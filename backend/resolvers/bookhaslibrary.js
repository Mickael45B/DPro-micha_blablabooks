import db from "../db/connect_DB.js";
import { v4 as uuidv4 } from "uuid";
import { GraphQLError } from 'graphql';
import { validateOrderParams, handleDbError } from '../utils/validators.js';

import fetchBookById from './utils/utils_books.js';
import fetchLibraryById from './utils/utils_librairies.js';
import { isAuthenticated, requireAuth, requireAdmin, requireOwnershipOrAdmin, sanitizeString, sanitizeInput } from './utils/helpers/helpers_general.js';
import { findBookLibraryOrThrow, requireEditableLibrary, verifyLibraryAccess} from './utils/helpers/helpers_bookhaslibrary.js';
import sanitizeHtml from 'sanitize-html';



export default {
  Query: {

    /**
     * Récupère les livres d'une bibliothèque avec pagination et tri
     * 🔒 Route protégée - L'utilisateur ne peut voir que ses propres livres (sauf admin)
     * @param {string} id_library - ID de la bibliothèque
     * @param {number} limit - Limite de résultats (max 100)
     * @param {number} offset - Décalage pour pagination
     * @param {string} order - Champ de tri
     * @param {string} direction - Direction du tri (ASC/DESC)
     * @returns {object} { books, totalCount, hasNextPage, httpStatus }
     * @throws {GraphQLError} Si l'utilisateur n'a pas les droits (401 ou 403)  
     * @throws {GraphQLError} Si une erreur se produit lors de la récupération des livres (500)
     */
    getBooksInLibrary: async (_, args, context) => {
      try {
        const { limit = 50, offset = 0, order = 'created_at', direction = 'ASC' } = args;
        
        // Sanitize inputs
        const cleanLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 100);
        const cleanOffset = Math.max(parseInt(offset) || 0, 0);
        
        // Vérifier l'accès à la bibliothèque
         requireAuth( context);
        
        // Valider les paramètres de tri
        const validOrders = ['created_at', 'updated_at'];
        const { order: safeOrder, direction: safeDirection } = validateOrderParams(
          sanitizeString(order), 
          sanitizeString(direction), 
          validOrders
        );
        
        const result = await db.query(`
          SELECT * FROM bookhaslibrary
          ORDER BY ${safeOrder} ${safeDirection}
          LIMIT $1 OFFSET $2
        `, [cleanLimit, cleanOffset]);

        const countResult = await db.query('SELECT COUNT(*)::int as count FROM bookhaslibrary');

        const totalCount = countResult.rows[0].count;
        
        return {
          books: result.rows,
          totalCount,
          hasNextPage: cleanOffset + cleanLimit < totalCount,
          httpStatus: 200,
        };
      } catch (error) {
        console.error('ERROR getBooksInLibrary:', error);
        if (error instanceof GraphQLError) throw error;
        throw new GraphQLError('Erreur lors de la récupération des livres', {
          extensions: { 
            code: 'INTERNAL_SERVER_ERROR',
            httpStatus: 500,
            originalError: error.message
          },
        });
      }
    },

    /**
     * Récupère un livre d'une bibliothèque
     * 🔒 Route protégée - L'utilisateur ne peut voir que ses propres livres (sauf admin)
     * @param {string} id_bookhaslibrary - ID de la relation livre-bibliothèque
     * @returns {object|null} { data, httpStatus } Les livres en bibliothèque ou null s'il n'y en a pas
     * @throws {GraphQLError} Si l'utilisateur n'a pas les droits (401 ou 403)
     * @throws {GraphQLError} Si une erreur se produit lors de la récupération des livres (500)
     */
    getBookInLibrary: async (_, { id_bookhaslibrary }, context) => {
      try {
        //console.log('getBookInLibrary called with id_bookhaslibrary:', id_bookhaslibrary);
        // Sanitize input
        const cleanId = sanitizeString(id_bookhaslibrary);
        
        // Trouver la relation (throw 404 si non trouvée)
        const bookLibrary = await findBookLibraryOrThrow(cleanId);
        
        // Vérifier l'accès à la bibliothèque
        await verifyLibraryAccess(bookLibrary.id_library, context);
        
        if (context?.res?.status) context.res.status(200);
        return bookLibrary;
      } catch (error) {
        if (error instanceof GraphQLError) throw error;
        throw new GraphQLError('Erreur lors de la récupération du livre', {
          extensions: { 
            code: 'INTERNAL_SERVER_ERROR',
            httpStatus: 500,
            originalError: error.message
          },
        });
      }
    },

    /**
     * Recherche des livres dans une bibliothèque
     * 🔒 Route protégée - L'utilisateur ne peut voir que les livres dans ses bibliothèques (sauf admin)
     * @param {string} id_library - ID de la bibliothèque
     * @param {string} titleOrAuthor - Terme de recherche
     * @param {number} limit Le nombre maximum de résultats à retourner (par défaut 50, max 100)
     * @param {number} offset Le nombre de résultats à sauter (par défaut 0)
     * @returns {object} { data: { books, totalCount, hasNextPage }, httpStatus } Les livres trouvés et des informations de pagination
     * @throws {GraphQLError} Si l'utilisateur n'a pas les droits (401 ou 403)
     * @throws {GraphQLError} Si une erreur se produit lors de la récupération des livres (500)
     */
    searchBooksInLibrary: async (_, args, context) => {
      try {
        const { titleOrAuthor, limit = 50, offset = 0 } = args;
        
        // Sanitize inputs
        const cleanSearch = sanitizeString(titleOrAuthor);
        const cleanLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 100);
        const cleanOffset = Math.max(parseInt(offset) || 0, 0);
        
        // Validation
        if (!cleanSearch || cleanSearch.length < 2) {
          throw new GraphQLError('Le terme de recherche doit contenir au moins 2 caractères', {
            extensions: { 
              code: 'BAD_REQUEST',
              httpStatus: 400
            },
          });
        }
        
        // Vérifier l'accès à la bibliothèque
        requireAuth(context);
        
        const searchPattern = `%${cleanSearch}%`;

        const result = await db.query(`
          SELECT bhl.* FROM bookhaslibrary bhl
          JOIN books b ON bhl.id_book = b.id_book
          WHERE (LOWER(b.title) LIKE LOWER($1) OR LOWER(b.author) LIKE LOWER($1))
          ORDER BY bhl.created_at DESC
          LIMIT $2 OFFSET $3
        `, [ searchPattern, cleanLimit, cleanOffset]);
        
        const countResult = await db.query(`
          SELECT COUNT(*)::int as count FROM bookhaslibrary bhl
          JOIN books b ON bhl.id_book = b.id_book
          WHERE (LOWER(b.title) LIKE LOWER($1) OR LOWER(b.author) LIKE LOWER($1))
        `, [searchPattern]);
        
        return {
          books: result.rows || [],
          totalCount: countResult.rows[0].count || 0,
          hasNextPage: cleanOffset + cleanLimit < (countResult.rows[0].count || 0),
        };
      } catch (error) {
        if (error instanceof GraphQLError) throw error;
        throw new GraphQLError('Erreur lors de la recherche', {
          extensions: { 
            code: 'INTERNAL_SERVER_ERROR',
            httpStatus: 500,
            originalError: error.message
          },
        });
      }
    },
  },

  Mutation: {

    /**
     * Ajoute un livre à une bibliothèque
     * 🔒 Route protégée - L'utilisateur ne peut ajouter que dans ses propres bibliothèques (sauf admin)
     * @param {object} input  - { bookId, libraryId }
     * @returns {object} { data, httpStatus: 201 }
     * @throws {GraphQLError} Si les données d'entrée sont invalides (400)
     * @throws {GraphQLError} Si le livre ou la bibliothèque n'existe pas (404)
     * @throws {GraphQLError} Si l'utilisateur n'a pas les droits (401 ou 403)
     * @throws {GraphQLError} Conflit lors de l'ajout du livre (409)
     * @throws {GraphQLError} Si une erreur se produit lors de la récupération des livres (500)
     */
    addBookHasLibrary: async (_, { input }, context) => {
      try {
        // Sanitize input
        const cleanInput = sanitizeInput(input);
        
        // Validation
        if (!cleanInput.bookId || !cleanInput.libraryId) {
          throw new GraphQLError('bookId et libraryId sont requis', {
            extensions: { 
              code: 'BAD_REQUEST',
              httpStatus: 400
            },
          });
        }
        
        // Vérifier l'accès et que la bibliothèque est modifiable
        const library = await verifyLibraryAccess(cleanInput.libraryId, context);
        requireEditableLibrary(library);
        
        // Vérifier que le livre existe
        const book = await fetchBookById(cleanInput.bookId);
        if (!book) {
          throw new GraphQLError('Livre non trouvé', {
            extensions: { 
              code: 'NOT_FOUND',
              httpStatus: 404
            },
          });
        }
        
        // Vérifier que le livre n'est pas déjà dans la bibliothèque
        const existing = await db.query(
          'SELECT id_bookhaslibrary FROM bookhaslibrary WHERE id_book = $1 AND id_library = $2',
          [cleanInput.bookId, cleanInput.libraryId]
        );
        
        if (existing.rows.length > 0) {
          throw new GraphQLError('Ce livre est déjà dans cette bibliothèque', {
            extensions: { 
              code: 'CONFLICT',
              httpStatus: 409
            },
          });
        }
        
        const id = uuidv4();
        const result = await db.query(`
          INSERT INTO bookhaslibrary (id_bookhaslibrary, id_book, id_library, is_read, is_favorite)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING *
        `, [id, cleanInput.bookId, cleanInput.libraryId, false, false]);
        
        return {
          data: result.rows[0],
          httpStatus: 201,
        };
      } catch (error) {
        if (error instanceof GraphQLError) throw error;
        throw new GraphQLError('Erreur lors de l\'ajout du livre', {
          extensions: { 
            code: 'INTERNAL_SERVER_ERROR',
            httpStatus: 500,
            originalError: error.message
          },
        });
      }
    },

    /**
     * Met à jour un livre dans une bibliothèque
     * 🔒 Route protégée - L'utilisateur ne peut modifier que dans ses propres bibliothèques (sauf admin)
     * @param {object} input L'ID du livre en bibliothèque à modifier
     * @returns {object} { data, httpStatus: 200 }
     * @throws {GraphQLError} Si les données d'entrée sont invalides (400)
     * @throws {GraphQLError} Si le livre en bibliothèque ou la bibliothèque n'existe pas (404)
     * @throws {GraphQLError} Si l'utilisateur n'a pas les droits (401 ou 403)
     * @throws {GraphQLError} Si une erreur se produit lors de la récupération des livres (500)
     */
    updateBookHasLibrary: async (_, { input }, context) => {
      try {
        // Sanitize input
        const cleanInput = sanitizeInput(input);
        
        // Validation
        if (!cleanInput.id_bookhaslibrary) {
          throw new GraphQLError('id_bookhaslibrary est requis', {
            extensions: { 
              code: 'BAD_REQUEST',
              httpStatus: 400
            },
          });
        }
        
        // Trouver la relation
        const bookLibrary = await findBookLibraryOrThrow(cleanInput.id_bookhaslibrary);
        
        // Vérifier l'accès et que la bibliothèque est modifiable
        const library = await verifyLibraryAccess(bookLibrary.id_library, context);
        requireEditableLibrary(library);
        
        // Construire la requête dynamique
        const updates = [];
        const values = [];
        let paramIndex = 1;

        if (cleanInput.isRead !== undefined) {
          updates.push(`is_read = $${paramIndex++}`);
          values.push(cleanInput.isRead);
        }
        if (cleanInput.isFavorite !== undefined) {
          updates.push(`is_favorite = $${paramIndex++}`);
          values.push(cleanInput.isFavorite);
        }

        if (updates.length === 0) {
          throw new GraphQLError('Aucun champ à mettre à jour', {
            extensions: { 
              code: 'BAD_REQUEST',
              httpStatus: 400
            },
          });
        }

        values.push(cleanInput.id_bookhaslibrary);

        const result = await db.query(`
          UPDATE bookhaslibrary
          SET ${updates.join(', ')}, updated_at = NOW()
          WHERE id_bookhaslibrary = $${paramIndex}
          RETURNING *
        `, values);

        return {
          data: result.rows[0],
          httpStatus: 200,
        };
      } catch (error) {
        if (error instanceof GraphQLError) throw error;
        throw new GraphQLError('Erreur lors de la mise à jour', {
          extensions: { 
            code: 'INTERNAL_SERVER_ERROR',
            httpStatus: 500,
            originalError: error.message
          },
        });
      }
    },

    /**
     * Supprime un livre d'une bibliothèque
     * 🔒 Route protégée - L'utilisateur ne peut supprimer que dans ses propres bibliothèques (sauf admin)
     * @param {object} input - { id_bookhaslibrary }
     * @returns {object} { data: true, httpStatus: 200 }
     * @throws {GraphQLError} Si les données d'entrée sont invalides (400)
     * @throws {GraphQLError} Si le livre en bibliothèque ou la bibliothèque n'existe pas (404)
     * @throws {GraphQLError} Si l'utilisateur n'a pas les droits (401 ou 403)
     * @throws {GraphQLError} Si une erreur se produit lors de la récupération des livres (500)
     */
    deleteBookHasLibrary: async (_, { input }, context) => {
      try {
        // Sanitize input
        const cleanId = sanitizeString(input.id_bookhaslibrary);
        
        // Validation
        if (!cleanId) {
          throw new GraphQLError('id_bookhaslibrary est requis', {
            extensions: { 
              code: 'BAD_REQUEST',
              httpStatus: 400
            },
          });
        }
        
        // Trouver la relation
        const bookLibrary = await findBookLibraryOrThrow(cleanId);
        
        // Vérifier l'accès et que la bibliothèque est modifiable
        const library = await verifyLibraryAccess(bookLibrary.id_library, context);
        requireEditableLibrary(library);
        
        // Supprimer
        await db.query(
          'DELETE FROM bookhaslibrary WHERE id_bookhaslibrary = $1',
          [cleanId]
        );
        
        return {
          data: true,
          httpStatus: 200,
        };
      } catch (error) {
        if (error instanceof GraphQLError) throw error;
        throw new GraphQLError('Erreur lors de la suppression', {
          extensions: { 
            code: 'INTERNAL_SERVER_ERROR',
            httpStatus: 500,
            originalError: error.message
          },
        });
      }
    },

    /**
     * Ajoute plusieurs livres à une bibliothèque
     * 🔒 Route protégée - L'utilisateur ne peut ajouter que dans ses propres bibliothèques (sauf admin)
     * @param {object} input Les données d'entrée
     * @returns {object} { data: { added: number }, httpStatus: 201 }
     * @throws {GraphQLError} Si les données d'entrée sont invalides (400)
     * @throws {GraphQLError} Si le livre ou la bibliothèque n'existe pas (404)
     * @throws {GraphQLError} Si l'utilisateur n'a pas les droits ou Si la bibliothèque n'est pas modifiable(401 ou 403)
     * @throws {GraphQLError} Si une erreur se produit lors de la récupération des livres (500)
     */
    addBooksToLibrary: async (_, { input }, context) => {
      const client = await db.connect();
      try {
        // Sanitize input
        const cleanInput = sanitizeInput(input);
        
        // Validation
        if (!cleanInput.bookIds || !Array.isArray(cleanInput.bookIds) || cleanInput.bookIds.length === 0) {
          throw new GraphQLError('bookIds doit être un tableau non vide', {
            extensions: { 
              code: 'BAD_REQUEST',
              httpStatus: 400
            },
          });
        }
        if (!cleanInput.libraryId) {
          throw new GraphQLError('libraryId est requis', {
            extensions: { 
              code: 'BAD_REQUEST',
              httpStatus: 400
            },
          });
        }
        
        // Vérifier l'accès et que la bibliothèque est modifiable
        const library = await verifyLibraryAccess(cleanInput.libraryId, context);
        requireEditableLibrary(library);
        
        // Transaction
        await client.query('BEGIN');
        
        let addedCount = 0;
        for (const bookId of cleanInput.bookIds) {
          // Vérifier que le livre n'existe pas déjà
          const existing = await client.query(
            'SELECT id_bookhaslibrary FROM bookhaslibrary WHERE id_book = $1 AND id_library = $2',
            [bookId, cleanInput.libraryId]
          );
          
          if (existing.rows.length === 0) {
            const id = uuidv4();
            await client.query(`
              INSERT INTO bookhaslibrary (id_bookhaslibrary, id_book, id_library, is_read, is_favorite)
              VALUES ($1, $2, $3, $4, $5)
            `, [id, bookId, cleanInput.libraryId, false, false]);
            addedCount++;
          }
        }
        
        await client.query('COMMIT');
        
        return {
          data: { added: addedCount },
          httpStatus: 201,
        };
      } catch (error) {
        await client.query('ROLLBACK');
        if (error instanceof GraphQLError) throw error;
        throw new GraphQLError('Erreur lors de l\'ajout en masse', {
          extensions: { 
            code: 'INTERNAL_SERVER_ERROR',
            httpStatus: 500,
            originalError: error.message
          },
        });
      } finally {
        client.release();
      }
    },  

    /**
     * Supprime plusieurs livres d'une bibliothèque
     * 🔒 Route protégée - L'utilisateur ne peut supprimer que dans ses propres bibliothèques (sauf admin
     * @param {object} input Les données d'entrée
     * @throws {GraphQLError} Si les données d'entrée sont invalides (400)
     * @throws {GraphQLError} Si le livre ou la bibliothèque n'existe pas (404)
     * @throws {GraphQLError} Si l'utilisateur n'a pas les droits ou Si la bibliothèque n'est pas modifiable(401 ou 403)
     * @throws {GraphQLError} Si une erreur se produit lors de la récupération des livres (500)
     */
    removeBooksFromLibrary: async (_, { input }) => {
      const client = await db.connect();
      try {
        // Sanitize input
        const cleanInput = sanitizeInput(input);
        
        // Validation
        if (!cleanInput.bookIds || !Array.isArray(cleanInput.bookIds) || cleanInput.bookIds.length === 0) {
          throw new GraphQLError('bookIds doit être un tableau non vide', {
            extensions: { 
              code: 'BAD_REQUEST',
              httpStatus: 400
            },
          });
        }
        if (!cleanInput.libraryId) {
          throw new GraphQLError('libraryId est requis', {
            extensions: { 
              code: 'BAD_REQUEST',
              httpStatus: 400
            },
          });
        }
        
        // Vérifier l'accès et que la bibliothèque est modifiable
        const library = await verifyLibraryAccess(cleanInput.libraryId, context);
        requireEditableLibrary(library);
        
        // Transaction
        await client.query('BEGIN');
        
        const result = await client.query(`
          DELETE FROM bookhaslibrary
          WHERE id_book = ANY($1) AND id_library = $2
          RETURNING id_bookhaslibrary
        `, [cleanInput.bookIds, cleanInput.libraryId]);
        
        await client.query('COMMIT');
        
        return {
          data: { removed: result.rows.length },
          httpStatus: 200,
        };
      } catch (error) {
        await client.query('ROLLBACK');
        if (error instanceof GraphQLError) throw error;
        throw new GraphQLError('Erreur lors de la suppression en masse', {
          extensions: { 
            code: 'INTERNAL_SERVER_ERROR',
            httpStatus: 500,
            originalError: error.message
          },
        });
      } finally {
        client.release();
      }
    },
  },

  BookHasLibrary: {
    book: async (parent) => {
      return fetchBookById(parent.id_book);
    },
    
    library: async (parent) => {
      return fetchLibraryById(parent.id_library);
    },
  },
};