import db from "../db/connect_DB.js";
import { v4 as uuidv4 } from 'uuid';
import { GraphQLError } from 'graphql';
import sanitizeHtml from 'sanitize-html';
import { validateOrderParams, handleDbError } from '../utils/validators.js';
import { isAuthenticated, requireAuth, requireAdmin, requireOwnershipOrAdmin, sanitizeInput, flattenEdges, makePageInfo, makeEdgeFromBook, withErrorHandling } from './utils/helpers/helpers_general.js';

// Importer les schemas Joi spécifiques
import { generalLibrarySchema, generalOrderLibrarySchema, searchLibrariesSchema} from '../schema/schemas_joi/librairySchema.js';

// Importer les wrappers et helpers de sécurité
import { sanitizeStrict} from './utils/helpers/helpers_securite.js';

import { findBy1ParameterOrThrow, withSecureResolver,  generalSortingSchema} from './utils/helper.js';




// ========================================
// RESOLVERS POUR LES BIBLIOTHÈQUES
// ======================================== 

export default {
  Query: {
    
    /**
     * Récupère toutes les bibliothèques avec pagination
     * 🔓 Route privée (admin uniquement)
     * @returns {object} { libraries, totalCount, hasNextPage }
     */
    getLibraries: withSecureResolver(
      async (_, { validated }, context) => {
        /* exemple context JWT décodé ( à revoir):
        {
          userId: "uuid-of-user",
          email: "user@example.com",
          role: "admin"
        }
        */
        /*exemple de requête :
        query {getLibraries{libraries{name, user{name}}}}
        */
        /* Exemple variables :
        {
        }
        */
        // ========================================
        // RECUPERER LES DONNEES NESSESAIRES
        // ======================================== 
        try {
          //console.log('DEBUG resolver addLibrary - start');
          //console.log('context keys:', Object.keys(context || {}));
          //console.log('context (short):', JSON.stringify(context && { userId: context.userId, id_user: context.id_user, user: context.user }, null, 2));
          //console.log('validated:', context.user.id_user);
        } catch (e) {
          console.error('DEBUG log error', e);
        }
        const { limit = 50, offset = 0, order = 'created_at', direction = 'ASC' } = validated;
        const validOrders = ['name', 'created_at', 'id_library', 'is_editable', 'id_user'];
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
          FROM libraries
          ORDER BY ${safeOrder} ${safeDirection}
          LIMIT $1 OFFSET $2
        `, [limit, offset]);
        
        const countResult = await db.query('SELECT COUNT(*)::int as count FROM libraries');
        const totalCount = countResult.rows[0].count;
        // ========================================
        // DONNEES RECUPEREES
        // ======================================== 
        return {
          libraries: result.rows,
          totalCount,
          hasNextPage: offset + limit < totalCount,
          httpStatus: 200,
        };    
        
      },
      {
        structureSchema: generalLibrarySchema,
        sortingSchema: generalSortingSchema,
        orderSchema: generalOrderLibrarySchema,
        logAction: 'GET_ALL_LIBRARY',
        requiresAdmin: true,
        errorMessage: 'Erreur lors de la récupération des bibliothèques'
      }
    ),
    
    /**
     * Récupère les bibliothèques de l'utilisateur authentifié
     * 🔒 Route protégée - Retourne les bibliothèques de l'utilisateur courant
     * @param {object} filter - Filtres optionnels
     * @returns {array} Liste des bibliothèques
     */
    getMyLibraries: withSecureResolver(
      async (_, { filter, validated }, context) => {
        // Récupérer l'ID de l'utilisateur du contexte
        const userId =
          context?.user?.id_user ||
          context?.user?.id ||
          context?.userId ||
          context?.id_user ||
          null;

        if (!userId) {
          throw new GraphQLError('Utilisateur non authentifié', {
            extensions: { code: 'UNAUTHENTICATED', httpStatus: 401 }
          });
        }

        const cleanUserId = sanitizeStrict(userId);

        // Récupérer les bibliothèques de l'utilisateur
        const result = await db.query(`
          SELECT id_library, name, description, is_editable, is_default, is_public, color, sort_order, id_user, 
                 to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as created_at,
                 to_char(updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as updated_at
          FROM libraries
          WHERE id_user = $1
          ORDER BY sort_order ASC, created_at DESC
        `, [cleanUserId]);

        if (context?.res?.status) context.res.status(200);
        return result.rows || [];
      },
      {
        structureSchema: generalLibrarySchema,
        sortingSchema: generalSortingSchema,
        orderSchema: generalOrderLibrarySchema,
        logAction: 'GET_MY_LIBRARIES',
        requiresAuth: true,
        errorMessage: "Erreur lors de la récupération de vos bibliothèques"
      }
    ),

    /**
     * Récupère les bibliothèques d'un utilisateur
     * 🔒 Route protégée - L'utilisateur ne peut voir que ses propres bibliothèques (sauf admin)
     * @param {string} id_user - ID de l'utilisateur
     * @returns {array} Liste des bibliothèques
     */
    getUserLibraries: withSecureResolver(
      async (_, args, context) => {
        /* exemple context JWT décodé ( à revoir):
        {
          userId: "uuid-of-user",
          email: "user@example.com",
          role: "admin"
        }
        */
       /*exemple de requête :
        query  getUserLibraries($id_user: ID!) {getUserLibraries(id_user: $id_user) {id_library,name }}

        query GetUserLibraries {
          getUserLibraries {
            libraries {
              id_library
              name
              is_editable
            }
            totalCount
            hasNextPage
            httpStatus
          }
        }        
        */
        /* Exemple variables :
        {"id_user": "55530935-6301-4320-9ec9-85e8db741583"}
        */
        // ========================================
        // RECUPERER LES DONNEES NESSESAIRES
        // ======================================== 
        const { validated = {} } = args;

        // Détecter si l'appelant est admin
        const currentRole =
          context?.user?.role ||
          context?.user?.role_name ||
          context?.user?.roleName ||
          null;
        const isAdmin = currentRole === 'glossaire' || !!context?.user?.isAdmin;

        // Si admin : peut fournir validated.id_user ou args.id_user ; sinon on prend l'id du contexte
        const requestedId = (isAdmin ? (validated.id_user || args.id_user) : null) || (context?.user?.id_user || context?.user?.id || null);

        if (!requestedId) {
          throw new GraphQLError(
            isAdmin ? 'Pour un administrateur l\'id_user est requis' : 'Utilisateur non authentifié',
            { extensions: { code: 'UNAUTHENTICATED', httpStatus: 401 } }
          );
        }


        const rawUserId =
          context?.user?.id_user ||
          context?.user?.id ||
          context?.req?.user?.id ||
          null;

        if (!rawUserId) {
          throw new GraphQLError('Utilisateur non authentifié', {
            extensions: { code: 'UNAUTHENTICATED', httpStatus: 401 }
          });
        }

        const cleanUser = sanitizeStrict(rawUserId);

        const { limit = 50, offset = 0, order = 'created_at', direction = 'ASC' } = validated;
        const validOrders = ['name', 'created_at', 'id_library', 'is_editable', 'id_user'];
        const { order: safeOrder, direction: safeDirection } = validateOrderParams(order, direction, validOrders);

        // ========================================
        // REQUETES BASE DE DONNEES
        // ======================================== 
          const result = await db.query(`
              SELECT id_library, name, is_editable, id_user, created_at, updated_at FROM libraries WHERE id_user = $1
            ORDER BY ${safeOrder} ${safeDirection}
          LIMIT $2 OFFSET $3
        `, [cleanUser, limit, offset]);

        const countResult = await db.query(`
        SELECT COUNT(*)::int as count FROM libraries WHERE id_user = $1
        `, [cleanUser]);
        // ========================================
        // DONNEES RECUPEREES
        // ========================================        
        const totalCount = countResult.rows[0].count;

        if (context?.res?.status) context.res.status(200);

        return {
          libraries: result.rows,
          totalCount,
          hasNextPage: offset + limit < totalCount,
          httpStatus: 200,
        };        
      },
      {
        structureSchema: generalLibrarySchema,
        sortingSchema: generalSortingSchema,
        orderSchema: generalOrderLibrarySchema,
        logAction: 'GET_ONE_LIBRARY_OF_USER',
        requiresAuth: true,

        getResourceUserId: (args, context) => {
          return (
            context?.user?.id_user ||
            context?.user?.id ||
            context?.userId ||
            context?.id_user ||
            context?.decoded?.id_user ||
            context?.decoded?.id ||
            (context?.req?.user && (context.req.user.id_user || context.req.user.id)) ||
            null
          );
        },        
        errorMessage: "Erreur lors de la récupération de la bibliothèque de l'utilisateur"
      }
    ),
    
    /**
     * Récupère une bibliothèque par son ID
     * 🔓 Route publique
     * @param {string} id_library - ID de la bibliothèque
     * @returns {object} Bibliothèque trouvée
     */
    getLibrary: withSecureResolver(
      async (_, { id_library, validated }, context) => {
        /* exemple context JWT décodé ( à revoir):
        {
          userId: "uuid-of-user",
          email: "user@example.com",
          role: "admin"
        }
        */
       /*exemple de requête :
        query  getLibrary($id_library: ID!) {getLibrary(id_library: $id_library) {id_library,name user{name, role{role_name}} }}

        */
        /* Exemple variables :
        {"id_library": "2b3c4d5e-6f7g-8h9i-0j1k-2l3m4n5o6p7q"}
        */
        // ========================================
        // RECUPERER LES DONNEES NESSESAIRES
        // ======================================== 
        const cleanId = sanitizeStrict(id_library);

        // ========================================
        // REQUETES BASE DE DONNEES
        // ======================================== 
        const library = await findBy1ParameterOrThrow('libraries', 'id_library', cleanId, 'Bibliothèque non trouvée');
        // ========================================
        // DONNEES RECUPEREES
        // ========================================        

        
        if (context?.res?.status) context.res.status(200);
        return library;
      },
      {
        structureSchema: generalLibrarySchema,
        sortingSchema: generalSortingSchema,
        orderSchema: generalOrderLibrarySchema,
        logAction: 'GET_ONE_LIBRARY',
        requiresAuth: true,
        errorMessage: 'Erreur lors de la récupération du livre en bibliothèque'
      }
    ),
    
    /**
     * Récupère les bibliothèques d'un utilisateur par son ID
     * 🔒 Route protégée - L'utilisateur ne peut voir que ses propres bibliothèques (sauf admin)
     * @param {string} id_user - ID de l'utilisateur
     * @returns {array} Liste des bibliothèques
     */
    getLibrariesByIdUser: withSecureResolver(
      async (_, { id_user, validated }, context) => {
        const cleanUserId = sanitizeStrict(id_user);  

        const result = await db.query(`
          SELECT id_library, name, is_editable, id_user, created_at, updated_at 
          FROM libraries
          WHERE id_user = $1
        `, [cleanUserId]);

        return {
          libraries: result.rows,
          httpStatus: 200,
        };
      },
      {
        structureSchema: generalLibrarySchema,
        sortingSchema: generalSortingSchema,
        orderSchema: generalOrderLibrarySchema,
        logAction: 'GET_LIBRARY_BY_ID_USER',
        requiresAuth: true,
        errorMessage: 'Erreur lors de la récupération des bibliothèques de l\'utilisateur'
      }
    ),



    /**
     * Recherche des bibliothèques par nom
     * 🔓 Route publique
     * @param {string} name - Terme de recherche
     * @returns {object} { libraries, totalCount, hasNextPage }
     */
    searchLibraries: withSecureResolver(
      async (_, { validated }, context) => {
        /* exemple context JWT décodé ( à revoir):
        {
          userId: "uuid-of-user",
          email: "user@example.com",
          role: "admin"
        }
        */
       /*exemple de requête :
        query  searchLibraries($name: String!) {searchLibraries(name: $name) {id_library,name }}

        */
        /* Exemple variables :
        {"name": "bob"}
        */
        // ========================================
        // RECUPERER LES DONNEES NESSESAIRES
        // ======================================== 
        const { query, limit = 50, offset = 0, direction = 'ASC', order = 'created_at' } = validated;

        const cleanQuery = sanitizeStrict(query);

        if (!cleanQuery || cleanQuery.length < 2) {
          throw new GraphQLError('Le terme de recherche doit contenir au moins 2 caractères', {
            extensions: { code: 'BAD_REQUEST', httpStatus: 400 }
          });
        }

        const validOrders = ['name', 'created_at', 'id_library', 'is_editable', 'id_user'];
        const { order: safeOrder, direction: safeDirection } = validateOrderParams(
          order,
          direction,
          validOrders
        );

        const searchPattern = `%${cleanName}%`;

        // ========================================
        // REQUETES BASE DE DONNEES
        // ======================================== 

        const result = await db.query(`
          SELECT id_library, name, is_editable, id_user, created_at, updated_at 
          FROM libraries
          WHERE LOWER(name) LIKE LOWER($1)
          ORDER BY ${safeOrder} ${safeDirection}
          LIMIT $2 OFFSET $3
        `, [searchPattern, limit, offset]);
        
        const countResult = await db.query(`
          SELECT COUNT(*)::int as count FROM libraries
          WHERE LOWER(name) LIKE LOWER($1)
        `, [searchPattern]);

        // ========================================
        // DONNEES RECUPEREES
        // ========================================        
        return {
          libraries: result.rows,
          totalCount: countResult.rows[0].count,
          hasNextPage: cleanOffset + cleanLimit < countResult.rows[0].count,
          httpStatus: 200,
        };
      },
      {
        structureSchema: generalLibrarySchema,
        sortingSchema: generalSortingSchema,
        orderSchema: generalOrderLibrarySchema,
        specificSchema: searchLibrariesSchema,
        logAction: 'SEARCH_LIBRARIES',
        requiresAuth: true,
        errorMessage: 'Erreur lors de la recherche de la bibliothèque'
      }
    ),





  },
  
  Mutation: {
    /**
     * Crée une nouvelle bibliothèque
     * 🔒 Route protégée - L'utilisateur ne peut créer que ses propres bibliothèques (sauf admin)
     * @param {object} input - { name, isEditable, idUser }
     * @returns {object} Bibliothèque créée
     */
    addLibrary: withSecureResolver(
      async (_, { input, validated }, context) => {
        /* exemple context JWT décodé ( à revoir):
        {
          userId: "uuid-of-user",
          email: "user@example.com",
          role: "admin"
        }
        */
       /*exemple de requête :
        mutation addLibrary($input: CreateLibraryInput!) { addLibrary(input: $input) {__typename }}

        */
        /* Exemple variables :
        { "input": {
          "name": "bibliothèque de toto",
          "id_user": "1e2d3c4b-5a6f-7e8d-9c0b-1a2f3e4d5c6b"
        }
        }        
        */
        // ========================================
        // RECUPERER LES DONNEES NESSESAIRES
        // ======================================== 
        const { name, idUser } = input;
        const cleanName = sanitizeStrict(name);
        const cleanIdUser = sanitizeStrict(idUser);

        if (!cleanName || cleanName.length < 3) {
          throw new GraphQLError('Le nom de la bibliothèque doit contenir au moins 3 caractères', {
            extensions: { code: 'BAD_REQUEST', httpStatus: 400 }
          });
        }

        if (!cleanIdUser) {
          throw new GraphQLError('L\'ID de l\'utilisateur est requis', {
            extensions: { code: 'BAD_REQUEST', httpStatus: 400 }
          });
        }

        const user = await findBy1ParameterOrThrow('users', 'id_user', cleanIdUser, 'Utilisateur non trouvé');
        // ========================================
        // REQUETES BASE DE DONNEES
        // ========================================         
        const id = uuidv4();
        
        // inserer les created-at et updated-at en base
        const createdAt = new Date();
        const updatedAt = new Date();


        const result = await db.query(`
          INSERT INTO libraries (id_library, name, is_editable, id_user, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING id_library, name, is_editable, id_user, created_at, updated_at
        `, [
          id,
          cleanInput.name,
          cleanInput.isEditable !== undefined ? cleanInput.isEditable : true,
          cleanInput.id_user,
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
        structureSchema: generalLibrarySchema,
        sortingSchema: generalSortingSchema,
        orderSchema: generalOrderLibrarySchema,
        logAction: 'ADD_BOOK_TO_LIBRARY',
        requiresAuth: true,
        errorMessage: 'Erreur lors de l\'ajout du livre'
      }
    ),
    
    /**
     * Met à jour une bibliothèque
     * 🔒 Route protégée - L'utilisateur ne peut modifier que ses propres bibliothèques (sauf admin)
     * @param {object} input - { id_library, name?, isEditable? }
     * @returns {object} Bibliothèque mise à jour
     */
    updateLibrary: withSecureResolver(
      async (_, { input, validated }, context) => {
        /* exemple context JWT décodé ( à revoir):
        {
          userId: "uuid-of-user",
          email: "user@example.com",
          role: "admin"
        }
        */
       /*exemple de requête :
        mutation updateLibrary($input: UpdateLibraryInput!) { updateLibrary(input: $input) {__typename }}

        */
        /* Exemple variables :
        { "input": 
        {"id_library": "2b3c4d5e-6f7g-8h9i-0j1k-2l3m4n5o6p7q",
          "name" :"toto au travail"
        }
        }       
        */
        
        // ========================================
        // RECUPERER LES DONNEES NESSESAIRES
        // ======================================== 
        const { name, idUser } = input;

        const cleanName = sanitizeStrict(name);
        const cleanLibraryId = sanitizeStrict(input.id_library);

        if (cleanName !== undefined && cleanName.length < 3) {  
          throw new GraphQLError('Le nom de la bibliothèque doit contenir au moins 3 caractères', {
            extensions: { code: 'BAD_REQUEST', httpStatus: 400 }
          });
        } 

        // ========================================
        // REQUETES BASE DE DONNEES
        // ======================================== 
        const result = await db.query(`
          UPDATE libraries
          SET name = $1, updated_at = NOW()
          WHERE id_library = $2
          RETURNING id_library, name, is_editable, id_user, created_at, updated_at
        `, [cleanName, cleanLibraryId]);

        // ========================================
        // DONNEES RECUPEREES
        // ========================================         
        return {
          data: result.rows[0],
          httpStatus: 200,
        };
    
      },
      {
        structureSchema: generalLibrarySchema,
        sortingSchema: generalSortingSchema,
        orderSchema: generalOrderLibrarySchema,
        logAction: 'UPDATE_LIBRARY',
        requiresAuth: true,
        errorMessage: 'Erreur lors de la mise à jour de la bibliothèque'
      }
    ),
    
    /**
     * Supprime toutes les bibliothèques d'un utilisateur
     * 🔐 Route admin uniquement
     * @param {string} id_user - ID de l'utilisateur
     * @returns {array} IDs des bibliothèques supprimées
     */
    deleteAllLibrariesFromUser: withSecureResolver(
      async (_, { input, validated }, context) => {
        /* exemple context JWT décodé ( à revoir):
        {
          userId: "uuid-of-user",
          email: "user@example.com",
          role: "admin"
        }
        */
        /*exemple de requête :
            mutation deleteAllLibrariesFromUser($id_user: ID!) { deleteAllLibrariesFromUser(id_user: $id_user) }
        */
        /* Exemple variables :
        {"id_user":"a1b2c3d4-e5f6-7g8h-9i0j-1k2l3m4n5o6p"}
        */
        
        // ========================================
        // RECUPERER LES DONNEES NESSESAIRES
        // ======================================== 
        const { id_user } = input;

        const cleanUserId = sanitizeStrict(id_user);

        if (!cleanUserId) {
          throw new GraphQLError('L\'ID de l\'utilisateur est requis', {
            extensions: { code: 'BAD_REQUEST', httpStatus: 400 }
          });
        }
        // ========================================
        // REQUETES BASE DE DONNEES
        // ======================================== 

        const result = await db.query(
          'DELETE FROM libraries WHERE id_user = $1 AND is_editable = true RETURNING id_library',
          [cleanUserId]
        );
        // ========================================
        // DONNEES RECUPEREES
        // ======================================== 
        
        if (context?.res?.status) context.res.status(200);
        return true;
    
      },
      {
        structureSchema: generalLibrarySchema,
        sortingSchema: generalSortingSchema,
        orderSchema: generalOrderLibrarySchema,
        logAction: 'DELETE_LIBRARY_FROM_USER',
        requiresAuth: true,
        errorMessage: 'Erreur lors de la suppression de la bibliothèques de l\'utilisateur'
      }
    ),
    
    /**
     * Supprime une bibliothèque
     * 🔒 Route protégée - L'utilisateur ne peut supprimer que ses propres bibliothèques (sauf admin)
     * @param {object} input - { id_library }
     * @returns {boolean} true si supprimée
     */
    deleteLibrary: withSecureResolver(
      async (_, { input, validated }, context) => {
        /* exemple context JWT décodé ( à revoir):
        {
          userId: "uuid-of-user",
          email: "user@example.com",
          role: "admin"
        }
        */
       /*exemple de requête :
            mutation deleteLibrary($input: DeleteLibraryInput!) { deleteLibrary(input: $input) }
        */
        /* Exemple variables :
        {"input": {"id_library":"2b3c4d5e-6f7g-8h9i-0j1k-2l3m4n5o6p7d"} }
        */
        // ========================================
        // RECUPERER LES DONNEES NESSESAIRES
        // ======================================== 
        const { id_library } = input;

        const cleanLibraryId = sanitizeStrict(id_library);
        if (!cleanLibraryId) {
          throw new GraphQLError('L\'ID de la bibliothèque est requis', {
            extensions: { code: 'BAD_REQUEST', httpStatus: 400 }
          });
        }

        // ========================================
        // REQUETES BASE DE DONNEES
        // ======================================== 
        await db.query(
          'DELETE FROM libraries WHERE id_library = $1',
          [cleanLibraryId]
        );

        // ========================================
        // DONNEES RECUPEREES
        // ======================================== 

        if (context?.res?.status) context.res.status(200);
        return true;
    
      },
      {
        structureSchema: generalLibrarySchema,
        sortingSchema: generalSortingSchema,
        orderSchema: generalOrderLibrarySchema,
        logAction: 'DELETE_LIBRARY',
        requiresAuth: true,
        errorMessage: 'Erreur lors de la suppression de la bibliothèque'
      }
    ),

    /**
     * Réorganise l'ordre des bibliothèques pour un utilisateur
     * 🔒 Route protégée - L'utilisateur peut réorganiser ses propres bibliothèques
     * @param {array} library_ids - Liste ordonnée des IDs de bibliothèques
     * @returns {boolean} true si succès
     */
    reorderLibraries: withSecureResolver(
      async (_, { library_ids }, context) => {
        //console.log('📚 reorderLibraries called with:', { library_ids, userId: context?.user?.id_user });

        if (!library_ids || library_ids.length === 0) {
          throw new GraphQLError('La liste des bibliothèques est requise', {
            extensions: { code: 'BAD_REQUEST', httpStatus: 400 }
          });
        }

        const userId = context?.user?.id_user;
        if (!userId) {
          throw new GraphQLError('Utilisateur non authentifié', {
            extensions: { code: 'UNAUTHORIZED', httpStatus: 401 }
          });
        }

        // Mettre à jour l'ordre de chaque bibliothèque
        for (let i = 0; i < library_ids.length; i++) {
          const libraryId = sanitizeStrict(library_ids[i]);
          const sortOrder = i;

          await db.query(
            `UPDATE libraries 
             SET sort_order = $1, updated_at = NOW() 
             WHERE id_library = $2 AND id_user = $3`,
            [sortOrder, libraryId, userId]
          );
        }

        //console.log('✅ Libraries reordered successfully');
        return true;
      },
      {
        structureSchema: generalLibrarySchema,
        sortingSchema: generalSortingSchema,
        orderSchema: generalOrderLibrarySchema,
        logAction: 'REORDER_LIBRARIES',
        requiresAuth: true,
        errorMessage: 'Erreur lors de la réorganisation des bibliothèques'
      }
    ),
    
  },
  
  Library: {

    /**
     * Résout le champ "user" d'une bibliothèque
     * @param {object} parent - Objet bibliothèque parent
     * @returns {object|null} Utilisateur propriétaire
     */
    user: async (parent) => {

      if (!parent?.id_user) return null;
      try {
        const result = await findBy1ParameterOrThrow('users', 'id_user', parent.id_user, 'Utilisateur propriétaire non trouvé');
        return result?.data ?? result;
      } catch (err) {
        // si utilisateur supprimé / non trouvé -> retourner null au lieu d'échouer tout le query
        if (err && err.extensions && err.extensions.code === 'NOT_FOUND') return null;
        throw err;
      }
      
    },

    /**
     * Résout le champ "books" d'une bibliothèque
     * @param {object} parent - Objet bibliothèque parent
     * @returns {array} Liste des livres de la bibliothèque
     */
    books: async (parent) => {
      if (!parent?.id_library) return [];
      
      try {
        const result = await db.query(`
          SELECT bhl.id_bookhaslibrary, bhl.id_library, bhl.id_book, bhl.is_favorite, bhl.is_read,
                 to_char(bhl.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as created_at,
                 to_char(bhl.updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as updated_at,
                 b.id_book as book_id, b.title, b.description, b.isbn, b.publication_date, b.bookimage, b.vignetteimage,
                 to_char(b.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as book_created_at,
                 to_char(b.updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as book_updated_at
          FROM bookhaslibrary bhl
          JOIN books b ON bhl.id_book = b.id_book
          WHERE bhl.id_library = $1
          ORDER BY bhl.created_at DESC
        `, [parent.id_library]);
        
        return result.rows || [];
      } catch (err) {
        console.error('Erreur lors de la récupération des livres de la bibliothèque:', err);
        return [];
      }
    },

    /**
     * Résout le champ "stats" d'une bibliothèque
     * @param {object} parent - Objet bibliothèque parent
     * @returns {object} Statistiques de la bibliothèque
     */
    stats: async (parent) => {
      if (!parent?.id_library) {
        return {
          total_books: 0,
          books_read: 0,
          books_reading: 0,
          books_to_read: 0,
          avg_rating: 0,
          total_pages: 0,
          books_lent: 0
        };
      }

      try {
        const result = await db.query(`
          SELECT 
            COUNT(bhl.id_bookhaslibrary) as total_books,
            SUM(CASE WHEN bhl.is_read = TRUE THEN 1 ELSE 0 END) as books_read,
            SUM(CASE WHEN bhl.is_read = FALSE AND bhl.is_favorite = TRUE THEN 1 ELSE 0 END) as books_reading,
            SUM(CASE WHEN bhl.is_read = FALSE THEN 1 ELSE 0 END) as books_to_read,
            COALESCE(ROUND(AVG(b.avg_rating)::numeric, 2), 0) as avg_rating,
            0 as total_pages,
            0 as books_lent
          FROM bookhaslibrary bhl
          LEFT JOIN books b ON bhl.id_book = b.id_book
          WHERE bhl.id_library = $1
          GROUP BY bhl.id_library
        `, [parent.id_library]);

        if (result.rows.length === 0) {
          return {
            total_books: 0,
            books_read: 0,
            books_reading: 0,
            books_to_read: 0,
            avg_rating: 0,
            total_pages: 0,
            books_lent: 0
          };
        }

        const row = result.rows[0];
        return {
          total_books: parseInt(row.total_books) || 0,
          books_read: parseInt(row.books_read) || 0,
          books_reading: parseInt(row.books_reading) || 0,
          books_to_read: parseInt(row.books_to_read) || 0,
          avg_rating: parseFloat(row.avg_rating) || 0,
          total_pages: 0,
          books_lent: 0
        };
      } catch (err) {
        console.error('Erreur lors du calcul des stats de la bibliothèque:', err);
        return {
          total_books: 0,
          books_read: 0,
          books_reading: 0,
          books_to_read: 0,
          avg_rating: 0,
          total_pages: 0,
          books_lent: 0
        };
      }
    },

  },
};