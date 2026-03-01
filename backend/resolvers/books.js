import db from "../db/connect_DB.js";
import { v4 as uuidv4 } from 'uuid';
import { validateOrderParams, handleDbError } from '../utils/validators.js';
import sanitizeHtml from 'sanitize-html';
import { GraphQLError } from 'graphql';
// import { isAuthenticated, requireAuth, requireAdmin, requireOwnershipOrAdmin, sanitizeInput } from './utils/helpers/helpers_general.js';
import { isAuthenticated, requireAuth, requireAdmin, requireOwnershipOrAdmin, sanitizeInput, flattenEdges, makePageInfo, makeEdgeFromBook, withErrorHandling  } from './utils/helpers/helpers_general.js';


import { validate as uuidValidate } from 'uuid';

// Importer les helpers généralistes
import { withSecureResolver } from './utils/helpers/helpers_general.js';

// Importer les schemas Joi spécifiques
import { generalBookSchema, generalOrderBookSchema, searchBooksSchema} from '../schema/schemas_joi/bookSchema.js';

// Importer les wrappers et helpers de sécurité
import { sanitizeStrict} from './utils/helpers/helpers_securite.js';

import { findBy1ParameterOrThrow, generalSortingSchema } from './utils/helper.js';
import authors from "./authors.js";
import editors from "./editors.js";


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

        // Normaliser les dates/strings pour GraphQL scalars
        const books = result.rows.map((r) => ({
          ...r,
          created_at: r.created_at ? (r.created_at instanceof Date ? r.created_at.toISOString().split('T')[0] : String(r.created_at).split('T')[0]) : null,
          updated_at: r.updated_at ? (r.updated_at instanceof Date ? r.updated_at.toISOString().split('T')[0] : String(r.updated_at).split('T')[0]) : null,
          // publication_date : renvoyer une date courte YYYY-MM-DD si c'est une Date, sinon string/null
          publication_date: r.publication_date
            ? (r.publication_date instanceof Date
                ? r.publication_date.toISOString().split('T')[0]
                : String(r.publication_date))
            : null,
        }));

        return {
          // flattened list of Book objects for simple queries: getBooks { books { title } }
          books,
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
        requiresAuth: false,
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
        const cleanId = sanitizeStrict(id_book);

        // Récupérer le livre avec ses reviews (en incluant title_rating)
        const result = await db.query(`
          SELECT 
            b.id_book,
            b.isbn,
            b.title,
            b.author,
            to_char(b.publication_date, 'YYYY-MM-DD') as publication_date,
            b.genre,
            b.editor,
            b.vignetteimage,
            b.bookimage,
            b.age_limit,
            b.description,
            b.series,
            b.avg_rating,
            b.nb_reviews,
            b.is_in_favorite,
            b.is_in_library,
            to_char(b.created_at, 'YYYY-MM-DD') as created_at,
            to_char(b.updated_at, 'YYYY-MM-DD') as updated_at,
            json_agg(
              json_build_object(
                'id_review', r.id_review,
                'title_rating', r.title_rating,
                'rating', r.rating,
                'comment', r.comment,
                'updated_at', to_char(r.updated_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
                'id_user', r.id_user,
                'user', json_build_object(
                  'id_user', u.id_user,
                  'pseudo', u.pseudo,
                  'name', u.name
                )
              ) ORDER BY r.updated_at DESC
            ) FILTER (WHERE r.id_review IS NOT NULL) as reviews
          FROM books b
          LEFT JOIN reviews r ON b.id_book = r.id_book
          LEFT JOIN users u ON r.id_user = u.id_user
          WHERE b.id_book = $1
          GROUP BY b.id_book
        `, [cleanId]);

        if (!result.rows.length) {
          throw new GraphQLError('Livre non trouvé', {
            extensions: { code: 'NOT_FOUND', httpStatus: 404 }
          });
        }

        const book = result.rows[0];
        book.reviews = book.reviews || [];

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
      //console.log('titleOrAuthor:', titleOrAuthor);
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
        totalCount: countResult.rows[0].count,
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

    // ✅ Valider que le titre existe
    if (!title || !title.trim()) {
      throw new GraphQLError('Le titre est obligatoire', {
        extensions: { code: 'BAD_REQUEST', httpStatus: 400 },
      });
    }

    // ✅ Valider et formater publication_date
    let formattedDate = null;
    if (publication_date) {
      const dateStr = String(publication_date).trim();
      if (dateStr && dateStr !== '{}') {
        const parsedDate = new Date(dateStr);
        if (isNaN(parsedDate.getTime())) {
          throw new GraphQLError('Format de date invalide (attendu: YYYY-MM-DD)', {
            extensions: { code: 'BAD_REQUEST', httpStatus: 400 }
          });
        }
        // ✅ Vérifier que la date n'est pas dans le futur
        if (parsedDate > new Date()) {
          throw new GraphQLError('La date de publication ne peut pas être dans le futur', {
            extensions: { code: 'BAD_REQUEST', httpStatus: 400 }
          });
        }
        formattedDate = parsedDate.toISOString().split('T')[0]; // Format YYYY-MM-DD
      }
    }

    // ✅ CORRECTION : Utiliser une fonction helper pour nettoyer les valeurs
    const cleanValue = (val) => {
      const sanitized = sanitizeStrict(val);
      // Si sanitizeStrict retourne {} ou vide, retourner null
      if (!sanitized || (typeof sanitized === 'object' && Object.keys(sanitized).length === 0)) {
        return null;
      }
      return sanitized;
    };

        const cleanInput = {
          isbn: sanitizeStrict(isbn) || null,
          title: sanitizeStrict(title),
          author: sanitizeStrict(author) || null,
          publicationDate: formattedDate ,
          genre: sanitizeStrict(genre) || null,
          editor: sanitizeStrict(editor) || null,
          vignetteImage: sanitizeStrict(vignetteimage) || null,
          bookImage: sanitizeStrict(bookimage) || null,
          ageLimit: sanitizeStrict(age_limit) || null,
          description: sanitizeStrict(description) || null,
          series: sanitizeStrict(series) || null,
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
          cleanInput.title,
          cleanInput.author,
          cleanInput.publicationDate, // ✅ Peut être null ou YYYY-MM-DD
          cleanInput.genre,
          cleanInput.isbn,
          cleanInput.editor,
          cleanInput.vignetteImage,
          cleanInput.bookImage,
          cleanInput.ageLimit,
          cleanInput.description,
          cleanInput.series,
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

          //console.log('📥 INPUT REÇU:', JSON.stringify(input, null, 2));
          //console.log('📥 publication_date type:', typeof input.publication_date);
          //console.log('📥 publication_date value:', input.publication_date);
  
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
          //console.log('cleanIdBook:', cleanIdBook);

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
          const cleanIsbn = sanitizeStrict(input.isbn);
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
          //console.log('Values for updateBook:', result);
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
        const existingBook = await findBy1ParameterOrThrow('books', 'id_book', cleanIdBook, 'Livre non trouvé');
        if (!existingBook.data) {
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

  Book: {
    // Resolver pour les reviews d'un livre
    reviews: async (parent) => {

      // ✅ Ajoute un log pour déboguer
      //console.log('📚 Loading reviews for book:', parent.id_book);
          
      if (parent?.reviews && Array.isArray(parent.reviews)) {
        return parent.reviews;
      }

      if (!parent?.id_book) {
        //console.log('❌ No id_book provided');
        return [];
      }

      try {
        const result = await db.query(`
          SELECT 
            r.id_review,
            r.id_book,
            r.id_user,
            r.rating,
            r.comment,
            r.updated_at,
            r.created_at
          FROM reviews r
          WHERE r.id_book = $1
          AND r.title_rating IS NOT NULL
          AND r.comment IS NOT NULL
          ORDER BY r.updated_at DESC
        `, [parent.id_book]);

        //console.log('✅ Found reviews:', result.rows.length);

        return result.rows || [];

     // ✅ Filtrer et valider les données retournées
     /*return (result.rows || [])
       .filter(r => r.title_rating && r.comment) // Éviter les null
       .map(r => ({
         ...r,
         title_rating: r.title_rating || 'Sans titre',
         comment: r.comment || ''
       }));*/

      } catch (error) {
        console.error('Erreur lors de la récupération des reviews:', error);
        return [];
      }
    },

    authors: async (parent) => {
      if (parent?.authors) {
        return parent.authors;
      }
      if (!parent?.id_book) {
        return [];
      }
      const result = await db.query(
        'SELECT * FROM authors WHERE id_book = $1',
        [parent.id_book]
      );
      return result.rows || [];
    },

     libraries: async (parent) => { 
      if (parent?.libraries) {
        return parent.libraries;
      }
      if (!parent?.id_book) {
        return [];
      }
      const result = await db.query(
        `SELECT l.* FROM libraries l
         JOIN bookhaslibrary bl ON bl.id_library = l.id_library
         WHERE bl.id_book = $1`,
        [parent.id_book]
      );
      return result.rows || [];
    },

    editors: async (parent) => {
      if (parent?.editors) {
        return parent.editors;
      } 
      if (!parent?.id_book) { 
        return [];
      }
      const result = await db.query(
        'SELECT * FROM editors WHERE id_book = $1',
        [parent.id_book]
      );
      return result.rows || [];
    },

    genre: async (parent) => {
      // Si le genre est déjà chargé (objet), retourner son nom
      if (parent?.genre && typeof parent.genre === 'object' && parent.genre.name) {
        return parent.genre.name;
      }
      
      // Si genre est un ID (INTEGER), chercher le nom du genre
      if (parent?.genre) {
        try {
          const result = await db.query(
            'SELECT name FROM genres WHERE id_genre = $1',
            [parent.genre]
          );
          return result.rows[0]?.name || null;
        } catch (error) {
          console.error('Erreur lors de la récupération du nom du genre:', error);
          return null;
        }
      }
      return null;
    },

    author: async (parent) => {
      //console.log('📖 Book.author resolver called, parent.author =', parent.author, 'type:', typeof parent.author);
      
      // Si l'auteur est déjà chargé (objet), retourner son nom
      if (parent?.author && typeof parent.author === 'object' && parent.author.name) {
        return parent.author.name;
      }
      
      // Si author est un ID (INTEGER), chercher le nom de l'auteur
      if (parent?.author) {
        try {
          const result = await db.query(
            'SELECT name FROM authors WHERE id_author = $1',
            [parent.author]
          );
          //console.log('📖 Author lookup result for id', parent.author, ':', result.rows);
          return result.rows[0]?.name || null;
        } catch (error) {
          console.error('Erreur lors de la récupération du nom de l\'auteur:', error);
          return null;
        }
      }
      //console.log('📖 No author found (null), returning null');
      return null;
    },

    editor: async (parent) => {
      // Si l'éditeur est déjà chargé (objet), retourner son nom
      if (parent?.editor && typeof parent.editor === 'object' && parent.editor.name) {
        return parent.editor.name;
      }
      
      // Si editor est un ID (INTEGER), chercher le nom de l'éditeur
      if (parent?.editor) {
        try {
          const result = await db.query(
            'SELECT name FROM editors WHERE id_editor = $1',
            [parent.editor]
          );
          return result.rows[0]?.name || null;
        } catch (error) {
          console.error('Erreur lors de la récupération du nom de l\'éditeur:', error);
          return null;
        }
      }
      return null;
    },
  },
};
