import db from "../db/connect_DB.js";
import { v4 as uuidv4 } from 'uuid';
import { GraphQLError } from 'graphql';
import sanitizeHtml from 'sanitize-html';
import { validateOrderParams, handleDbError } from '../utils/validators.js';
import { fetchUserById } from './utils/utils_users.js';
import fetchUserRoleNameById from './utils/utils_roles.js';
import { isAuthenticated, requireAuth, requireAdmin, requireOwnershipOrAdmin, sanitizeString, sanitizeInput, flattenEdges, makePageInfo, makeEdgeFromBook, withErrorHandling } from './utils/helpers/helpers_general.js';

import { getLibrariesSchema, getUserLibrariesSchema, getLibrarySchema, searchLibrariesSchema, addLibrarySchema, updateLibrarySchema, deleteAllLibrariesFromUserSchema, deleteLibrarySchema } from '../schema/schemas_joi/librairySchema.js';
import { validateWithJoi } from './utils/helpers/helpers_books.js';

// Importer les helpers généralistes
import { withSecureResolver } from './utils/helpers/helpers_general.js';
// Importer les helpers spécifiques
import { findLibraryOrThrow, requireEditableLibrary, findUserOrThrow} from './utils/helpers/helpers_library.js';

// Importer le schema Joi genéral
import { generalSortingSchema } from '../schema/schemas_joi/generalSchema.js';
// Importer les schemas Joi spécifiques
import { generalOrderLibrarySchema, generalOrderLibrarySchema, searchLibrariesSchema} from '../schema/schemas_joi/bookhaslibrarySchema.js';

// Importer les wrappers et helpers de sécurité
import { sanitizeStrict} from './utils/helpers/helpers_securite.js';





// ========================================
// RESOLVERS POUR LES BIBLIOTHÈQUES
// ======================================== 

export default {
  Query: {
    
    /**
     * Récupère toutes les bibliothèques avec pagination
     * 🔓 Route publique
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
        `, [cleanLimit, cleanOffset]);
        
        const countResult = await db.query('SELECT COUNT(*)::int as count FROM libraries');
        const totalCount = countResult.rows[0].count;
        // ========================================
        // DONNEES RECUPEREES
        // ======================================== 
        return {
          libraries: result.rows,
          totalCount,
          hasNextPage: cleanOffset + cleanLimit < totalCount,
          httpStatus: 200,
        };    
        
      },
      {
        sortingSchema: generalSortingSchema,
        orderSchema: generalOrderLibrarySchema,
        logAction: 'GET_ALL_LIBRARY',
        requiresAuth: true,
        errorMessage: 'Erreur lors de la récupération des bibliothèques'
      }
    ),
    
    /**
     * Récupère les bibliothèques d'un utilisateur
     * 🔒 Route protégée - L'utilisateur ne peut voir que ses propres bibliothèques (sauf admin)
     * @param {string} id_user - ID de l'utilisateur
     * @returns {array} Liste des bibliothèques
     */
    getUserLibraries: withSecureResolver(
      async (_, { id_user, validated }, context) => {
        /* exemple context JWT décodé ( à revoir):
        {
          userId: "uuid-of-user",
          email: "user@example.com",
          role: "admin"
        }
        */
       /*exemple de requête :
        query  getUserLibraries($id_user: ID!) {getUserLibraries(id_user: $id_user) {id_library,name }}

        */
        /* Exemple variables :
        {"id_user": "55530935-6301-4320-9ec9-85e8db741583"}
        */
        // ========================================
        // RECUPERER LES DONNEES NESSESAIRES
        // ======================================== 
        const cleanId = sanitizeStrict(id_user);

        // ========================================
        // REQUETES BASE DE DONNEES
        // ======================================== 
          const result = await db.query(
              'SELECT id_library, name, is_editable, id_user, created_at, updated_at FROM libraries WHERE id_user = $1',
              [cleanId]
            );
        // ========================================
        // DONNEES RECUPEREES
        // ========================================        
        if (context?.res?.status) context.res.status(200);
        return bookLibrary;        
      },
      {
        logAction: 'GET_ONE_LIBRARY_OF_USER',
        requiresAuth: true,
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
        const library = await findLibraryOrThrow(cleanLibraryId);

        // ========================================
        // DONNEES RECUPEREES
        // ========================================        

        
        if (context?.res?.status) context.res.status(200);
        return library;
      },
      {
        logAction: 'GET_ONE_LIBRARY',
        requiresAuth: true,
        errorMessage: 'Erreur lors de la récupération du livre en bibliothèque'
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
        sortingSchema: generalSortingSchema,
        orderSchema: generalOrderLibrarySchema,
        inputSchema: searchLibrariesSchema,
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

        const user = await findUserOrThrow(cleanIdUser);
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
        logAction: 'DELETE_LIBRARY',
        requiresAuth: true,
        errorMessage: 'Erreur lors de la suppression de la bibliothèque'
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
      return fetchUserById(parent.id_user);
    },

  },
};