import db from "../db/connect_DB.js";
import { v4 as uuidv4 } from "uuid";
import { GraphQLError } from 'graphql';
import { validateOrderParams, handleDbError } from '../utils/validators.js';

// Importer les fonctions de vérification de l'existence du livre et de la bibliothèque
import fetchBookById from './utils/utils_books.js';
import fetchLibraryById from './utils/utils_librairies.js';

// Importer les helpers généralistes
import { withSecureResolver, verifyUserInDB } from './utils/helpers/helpers_general.js';
// Importer les helpers spécifiques
import { findBookLibraryOrThrow, requireEditableLibrary, verifyUserOwnsLibrary} from './utils/helpers/helpers_bookhaslibrary.js';

// Importer le schema Joi genéral
import { generalSortingSchema } from '../schema/schemas_joi/generalSchema.js';
// Importer les schemas Joi spécifiques
import { generalBookHasLibrarySchema, generalOrderBookHasLibrarySchema, searchBooksInLibrary, addBookHasLibrarySchema, updateBookHasLibrarySchema, deleteBookHasLibrarySchema, addBooksToLibrarySchema, removeBooksFromLibrarySchema} from '../schema/schemas_joi/bookhaslibrarySchema.js';

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
    getBooksInLibraries: withSecureResolver(
      async (_, { validated }, context) => {
        /* exemple header (admin):
          {"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZF91c2VyIjoiMWUyZDNjNGItNWE2Zi03ZThkLTljMGItMWEyZjNlNGQ1YzZiIiwibmFtZSI6IkFsaWNlIER1cG9udCIsInBzZXVkbyI6InBldGl0IHBvaXNzb24ifQ.c8A_mkFWejX_6GDls2GbqCykqsvCISe6soTAHzHbQCM"}
        */
        /*exemple de requête :
          query {getBooksInLibraries { books{id_bookhaslibrary, book{title,description}, library{id_library name, user{name, role{role_name}}}} }}
        */
        /* Exemple variables :
        {
        }
        */

        // ========================================
        // RECUPERER LES DONNEES NESSESAIRES
        // ======================================== 
        const { limit = 50, offset = 0, direction = 'DESC', order = 'created_at' } = validated;

        const validOrders = ['id_book', 'id_library', 'created_at', 'updated_at'];
        const { order: safeOrder, direction: safeDirection } = validateOrderParams(
          order,
          direction,
          validOrders
        );
        // ========================================
        // REQUETES BASE DE DONNEES
        // ======================================== 
        const result = await db.query(`
          SELECT 
            bhl.id_bookhaslibrary, 
            bhl.id_book, 
            bhl.id_library, 
            bhl.is_read, 
            bhl.is_favorite, 
            bhl.created_at, 
            bhl.updated_at,
            l.name as library_name,
            l.id_user as library_owner_id
          FROM bookhaslibrary bhl
          INNER JOIN libraries l ON bhl.id_library = l.id_library
          ORDER BY bhl.${safeOrder} ${safeDirection}
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
        logAction: 'ADMIN_GET_ALL_BOOKS_ALL_LIBRARIES',
        requiresAuth: true,
        requiresAdmin: true, // ✅ Admin uniquement
        errorMessage: 'Erreur lors de la récupération (admin)'
      }
    ),

    /**
     * Récupère tous les livres de toutes LES bibliothèques de l'utilisateur connecté
     * 🔒 Route protégée - Utilisateur authentifié
     */
    getMyBooksInLibraries: withSecureResolver(
      /* exemple de header  :
        {"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZF91c2VyIjoiNGc1ZjZlN2QtOGM5Yi0wYTFmLTJlM2QtNGM1YjZhN2Y4ZTlkIiwibmFtZSI6IkRpYW5lIE1vcmVsIiwicHNldWRvIjoibGludXggdGhlIGJlc3QiLCJpc0FkbWluIjpmYWxzZX0.JPjw19bbnW1IGSunQ4FWC7Z2j8UzYIDUFxET6x4jC6U"}
      */  
      /*exemple de requête :
        query {getMyBooksInLibraries { books{ id_bookhaslibrary book{title, author} library{id_library name} } totalCount hasNextPage }}      
      */
      /* Exemple variables :
        {
        }
      */

      async (_, { validated }, context) => {
        const { limit = 50, offset = 0, direction = 'DESC', order = 'created_at' } = validated;

        // Triple vérification BDD
        const user = await verifyUserInDB(context);

        const validOrders = ['id_book', 'created_at', 'updated_at'];
        const { order: safeOrder, direction: safeDirection } = validateOrderParams(
          order,
          direction,
          validOrders
        );

        // Si admin : voir tout, sinon uniquement ses bibliothèques
        let query, countQuery, params, countParams;

        if (user.isAdmin) {
          // Admin voit tous les livres de toutes les bibliothèques
  query = `
    SELECT 
      bhl.id_bookhaslibrary, 
      bhl.id_book, 
      bhl.id_library, 
      bhl.is_read, 
      bhl.is_favorite,
      bhl.created_at, 
      bhl.updated_at
    FROM bookhaslibrary bhl
    ORDER BY bhl.${safeOrder} ${safeDirection}
    LIMIT $1 OFFSET $2
  `;
  params = [limit, offset];
  
  countQuery = 'SELECT COUNT(*)::int as count FROM bookhaslibrary';
  countParams = [];

        } else {
          // Utilisateur normal : uniquement SES bibliothèques
query = `
  SELECT 
    bhl.id_bookhaslibrary, 
    bhl.id_book, 
    bhl.id_library, 
    bhl.is_read, 
    bhl.is_favorite,
    bhl.created_at, 
    bhl.updated_at,
    l.id_user AS library_owner_id,
    l.name AS library_name
  FROM bookhaslibrary bhl
  INNER JOIN libraries l ON bhl.id_library = l.id_library
  WHERE l.id_user = $1
  ORDER BY bhl.${safeOrder} ${safeDirection}
  LIMIT $2 OFFSET $3
`;
          params = [user.id_user, limit, offset];
          
          countQuery = `
            SELECT COUNT(*)::int as count 
            FROM bookhaslibrary bhl
            INNER JOIN libraries l ON bhl.id_library = l.id_library
            WHERE l.id_user = $1
          `;
          countParams = [user.id_user];
        }

        const result = await db.query(query, params);
        const countResult = await db.query(countQuery, countParams);
        const totalCount = countResult.rows[0].count;

        return {
          books: result.rows,
          totalCount,
          hasNextPage: offset + limit < totalCount,
          httpStatus: 200,
        };
      },
      {
        structureSchema: generalBookHasLibrarySchema,
        sortingSchema: generalSortingSchema,
        orderSchema: generalOrderBookHasLibrarySchema,
        logAction: 'GET_MY_BOOKS_IN_MY_LIBRARIES',
        requiresAuth: false,
        errorMessage: 'Erreur lors de la récupération de vos livres'
      }
    ),

    /**
     * Récupère les livres d'UNE bibliothèque spécifique
     * 🔒 Route protégée - Propriétaire de la bibliothèque ou admin
     */
    getBooksInLibrary: withSecureResolver(
      /* exemple context JWT décodé ( à revoir):
      admin
      {"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZF91c2VyIjoiMWUyZDNjNGItNWE2Zi03ZThkLTljMGItMWEyZjNlNGQ1YzZiIiwibmFtZSI6IkFsaWNlIER1cG9udCIsInBzZXVkbyI6InBldGl0IHBvaXNzb24ifQ.c8A_mkFWejX_6GDls2GbqCykqsvCISe6soTAHzHbQCM"}
      utilisateur normal
      {"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZF91c2VyIjoiNGc1ZjZlN2QtOGM5Yi0wYTFmLTJlM2QtNGM1YjZhN2Y4ZTlkIiwibmFtZSI6IkRpYW5lIE1vcmVsIiwicHNldWRvIjoibGludXggdGhlIGJlc3QiLCJpc0FkbWluIjpmYWxzZX0.JPjw19bbnW1IGSunQ4FWC7Z2j8UzYIDUFxET6x4jC6U"}
      */  
      /*exemple de requête :
        query GetBooksInLibrary($id_library: ID!) {getBooksInLibrary( id_library: $id_library ) { books { id_bookhaslibrary book { title author } library { id_library name } } totalCount hasNextPage}}      
      */
      /* Exemple variables :
        bibliotheque de l'utilisateur non admin :
        {
          "id_library": "4d5e6f7g-8h9i-0j1k-2l3m-4n5o6p7q8r9s"
        }
        bibliotheque d'un autre utilisateur que celui connecté (voir si erreur 403 ) :
        {
          "id_library": "6f7g8h9i-0j1k-2l3m-4n5o-6p7q8r9s0t1i"
        }
        bibliotheque inexistante (voir si erreur 404 ) :
        {
          "id_library": "00000000-0000-0000-0000-000000000000"
        }
        bibliotheque de l'admin (voir si ok pour admin) :
        {
          "id_library": "1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p"
        }
      */

      async (_, { validated }, context) => {
        const { id_library, limit = 50, offset = 0, direction = 'DESC', order = 'created_at' } = validated;

        if (!id_library) {
          throw new GraphQLError('id_library requis', {
            extensions: { code: 'BAD_REQUEST', httpStatus: 400 }
          });
        }

        // Vérifier que la bibliothèque existe
        const library = await fetchLibraryById(id_library);
        
        if (!library) {
          throw new GraphQLError('Bibliothèque non trouvée', {
            extensions: { code: 'NOT_FOUND', httpStatus: 404 }
          });
        }

        // Triple vérification BDD + ownership
        const user = await verifyUserInDB(context);
        
        if (!user.isAdmin && library.id_user !== user.id_user) {
          throw new GraphQLError('Accès refusé à cette bibliothèque', {
            extensions: { code: 'FORBIDDEN', httpStatus: 403 }
          });
        }

        // Requête BDD
        const validOrders = ['id_book', 'created_at', 'updated_at'];
        const { order: safeOrder, direction: safeDirection } = validateOrderParams(
          order,
          direction,
          validOrders
        );

        const result = await db.query(`
          SELECT 
            id_bookhaslibrary, 
            id_book, 
            id_library, 
            is_read, 
            is_favorite, 
            created_at, 
            updated_at
          FROM bookhaslibrary
          WHERE id_library = $1
          ORDER BY ${safeOrder} ${safeDirection}
          LIMIT $2 OFFSET $3
        `, [id_library, limit, offset]);

        const countResult = await db.query(
          'SELECT COUNT(*)::int as count FROM bookhaslibrary WHERE id_library = $1',
          [id_library]
        );
        
        const totalCount = countResult.rows[0].count;

        return {
          books: result.rows,
          totalCount,
          hasNextPage: offset + limit < totalCount,
          httpStatus: 200,
        };
      },
      {
        structureSchema: generalBookHasLibrarySchema, // Avec id_library requis
        sortingSchema: generalSortingSchema,
        orderSchema: generalOrderBookHasLibrarySchema,
        logAction: 'GET_BOOKS_IN_ONE_LIBRARY',
        requiresAuth: true,
        errorMessage: 'Erreur lors de la récupération des livres de la bibliothèque'
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
      /* exemple context JWT décodé ( à revoir):
        {
          userId: "uuid-of-user",
          email: "user@example.com"
        }
        */
        /*exemple de requête :
        query GetBookInLibrary($id_bookhaslibrary: ID!) { getBookInLibrary( id_bookhaslibrary: $id_bookhaslibrary ) { id_bookhaslibrary book { title author } library { id_library name } } }
        */
        /* Exemple variables :
        { "id_bookhaslibrary": "00e1f2g3-h4i5-j6k7-l8m9-n0o1p2q3r4s5" }        
        */
      async (_, { id_bookhaslibrary }, context) => {
        const cleanId = sanitizeStrict(id_bookhaslibrary);
        const bookLibrary = await findBookLibraryOrThrow(cleanId);
        
        // Vérifier que la bibliothèque et le livre existent
        const library = await fetchLibraryById(bookLibrary.id_library);
        const book = await fetchBookById(bookLibrary.id_book);

        
        // Vérifier ownership de la bibliothèque (triple vérification BDD. On ne fait pas confiance au token seul. retourne une valeur ou lève une erreur si pas trouvé)
        const user = await verifyUserInDB(context);
        
        if (!user.isAdmin && library.id_user !== user.id_user) {
          throw new GraphQLError('Accès refusé', {
            extensions: { code: 'FORBIDDEN', httpStatus: 403 }
          });
        }

        if (context?.res?.status) context.res.status(200);
        return bookLibrary;
      },
      {
        structureSchema: generalBookHasLibrarySchema,
        logAction: 'GET_ONE_BOOK_IN_LIBRARY',
        requiresAuth: true,
        errorMessage: 'Erreur lors de la récupération du livre'
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
        /* exemple context JWT décodé ( à revoir):
        {
        }
        */
        /*exemple de requête :
        query SearchBooksInLibrary($titleOrAuthor: String!) { searchBooksInLibrary(titleOrAuthor: $titleOrAuthor) { totalCount books { id_bookhaslibrary book { title author} library { id_library name}}}}
        */
        /* Exemple variables :
        { "titleOrAuthor": "00" }        
        */
      async (_, { validated }, context) => {

        const { titleOrAuthor, limit = 50,  offset = 0, direction = 'DESC', order = 'created_at' } = validated;  

        if (!titleOrAuthor || titleOrAuthor.length < 2) {
          throw new GraphQLError('Le terme de recherche doit contenir au moins 2 caractères', {
            extensions: { code: 'BAD_REQUEST', httpStatus: 400 }
          });
        }

        const user = await verifyUserInDB(context);
        const cleanQuery = sanitizeStrict(titleOrAuthor);
        const searchPattern = `%${cleanQuery}%`;

        const validOrders = ['id_book', 'created_at', 'updated_at'];
        const { order: safeOrder, direction: safeDirection } = validateOrderParams(
          order,
          direction,
          validOrders
        );

        // Si admin : chercher partout, sinon uniquement dans ses bibliothèques
        let query, countQuery, params, countParams;

        if (user.isAdmin) {
          query = `
            SELECT bhl.*, b.title, b.author
            FROM bookhaslibrary bhl
            INNER JOIN books b ON bhl.id_book = b.id_book
            WHERE LOWER(b.title) LIKE LOWER($1) OR LOWER(b.author) LIKE LOWER($1)
            ORDER BY bhl.${safeOrder} ${safeDirection}
            LIMIT $2 OFFSET $3
          `;
          params = [searchPattern, limit, offset];
          
          countQuery = `
            SELECT COUNT(*)::int as count
            FROM bookhaslibrary bhl
            INNER JOIN books b ON bhl.id_book = b.id_book
            WHERE LOWER(b.title) LIKE LOWER($1) OR LOWER(b.author) LIKE LOWER($1)
          `;
          countParams = [searchPattern];
        } else {
          query = `
            SELECT bhl.*, b.title, b.author
            FROM bookhaslibrary bhl
            INNER JOIN books b ON bhl.id_book = b.id_book
            INNER JOIN libraries l ON bhl.id_library = l.id_library
            WHERE (LOWER(b.title) LIKE LOWER($1) OR LOWER(b.author) LIKE LOWER($1))
              AND l.id_user = $2
            ORDER BY bhl.${safeOrder} ${safeDirection}
            LIMIT $3 OFFSET $4
          `;
          params = [searchPattern, user.id_user, limit, offset];
          
          countQuery = `
            SELECT COUNT(*)::int as count
            FROM bookhaslibrary bhl
            INNER JOIN books b ON bhl.id_book = b.id_book
            INNER JOIN libraries l ON bhl.id_library = l.id_library
            WHERE (LOWER(b.title) LIKE LOWER($1) OR LOWER(b.author) LIKE LOWER($1))
              AND l.id_user = $2
          `;
          countParams = [searchPattern, user.id_user];
        }

        const result = await db.query(query, params);
        const countResult = await db.query(countQuery, countParams);
        const totalCount = countResult.rows[0].count;

        return {
          books: result.rows,
          totalCount,
          hasNextPage: offset + limit < totalCount,
          httpStatus: 200,
        };
      },
      {
        structureSchema: generalBookHasLibrarySchema,
        specificSchema: searchBooksInLibrary,
        sortingSchema: generalSortingSchema,
        orderSchema: generalOrderBookHasLibrarySchema,
        logAction: 'SEARCH_BOOKS_IN_LIBRARIES',
        requiresAuth: true,
        errorMessage: 'Erreur lors de la recherche'
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
        structureSchema: generalBookHasLibrarySchema,
        specificSchema: addBookHasLibrarySchema,
        sortingSchema: generalSortingSchema,
        orderSchema: generalOrderBookHasLibrarySchema,
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
        structureSchema: generalBookHasLibrarySchema,
        specificSchema: updateBookHasLibrarySchema,
        sortingSchema: generalSortingSchema,
        orderSchema: generalOrderBookHasLibrarySchema,
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
        structureSchema: generalBookHasLibrarySchema,
        specificSchema: deleteBookHasLibrarySchema,
        sortingSchema: generalSortingSchema,
        orderSchema: generalOrderBookHasLibrarySchema,
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
        mutation AddBooksToLibrary($input: AddBooksToLibraryInput!) { addBooksToLibrary(input: $input) {booksInLibrary{book{title}}  } }

        */
        /* Exemple variables :     
        { "input": 
          { "books": [
              { "id_book": "3c4d5e6f-7g8h-9i0j-1k2l-3m4n5o6p7q8r", "id_library": "2b3c4d5e-6f7g-8h9i-0j1k-2l3m4n5o6p7q" },
              { "id_book": "9x0y1z2a-3b4c-5d6e-7f8g-9h0i1j2k3l4m", "id_library": "2b3c4d5e-6f7g-8h9i-0j1k-2l3m4n5o6p7q" }
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
          // Un seul jeu de placeholders $n par ligne
          placeholders.push(`($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4}, NOW(), NOW())`);
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
          RETURNING *
        `, values);

        // ========================================
        // DONNEES RECUPEREES
        // ======================================== 
        if (context?.res?.status) context.res.status(201);

        return {
          booksInLibrary: result.rows,
          httpStatus: 201,
        };
      },
      {
        structureSchema: generalBookHasLibrarySchema,
        specificSchema: addBooksToLibrarySchema,
        sortingSchema: generalSortingSchema,
        orderSchema: generalOrderBookHasLibrarySchema,
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
        mutation RemoveBooksFromLibrary($input: RemoveBooksFromLibraryInput!) { addBooksToLibrary(input: $input) {removed{book{title}}  } }

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
        const values = [];
        const tuplePlaceholders = [];
        let paramIndex = 1;
        for (const book of cleanBooks) {
          tuplePlaceholders.push(`($${paramIndex}, $${paramIndex + 1})`);
          values.push(book.id_book, book.id_library);
          paramIndex += 2;
        }

        if (tuplePlaceholders.length === 0) {
          throw new GraphQLError('Aucun livre à supprimer', { extensions: { code: 'BAD_REQUEST', httpStatus: 400 } });
        }

        // ========================================
        // REQUETES BASE DE DONNEES
        // ======================================== 
        const result = await db.query(`
          DELETE FROM bookhaslibrary b
          USING (VALUES ${tuplePlaceholders.join(', ')}) AS vals(id_book, id_library)
          WHERE b.id_book = vals.id_book AND b.id_library = vals.id_library
          RETURNING b.*;
        `, values);

        // ========================================
        // DONNEES RECUPEREES
        // ======================================== 
        if (context?.res?.status) context.res.status(200);

        return {
          removed: result.rows,
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

