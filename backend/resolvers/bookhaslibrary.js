import db from "../db/connect_DB.js";
import { v4 as uuidv4 } from "uuid";
import { GraphQLError } from 'graphql';
import { validateOrderParams, handleDbError } from '../utils/validators.js';

// Importer les fonctions de vérification de l'existence du livre et de la bibliothèque
import { findBy1ParameterOrThrow } from './utils/helper.js';

// Importer les helpers généralistes
import { withSecureResolver, verifyUserInDB } from './utils/helpers/helpers_general.js';
// Importer les helpers spécifiques
import { requireEditableLibrary, verifyUserOwnsLibrary} from './utils/helpers/helpers_bookhaslibrary.js';

// Importer le schema Joi genéral
import { generalSortingSchema } from '../schema/schemas_joi/generalSchema.js';
// Importer les schemas Joi spécifiques
import { generalBookHasLibrarySchema, generalOrderBookHasLibrarySchema, searchBooksInLibrary, addBookHasLibrarySchema, updateBookHasLibrarySchema, deleteBookHasLibrarySchema, addBooksToLibrarySchema, removeBooksFromLibrarySchema} from '../schema/schemas_joi/bookhaslibrarySchema.js';

// Importer les wrappers et helpers de sécurité
import { sanitizeStrict} from './utils/helpers/helpers_securite.js';
import { get } from "http";

// HEADERS POUR LES REQUETES DE TEST
  //ADMIN
    // {"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZF91c2VyIjoiMWUyZDNjNGItNWE2Zi03ZThkLTljMGItMWEyZjNlNGQ1YzZiIiwibmFtZSI6IkFsaWNlIER1cG9udCIsInBzZXVkbyI6InBldGl0IHBvaXNzb24ifQ.c8A_mkFWejX_6GDls2GbqCykqsvCISe6soTAHzHbQCM"}
    // {"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZF91c2VyIjoiMmUzZDRjNWItNmE3Zi04ZTlkLTBjMWItMmEzZjRlNWQ2YzdiIiwibmFtZSI6IkJvYiBNYXJ0aW4iLCJwc2V1ZG8iOiJyZWQgdGFnIn0.tYTKgqtrErdB4wzIC3GJkyyflvnL-eEzv8xTBhw9UsY"}

  //UTILISATEUR NORMAL
    // {"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZF91c2VyIjoiNGc1ZjZlN2QtOGM5Yi0wYTFmLTJlM2QtNGM1YjZhN2Y4ZTlkIiwibmFtZSI6IkRpYW5lIE1vcmVsIiwicHNldWRvIjoibGludXggdGhlIGJlc3QiLCJpc0FkbWluIjpmYWxzZX0.JPjw19bbnW1IGSunQ4FWC7Z2j8UzYIDUFxET6x4jC6U"}

// ========================================
// RESOLVERS POUR LES LIVRES EN BIBLIOTHÈQUE
// ======================================== 

export default {
  Query: {
    /**
     * Récupère tous les livres de toutes les bibliothèques avec pagination et tri
     * 🔒 Route protégée - L'utilisateur ne peut voir que ses propres livres (sauf admin)
     * @param {number} limit - Limite de résultats (max 100)
     * @param {number} offset - Décalage pour pagination
     * @param {string} order - Champ de tri
     * @param {string} direction - Direction du tri (ASC/DESC)
     * @returns {object} { books, totalCount, hasNextPage, httpStatus }
     * @throws {GraphQLError} Si l'utilisateur n'a pas les droits (401 ou 403)  
     * @throws {GraphQLError} Si une erreur se produit lors de la récupération des livres (500)
    */
    getAllBooksAllLibrariesForAdmin: withSecureResolver(
      async (_, { validated }, context) => {
        /*exemple de requête :
          query {getAllBooksAllLibrariesForAdmin { books{id_bookhaslibrary, book{title,description}, library{id_library name, user{name, role{role_name}}}} }}
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
        //vérifier si id_user existe en BDD sinon erreur 401
        const user = await verifyUserInDB(context); console.log('User from context:', user);
        
        let query, countQuery;

        // ========================================
        // REQUETES BASE DE DONNEES
        // ======================================== 
        if (!user.isAdmin) {
          throw new GraphQLError('Accès refusé', {
            extensions: { code: 'FORBIDDEN', httpStatus: 403 }
          });
        } else {
        //si admin, recuperer tous les livres en bibliothèque
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
          `;
           countQuery = `
            SELECT COUNT(*)::int as count FROM bookhaslibrary
          `;
        }
        const result = await db.query(query);
        const countResult = await db.query(countQuery);
        // ========================================
        // DONNEES RECUPEREES
        // ========================================
        return {
          books: result.rows,
          totalCount: countResult.rows[0].count,
          httpStatus: 200
        };
      },
      {
        structureSchema: generalBookHasLibrarySchema,
        sortingSchema: generalSortingSchema,
        orderSchema: generalOrderBookHasLibrarySchema,
        logAction: 'ADMIN_GET_ALL_BOOKS_ALL_LIBRARIES',
        requiresAuth: true,
        requiresAdmin: true,
        errorMessage: 'Erreur lors de la récupération (admin)'
      }
    ),

    /**
     * Récupère les livres d'UNE bibliothèque spécifique
     * 🔒 Route protégée - Propriétaire de la bibliothèque ou admin
     */
    getAllBooksInAllMyLibraries: withSecureResolver(
      /*exemple de requête :
        query getAllBooksIn1Library { books { id_bookhaslibrary book { title author } library { id_library name } } }      
      */

      async (_, { validated }, context) => {
        // Récupérer l'utilisateur depuis le context
          // user
          const user = await verifyUserInDB(context);

          // caster/valider pagination
          const raw = validated || {};
          const cleanLimit = Math.min(Math.max(parseInt(raw.limit, 10) || 50, 1), 100);
          const cleanOffset = Math.max(parseInt(raw.offset, 10) || 0, 0);
          const direction = (raw.direction || 'DESC').toString();
          const order = (raw.order || 'created_at').toString();

          const validOrders = ['id_book', 'created_at', 'updated_at'];
          const { order: safeOrder, direction: safeDirection } = validateOrderParams(order, direction, validOrders);

          // récupérer bibliothèques
          const userLibraries = await db.query('SELECT id_library FROM libraries WHERE id_user = $1', [user.id_user]);
          const libraryIds = Array.isArray(userLibraries.rows) ? userLibraries.rows.map(r => r.id_library).filter(Boolean) : [];

          if (libraryIds.length === 0) {
            return { books: [], totalCount: 0, hasNextPage: false, httpStatus: 200 };
          }

          // préparer requête une fois
          const sql = `
            SELECT
              bhl.id_bookhaslibrary,
              bhl.id_book,
              bhl.id_library,
              bhl.is_read,
              bhl.is_favorite,
              bhl.created_at,
              bhl.updated_at
            FROM bookhaslibrary bhl
           WHERE bhl.id_library = $1
            ORDER BY bhl.${safeOrder} ${safeDirection}
          `;

          // récupérer par bibliothèque en protégeant chaque appel
          const booksByLibrary = await Promise.all(libraryIds.map(async (libId) => {
            if (!libId) return [];
            try {
              const res = await db.query(sql, [libId]);
              console.log(`Books found in library ${libId}:`, res.rows);
              return Array.isArray(res.rows) ? res.rows : [];

            } catch (e) {
              console.error('[ERROR] db.query failed in getAllBooksInAllMyLibraries', {
                libId,
                safeOrder,
                safeDirection,
                cleanLimit,
                cleanOffset,
                errMessage: e && e.message
              });
              throw e;
            }
          }));

          const flattened = booksByLibrary.flat();
          console.log('Total books found across all libraries:', flattened);

        // Récupérer les infos (id, name) pour les bibliothèques en une seule requête
        const libsRes = await db.query(
          `SELECT id_library, name FROM libraries WHERE id_library = ANY($1)`,
          [libraryIds]
        );
       const libsMap = new Map(libsRes.rows.map(r => [r.id_library, r.name]));

        const librariesWithBooks = libraryIds.map((libId, idx) => {
          const booksForLib = booksByLibrary[idx] || [];
          return {
            id_library: libId,
            name: libsMap.get(libId) || null,
            bookCount: booksForLib.length,
            books: booksForLib
          };
        });
        // Retour standard attendu par le SDL — on renvoie à la fois la liste aplatie et la structure groupée
        return {
          libraries: librariesWithBooks,
          books: flattened,
          totalCount: flattened.length,
          hasNextPage: cleanOffset + cleanLimit < flattened.length,
          httpStatus: 200
        };

      },
      {
        structureSchema: generalBookHasLibrarySchema, 
        sortingSchema: generalSortingSchema,
        orderSchema: generalOrderBookHasLibrarySchema,
        logAction: 'GET_BOOKS_IN_ONE_LIBRARY',
        requiresAuth: true,
        errorMessage: 'Erreur lors de la récupération des livres de la bibliothèque'
      }    
    ),

    /**
     * Récupère tous les livres de toutes LES bibliothèques de l'utilisateur connecté
     * 🔒 Route protégée - Utilisateur authentifié
     */
    getAllBookInLibrariesOfUserForAdmin: withSecureResolver(
      async (_, args, context) => {
        /*exemple de requête :  
          query getAllBookInLibrariesOfUserForAdmin($id_user: ID!) { getAllBookInLibrariesOfUserForAdmin( id_user: $id_user ) { libraries { id_library, name, bookCount, books{book{title}} }}}        
          */
        /* Exemple variables :
          {
            "id_user": "c3d4e5f6-g7h8-9i0j-1k2l-3m4n5o6p7q8r"
          }
        */
        
          // accepter id_user soit dans validated soit en argument racine
        const validated = args?.validated || {};
        const id_user = validated.id_user || args.id_user;
        const validatedMerged = { ...validated, id_user };
        const { id_user: cleanIdUserRaw, limit = 50, offset = 0, direction = 'DESC', order = 'created_at' } = validatedMerged;

        if (!id_user) {
          throw new GraphQLError('id_user requis', {
            extensions: { code: 'BAD_REQUEST', httpStatus: 400 }
          });
        }

        const cleanIdUser = sanitizeStrict(cleanIdUserRaw);

        // Vérifier que l'utilisateur existe (utilise le helper)
        const userCheck = await findBy1ParameterOrThrow('users', 'id_user', cleanIdUser, 'Utilisateur non trouvé');
        if (!userCheck?.data && !userCheck) {
          throw new GraphQLError('Utilisateur non trouvé', {
            extensions: { code: 'NOT_FOUND', httpStatus: 404 }
          });
        }

        // Valider tri
        const validOrders = ['id_book', 'created_at', 'updated_at'];
        const { order: safeOrder, direction: safeDirection } = validateOrderParams(order, direction, validOrders);

        // Récupérer toutes les bibliothèques de l'utilisateur (même si vides)
        const libsRes = await db.query(
          'SELECT id_library, name FROM libraries WHERE id_user = $1 ORDER BY name',
          [cleanIdUser]
        );
        const libraries = Array.isArray(libsRes.rows) ? libsRes.rows : [];

        // Si pas de bibliothèques -> structure vide
        if (libraries.length === 0) {
          return {
            libraries: [],
            books: [],
            totalCount: 0,
            hasNextPage: false,
            httpStatus: 200
          };
        }

          // préparer requête une fois
        const sql = `
          SELECT
            bhl.id_bookhaslibrary,
            bhl.id_book,
            bhl.id_library,
            b.title,
            b.description,
            bhl.is_read,
            bhl.is_favorite,
            bhl.created_at,
            bhl.updated_at
          FROM bookhaslibrary bhl
          LEFT JOIN books b ON bhl.id_book = b.id_book
          WHERE bhl.id_library = $1
          ORDER BY bhl.${safeOrder} ${safeDirection}
        `;

        // Pour chaque bibliothèque, récupérer ses livres (retourne [] si aucun)
        const booksByLibrary = await Promise.all(libraries.map(async (lib) => {
          try {
            const res = await db.query(sql, [lib.id_library]);
            return Array.isArray(res.rows) ? res.rows : [];
          } catch (e) {
            console.error('[ERROR] getAllBookInLibrariesOfUserForAdmin db.query', { libId: lib.id_library, err: e && e.message });
            throw e;
          }
        }));

        // Construire la structure par bibliothèque (toujours incluse, books peut être [])
        const librariesWithBooks = libraries.map((lib, idx) => ({
          id_library: lib.id_library,
          name: lib.name,
          bookCount: booksByLibrary[idx]?.length || 0,
          books: booksByLibrary[idx] || []
        }));

        const flattened = booksByLibrary.flat();

        return {
          libraries: librariesWithBooks,
          books: flattened,
          totalCount: flattened.length,
          hasNextPage: offset + limit < flattened.length,
          httpStatus: 200
        };
      },
      {
        structureSchema: generalBookHasLibrarySchema,
        sortingSchema: generalSortingSchema,
        orderSchema: generalOrderBookHasLibrarySchema,
        logAction: 'ADMIN_GET_ALL_BOOKS_IN_LIBRARIES_OF_USER',
        requiresAuth: true,
        requiresAdmin: true,
        errorMessage: 'Erreur lors de la récupération des livres de l\'utilisateur'
      }
    ),

    /**
     * Récupère les livres d'UNE bibliothèque spécifique
     * 🔒 Route protégée - Propriétaire de la bibliothèque ou admin
     */
    getAllBooksIn1Library: withSecureResolver(
      /*exemple de requête :
        query getAllBooksIn1Library($id_library: ID!) {getAllBooksIn1Library( id_library: $id_library ) { books { id_bookhaslibrary book { title author } library { id_library name } } totalCount hasNextPage}}      
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
        const library = await findBy1ParameterOrThrow('libraries', 'id_library', id_library, 'Bibliothèque non trouvée');
        

        // Triple vérification BDD + ownership
        const user = await verifyUserInDB(context);
        
        if (!user.isAdmin || library.data.id_user !== user.id_user) {
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

        let query, countQuery, params, countParams;

        // si l'utilisateur est admin, il peut voir tous les livres de la bibliothèque sinon uniquement si il en est le propriétaire
        if (user.isAdmin) {
          // Admin : voir tous les livres de la bibliothèque cible
            query = `
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
          `; 
          params = [id_library, limit, offset];

          countQuery = `
            SELECT COUNT(*)::int as count FROM bookhaslibrary WHERE id_library = $1`;
            countParams = [id_library];
        } else {
          // Utilisateur normal : uniquement si il en est le propriétaire
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
            INNER JOIN libraries l ON bhl.id_library = l.id_library
            WHERE bhl.id_library = $1 AND l.id_user = $2
            ORDER BY bhl.${safeOrder} ${safeDirection}
            LIMIT $3 OFFSET $4
          `;  
          params = [id_library, user.id_user, limit, offset];

          countQuery = `
            SELECT COUNT(*)::int as count
            FROM bookhaslibrary bhl
            INNER JOIN libraries l ON bhl.id_library = l.id_library
            WHERE bhl.id_library = $1 AND l.id_user = $2
          `; 
          countParams = [id_library, user.id_user];

        }

        const result = await db.query(query, params);
        const countResult = await db.query(countQuery, countParams);
        const totalCount = countResult.rows[0].count;

          // Vérifier que l'utilisateur est bien le propriétaire de la bibliothèque
          if (!countResult.rows[0]) {
            throw new GraphQLError('Accès refusé à cette bibliothèque', {
              extensions: { code: 'FORBIDDEN', httpStatus: 403 }
            });
          }

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
        const bookLibrary = await findBy1ParameterOrThrow('bookhaslibrary', 'id_bookhaslibrary', cleanId, 'Livre en bibliothèque non trouvé');

        // Vérifier que la bibliothèque et le livre existent
        const library = await findBy1ParameterOrThrow('libraries', 'id_library', bookLibrary.id_library, 'Bibliothèque non trouvée');
        const book = await findBy1ParameterOrThrow('books', 'id_book', bookLibrary.id_book, 'Livre non trouvé');

        // Vérifier ownership de la bibliothèque (triple vérification BDD. On ne fait pas confiance au token seul. retourne une valeur ou lève une erreur si pas trouvé)
        const user = await verifyUserInDB(context);
        
        if (!user.isAdmin && library.data.id_user !== user.id_user) {
          throw new GraphQLError('Accès refusé', {
            extensions: { code: 'FORBIDDEN', httpStatus: 403 }
          });
        }

        if (context?.res?.status) context.res.status(200);
        return bookLibrary.data;
      },
      {
        structureSchema: generalBookHasLibrarySchema, // Avec id_library requis
        sortingSchema: generalSortingSchema,
        orderSchema: generalOrderBookHasLibrarySchema,
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
        const book = await findBy1ParameterOrThrow('books', 'id_book', cleanIdBook, 'Livre non trouvé');
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
    updateLibraryInBookHasLibrary: withSecureResolver(
      async (_, { input, validated }, context) => {
        /* exemple context JWT décodé ( à revoir):
        {
          userId: "uuid-of-user",
          email: "user@example.com",
          role: "admin"
        }
        */
        /*exemple de requête :
        mutation updateLibraryInBookHasLibrary($input: UpdateLibraryInBookHasLibraryInput!) { updateLibraryInBookHasLibrary(input: $input) {__typename }}

        */
        /* Exemple variables :
        { "input": 
        {"bookId": "2g3h4i5j-6k7l-8m9n-0o1p-2q3r4s5t6u7v",
          "id_bookhaslibrary" :"0147539a-db17-44cc-90ab-9d2f524f32c6",
          "id_library": "1bd2f719-a89a-4231-aa6d-dd1df163eee6"}
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

        const cleanIdBookHasLibrary = sanitizeStrict(id_bookhaslibrary);
        const cleanIdLibrary = sanitizeStrict(id_library);
        const bookLibrary = await findBy1ParameterOrThrow('bookhaslibrary', 'id_bookhaslibrary', cleanIdBookHasLibrary, 'Livre en bibliothèque non trouvé');

        //avec l'id_library retourné par la requête précédente, vérifier que l'utilisateur a accès à cette bibliothèque
        const ownerLibrary = await findBy1ParameterOrThrow('libraries', 'id_library', bookLibrary.data.id_library, 'Bibliothèque non trouvée');
        await verifyUserOwnsLibrary(ownerLibrary.id_library, context);

        let result;
        // vérifier si la bibliothèque de destination (cleanIdLibrary) existe, puis vérifier l'accès de l'accès à cette bibliothèque
        if (id_library) {
          const targetLibrary = await findBy1ParameterOrThrow('libraries', 'id_library', cleanIdLibrary, 'Bibliothèque de destination non trouvée');
          await verifyUserOwnsLibrary(targetLibrary.id_library, context);
        }

        // si la bibliothèque de destination est identique à l'actuelle, retourner un message indiquant qu'aucune modification n'est nécessaire, et un statut http de non-modification
        if (cleanIdLibrary && bookLibrary.data.id_library === cleanIdLibrary) {
          return {
            result:{ ...bookLibrary.data },
            message: 'Aucune modification nécessaire, le livre est déjà dans cette bibliothèque.',
            httpStatus: 304
          };
        }else {
        // ========================================
        // REQUETES BASE DE DONNEES
        // ======================================== 
          const result = await db.query(`
            UPDATE bookhaslibrary
            SET 
                id_library = COALESCE($1, id_library),
                updated_at = NOW()
            WHERE id_bookhaslibrary = $2
            RETURNING *
          `, [
            id_library ? cleanIdLibrary : null,
            cleanIdBookHasLibrary
          ]);
        }
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
     * Met à jour le statut "lu" d'un livre dans une bibliothèque (marquer comme lu/non lu)
     * 🔒 Route protégée - L'utilisateur ne peut modifier que dans ses propres bibliothèques (sauf admin)
     * @param {object} input L'ID du livre en bibliothèque à modifier
     * @returns {object} { data, httpStatus: 200 }
     * @throws {GraphQLError} Si les données d'entrée sont invalides (400)
     * @throws {GraphQLError} Si le livre en bibliothèque ou la bibliothèque n'existe pas (404)
     * @throws {GraphQLError} Si l'utilisateur n'a pas les droits (401 ou 403)
     * @throws {GraphQLError} Si une erreur se produit lors de la récupération des livres (500)
     */
    updateReadStatusInBookHasLibrary: withSecureResolver(
      async (_, { input, validated }, context) => {
        const { id_bookhaslibrary } = input;

        if (!id_bookhaslibrary) {
          throw new GraphQLError('id_bookhaslibrary requis', {
            extensions: { code: 'BAD_REQUEST', httpStatus: 400 }
          });
        }

        const cleanIdBookHasLibrary = sanitizeStrict(id_bookhaslibrary);
        const bookLibrary = await findBy1ParameterOrThrow('bookhaslibrary', 'id_bookhaslibrary', cleanIdBookHasLibrary, 'Livre en bibliothèque non trouvé');

        // Vérifier l'accès
        await verifyUserOwnsLibrary(bookLibrary.data.id_library, context);

        // ========================================
        // REQUETES BASE DE DONNEES
        // ======================================== 
        // si "is_read" est false, le passer à true, et inversement
        const result = await db.query(`
          UPDATE bookhaslibrary
          SET is_read = NOT is_read, updated_at = NOW()
          WHERE id_bookhaslibrary = $1
          RETURNING *
        `, [cleanIdBookHasLibrary]);

        // ========================================
        // DONNEES RECUPEREES
        // ======================================== 
        if (result.rows.length === 0) {
          throw new GraphQLError('Livre en bibliothèque non trouvé', {
            extensions: { code: 'NOT_FOUND', httpStatus: 404 }
          });
        }
        if (context?.res?.status) context.res.status(201);
        return {
          data: result.rows[0],
          message: `Le statut 'lu' a été mis à jour avec succès.`,
          httpStatus: 201
        };
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
     * Met à jour le statut "favori" d'un livre dans une bibliothèque (marquer comme favori/non favori)
     * 🔒 Route protégée - L'utilisateur ne peut modifier que dans ses propres bibliothèques (sauf admin
     * @param {object} input L'ID du livre en bibliothèque à modifier
     * @returns {object} { data, httpStatus: 200 }
     * @throws {GraphQLError} Si les données d'entrée sont invalides (400)
     * @throws {GraphQLError} Si le livre en bibliothèque ou la bibliothèque n'existe pas (404)
     * @throws {GraphQLError} Si l'utilisateur n'a pas les droits (401 ou 403)
     * @throws {GraphQLError} Si une erreur se produit lors de la récupération des livres (500)
     */
    updateFavoriteStatusInBookHasLibrary: withSecureResolver(
      async (_, { input, validated }, context) => {
        const { id_bookhaslibrary } = input;  
        if (!id_bookhaslibrary) {
          throw new GraphQLError('id_bookhaslibrary requis', {
            extensions: { code: 'BAD_REQUEST', httpStatus: 400 }
          });
        }
        // ========================================
        // RECUPERER LES DONNEES NESSESAIRES
        // ========================================
        
        const cleanIdBookHasLibrary = sanitizeStrict(id_bookhaslibrary);
        const bookLibrary = await findBy1ParameterOrThrow('bookhaslibrary', 'id_bookhaslibrary', cleanIdBookHasLibrary, 'Livre en bibliothèque non trouvé');
        // Vérifier l'accès
        await verifyUserOwnsLibrary(bookLibrary.data.id_library, context);
        // ========================================
        // REQUETES BASE DE DONNEES
        // ========================================
        const result = await db.query(`
          UPDATE bookhaslibrary
          SET is_favorite = NOT is_favorite, updated_at = NOW()
          WHERE id_bookhaslibrary = $1
          RETURNING *
        `, [cleanIdBookHasLibrary]);
        // ========================================
        // DONNEES RECUPEREES
        // ========================================
        if (result.rows.length === 0) {
          throw new GraphQLError('Livre en bibliothèque non trouvé', {
            extensions: { code: 'NOT_FOUND', httpStatus: 404 }
          });
        }
        if (context?.res?.status) context.res.status(201);
        return {
          data: result.rows[0],
          message: `Le statut 'favori' a été mis à jour avec succès.`,
          httpStatus: 201
        };
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

        const bookLibrary = await findBy1ParameterOrThrow('bookhaslibrary', 'id_bookhaslibrary', cleanId, 'Livre en bibliothèque non trouvé');
        
        // Vérifier l'accès
        await verifyUserOwnsLibrary(bookLibrary.data.id_library, context);

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
          const book = await findBy1ParameterOrThrow('books', 'id_book', bookId, 'Livre non trouvé');
          if (!book.data) {
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
      // return fetchBookById(parent.id_book); 

      const book = await findBy1ParameterOrThrow('books', 'id_book', parent.id_book, 'Livre non trouvé');
      return book.data;


    },
    
    library: async (parent) => {
      // return fetchLibraryById(parent.id_library);

      const library = await findBy1ParameterOrThrow('libraries', 'id_library', parent.id_library, 'Bibliothèque non trouvée');
      return library.data;
    },
  },
};

