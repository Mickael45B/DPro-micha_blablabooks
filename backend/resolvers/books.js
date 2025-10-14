import db from "../db/connect_DB.js";
import { v4 as uuidv4 } from 'uuid';
import { validateOrderParams, handleDbError } from '../utils/validators.js';
import { flattenEdges, makePageInfo, makeEdgeFromBook } from '../utils/helpers_books.js';
import sanitizeHtml from 'sanitize-html';
import { GraphQLError } from 'graphql';
import fetchBookById from './utils/utils_books.js';
import fetchLibraryById from './utils/utils_librairies.js';
import { isAuthenticated, requireAuth, requireAdmin, requireOwnershipOrAdmin, sanitizeString, sanitizeInput } from './utils/helpers/helpers_general.js';

import { findBookOrThrow, validateBookInput} from './utils/helpers/helpers_books.js';

export default {
  Query: {

    /**
       * Récupère les livres d'une bibliothèque avec pagination et tri
       * 🔓 Route publique 
       * @param {number} limit - Limite de résultats (max 100)
       * @param {number} offset - Décalage pour pagination
       * @param {string} order - Champ de tri
       * @param {string} direction - Direction du tri (ASC/DESC)
       * @returns {object} { books, totalCount, hasNextPage, httpStatus }
       * @throws {GraphQLError} Si l'utilisateur n'a pas les droits (401 ou 403)  
       * @throws {GraphQLError} Si une erreur se produit lors de la récupération des livres (500)
     */
      getBooks: async (_, { limit = 50, offset = 0, order = 'created_at', direction = 'ASC' }, context) => {
        try {

        // Sanitize inputs
        const cleanLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 100);
        const cleanOffset = Math.max(parseInt(offset) || 0, 0);

        // Valider les paramètres de tri
          const validOrders = ['created_at', 'title', 'author', 'avg_rating', 'nb_reviews', 'is_in_favorite', 'publication_date'];// Definir les colonnes valides pour le tri
        const { order: safeOrder, direction: safeDirection } = validateOrderParams(
          sanitizeString(order), 
          sanitizeString(direction), 
          validOrders
        );


        // Requête SQL avec tri et pagination
        const result = await db.query(`
          SELECT *
          FROM books
          ORDER BY ${safeOrder} ${safeDirection}
          LIMIT $1 OFFSET $2
        `, [cleanLimit, cleanOffset]);
        
        const countResult = await db.query('SELECT COUNT(*)::int as count FROM books');
        const totalCount = countResult.rows[0].count;

          // Transformer les résultats en une structure conforme à BookConnection
          const edges = result.rows.map(makeEdgeFromBook);


        return {
          books: edges,
          totalCount,
          hasNextPage: cleanOffset + cleanLimit < totalCount,
          httpStatus: 200,
        };

        } catch (error) {
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
       * Récupère les livres d'une bibliothèque avec pagination et tri
       * 🔓 Route publique 
       * @param {string} id_book - ID du livre
       * @param {number} limit - Limite de résultats (max 100)
       * @param {number} offset - Décalage pour pagination
       * @param {string} order - Champ de tri
       * @param {string} direction - Direction du tri (ASC/DESC)
       * @returns {object} { books, totalCount, hasNextPage, httpStatus }
       * @throws {GraphQLError} Si l'utilisateur n'a pas les droits (401 ou 403)  
       * @throws {GraphQLError} Si une erreur se produit lors de la récupération des livres (500)
     */
    getBook: async (_, { id_book }, context) => {
      try {
      
        // Sanitize input
        const cleanIdBook = sanitizeString(id_book);

        // Vérifier l'accès à la bibliothèque
        requireAuth( context);

        // Vérifier que le livre existe (throw 404 si non trouvé)
        const book = await findBookOrThrow(cleanIdBook);

        // Retourner l'objet Book conforme au schéma
        if (context?.res?.status) context.res.status(200);
        return book;

      } catch (error) {
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
       * Recherche des livres par titre ou auteur avec pagination
       * 🔓 Route publique
       * @param {string} titleOrAuthor - Titre ou auteur du livre
       * @param {number} limit - Limite de résultats (max 100)
       * @param {number} offset - Décalage pour pagination
       * @returns {object} { books, totalCount, hasNextPage }
       * @throws {GraphQLError} Si l'utilisateur n'a pas les droits (401 ou 403)  
       * @throws {GraphQLError} Si l'utilisateur n'a pas fourni de terme de recherche (400)  
       * @throws {GraphQLError} Si une erreur se produit lors de la recherche de livres (500)
     */
    searchBooks: async (_, args, context) => {
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

        // Vérifier l'authentification
        requireAuth(context);
        const searchPattern = `%${cleanSearch}%`;

        const result = await db.query(`
          SELECT *
          FROM books
          WHERE LOWER(title) LIKE LOWER($1) OR LOWER(author) LIKE LOWER($1)
          ORDER BY avg_rating DESC NULLS LAST, nb_reviews DESC
          LIMIT $2 OFFSET $3
        `, [searchPattern, cleanLimit, cleanOffset]);
        
        const countResult = await db.query(`
          SELECT COUNT(*)::int as count FROM books
          WHERE LOWER(title) LIKE LOWER($1) OR LOWER(author) LIKE LOWER($1)
        `, [searchPattern]);
        
        return {
          books: result.rows,
          totalCount: countResult.rows[0].count,
          hasNextPage: cleanOffset + cleanLimit < countResult.rows[0].count,
          httpStatus: 200,
        };
      } catch (error) {
        if (error instanceof GraphQLError) throw error;
        throw new GraphQLError('Erreur lors de la recherche de livres', {
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
     * Ajoute un livre
     * 🔒 Route protégée
     * @param {object} input - Les données du livre à ajouter
     * @returns {object} Le livre ajouté
     * @throws {GraphQLError} Si l'utilisateur n'a pas les droits (401 ou 403)
     * @throws {GraphQLError} Si une erreur se produit lors de l'ajout du livre (500)
     */
    addBook: async (_, { input }, context) => {
      try {
        const id = uuidv4();

        const cleanInput = {
          title: sanitizeString(input.title),
          author: input.author ? sanitizeString(input.author) : null,
          publicationDate: input.publicationDate ? sanitizeString(input.publicationDate) : null,
          genre: input.genre ? sanitizeString(input.genre) : null,
          isbn: input.isbn ? sanitizeString(input.isbn) : null,
          editor: input.editor ? sanitizeString(input.editor) : null,
          vignetteImage: input.vignetteImage ? sanitizeString(input.vignetteImage) : null,
          bookImage: input.bookImage ? sanitizeString(input.bookImage) : null,
          ageLimit: input.ageLimit !== undefined ? parseInt(input.ageLimit) : null,
          description: input.description ? sanitizeString(input.description) : null,
          series: input.series ? sanitizeString(input.series) : null,
        };

        // Valider les données
        validateBookInput(cleanInput);

        // Vérifier que l'utilisateur est un administrateur avec accès aux données
        requireAuth(context);


        if (cleanInput.isbn) {
          const existingBook = await db.query(
            'SELECT id_book FROM books WHERE isbn = $1',
            [cleanInput.isbn]
          );
          
          if (existingBook.rows.length > 0) {
            throw new GraphQLError('Un livre avec cet ISBN existe déjà', {
              extensions: { 
                code: 'CONFLICT',
                httpStatus: 409
              },
            });
          }
        }

        const result = await db.query(`
          INSERT INTO books (
            id_book, title, author, publication_date, genre, isbn, 
            editor, vignetteimage, bookimage, age_limit, description, series
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          RETURNING *
        `, [
          id,
          cleanInput.title || null,
          cleanInput.author || null,
          cleanInput.publicationDate || null,
          cleanInput.genre || null,
          cleanInput.isbn || null,
          cleanInput.editor || null,
          cleanInput.vignetteImage || null,
          cleanInput.bookImage || null,
          cleanInput.ageLimit || null,
          cleanInput.description || null,
          cleanInput.series || null
        ]);



        if (context?.res?.status) context.res.status(201);
        return result.rows[0];

      } catch (error) {

        if (error instanceof GraphQLError) throw error;
        throw new GraphQLError("Erreur lors de l'ajout du livre", {
          extensions: { 
            code: 'INTERNAL_SERVER_ERROR',
            httpStatus: 500,
            originalError: error.message
          },
        });


        throw handleDbError(error, 'creating book');
      }
    },

    /**
    * Met à jour un livre
    * 🔒 Route protégée
    * @param {object} input - Les données du livre à mettre à jour
    * @returns {object} Le livre mis à jour
    * @throws {GraphQLError} Si l'utilisateur n'a pas les droits (401 ou 403)
    * @throws {GraphQLError} Si une erreur se produit lors de la mise à jour du livre (500)
    */
    updateBook: async (_, { input }, context) => {
      try {

        // Vérifier que l'utilisateur est un administrateur avec accès aux données
        requireAdmin(context);

        // Sanitize ID
        const cleanIdBook = sanitizeString(input.idBook);

        // Vérifier que le livre existe
        await findBookOrThrow(cleanIdBook);


        const updates = [];
        const values = [];
        let paramIndex = 1;

        if (input.title !== undefined) {
          const cleanTitle = sanitizeString(input.title);
          if (cleanTitle.trim().length < 1) {
            throw new GraphQLError('Le titre ne peut pas être vide', {
              extensions: { code: 'BAD_REQUEST', httpStatus: 400 },
            });
          }
          updates.push(`title = $${paramIndex++}`);
          values.push(cleanTitle);
        }        if (input.author !== undefined) {
          updates.push(`author = $${paramIndex++}`);
          values.push(sanitizeInput(input.author));
        }
        if (input.publicationDate !== undefined) {
          updates.push(`publication_date = $${paramIndex++}`);
          values.push(sanitizeInput(input.publicationDate));
        }
        if (input.genre !== undefined) {
          updates.push(`genre = $${paramIndex++}`);
          values.push(sanitizeInput(input.genre));
        }
        if (input.isbn !== undefined) {
          const cleanIsbn = sanitizeString(input.isbn);
          // Vérifier que l'ISBN n'est pas déjà utilisé par un autre livre
          if (cleanIsbn) {
            const existing = await db.query(
              'SELECT id_book FROM books WHERE isbn = $1 AND id_book != $2',
              [cleanIsbn, cleanIdBook]
            );
            if (existing.rows.length > 0) {
              throw new GraphQLError('Cet ISBN est déjà utilisé par un autre livre', {
                extensions: { code: 'CONFLICT', httpStatus: 409 },
              });
            }
          }
          updates.push(`isbn = $${paramIndex++}`);
          values.push(cleanIsbn);
        }
        if (input.editor !== undefined) {
          updates.push(`editor = $${paramIndex++}`);
          values.push(sanitizeInput(input.editor));
        }
        if (input.vignetteImage !== undefined) {
          updates.push(`vignetteimage = $${paramIndex++}`);
          values.push(sanitizeInput(input.vignetteImage));
        }
        if (input.bookImage !== undefined) {
          updates.push(`bookimage = $${paramIndex++}`);
          values.push(sanitizeInput(input.bookImage));
        }

        if (input.ageLimit !== undefined) {
          const cleanAge = parseInt(input.ageLimit);
          if (cleanAge < 0 || cleanAge > 18) {
            throw new GraphQLError('L\'âge limite doit être entre 0 et 18', {
              extensions: { code: 'BAD_REQUEST', httpStatus: 400 },
            });
          }
          updates.push(`age_limit = $${paramIndex++}`);
          values.push(cleanAge);
        }
        if (input.description !== undefined) {
          updates.push(`description = $${paramIndex++}`);
          values.push(sanitizeInput(input.description));
        }
        if (input.series !== undefined) {
          updates.push(`series = $${paramIndex++}`);
          values.push(sanitizeInput(input.series));
        }

        if (updates.length === 0) {
          throw new GraphQLError('Aucun champ à mettre à jour', {
            extensions: { 
              code: 'BAD_REQUEST',
              httpStatus: 400
            },
          });
        }
        values.push(input.idBook);


        const result = await db.query(`
          UPDATE books
          SET ${updates.join(', ')}
          WHERE id_book = $${paramIndex}
          RETURNING *
        `, values);

        if (result.rows.length === 0) {
          throw new Error('Book not found');
        }

        return result.rows[0];
      } catch (error) {
        throw new GraphQLError("Erreur lors de la mise à jour du livre", {
          extensions: { 
            code: 'INTERNAL_SERVER_ERROR',
            httpStatus: 500,
            originalError: error.message
          },
        });
      }
    },

      /**
    * Supprime un livre
    * 🔒 Route protégée
    * @param {object} input - Les données du livre à supprimer
    * @returns {boolean} true si le livre a été supprimé, false sinon
    * @throws {GraphQLError} Si l'utilisateur n'a pas les droits (401 ou 403)
    * @throws {GraphQLError} Si une erreur se produit lors de la suppression du livre (500)
    */
    deleteBook: async (_, { input }, context) => {
      try {
        // Vérifier que l'utilisateur est un administrateur avec accès aux données
        requireAdmin(context);

        // Sanitize input
        const cleanIdBook = sanitizeString(input.id_book);

        // Vérifier que le livre existe
        await findBookOrThrow(cleanIdBook);

       // Vérifier que le livre n'est pas dans des bibliothèques
        const inLibraries = await db.query(
          'SELECT COUNT(*)::int as count FROM bookhaslibrary WHERE id_book = $1',
          [cleanIdBook]
        );

        if (inLibraries.rows[0].count > 0) {
          throw new GraphQLError(
            'Impossible de supprimer ce livre : il est présent dans des bibliothèques',
            {
              extensions: { 
                code: 'CONFLICT',
                httpStatus: 409
              },
            }
          );
        }

        const result = await db.query(
          'DELETE FROM books WHERE id_book = $1 RETURNING id_book',
          [cleanIdBook]
        );

        return {
          data: true,
          httpStatus: 200,
        };

      } catch (error) {
        throw new GraphQLError("Erreur lors de la suppression du livre", {
          extensions: { 
            code: 'INTERNAL_SERVER_ERROR',
            httpStatus: 500,
            originalError: error.message
          },
        });
      }
    },
  },

  Book: {},
};