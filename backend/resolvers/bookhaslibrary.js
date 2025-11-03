import db from "../db/connect_DB.js";
import { v4 as uuidv4 } from "uuid";
import { GraphQLError } from 'graphql';
import { validateOrderParams, handleDbError } from '../utils/validators.js';

// Importer les fonctions de vérification de l'existence du livre et de la bibliothèque
import fetchBookById from './utils/utils_books.js';
import fetchLibraryById from './utils/utils_librairies.js';

// Importer les helpers généralistes
import { withSecureResolver } from './utils/helpers/helpers_general.js';
// Importer les helpers spécifiques
import { findBookLibraryOrThrow, requireEditableLibrary, verifyUserOwnsLibrary} from './utils/helpers/helpers_bookhaslibrary.js';

// Importer le schema Joi genéral
import { generalSortingSchema } from '../schema/schemas_joi/generalSchema.js';
// Importer les schemas Joi spécifiques
import { generalOrderBookHasLibrarySchema, sgeneralOrderBookHasLibrarySchema, earchBooksInLibrarySchema} from '../schema/schemas_joi/bookhaslibrarySchema.js';

// Importer les wrappers et helpers de sécurité
import { sanitizeStrict} from './utils/helpers/helpers_securite.js';


// ========================================
// RESOLVERS POUR LES LIVRES EN BIBLIOTHÈQUE
// ======================================== 

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
    getBooksInLibrary: withSecureResolver(
      async (_, { validated }, context) => {
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

        // ========================================
        // RECUPERER LES DONNEES NESSESAIRES
        // ======================================== 
        const { limit = 50, offset = 0, direction = 'ASC', order = 'created_at' } = validated;

        const validOrders = ['id_book', 'created_at', 'updated_at'];
        const { order: safeOrder, direction: safeDirection } = validateOrderParams(
          order,
          direction,
          validOrders
        );

        // ========================================
        // REQUETES BASE DE DONNEES
        // ======================================== 
        const result = await db.query(`
          SELECT id_bookhaslibrary, id_book, id_library, is_read, is_favorite, created_at, updated_at
          FROM bookhaslibrary
          ORDER BY ${safeOrder} ${safeDirection}
          LIMIT $1 OFFSET $2
        `, [limit, offset]);

        const countResult = await db.query('SELECT COUNT(*)::int as count FROM bookhaslibrary');
        const totalCount = countResult.rows[0].count;

        // ========================================
        // DONNEES RECUPEREES
        // ======================================== 
        return {
          books: result.rows,
          totalCount,
          hasNextPage: offset + limit < totalCount,
          httpStatus: 200,
        };
      },
      {
        sortingSchema: generalSortingSchema,
        orderSchema: generalOrderBookHasLibrarySchema,
        logAction: 'GET_ALL_BOOKS_IN_LIBRARY',
        requiresAuth: true,
        errorMessage: 'Erreur lors de la récupération des livres en bibliothèque'
      }
    ),

    /**
     * Récupère un livre d'une bibliothèque
     * 🔒 Route protégée - L'utilisateur ne peut voir que ses propres livres (sauf admin)
     * @param {string} id_bookhaslibrary - ID de la relation livre-bibliothèque
     * @returns {object|null} { data, httpStatus } Les livres en bibliothèque ou null s'il n'y en a pas
     * @throws {GraphQLError} Si l'utilisateur n'a pas les droits (401 ou 403)
     * @throws {GraphQLError} Si une erreur se produit lors de la récupération des livres (500)
     */
    getBookInLibrary: withSecureResolver(
      async (_, { id_bookhaslibrary, validated }, context) => {
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

        // ========================================
        // RECUPERER LES DONNEES NESSESAIRES
        // ======================================== 
        const cleanId = sanitizeStrict(id_bookhaslibrary);

        // ========================================
        // REQUETES BASE DE DONNEES
        // ======================================== 
        const bookLibrary = await findBookLibraryOrThrow(cleanId);
        
        // ========================================
        // DONNEES RECUPEREES
        // ========================================        
        // Vérifier l'accès
        await verifyUserOwnsLibrary(bookLibrary.id_library, context);

        if (context?.res?.status) context.res.status(200);
        return bookLibrary;
      },
      {
        logAction: 'GET_ONE_BOOK_IN_LIBRARY',
        requiresAuth: true,
        errorMessage: 'Erreur lors de la récupération du livre en bibliothèque'
      }
    ),

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
    searchBooksInLibrary: withSecureResolver(
      async (_, { validated }, context) => {
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
    
        // ========================================
        // RECUPERER LES DONNEES NESSESAIRES
        // ======================================== 
        const { bookOrLibrary, limit = 50, offset = 0, direction = 'ASC', order = 'created_at' } = validated;

        if (!bookOrLibrary || bookOrLibrary.length < 2) {
          throw new GraphQLError('Le terme de recherche doit contenir au moins 2 caractères', {
            extensions: { code: 'BAD_REQUEST', httpStatus: 400 }
          });
        }

        const cleanQuery = sanitizeStrict(bookOrLibrary);
        const searchPattern = `%${cleanQuery}%`;

        const validOrders = ['id_book', 'created_at', 'updated_at'];
        const { order: safeOrder, direction: safeDirection } = validateOrderParams(
          order,
          direction,
          validOrders
        );

        // ========================================
        // REQUETES BASE DE DONNEES
        // ======================================== 
        const result = await db.query(`
          SELECT bhl.*, b.title, b.author
          FROM bookhaslibrary bhl
          INNER JOIN books b ON bhl.id_book = b.id_book
          WHERE LOWER(b.title) LIKE LOWER($1) OR LOWER(b.author) LIKE LOWER($1)
          ORDER BY ${safeOrder} ${safeDirection}
          LIMIT $2 OFFSET $3
        `, [searchPattern, limit, offset]);

        const countResult = await db.query(`
          SELECT COUNT(*)::int as count
          FROM bookhaslibrary bhl
          INNER JOIN books b ON bhl.id_book = b.id_book
          WHERE LOWER(b.title) LIKE LOWER($1) OR LOWER(b.author) LIKE LOWER($1)
        `, [searchPattern]);
        const totalCount = countResult.rows[0].count;

        // ========================================
        // DONNEES RECUPEREES
        // ========================================                
        return {
          BookHasLibrary: result.rows,
          totalCount,
          hasNextPage: offset + limit < totalCount,
          httpStatus: 200,
        };
      },
      {
        sortingSchema: generalSortingSchema,
        orderSchema: generalOrderBookHasLibrarySchema,
        inputSchema: searchBooksInLibrarySchema,
        logAction: 'SEARCH_BOOKS_IN_LIBRARY',
        requiresAuth: true,
        errorMessage: 'Erreur lors de la recherche de livres'
      }
    ),
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
    addBookHasLibrary: withSecureResolver(
      async (_, { input, validated }, context) => {
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
    
        // ========================================
        // RECUPERER LES DONNEES NESSESAIRES
        // ======================================== 
        const cleanIdLibrary = sanitizeStrict(input.id_library);
        const cleanIdBook = sanitizeStrict(input.id_book);

        // Vérifier l'accès et que la bibliothèque est modifiable
        const library = await verifyUserOwnsLibrary(cleanIdLibrary, context);
        requireEditableLibrary(library);

        // Vérifier que le livre existe
        const book = await fetchBookById(cleanIdBook);
        if (!book) {
          throw new GraphQLError('Livre non trouvé', {
            extensions: { code: 'NOT_FOUND', httpStatus: 404 }
          });
        }

        // ========================================
        // REQUETES BASE DE DONNEES
        // ========================================         
        // Vérifier que le livre n'est pas déjà dans la bibliothèque
        const existing = await db.query(
          'SELECT id_bookhaslibrary FROM bookhaslibrary WHERE id_book = $1 AND id_library = $2',
          [cleanIdBook, cleanIdLibrary]
        );

        if (existing.rows.length > 0) {
          throw new GraphQLError('Ce livre est déjà dans cette bibliothèque', {
            extensions: { code: 'CONFLICT', httpStatus: 409 }
          });
        }

        const id = uuidv4();
        const result = await db.query(`
          INSERT INTO bookhaslibrary (id_bookhaslibrary, id_book, id_library, is_read, is_favorite, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
          RETURNING *
        `, [id, cleanIdBook, cleanIdLibrary, false, false]);
        // ========================================
        // DONNEES RECUPEREES
        // ======================================== 
        
        if (context?.res?.status) context.res.status(201);
        return result.rows[0];
      },
      {
        logAction: 'ADD_BOOK_TO_LIBRARY',
        requiresAuth: true,
        errorMessage: 'Erreur lors de l\'ajout du livre'
      }
    ),
    
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
    updateBookHasLibrary: withSecureResolver(
      async (_, { input, validated }, context) => {
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
    
        // ========================================
        // RECUPERER LES DONNEES NESSESAIRES
        // ======================================== 
        const { id_bookhaslibrary, id_book, id_library, is_read, is_favorite } = input;

        if (!id_bookhaslibrary) {
          throw new GraphQLError('id_bookhaslibrary requis', {
            extensions: { code: 'BAD_REQUEST', httpStatus: 400 }
          });
        }

        const cleanId = sanitizeStrict(id_bookhaslibrary);
        const bookLibrary = await findBookLibraryOrThrow(cleanId);

        // Vérifier l'accès
        await verifyUserOwnsLibrary(bookLibrary.id_library, context);

        // Construire la requête dynamique
        const updates = [];
        const values = [];
        let paramIndex = 1;

        if (id_book) {
          updates.push(`id_book = $${paramIndex++}`);
          values.push(sanitizeStrict(id_book));
        }
        if (id_library) {
          updates.push(`id_library = $${paramIndex++}`);
          values.push(sanitizeStrict(id_library));
        }
        if (is_read !== undefined) {
          updates.push(`is_read = $${paramIndex++}`);
          values.push(Boolean(is_read));
        }
        if (is_favorite !== undefined) {
          updates.push(`is_favorite = $${paramIndex++}`);
          values.push(Boolean(is_favorite));
        }

        if (updates.length === 0) {
          throw new GraphQLError('Aucun champ à mettre à jour', {
            extensions: { code: 'BAD_REQUEST', httpStatus: 400 }
          });
        }

        // ========================================
        // REQUETES BASE DE DONNEES
        // ======================================== 
        values.push(cleanId); // Pour le WHERE
        const result = await db.query(`
          UPDATE bookhaslibrary
          SET ${updates.join(', ')}, updated_at = NOW()
          WHERE id_bookhaslibrary = $${paramIndex}
          RETURNING *
        `, values);

        // ========================================
        // DONNEES RECUPEREES
        // ========================================         
        if (result.rows.length === 0) {
          throw new GraphQLError('Livre en bibliothèque non trouvé', {
            extensions: { code: 'NOT_FOUND', httpStatus: 404 }
          });
        }

        return result.rows[0];
      },
      {
        logAction: 'UPDATE_BOOK_IN_LIBRARY',
        requiresAuth: true,
        errorMessage: 'Erreur lors de la mise à jour'
      }
    ),
    
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
    deleteBookHasLibrary: withSecureResolver(
      async (_, { input, validated }, context) => {
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
    
        // ========================================
        // RECUPERER LES DONNEES NESSESAIRES
        // ======================================== 
        const cleanId = sanitizeStrict(input.id_bookhaslibrary);

        if (!cleanId) {
          throw new GraphQLError('id_bookhaslibrary requis', {
            extensions: { code: 'BAD_REQUEST', httpStatus: 400 }
          });
        }

        const bookLibrary = await findBookLibraryOrThrow(cleanId);
        
        // Vérifier l'accès
        await verifyUserOwnsLibrary(bookLibrary.id_library, context);

        // ========================================
        // REQUETES BASE DE DONNEES
        // ======================================== 
        const result = await db.query(
          'DELETE FROM bookhaslibrary WHERE id_bookhaslibrary = $1 RETURNING id_bookhaslibrary',
          [cleanId]
        );

        // ========================================
        // DONNEES RECUPEREES
        // ======================================== 
        if (context?.res?.status) context.res.status(200);
        return true;
      },
      {
        logAction: 'DELETE_BOOK_FROM_LIBRARY',
        requiresAuth: true,
        errorMessage: 'Erreur lors de la suppression'
      }
    ),
    
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
    addBooksToLibrary: withSecureResolver(
      async (_, { input, validated }, context) => {
        /* exemple context JWT décodé ( à revoir):
        {
          userId: "uuid-of-user",
          email: "user@example.com"
        }
        */
        /*exemple de requête :
        mutation AddBooksToLibrary($input: AddBooksToLibraryInput!) { addBooksToLibrary(input: $input) { added } }

        */
        /* Exemple variables :     
        { "input": 
          { "books": [
              { "id": "7v8w9x0y-1z2a-3b4c-5d6e-7f8g9h0i1j2k", "id_library": "1bd2f719-a89a-4231-aa6d-dd1df163eee6" },
              { "id": "8w9x0y1z-2a3b-4c5d-6e7f-8g9h0i1j2k3l", "id_library": "1bd2f719-a89a-4231-aa6d-dd1df163eee6" }
            ] 
          }
        }        
        */

        // ========================================
        // RECUPERER LES DONNEES NESSESAIRES
        // ======================================== 

        const { books } = input;

        if (!books || !Array.isArray(books) || books.length === 0) {
          throw new GraphQLError('Le tableau "books" est requis et ne peut pas être vide', {
            extensions: { code: 'BAD_REQUEST', httpStatus: 400 }
          });
        }

        // Sanitize et valider chaque livre
        const cleanBooks = books.map((book) => ({
          id_book: sanitizeStrict(book.id_book),
          id_library: sanitizeStrict(book.id_library),
        }));

        // Vérifier que toutes les bibliothèques appartiennent à l'utilisateur
        const uniqueLibraries = [...new Set(cleanBooks.map(b => b.id_library))];
        for (const libraryId of uniqueLibraries) {
          const library = await verifyUserOwnsLibrary(libraryId, context);
          requireEditableLibrary(library);
        }

        // Vérifier que tous les livres existent
        const uniqueBooks = [...new Set(cleanBooks.map(b => b.id_book))];
        for (const bookId of uniqueBooks) {
          const book = await fetchBookById(bookId);
          if (!book) {
            throw new GraphQLError(`Livre ${bookId} non trouvé`, {
              extensions: { code: 'NOT_FOUND', httpStatus: 404 }
            });
          }
        }

        // Préparer l'insertion en batch
        const values = [];
        const placeholders = [];
        let paramIndex = 1;

        for (const book of cleanBooks) {
          const id = uuidv4();
          placeholders.push(
            `(${paramIndex}, ${paramIndex + 1}, ${paramIndex + 2}, ${paramIndex + 3}, ${paramIndex + 4}, NOW(), NOW())`
          );
          values.push(id, book.id_book, book.id_library, false, false);
          paramIndex += 5;
        }

        // ========================================
        // REQUETES BASE DE DONNEES
        // ======================================== 

        // Insérer tous les livres en une seule requête
        const result = await db.query(`
          INSERT INTO bookhaslibrary (id_bookhaslibrary, id_book, id_library, is_read, is_favorite, created_at, updated_at)
          VALUES ${placeholders.join(', ')}
          ON CONFLICT (id_book, id_library) DO NOTHING
          RETURNING id_bookhaslibrary
        `, values);

        // ========================================
        // DONNEES RECUPEREES
        // ======================================== 
        if (context?.res?.status) context.res.status(201);

        return {
          added: result.rowCount,
          httpStatus: 201,
        };
      },
      {
        logAction: 'ADD_MULTIPLE_BOOKS_TO_LIBRARY',
        requiresAuth: true,
        errorMessage: 'Erreur lors de l\'ajout des livres en batch'
      }
    ),
    
    /**
     * Supprime plusieurs livres d'une bibliothèque
     * 🔒 Route protégée - L'utilisateur ne peut supprimer que dans ses propres bibliothèques (sauf admin
     * @param {object} input Les données d'entrée
     * @throws {GraphQLError} Si les données d'entrée sont invalides (400)
     * @throws {GraphQLError} Si le livre ou la bibliothèque n'existe pas (404)
     * @throws {GraphQLError} Si l'utilisateur n'a pas les droits ou Si la bibliothèque n'est pas modifiable(401 ou 403)
     * @throws {GraphQLError} Si une erreur se produit lors de la récupération des livres (500)
     */
    removeBooksFromLibrary: withSecureResolver(
      async (_, { input, validated }, context) => {
        /* exemple context JWT décodé ( à revoir):
        {
          userId: "uuid-of-user",
          email: "user@example.com"
        }
        */
        /*exemple de requête :
        mutation RemoveBooksFromLibrary($input: RemoveBooksFromLibraryInput!) { removeBooksFromLibrary(input: $input) { removed } }

       */
        /* Exemple variables :     
        { "input": 
          { "books": [
            { "id": "uuid-of-book-1" },
            { "id": "uuid-of-book-2" }
          ]
        }
       */
   
        // ========================================
        // RECUPERER LES DONNEES NESSESAIRES
        // ========================================
        const { books } = input;

        if (!books || !Array.isArray(books) || books.length === 0) {
          throw new GraphQLError('Le tableau "books" est requis et ne peut pas être vide', {
            extensions: { code: 'BAD_REQUEST', httpStatus: 400 }
          });
        }

        // Sanitize et valider chaque livre
        const cleanBooks = books.map((book) => ({
          id_book: sanitizeStrict(book.id_book),
          id_library: sanitizeStrict(book.id_library),
        }));

        // Vérifier que toutes les bibliothèques appartiennent à l'utilisateur
        const uniqueLibraries = [...new Set(cleanBooks.map(b => b.id_library))];
        for (const libraryId of uniqueLibraries) {
          const library = await verifyUserOwnsLibrary(libraryId, context);
          requireEditableLibrary(library);
        }

        // Préparer la suppression en batch avec des paires (id_book, id_library)
        const conditions = cleanBooks.map((book, index) => {
          const bookIndex = index * 2 + 1;
          const libraryIndex = index * 2 + 2;
          return `(id_book = ${bookIndex} AND id_library = ${libraryIndex})`;
        });

        const values = cleanBooks.flatMap(book => [book.id_book, book.id_library]);

        // ========================================
        // REQUETES BASE DE DONNEES
        // ======================================== 
        const result = await db.query(`
          DELETE FROM bookhaslibrary
          WHERE ${conditions.join(' OR ')}
          RETURNING id_bookhaslibrary
        `, values);

        // ========================================
        // DONNEES RECUPEREES
        // ======================================== 
        if (context?.res?.status) context.res.status(200);

        return {
          removed: result.rowCount,
          httpStatus: 200,
        };
      },
      {
        logAction: 'REMOVE_MULTIPLE_BOOKS_FROM_LIBRARY',
        requiresAuth: true,
        errorMessage: 'Erreur lors de la suppression des livres en batch'
      }
    ),

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

        // ========================================
        // RECUPERER LES DONNEES NESSESAIRES
        // ========================================
        // ========================================
        // REQUETES BASE DE DONNEES
        // ========================================
        // ========================================
        // DONNEES RECUPEREES
        // ========================================
