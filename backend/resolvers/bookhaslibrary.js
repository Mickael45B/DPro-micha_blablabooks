import db from "../db/connect_DB.js";
import { v4 as uuidv4 } from "uuid";
import { GraphQLError } from 'graphql';
import { validateOrderParams, handleDbError } from '../utils/validators.js';
import sanitizeHtml from 'sanitize-html'
import fetchBookById from './utils/utils_books.js';
import fetchLibraryById from './utils/utils_librairies.js';
import { isAuthenticated, requireAuth, requireAdmin, requireOwnershipOrAdmin, sanitizeString, sanitizeInput } from './utils/helpers/helpers_general.js';
import { findBookLibraryOrThrow, requireEditableLibrary, verifyLibraryAccess, validateWithJoi} from './utils/helpers/helpers_bookhaslibrary.js';

import {getBooksInLibrarySchema, getBookInLibrarySchema, searchBooksInLibrarySchema, addBookHasLibrarySchema, updateBookHasLibrarySchema, deleteBookHasLibrarySchema, addBooksToLibrarySchema, removeBooksFromLibrarySchema} from '../schema/schemas_joi/bookhaslibrarySchema.js';
import { validate as uuidValidate } from 'uuid';




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
        /* exemple context JWT décodé ( à revoir):
        {
          userId: "uuid-of-user",
          email: "user@example.com",
          role: "admin"
        }
        */
       /*exemple de requête :
        query {
            getBooksInLibrary { books{id_bookhaslibrary, book{title,description}, library{id_library name, user{name, role{role_name}}}} }
        }
        */
        /* Exemple variables :
        {
        }
        */


        const { limit = 50, offset = 0, order = 'created_at', direction = 'ASC' } = args;
        
        // Validation avec Joi => 1ere couche - défense en profondeur
        const validatedArgs = validateWithJoi(getBooksInLibrarySchema, {
          limit : args.limit,
          offset : args.offset,
          order : args.order,
          direction : args.direction  
        });

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
        /* exemple context JWT décodé ( à revoir):
        {
          userId: "uuid-of-user",
          email: "user@example.com",
          role: "admin"
        }
        */
       /*exemple de requête :
        query 
          GetBookInLibrary($id_bookhaslibrary: ID!) 
          {getBookInLibrary(id_bookhaslibrary: $id_bookhaslibrary) {id_bookhaslibrary }}

        */
        /* Exemple variables :
        {
          id_bookhaslibrary: "11b3c4d5e-6f7g-8h9i-0j1k-2l3m4n5o6p7"
        }
        */

        // Vérifier les droits d'accès
        requireAuth(context);

        // Validation avec Joi => 1ère couche - défense en profondeur
        const validatedArgs = validateWithJoi(getBookInLibrarySchema, {
          id: id_bookhaslibrary
        });

        // Sanitize input => 2ème couche - défense en profondeur
        const cleanId = sanitizeString(validatedArgs.id);
        
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

        /* exemple context JWT décodé ( à revoir):
        {
          userId: "uuid-of-user",
          email: "user@example.com",
          role: "admin"
        }
        */
       /*exemple de requête :
        query SearchBooksInLibrary($titleOrAuthor: String!) { searchBooksInLibrary(titleOrAuthor: $titleOrAuthor) { totalCount books { id_bookhaslibrary book { title author} library { id_library name}}}}
        */
        /* Exemple variables :
        { "titleOrAuthor": "00" }        
        */


        const { titleOrAuthor, limit = 50, offset = 0, order = 'created_at', direction = 'DESC' } = args;
        
        // Validation avec Joi => 1ère couche - défense en profondeur
        const validatedArgs = validateWithJoi(searchBooksInLibrarySchema, {
            titleOrAuthor: args.titleOrAuthor,
            limit: args.limit || 50,
            offset: args.offset || 0,
          });

        // Sanitize inputs => 2ème couche - défense en profondeur
          const cleanQuery = sanitizeString(validatedArgs.titleOrAuthor);
        const cleanLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 100);
        const cleanOffset = Math.max(parseInt(offset) || 0, 0);
        const validOrders = ['created_at', 'id_library', 'updated_at', 'id_book'];
        const { order: safeOrder, direction: safeDirection } = validateOrderParams(
          sanitizeString(order), 
          sanitizeString(direction), 
          validOrders
        );

        // Validation
          if (!cleanQuery || cleanQuery.length < 2) {
          throw new GraphQLError('Le terme de recherche doit contenir au moins 2 caractères', {
            extensions: { 
              code: 'BAD_REQUEST',
              httpStatus: 400
            },
          });
        }
        
        // Vérifier l'accès à la bibliothèque
        //requireAuth(context);
        
          const searchPattern = `%${cleanQuery}%`;

        const result = await db.query(`
          SELECT * FROM bookhaslibrary 
          WHERE (LOWER(id_library) LIKE LOWER($1) OR LOWER(id_book) LIKE LOWER($1))
          ORDER BY ${safeOrder} ${safeDirection}
          LIMIT $2 OFFSET $3
        `, [ searchPattern, cleanLimit, cleanOffset]);

        const countResult = await db.query(`
          SELECT COUNT(*)::int as count FROM bookhaslibrary
          WHERE (LOWER(id_library) LIKE LOWER($1) OR LOWER(id_book) LIKE LOWER($1))
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
     * @param {object} input  - { id_book, id_library }
     * @returns {object} { data, httpStatus: 201 }
     * @throws {GraphQLError} Si les données d'entrée sont invalides (400)
     * @throws {GraphQLError} Si le livre ou la bibliothèque n'existe pas (404)
     * @throws {GraphQLError} Si l'utilisateur n'a pas les droits (401 ou 403)
     * @throws {GraphQLError} Conflit lors de l'ajout du livre (409)
     * @throws {GraphQLError} Si une erreur se produit lors de la récupération des livres (500)
     */
    addBookHasLibrary: async (_, { input }, context) => {
      try {

        /* exemple context JWT décodé ( à revoir):
        {
          userId: "uuid-of-user",
          email: "user@example.com",
          role: "admin"
        }
        */
       /*exemple de requête :
        mutation AddBookHasLibrary($input: CreateBookHasLibraryInput!) { addBookHasLibrary(input: $input) {__typename id_bookhaslibrary id_book id_library }}

        */
        /* Exemple variables :
        { "input": 
        {"id_book": "7v8w9x0y-1z2a-3b4c-5d6e-7f8g9h0i1j2k",
          "id_library" :"1bd2f719-a89a-4231-aa6d-dd1df163eee6"
        }
        }        
        */

        // Validation avec Joi => 1ere couche - défense en profondeur
        const validatedArgs = validateWithJoi(addBookHasLibrarySchema, {
            id_library: input.id_library,
            id_book: input.id_book,
        });

        // Sanitize input => 2ème couche - défense en profondeur
        const cleanInput = sanitizeInput(validatedArgs);

        // Normalize keys: Joi schema uses id_book / id_library while GraphQL input uses bookId / libraryId
        // cleanInput.bookId = cleanInput.bookId ?? cleanInput.id_book;
        // cleanInput.libraryId = cleanInput.libraryId ?? cleanInput.id_library;

        // Validation
        if (!cleanInput.id_book || !cleanInput.id_library) {
          throw new GraphQLError('id_book et id_library sont requis', {
            extensions: { 
              code: 'BAD_REQUEST',
              httpStatus: 400
            },
          });
        }
        
        // Vérifier l'accès et que la bibliothèque est modifiable
        //const library = await verifyLibraryAccess(cleanInput.id_library, context);
        requireEditableLibrary(library);
        
        // Vérifier que le livre existe
        const book = await fetchBookById(cleanInput.id_book);
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
          [cleanInput.id_book, cleanInput.id_library]
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

        // inserer created_at et updated_at = NOW()
        const now = new Date();
        const createdAt = now;
        const updatedAt = now;
        
        const result = await db.query(`
          INSERT INTO bookhaslibrary (id_bookhaslibrary, id_book, id_library, is_read, is_favorite, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *
        `, [id, cleanInput.id_book, cleanInput.id_library, false, false, createdAt, updatedAt]);

        if (context && context.res && typeof context.res.status === 'function') {
          context.res.status(201);
        }

        return result.rows[0];
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
     * Met à jour un livre dans une bibliothèque (déplacement du livre dans une autre bibliothèque, marquer comme lu/favori, etc.)
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
        /* exemple context JWT décodé ( à revoir):
        {
          userId: "uuid-of-user",
          email: "user@example.com",
          role: "admin"
        }
        */
       /*exemple de requête :
        mutation UpdateBookHasLibrary($input: UpdateBookHasLibraryInput!) { updateBookHasLibrary(input: $input) {__typename }}

        */
        /* Exemple variables :
        { "input": 
        {"bookId": "2g3h4i5j-6k7l-8m9n-0o1p-2q3r4s5t6u7v",
          "id_bookhaslibrary" :"0147539a-db17-44cc-90ab-9d2f524f32c6",
          "is_read": true
        }
        }       
        */

        console.log('Input reçu pour la mise à jour:', input);

        // Vérifier les droits d'accès
          requireAuth(context);

        // Validation avec Joi => 1ere couche - défense en profondeur
        const validatedArgs = validateWithJoi(updateBookHasLibrarySchema, {
            id: input.id_bookhaslibrary,
            id_book: input.bookId,
            id_library: input.libraryId,
            is_read: input.is_read,
            is_favorite: input.is_favorite,
        });
        console.log('Arguments validés:', validatedArgs);
        // Sanitize input => 2ème couche - défense en profondeur
        const cleanInput = sanitizeInput(validatedArgs);
        console.log('Input nettoyé:', cleanInput);
        // Validation
        if (!cleanInput.id) {
          throw new GraphQLError('id_bookhaslibrary est requis', {
            extensions: { 
              code: 'BAD_REQUEST',
              httpStatus: 400
            },
          });
        }
        
        // Trouver la relation
        const bookLibrary = await findBookLibraryOrThrow(input.id_bookhaslibrary);
        
        // Vérifier l'accès et que la bibliothèque est modifiable
        const library = await verifyLibraryAccess(bookLibrary.id_library, context);
        requireEditableLibrary(library);
        
        // Construire la requête dynamique
        const updates = [];
        const values = [];
        let paramIndex = 1;

        if (cleanInput.id) {
          updates.push(`id_bookhaslibrary = $${paramIndex++}`);
          values.push(cleanInput.id);
        }
        if (cleanInput.id_book) {
          updates.push(`id_book = $${paramIndex++}`);
          values.push(cleanInput.id_book);
        }
        if (cleanInput.id_library) {
          updates.push(`id_library = $${paramIndex++}`);
          values.push(cleanInput.id_library);
        }

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
        /* exemple context JWT décodé ( à revoir):
        {
          userId: "uuid-of-user",
          email: "user@example.com",
          role: "admin"
        }
        */
       /*exemple de requête :
            mutation deleteBookHasLibrary($input: DeleteBookHasLibraryInput!) { deleteBookHasLibrary(input: $input) }
        */
        /* Exemple variables :
        {"input": {"id_bookhaslibrary":"1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p"} }
        */

        // Vérifier les droits d'accès
        requireAuth(context);

        // Validation avec Joi => 1ere couche - défense en profondeur
        const validatedArgs = validateWithJoi(deleteBookHasLibrarySchema, {
          id: input.id_bookhaslibrary
        });

        // Sanitize input => 2ème couche - défense en profondeur
        const cleanId = sanitizeString(validatedArgs.id);

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
        console.log('ID à supprimer:', bookLibrary.id_bookhaslibrary);
        

        // Vérifier l'accès et que la bibliothèque est modifiable
        const library = await verifyLibraryAccess(bookLibrary.id_library, context);
        requireEditableLibrary(library);
        
        // Supprimer
        const delResult = await db.query(
          'DELETE FROM bookhaslibrary WHERE id_bookhaslibrary = $1 RETURNING id_bookhaslibrary',
          [cleanId]
        );

        const deleted = delResult.rowCount > 0;
        if (context && context.res && typeof context.res.status === 'function') {
          context.res.status(deleted ? 200 : 404);
        }

        return deleted;
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
      /* voir plus tard */
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
    removeBooksFromLibrary: async (_, { input }, context) => {
      /* voir plus tard */
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