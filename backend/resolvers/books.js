import db from "../db/connect_DB.js";
import { v4 as uuidv4 } from 'uuid';
import { validateOrderParams, handleDbError } from '../utils/validators.js';
import sanitizeHtml from 'sanitize-html';
import { GraphQLError } from 'graphql';
import fetchBookById from './utils/utils_books.js';
import fetchLibraryById from './utils/utils_librairies.js';
// import { flattenEdges, makePageInfo, makeEdgeFromBook } from '../utils/helpers_books.js';
// import { isAuthenticated, requireAuth, requireAdmin, requireOwnershipOrAdmin, sanitizeString, sanitizeInput } from './utils/helpers/helpers_general.js';
import { isAuthenticated, requireAuth, requireAdmin, requireOwnershipOrAdmin, sanitizeString, sanitizeInput, flattenEdges, makePageInfo, makeEdgeFromBook, withErrorHandling  } from './utils/helpers/helpers_general.js';

import { findBookOrThrow, validateBookInput, validateWithJoi} from './utils/helpers/helpers_books.js';

import {getBooksSchema, getBookSchema, searchBooksSchema , createBookSchema, updateBookSchema, deleteBookSchema} from '../schema/schemas_joi/bookSchema.js';
import { validate as uuidValidate } from 'uuid';

// ========================================
// RESOLVERS POUR LES LIVRES
// ======================================== 

export default {
  Query: {
    /**
     * Récupère la liste des livres avec pagination et tri
     * 🔓 Route publique
     * @param {number} limit - Limite de résultats (max 100)
     * @param {number} offset - Décalage pour pagination
     * @param {string} order - Champ de tri
     * @param {string} direction - Direction du tri (ASC/DESC)
     * @returns {object} { books, totalCount, hasNextPage, httpStatus }
     * @throws {GraphQLError} Si l'utilisateur n'a pas les droits (401 ou 403)
     * @throws {GraphQLError} Si une erreur se produit lors de la récupération des livres (500)
     */
    getBooks: withErrorHandling(
      async (_, args, context) => {
        /* exemple context JWT décodé ( à revoir):
        {
          userId: "uuid-of-user",
          email: "user@example.com",
          role: "admin"
        }
        */
        /*exemple de requête :
        query {getBooks{books{title}}}
        */
        /* Exemple variables :
        {
        }
        */

        // Vérification des droits d'accès
        requireAuth(context);

        // Validation avec Joi => 1ere couche - défense en profondeur
        const validatedArgs = validateWithJoi(getBooksSchema, args);

        const { limit = 50, offset = 0, order = 'created_at', direction = 'DESC' } = validatedArgs;


        // Sanitize inputs => 2ème couche - défense en profondeur
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
        const nodes = flattenEdges(edges);

        return {
          // flattened list of Book objects for simple queries: getBooks { books { title } }
          books: nodes,
          // backward-compatible edge representation
          bookEdges: edges,
          // convenience alias
          nodes,
          totalCount,
          hasNextPage: cleanOffset + cleanLimit < totalCount,
          httpStatus: 200,
        };
      },
      'Erreur lors de la récupération des livres'
    ),

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
    getBook: withErrorHandling(
      async (_, args, context) => {
        /* exemple context JWT décodé ( à revoir):
        {
          userId: "uuid-of-user",
          email: "user@example.com",
          role: "admin"
        }
        */
        /*exemple de requête :
        query  getBook($id_book: ID!) {getBook(id_book: $id_book) {id_book,title }}

        */
        /* Exemple variables :
        {"id_book": "i9j0k1l2-m3n4-5o6p-7q8r-9s0t1u2v3w4z"}
        */

        const { id_book } = args;

        // Validation avec Joi => 1ere couche - défense en profondeur
        const validatedGetBook = validateWithJoi(getBookSchema, { id: id_book });

        // Sanitize input => 2ème couche - défense en profondeur
        const cleanIdBook = sanitizeString(validatedGetBook.id);

        // Vérifier l'accès à la bibliothèque
        requireAuth( context);

        // Vérifier que le livre existe (throw 404 si non trouvé)
        const book = await findBookOrThrow(cleanIdBook);

        // Retourner l'objet Book conforme au schéma
        if (context?.res?.status) context.res.status(200);
        return book;

      },
      'Erreur lors de la récupération d un livre'
    ),

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
    searchBooks: withErrorHandling(
      async (_, args, context) => {
        /* exemple context JWT décodé ( à revoir):
        {
          userId: "uuid-of-user",
          email: "user@example.com",
          role: "admin"
        }
        */
        /*exemple de requête :
        query  searchBooks($titleOrAuthor: String!) {searchBooks(titleOrAuthor: $titleOrAuthor) {id_book,title }}

        */
        /* Exemple variables :
        {"titleOrAuthor": "ta"}
        */

        const { titleOrAuthor, limit = 50, offset = 0 } = args;
        
        // Validation avec Joi => 1ere couche - défense en profondeur
        const validatedArgs = validateWithJoi(searchBooksSchema, {
            query: args.titleOrAuthor,
            limit: args.limit || 50,
            offset: args.offset || 0,
          });

        // Sanitize inputs => 2ème couche - défense en profondeur
        const cleanSearch = sanitizeString(validatedArgs.query);
        const cleanLimit = Math.min(Math.max(parseInt(validatedArgs.limit) || 50, 1), 100);
        const cleanOffset = Math.max(parseInt(validatedArgs.offset) || 0, 0);

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
        
      },
      'Erreur lors de la recherche de livres'
    ),    
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
    addBook: withErrorHandling(
      async (_, { input }, context) => {
        /* exemple context JWT décodé ( à revoir):
          {
            userId: "uuid-of-user",
            email: "user@example.com",
            role: "admin"
          }
        */
        /*exemple de requête :
        mutation addBook($input: CreateBookInput!) { addBook(input: $input) {isbn }}

        */
        /* Exemple variables :
        { "input": {
          "isbn": "978-2070301579",
          "title": "toto à la plage",
          "author": "toto",
          "publication_date": "2022-04-10",
          "genre": "blague",
          "editor": "plon",
          "age_limit": 10,
          "description": "Cest lhistoire de toto",
          "series":"1sur999999",
          "bookimage": "tret",
          "vignetteimage" : "test"
        }
        }        
        */
    
        // Vérifier que l'utilisateur est un administrateur avec accès aux données
        requireAdmin(context);
    
        // Validation Joi de l'input => 1ere couche - défense en profondeur
        const validatedInput = validateWithJoi(createBookSchema, {        
          title: input.title,
          author: input.author,
          publication_date: input.publicationDate,
          genre: input.genre,
          isbn: input.isbn,
          editor: input.editor,
          vignetteimage: input.vignetteImage,
          bookimage: input.bookImage,
          age_limit: input.ageLimit,
          description: input.description,
          series: input.series
        });

        // Générer un nouvel ID
        const id = uuidv4();
    
        // Sanitize inputs => 2ème couche - défense en profondeur
        const cleanInput = {
          title: sanitizeString(validatedInput.title),
          author: validatedInput.author ? sanitizeString(validatedInput.author) : null,
          publicationDate: validatedInput.publicationDate ? sanitizeString(validatedInput.publicationDate) : null,
          genre: validatedInput.genre ? sanitizeString(validatedInput.genre) : null,
          isbn: validatedInput.isbn ? sanitizeString(validatedInput.isbn) : null,
          editor: validatedInput.editor ? sanitizeString(validatedInput.editor) : null,
          vignetteImage: validatedInput.vignetteImage ? sanitizeString(validatedInput.vignetteImage) : null,
          bookImage: validatedInput.bookImage ? sanitizeString(validatedInput.bookImage) : null,
          ageLimit: validatedInput.ageLimit !== undefined ? parseInt(validatedInput.ageLimit) : null,
          description: validatedInput.description ? sanitizeString(validatedInput.description) : null,
          series: validatedInput.series ? sanitizeString(validatedInput.series) : null,
        };

        // Valider les données
        validateBookInput(cleanInput);

        // Vérifier que l'ISBN n'est pas déjà utilisé
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

        // inserer created_at et updated_at = NOW()
        const now = new Date();
        const createdAt = now;
        const updatedAt = now;

        // Insérer le livre en base de données
        const result = await db.query(`
          INSERT INTO books (
            id_book, title, author, publication_date, genre, isbn, 
            editor, vignetteimage, bookimage, age_limit, description, series, created_at, updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
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
          cleanInput.series || null,
          createdAt,
          updatedAt
        ]);

        if (context?.res?.status) context.res.status(201);
        return result.rows[0];

      },
      "Erreur lors de l'ajout du livre"
    ),    
    
    /**
    * Met à jour un livre
    * 🔒 Route protégée
    * @param {object} input - Les données du livre à mettre à jour
    * @returns {object} Le livre mis à jour
    * @throws {GraphQLError} Si l'utilisateur n'a pas les droits (401 ou 403)
    * @throws {GraphQLError} Si une erreur se produit lors de la mise à jour du livre (500)
    */
    updateBook: withErrorHandling(
      async (_, { input }, context) => {
        /* exemple context JWT décodé ( à revoir):
        {
          userId: "uuid-of-user",
          email: "user@example.com",
          role: "admin"
        }
        */
       /*exemple de requête :
        mutation updateBook($input: UpdateBookInput!) { updateBook(input: $input) {__typename }}

        */
        /* Exemple variables :
        { "input": 
        {"id_book": "4c6dbaa3-9300-425e-88b6-8b2ee81d035e",
          "title" :"toto au travail",
        }
        }       
        */
    
        // Vérifier que l'utilisateur est un administrateur avec accès aux données
        requireAdmin(context);
    
        // Validation Joi de l'input => 1ere couche - défense en profondeur
        const validatedInput = validateWithJoi(updateBookSchema, {   
          id: input.id_book,     
          title: input.title,
          author: input.author,
          publication_date: input.publicationDate,
          genre: input.genre,
          isbn: input.isbn,
          editor: input.editor,
          vignetteimage: input.vignetteImage,
          bookimage: input.bookImage,
          age_limit: input.ageLimit,
          description: input.description,
          series: input.series
        });

        // Sanitize ID => 2ème couche - défense en profondeur
        const cleanIdBook = sanitizeString(validatedInput);

        // Vérifier que le livre existe
        findBookOrThrow(cleanIdBook.id);


        const updates = [];
        const values = [];
        let paramIndex = 1;

        if (validatedInput.title !== undefined) {
          const cleanTitle = sanitizeString(validatedInput.title);
          if (cleanTitle.trim().length < 1) {
            throw new GraphQLError('Le titre ne peut pas être vide', {
              extensions: { code: 'BAD_REQUEST', httpStatus: 400 },
            });
          }
          updates.push(`title = $${paramIndex++}`);
          values.push(cleanTitle);
        }        
        if (validatedInput.author !== undefined) {
          updates.push(`author = $${paramIndex++}`);
          values.push(sanitizeInput(validatedInput.author));
        }
        if (validatedInput.publication_date !== undefined) {
          updates.push(`publication_date = $${paramIndex++}`);
          values.push(sanitizeInput(validatedInput.publication_date));
        }
        if (validatedInput.genre !== undefined) {
          updates.push(`genre = $${paramIndex++}`);
          values.push(sanitizeInput(validatedInput.genre));
        }
        if (validatedInput.isbn !== undefined) {
          const cleanIsbn = sanitizeString(validatedInput.isbn);
          // Vérifier que l'ISBN n'est pas déjà utilisé par un autre livre
          if (cleanIsbn) {
            const existing = await db.query(
              'SELECT id_book FROM books WHERE isbn = $1 AND id_book != $2',
              [cleanIsbn, cleanIdBook.id]
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
        if (validatedInput.editor !== undefined) {
          updates.push(`editor = $${paramIndex++}`);
          values.push(sanitizeInput(validatedInput.editor));
        }
        if (validatedInput.vignetteImage !== undefined) {
          updates.push(`vignetteimage = $${paramIndex++}`);
          values.push(sanitizeInput(validatedInput.vignetteImage));
        }
        if (validatedInput.bookImage !== undefined) {
          updates.push(`bookimage = $${paramIndex++}`);
          values.push(sanitizeInput(validatedInput.bookImage));
        }
        if (validatedInput.age_limit !== undefined) {
          const cleanAge = parseInt(validatedInput.age_limit);
          if (cleanAge < 0 || cleanAge > 18) {
            throw new GraphQLError('L\'âge limite doit être entre 0 et 18', {
              extensions: { code: 'BAD_REQUEST', httpStatus: 400 },
            });
          }
          updates.push(`age_limit = $${paramIndex++}`);
          values.push(cleanAge);
        }
        if (validatedInput.description !== undefined) {
          updates.push(`description = $${paramIndex++}`);
          values.push(sanitizeInput(validatedInput.description));
        }
        if (validatedInput.series !== undefined) {
          updates.push(`series = $${paramIndex++}`);
          values.push(sanitizeInput(validatedInput.series));
        }
    
        if (updates.length === 0) {
          throw new GraphQLError('Aucun champ à mettre à jour', {
            extensions: { 
              code: 'BAD_REQUEST',
              httpStatus: 400
            },
          });
        }
        values.push(cleanIdBook.id);


        const result = await db.query(`
          UPDATE books
          SET ${updates.join(', ')}
          WHERE id_book = $${paramIndex}
          RETURNING *
        `, values);

        if (result.rows.length === 0) {
          throw new Error('Book not found');
        }

        // Return the Book object directly to match the schema (Book!)
        if (context?.res?.status) context.res.status(200);
        return result.rows[0];
    
      },
      "Erreur lors de l'ajout du livre"
    ),    
    
      /**
    * Supprime un livre
    * 🔒 Route protégée
    * @param {object} input - Les données du livre à supprimer
    * @returns {boolean} true si le livre a été supprimé, false sinon
    * @throws {GraphQLError} Si l'utilisateur n'a pas les droits (401 ou 403)
    * @throws {GraphQLError} Si une erreur se produit lors de la suppression du livre (500)
    */
    deleteBook: withErrorHandling(
      async (_, { input }, context) => {
    
      /* exemple context JWT décodé ( à revoir):
        {
          userId: "uuid-of-user",
          email: "user@example.com",
          role: "admin"
        }
        */
      /*exemple de requête :
            mutation deleteBook($input: DeleteBookInput!) { deleteBook(input: $input) }
        */
      /* Exemple variables :
        {"input": {"id_book":"a1b2c3d4-e5f6-7g8h-9i0j-1k2l3m4n5o6p"} }
        */
    
        // Vérifier que l'utilisateur est un administrateur avec accès aux données
        requireAdmin(context);

        // Validation Joi de l'input => 1ere couche - défense en profondeur
        const validatedInput = validateWithJoi(deleteBookSchema, {
          id: input.id_book
        });

        // Sanitize input => 2ème couche - défense en profondeur
        const cleanIdBook = sanitizeString(validatedInput.id);

        // Vérifier que le livre existe
        await findBookOrThrow(cleanIdBook);

        // Vérifier que le livre n'est pas dans des bibliothèques (table bookhaslibrary)
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

        if (context && context.res && typeof context.res.status === 'function') {
          context.res.status(200);
        }

        return true;
        
      },
      "Erreur lors de la suppression du livre"
    ),    
  },

  Book: {},
};