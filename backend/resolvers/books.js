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


import { validate as uuidValidate } from 'uuid';

// Importer les helpers généralistes
import { withSecureResolver } from './utils/helpers/helpers_general.js';
// Importer les helpers spécifiques
import { findBookOrThrow, validateBookInput} from './utils/helpers/helpers_books.js';

// Importer le schema Joi genéral
import { generalSortingSchema } from '../schema/schemas_joi/generalSchema.js';
// Importer les schemas Joi spécifiques
import { generalBookSchema, generalOrderBookSchema, searchBooksSchema} from '../schema/schemas_joi/bookSchema.js';

// Importer les wrappers et helpers de sécurité
import { sanitizeStrict} from './utils/helpers/helpers_securite.js';




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
     getBooks: withSecureResolver(
      async (_, { validated }, context) => {    
        /* exemple context JWT décodé ( à revoir):
        {
          userId: "uuid-of-user",
          email: "user@example.com",
          role: "admin"
        }
        */
        /*exemple de requête :
        query {getBooks{books{title, id_book}}}
        */
        /* Exemple variables :
        {
        }
        */
        
        // ========================================
        // RECUPERER LES DONNEES NESSESAIRES
        // ======================================== 
        const { limit = 150, offset = 0, direction = 'ASC', order = 'created_at' } = validated;

        const validOrders = ['id_book', 'name', 'author', 'avg_rating', 'nb_reviews', 'is_in_favorite', 'publication_date', 'created_at', 'updated_at'];
        const { order: safeOrder, direction: safeDirection } = validateOrderParams(
          order,
          direction,
          validOrders
        );
        // ========================================
        // REQUETES BASE DE DONNEES
        // ======================================== 
        const result = await db.query(`
          SELECT *
          FROM books
          ORDER BY ${safeOrder} ${safeDirection}
          LIMIT $1 OFFSET $2
        `, [limit, offset]);
        
        const countResult = await db.query('SELECT COUNT(*)::int as count FROM books');
        const totalCount = countResult.rows[0].count;

        // ========================================
        // DONNEES RECUPEREES
        // ======================================== 
        return {
          // flattened list of Book objects for simple queries: getBooks { books { title } }
          books: result.rows,
          // backward-compatible edge representation
          totalCount,
          hasNextPage: offset + limit < totalCount,
          httpStatus: 200,
        };
      },
      {
        structureSchema: generalBookSchema,
        sortingSchema: generalSortingSchema,
        orderSchema: generalOrderBookSchema,  
        logAction: 'GET_ALL_BOOKS',
        requiresAuth: true,
        errorMessage: 'Erreur lors de la récupération des livres'
      }
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
    getBook: withSecureResolver(
      async (_, { id_book, validated }, context) => {
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
        // ========================================
        // RECUPERER LES DONNEES NESSESAIRES
        // ======================================== 
        const cleanId = sanitizeStrict(id_book);

        // ========================================
        // REQUETES BASE DE DONNEES
        // ======================================== 
        const book = await findBookOrThrow(cleanId  );

        // ========================================
        // DONNEES RECUPEREES
        // ========================================        
        if (context?.res?.status) context.res.status(200);
        return book;

      },
      {
        structureSchema: generalBookSchema,
        sortingSchema: generalSortingSchema,
        orderSchema: generalOrderBookSchema,  
        logAction: 'GET_ONE_BOOKS',
        requiresAuth: true,
        errorMessage: 'Erreur lors de la récupération d un livre'
      }
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
    searchBooks: withSecureResolver(
      async (_, { validated }, context) => {
      /* exemple context JWT décodé ( à revoir):
      {
        userId: "uuid-of-user",
        email: "user@example.com",
        role: "admin"
      }
      */
      /*exemple de requête :
      query  searchBooks($titleOrAuthor: String!) {searchBooks(titleOrAuthor: $titleOrAuthor) {books{title,author} }}

      */
      /* Exemple variables :
      {"titleOrAuthor": "ta"}
      */

      // ========================================
      // RECUPERER LES DONNEES NESSESAIRES
      // ======================================== 

      const { titleOrAuthor, limit = 50, offset = 0, direction = 'ASC', order = 'created_at' } = validated;
console.log('titleOrAuthor:', titleOrAuthor);
      if (!titleOrAuthor || titleOrAuthor.length < 2) {
        throw new GraphQLError('Le terme de recherche doit contenir au moins 2 caractères', {
          extensions: { code: 'BAD_REQUEST', httpStatus: 400 }
        });
      }

      const cleanQuery = sanitizeStrict(titleOrAuthor);
      const searchPattern = `%${cleanQuery}%`;

      const validOrders = ['id_book', 'name', 'author', 'avg_rating', 'nb_reviews', 'is_in_favorite', 'publication_date', 'created_at', 'updated_at'];
      const { order: safeOrder, direction: safeDirection } = validateOrderParams(
        order,
        direction,
        validOrders
      );

      // ========================================
      // REQUETES BASE DE DONNEES
      // ======================================== 
      const result = await db.query(`
        SELECT *
        FROM books
        WHERE LOWER(title) LIKE LOWER($1) OR LOWER(author) LIKE LOWER($1)
        ORDER BY avg_rating DESC NULLS LAST, nb_reviews DESC
        LIMIT $2 OFFSET $3
      `, [searchPattern, limit, offset]);
      
      const countResult = await db.query(`
        SELECT COUNT(*)::int as count FROM books
        WHERE LOWER(title) LIKE LOWER($1) OR LOWER(author) LIKE LOWER($1)
      `, [searchPattern]);

      // ========================================
      // DONNEES RECUPEREES
      // ========================================                
      return {
        books: result.rows,
        countResult,
        hasNextPage: offset + limit < countResult,
        httpStatus: 200,
      };

      },
      {
        structureSchema: generalBookSchema,
        sortingSchema: generalSortingSchema,
        orderSchema: generalOrderBookSchema,  
        specificSchema: searchBooksSchema,
        logAction: 'SEARCH_BOOKS',
        requiresAuth: true,
        errorMessage: 'Erreur lors de la recherche de livres'
      }
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
    addBook: withSecureResolver(
  async (_, { input, validated }, context) => {
        /* exemple context JWT décodé ( à revoir):
          {
            userId: "uuid-of-user",
            email: "user@example.com",
            role: "admin"
          }
        */
        /*exemple de requête :
        mutation addBook($input: CreateBookInput!) { addBook(input: $input) {isbn, id_book  }}

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
        // ========================================
        // RECUPERER LES DONNEES NESSESAIRES
        // ======================================== 

        const { isbn, title, author, publication_date, genre, editor, vignetteimage, bookimage, age_limit, description, series } = input;

        const cleanInput = {
          isbn: sanitizeStrict(isbn),
          title: sanitizeStrict(title),
          author: sanitizeStrict(author),
          publicationDate: sanitizeStrict(publication_date),
          genre: sanitizeStrict(genre),
          editor: sanitizeStrict(editor),
          vignetteImage: sanitizeStrict(vignetteimage),
          bookImage: sanitizeStrict(bookimage),
          ageLimit: sanitizeStrict(age_limit),
          description: sanitizeStrict(description),
          series: sanitizeStrict(series),
        };

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

        // ========================================
        // REQUETES BASE DE DONNEES
        // ========================================         
        
        // Générer un nouvel ID
        const id = uuidv4();
    

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
        // ========================================
        // DONNEES RECUPEREES
        // ======================================== 
        if (context?.res?.status) context.res.status(201);
        return result.rows[0];

      },
      {
        structureSchema: generalBookSchema,
        sortingSchema: generalSortingSchema,
        orderSchema: generalOrderBookSchema,  
        logAction: 'ADDING_BOOK',
        requiresAdmin: true,
        errorMessage: 'Erreur lors de la création de livres'
      }
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
      async (_, { input, validated }, context) => {
        /* exemple context JWT décodé ( à revoir):
        {
          userId: "uuid-of-user",
          email: "user@example.com",
          role: "admin"
        }
        */
       /*exemple de requête :
        mutation updateBook($input: UpdateBookInput!) { updateBook(input: $input) {id_book, isbn, title}}

        */
        /* Exemple variables :
        { "input": 
        {"id_book": "4c6dbaa3-9300-425e-88b6-8b2ee81d035e",
          "title" :"toto au travail"
        }
        }  
        ancient : 4c6dbaa3-9300-425e-88b6-8b2ee81d035e
        nouveau : 49114f5f-537e-42e7-a42a-62a66d23da4c
        */
        // ========================================
        // RECUPERER LES DONNEES NESSESAIRES
        // ======================================== 

        const { id_book, title, author, publication_date, genre, isbn, editor, vignetteimage, bookimage, age_limit, description, series } = input;

        const cleanInput = {  
          id_book: sanitizeStrict(input.id_book),
          title: sanitizeStrict(input.title),
          author: sanitizeStrict(input.author),
          publication_date: sanitizeStrict(input.publication_date),
          genre: sanitizeStrict(input.genre),
          isbn: sanitizeStrict(input.isbn),
          editor: sanitizeStrict(input.editor),
          vignetteimage: sanitizeStrict(input.vignetteimage),
          bookimage: sanitizeStrict(input.bookimage),
          age_limit: sanitizeStrict(input.age_limit),
          description: sanitizeStrict(input.description),
          series: sanitizeStrict(input.series)
        };

        const updates = [];
        const values = [];
        let paramIndex = 1;

        
          const cleanIdBook = sanitizeStrict(id_book);
          console.log('cleanIdBook:', cleanIdBook);

        if (title !== undefined) {
          const cleanTitle = sanitizeStrict(title);
          if (cleanTitle.trim().length < 1) {
            throw new GraphQLError('Le titre ne peut pas être vide', {
              extensions: { code: 'BAD_REQUEST', httpStatus: 400 },
            });
          }
          updates.push(`title = $${paramIndex++}`);
          values.push(cleanTitle);
        }        
        if (input.author !== undefined) {
          updates.push(`author = $${paramIndex++}`);
          values.push(sanitizeInput(input.author));
        }
        if (input.publication_date !== undefined) {
          updates.push(`publication_date = $${paramIndex++}`);
          values.push(sanitizeInput(input.publication_date));
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
        if (input.age_limit !== undefined) {
          const cleanAge = parseInt(input.age_limit);
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
        values.push(cleanIdBook);

        // ========================================
        // REQUETES BASE DE DONNEES
        // ======================================== 
        const result = await db.query(`
          UPDATE books
          SET ${updates.join(', ')}
          WHERE id_book = $${paramIndex}
          RETURNING *
        `, values);
          console.log('Values for updateBook:', result);
        // ========================================
        // DONNEES RECUPEREES
        // ========================================         
        if (result.rows.length === 0) {
          throw new GraphQLError('Livre non trouvé', {
            extensions: { code: 'NOT_FOUND', httpStatus: 404 },
          });
        }

        // Return the Book object directly to match the schema (Book!)
        if (context?.res?.status) context.res.status(200);
        return result.rows[0];

      },
      {
        structureSchema: generalBookSchema,
        sortingSchema: generalSortingSchema,
        orderSchema: generalOrderBookSchema,  
        logAction: 'UPDATE_BOOK',
        requiresAdmin: true,
        errorMessage: 'Erreur lors de la mise à jour du livre'
      }
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
  async (_, { input, validated }, context) => {
    
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
        {"input": {"id_book":"49114f5f-537e-42e7-a42a-62a66d23da4c"} }
        */
        // ========================================
        // RECUPERER LES DONNEES NESSESAIRES
        // ======================================== 
        const { id_book } = input;  

        const cleanIdBook = sanitizeStrict(id_book);
        const existingBook = await findBookOrThrow(cleanIdBook);
        if (!existingBook) {
          throw new GraphQLError('Livre non trouvé', {
            extensions: { code: 'NOT_FOUND', httpStatus: 404 },
          });
        }
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


        // ========================================
        // REQUETES BASE DE DONNEES
        // ========================================         
        const result = await db.query(
          'DELETE FROM books WHERE id_book = $1 RETURNING id_book',
          [cleanIdBook]
        );


        // ========================================
        // DONNEES RECUPEREES
        // ======================================== 
        if (context && context.res && typeof context.res.status === 'function') {
          context.res.status(200);
        }

        return true;
      },
      {
        structureSchema: generalBookSchema,
        sortingSchema: generalSortingSchema,
        orderSchema: generalOrderBookSchema,  
        logAction: 'DELETE_BOOK',
        requiresAdmin : true,
        errorMessage: 'Erreur lors de la suppression du livre'
      }
    ),

  },

  Book: {},
};