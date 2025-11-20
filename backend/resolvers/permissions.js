import db from "../db/connect_DB.js";
import { v4 as uuidv4 } from 'uuid';
import { validateOrderParams, handleDbError } from '../utils/validators.js';
import { fetchUserById } from './utils/utils_users.js';
import sanitizeHtml from 'sanitize-html';
import { GraphQLError } from 'graphql';
import fetchBookById from './utils/utils_books.js';
import fetchLibraryById from './utils/utils_librairies.js';

import { isAuthenticated, requireAuth, requireAdmin, requireOwnershipOrAdmin, sanitizeInput, flattenEdges, makePageInfo, makeEdgeFromBook, withErrorHandling } from './utils/helpers/helpers_general.js';

import { console } from "inspector";

import { findBy1ParameterOrThrow, generalSortingSchema } from './utils/helper.js';


// Importer les helpers généralistes
import { withSecureResolver } from './utils/helpers/helpers_general.js';

// Importer les schemas Joi spécifiques
import { generalPermissionSchema, generalOrderPermissionSchema, searchPermissionsSchema} from '../schema/schemas_joi/permissionsSchema.js';

// Importer les wrappers et helpers de sécurité
import { sanitizeStrict} from './utils/helpers/helpers_securite.js';








export default {
  Query: {

    /**
     * Récupère les commentaires avec pagination et tri
     * 🔒 Route protégée (administrateur uniquement)
       * @param {number} limit - Limite de résultats (max 100)
       * @param {number} offset - Décalage pour pagination
       * @param {string} order - Champ de tri
       * @param {string} direction - Direction du tri (ASC/DESC)
       * @returns {object} { permissions, totalCount, hasNextPage, httpStatus }
       * @throws {GraphQLError} Si l'utilisateur n'a pas les droits (401 ou 403)  
       * @throws {GraphQLError} Si une erreur se produit lors de la récupération des permissions (500)
     */
    getPermissions: withSecureResolver(
      async (_, { validated }, context) => {
        /* exemple context JWT décodé ( à revoir):
        {
          userId: "uuid-of-user",
          email: "user@example.com",
          role: "admin"
        }
        */
        /*exemple de requête :
        query {getPermissions{permissions{permission_name}}}
        */
        /* Exemple variables :
        {
        }
        */
        // ========================================
        // RECUPERER LES DONNEES NESSESAIRES
        // ======================================== 

        // Extraction et validation des paramètres de pagination et de tri
        const { limit = 50, offset = 0, order = 'created_at', direction = 'DESC' } = validated;

        // Sanitize inputs
        const validOrders = ['id_permission', 'permission_name', 'created_at', 'updated_at'];
        const { order: safeOrder, direction: safeDirection } = validateOrderParams(
          sanitizeStrict(order), 
          sanitizeStrict(direction), 
          validOrders
        );
        // ========================================
        // REQUETES BASE DE DONNEES
        // ======================================== 
        // Requête SQL pour récupérer toutes les permissions
        const result = await db.query(`
          SELECT *
          FROM permissions
          ORDER BY ${safeOrder} ${safeDirection}
          LIMIT $1 OFFSET $2
        `, [cleanLimit, cleanOffset]);

        const countResult = await db.query('SELECT COUNT(*)::int as count FROM permissions');
        const totalCount = countResult.rows[0].count;
        // ========================================
        // DONNEES RECUPEREES
        // ======================================== 
        return {
          permissions: result.rows,
          totalCount,
          hasNextPage: cleanOffset + cleanLimit < totalCount,
          httpStatus: 200,
        };
    
      },
      {
        sortingSchema: generalSortingSchema,
        orderSchema: generalPermissionSchema,
        logAction: 'GET_ALL_PERMISSIONS',
        requiresAdmin: true,
        errorMessage: 'Erreur lors de la récupération des permissions'
      }
    ),
    
    /**
     * Récupère une permission par son ID
     * 🔒 Route protégée (administrateur uniquement)
     * @param {string} id_permission - ID de la permission
     * @returns {object|null} Permission ou null si non trouvée
     * @throws {GraphQLError} Si l'utilisateur n'a pas les droits (401 ou 403)  
     * @throws {GraphQLError} Si une erreur se produit lors de la récupération de la permission (500)
     */
    getPermission: withSecureResolver(
      async (_, { id_permission, validated }, context) => {
        /* exemple context JWT décodé ( à revoir):
        {
          userId: "uuid-of-user",
          email: "user@example.com",
          role: "admin"
        }
        */
        /*exemple de requête :
        query  getPermission($id_permission: ID!) {getPermission(id_permission: $id_permission) {permission_name }}

        */
        /* Exemple variables :
        {"id_permission": 1}
        */
        // ========================================
        // RECUPERER LES DONNEES NESSESAIRES
        // ======================================== 
        // Sanitize input
        const cleanIdPermission = sanitizeStrict(id_permission);

        // Validation de l'ID de la permission
        if (!cleanIdPermission) {
          throw new GraphQLError('ID de la permission manquant', {
            extensions: { code: 'BAD_USER_INPUT', httpStatus: 400 }
          });
        }
        // ========================================
        // REQUETES BASE DE DONNEES
        // ======================================== 
        const permission = await findBy1ParameterOrThrow('permissions', 'id_permission', cleanIdPermission, 'Permission non trouvée');

        // ========================================
        // DONNEES RECUPEREES
        // ========================================        

        if (context?.res?.status) context.res.status(200);
        return permission.data;
    
      },
      {
        logAction: 'GET_ONE_PERMISSION',
        requiresAdmin: true,
        errorMessage: 'Erreur lors de la récupération de la permission'
      }
    ),
    
    /**
     * Recherche des permissions par ID avec pagination
     * 🔒 Route protégée (administrateur uniquement)
     * @param {string} id_permission - ID (partiel) de la permission à rechercher
     * @param {number} limit - Limite de résultats (max 100)
     * @param {number} offset - Décalage pour pagination
     * @returns {object} { permissions, totalCount, hasNextPage }
     * @throws {GraphQLError} Si l'utilisateur n'a pas les droits (401 ou 403)  
     * @throws {GraphQLError} Si une erreur se produit lors de la recherche des permissions (500)
     */
    searchPermissions: withSecureResolver(
      async (_, { validated }, context) => {
        /* exemple context JWT décodé ( à revoir):
        {
          userId: "uuid-of-user",
          email: "user@example.com",
          role: "admin"
        }
        */
        /*exemple de requête :
        query searchPermissions($name: String!) {searchPermissions(name: $name) {permissions{permission_name}}}

        */
        /* Exemple variables :
        {"name": "et"}
        */
        // ========================================
        // RECUPERER LES DONNEES NESSESAIRES
        // ======================================== 
        // Extraction et validation des paramètres de pagination et de tri
        const { limit = 50, offset = 0, order = 'created_at', direction = 'DESC', query } = args;

        // Sanitize inputs
        // const cleanLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 100);
        // const cleanOffset = Math.max(parseInt(offset) || 0, 0);
        const validOrders = ['created_at', 'permission_name', 'updated_at'];
        const { order: safeOrder, direction: safeDirection } = validateOrderParams(
          sanitizeStrict(order), 
          sanitizeStrict(direction), 
          validOrders
        );
        const cleanName = sanitizeStrict(query || '');

        if (!cleanName) {
          throw new GraphQLError('Nom de la permission manquant', {
            extensions: { code: 'BAD_USER_INPUT', httpStatus: 400 }
          });
        }

        const searchPattern = `%${cleanName}%`;
        // ========================================
        // REQUETES BASE DE DONNEES
        // ======================================== 
        const result = await db.query(`
          SELECT * FROM permissions
          WHERE LOWER(permission_name) LIKE LOWER($1)
          ORDER BY  ${safeOrder} ${safeDirection}
          LIMIT $2 OFFSET $3
        `, [searchPattern, cleanLimit, cleanOffset]);
        
        const countResult = await db.query(`
          SELECT COUNT(*)::int as count FROM permissions
          WHERE permission_name LIKE LOWER($1)
        `, [searchPattern]);
        // ========================================
        // DONNEES RECUPEREES
        // ========================================                
        return {
          permissions: result.rows,
          totalCount: countResult.rows[0].count,
          hasNextPage: cleanOffset + cleanLimit < countResult.rows[0].count,
          httpStatus: 200,
        };    
      },
      {
        sortingSchema: generalSortingSchema,
        orderSchema: generalOrderPermissionSchema,
        inputSchema: searchPermissionsSchema,
        logAction: 'SEARCH_PERMISSIONS',
        requiresAdmin: true,
        errorMessage: 'Erreur lors de la recherche de permissions'
      }
    ),

  },

  Mutation: {

    /**
     * Ajoute une nouvelle permission
     * 🔒 Route protégée (administrateur uniquement)
     * @param {object} input - Données de la permission
     * @param {string} input.name - Nom de la permission
     * @returns {object} La permission créée
     * @throws {GraphQLError} Si l'utilisateur n'a pas les droits (401 ou 403)  
     * @throws {GraphQLError} Si une erreur se produit lors de la création de la permission (500)
     */
    addPermission: withSecureResolver(
      async (_, { input, validated }, context) => {
        /* exemple context JWT décodé ( à revoir):
        {
          userId: "uuid-of-user",
          email: "user@example.com",
          role: "admin"
        }
        */
        /*exemple de requête :
        mutation addPermission($input: CreatePermissionInput!) { addPermission(input: $input) {id_permission, permission_name, created_at}}

        */
        /* Exemple variables :
        { "input": {
          "name": "tester"
        }
        }               
        */
        // ========================================
        // RECUPERER LES DONNEES NESSESAIRES
        // ======================================== 
        // Sanitize input
        const cleanName = sanitizeStrict(input.name);

        if (!cleanName) {
          throw new GraphQLError('Nom de la permission manquant', {
            extensions: { code: 'BAD_USER_INPUT', httpStatus: 400 }
          });
        }

        // vérification des données d'entrée
        validatePermissionInput(cleanName);
        // ========================================
        // REQUETES BASE DE DONNEES
        // ========================================         
        const id = uuidv4();
        const result = await db.query(`
          INSERT INTO permissions (id_permission, permission_name)
          VALUES ($1, $2)
          RETURNING *
        `, [id, cleanName]);

        // ========================================
        // DONNEES RECUPEREES
        // ======================================== 
        if (context?.res?.status) context.res.status(201);
        return result.rows[0];
    
      },
      {
        logAction: 'ADD_PERMISSION',
        requiresAdmin: true,
        errorMessage: 'Erreur lors de l\'ajout de la permission'
      }
    ),
    
    /**
     * Met à jour une permission existante
     * 🔒 Route protégée (administrateur uniquement)
     * @param {object} input - Données de la permission
     * @param {string} input.id_permission - ID de la permission
     * @param {string} input.name - Nom de la permission
     * @returns {object} La permission mise à jour
     * @throws {GraphQLError} Si l'utilisateur n'a pas les droits (401 ou 403)  
     * @throws {GraphQLError} Si une erreur se produit lors de la mise à jour de la permission (500)
   */
    updatePermission: withSecureResolver(
      async (_, { input, validated }, context) => {
        /* exemple context JWT décodé ( à revoir):
        {
          userId: "uuid-of-user",
          email: "user@example.com",
          role: "admin"
        }
        */
        /*exemple de requête :
        mutation updatePermission($input: UpdatePermissionInput!) { updatePermission(input: $input) {__typename }}

        */
        /* Exemple variables :
        { "input": 
        {
          "id_permission": "3c4d5e6f-7g8h-9i0j-1k2l-3m4n5y6p7q8r",
          "name": "modification du nom de la permission"
        }
        }       
        */
        // ========================================
        // RECUPERER LES DONNEES NESSESAIRES
        // ======================================== 

        // Sanitize input
        const cleanIdPermission = sanitizeStrict(input.id_permission);
        const cleanName = sanitizeStrict(input.name);


        if (!cleanIdPermission) {
          throw new GraphQLError('ID de la permission manquant', {
            extensions: { code: 'BAD_USER_INPUT', httpStatus: 400 }
          });
        }
        if (!cleanName) {
          throw new GraphQLError('Nom de la permission manquant', {
            extensions: { code: 'BAD_USER_INPUT', httpStatus: 400 }
          });
        }

        // Vérification de l'existence de la permission
        await findBy1ParameterOrThrow('permissions', 'id_permission', cleanIdPermission, 'Permission non trouvée');

        // Validation des données d'entrée
        validatePermissionInput(cleanName);
        // ========================================
        // REQUETES BASE DE DONNEES
        // ======================================== 
        const result = await db.query(`
          UPDATE permissions
          SET permission_name = $1
          WHERE id_permission = $2
          RETURNING *
        `, [cleanName, cleanIdPermission]);
        // ========================================
        // DONNEES RECUPEREES
        // ========================================         
        if (result.rows.length === 0) {
          throw new GraphQLError('Permission non trouvée', {
            extensions: { code: 'NOT_FOUND', httpStatus: 404 }
          });
        }

        return {
          data: result.rows[0],
          httpStatus: 200
        };
    
      },
      {
        logAction: 'UPDATE_PERMISSION',
        requiresAdmin: true,
        errorMessage: 'Erreur lors de la mise à jour de la permission'
      }
    ),
    
    /**
     * Supprime une permission par son ID
     * 🔒 Route protégée (administrateur uniquement)
     * @param {object} input - Données d'entrée
     * @param {string} input.id_permission - ID de la permission à supprimer
     * @returns {boolean} true si la permission a été supprimée, false sinon
     * @throws {GraphQLError} Si l'utilisateur n'a pas les droits (401 ou 403)  
     * @throws {GraphQLError} Si une erreur se produit lors de la suppression de la permission (500)
     */
    deletePermission: withSecureResolver(
      async (_, { input, validated }, context) => {
        /* exemple context JWT décodé ( à revoir):
        {
          userId: "uuid-of-user",
          email: "user@example.com",
          role: "admin"
        }
        */
        /*exemple de requête :
            mutation deletePermission($input: DeletePermissionInput!) { deletePermission(input: $input) }
        */
        /* Exemple variables :
        {"input": {"id_permission":"baa03f2e-d66a-413d-ad47-1e55f1c651ca"} }
        */
        // ========================================
        // RECUPERER LES DONNEES NESSESAIRES
        // ======================================== 

        // Sanitize input
        const cleanIdPermission = sanitizeStrict(input.id_permission);

        if (!cleanIdPermission) {
          throw new GraphQLError('ID de la permission manquant', {
            extensions: { code: 'BAD_USER_INPUT', httpStatus: 400 }
          });
        }

        // Vérification de l'existence de la permission
        await findBy1ParameterOrThrow('permissions', 'id_permission', cleanIdPermission, 'Permission non trouvée');
        // ========================================
        // REQUETES BASE DE DONNEES
        // ======================================== 
        const result = await db.query(
          'DELETE FROM permissions WHERE id_permission = $1 RETURNING id_permission',
          [cleanIdPermission]
        );
        // ========================================
        // DONNEES RECUPEREES
        // ======================================== 
        
        if (context?.res?.status) context.res.status(200);
        return true ;
    
      },
      {
        logAction: 'DELETE_PERMISSION',
        requiresAdmin: true,
        errorMessage: 'Erreur lors de la suppression de la permission'
      }
    ),
    
    
  },

  Permission: {},
};








/**
 * Valide les données d'un message
 * @param {object} input - Données du message
 * @throws {GraphQLError} Si validation échoue
 */
export const validatePermissionInput = (name) => {
if (!name || name.trim().length < 3) {
    throw new GraphQLError('La permission doit contenir au moins 3 caractères', {
      extensions: { 
        code: 'BAD_REQUEST',
        httpStatus: 400
      },
    });
  }
    
  if (name.length > 100) {
    throw new GraphQLError('La permission ne peut pas dépasser 100 caractères', {
      extensions: { 
        code: 'BAD_REQUEST',
        httpStatus: 400
      },
    });
  }
};
