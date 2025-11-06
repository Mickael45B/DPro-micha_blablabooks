import db from "../db/connect_DB.js";
import { v4 as uuidv4 } from "uuid";
import { validateOrderParams, handleDbError } from '../utils/validators.js';
import fetchRoleById from './utils/utils_roles.js';
import  fetchPermissionById  from './utils/utils_permissions.js';
import { fetchUserById } from './utils/utils_users.js';
import fetchBookById from './utils/utils_books.js'; 
import sanitizeHtml from 'sanitize-html';
import { GraphQLError } from 'graphql';
import fetchLibraryById from './utils/utils_librairies.js';

import { isAuthenticated, requireAuth, requireAdmin, requireOwnershipOrAdmin, sanitizeString, sanitizeInput, flattenEdges, makePageInfo, makeEdgeFromBook, withErrorHandling } from './utils/helpers/helpers_general.js';


//Revoir le "searchPermissionsRoles" une fois que la colonne name sera dispo dans la table rolehaspermissions

import {getPermissionsRolesSchema, getPermissionRoleSchema, searchPermissionsRolesSchema, addPermissionRoleSchema, updatePermissionRoleSchema, deletePermissionRoleSchema } from '../schema/schemas_joi/RoleshaspermissionSchema.js';
import { sanitizeStrict } from "./utils/helpers/helpers_securite.js";

// Importer les helpers généralistes
import { withSecureResolver } from './utils/helpers/helpers_general.js';
// Importer les helpers spécifiques
import { findRolePermissionOrThrow, validateRolePermissionInput} from './utils/helpers/helpers_RolePermissions.js';

// Importer le schema Joi genéral
import { generalSortingSchema } from '../schema/schemas_joi/generalSchema.js';
// Importer les schemas Joi spécifiques
import { generalRolesHasPermissionsSchema, generalOrderRolesHasPermissionsSchema, searchPermissionsRolesSchema} from '../schema/schemas_joi/bookhaslibrarySchema.js';

// Importer les wrappers et helpers de sécurité
import { sanitizeStrict} from './utils/helpers/helpers_securite.js';



export default {
  Query: {
    /**
     * Récupère les relations avec pagination et tri
     * 🔒 Route protégée (administrateur uniquement)
       * @param {number} limit - Limite de résultats (max 100)
       * @param {number} offset - Décalage pour pagination
       * @param {string} order - Champ de tri
       * @param {string} direction - Direction du tri (ASC/DESC)
       * @returns {object} { roles, permissions, totalCount, hasNextPage, httpStatus }
       * @throws {GraphQLError} Si l'utilisateur n'a pas les droits (401 ou 403)  
       * @throws {GraphQLError} Si une erreur se produit lors de la récupération des relations (500)
     */
    getPermissionsRoles: withSecureResolver(
      async (_, { validated }, context) => {
        /* exemple context JWT décodé ( à revoir):
        {
          userId: "uuid-of-user",
          email: "user@example.com",
          role: "admin"
        }
        */
        /*exemple de requête :
        query {getPermissionsRoles{roleHasPermissions{id_rolehaspermission, role{role_name}, permissions{permission_name}, created_at, updated_at}, totalCount}}
        */
        /* Exemple variables :
        {
        }
        */
    
        // ========================================
        // RECUPERER LES DONNEES NESSESAIRES
        // ======================================== 

        // Extraction et validation des paramètres de pagination et de tri
        const { limit = 50, offset = 0, order = 'created_at', direction = 'ASC' } = validated;

        // Sanitize inputs
        const cleanLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 100);
        const cleanOffset = Math.max(parseInt(offset) || 0, 0);
        const validOrders = ['created_at', 'id_role', 'id_permission', 'updated_at'];
        const { order: safeOrder, direction: safeDirection } = validateOrderParams(
          sanitizeStrict(order), 
          sanitizeStrict(direction), 
          validOrders
        );
        // ========================================
        // REQUETES BASE DE DONNEES
        // ======================================== 
        // Requête principale avec pagination et tri sécurisé        
        const result = await db.query(`
          SELECT id_rolehaspermission, id_role, id_permission, created_at, updated_at
          FROM rolehaspermissions
          ORDER BY ${safeOrder} ${safeDirection}
          LIMIT $1 OFFSET $2
        `, [cleanLimit, cleanOffset]);
        
        const countResult = await db.query('SELECT COUNT(*)::int as count FROM rolehaspermissions');
        const totalCount = countResult.rows[0].count;
        // ========================================
        // DONNEES RECUPEREES
        // ======================================== 
        return {
          roleHasPermissions: result.rows,
          totalCount,
          hasNextPage: cleanOffset + cleanLimit < totalCount,
          httpStatus: 200
        };
    
      },
      {
        sortingSchema: generalSortingSchema,
        orderSchema: generalOrderRolesHasPermissionsSchema,
        logAction: 'GET_ALL_ROLES_HAS_PERMISSIONS',
        requiresAuth: true,
        errorMessage: 'Erreur lors de la récupération des rôles et permissions'
      }
    ),
    
    /** 
       * Récupère une relation par son ID
       * 🔒 Route protégée (administrateur uniquement)
       * @param {string} id_rolehaspermission - ID de la relation
       * @returns {object} La relation trouvée
       * @throws {GraphQLError} Si la relation n'est pas trouvée (404)
       */
    getPermissionRole: withSecureResolver(
      async (_, { id_rolehaspermission, validated }, context) => {

        /* exemple context JWT décodé ( à revoir):
        {
          userId: "uuid-of-user",
          email: "user@example.com",
          role: "admin"
        }
        */
        /*exemple de requête :
        query  getPermissionRole($id_rolehaspermission: ID!) {getPermissionRole(id_rolehaspermission: $id_rolehaspermission) {id_rolehaspermission, id_role, id_permission, created_at, updated_at}}
        */
        /* Exemple variables :
        {
          id_rolehaspermission: "1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p"
        }
        */
    
        // ========================================
        // RECUPERER LES DONNEES NESSESAIRES
        // ======================================== 

        // Validation de l'ID 
        if (!id_rolehaspermission) {
          throw new GraphQLError('ID de la relation requis', {
            extensions: { code: 'BAD_USER_INPUT', httpStatus: 400 }
          });
        }
        
        // Sanitize input
        const cleanIdRoleHasPermission = sanitizeStrict(id_rolehaspermission);
        // ========================================
        // REQUETES BASE DE DONNEES
        // ======================================== 
        // Vérifie si la relation existe et le retourne
        const rolePermission  = await findRolePermissionOrThrow(cleanIdRoleHasPermission);
        // ========================================
        // DONNEES RECUPEREES
        // ========================================        
        if (context?.res?.status) context.res.status(200);
        return rolePermission;
    
      },
      {
        logAction: 'GET_ONE_ROLE_HAS_PERMISSION',
        requiresAuth: true,
        errorMessage: 'Erreur lors de la récupération de la relation rôle-permission'
      }
    ),
    
    /**
     * Recherche des relations par ID de rôle ou permission avec pagination et tri
     * 🔒 Route protégée (utilisateur authentifié)
     * @param {string} role_name - ID du rôle ou de la permission à rechercher
     * @param {number} limit - Limite de résultats (max 100)
     * @param {number} offset - Décalage pour pagination
     * @returns {object} { roleHasPermissions, totalCount, hasNextPage, httpStatus }
     * @throws {GraphQLError} Si l'utilisateur n'est pas authentifié (401)
     * @throws {GraphQLError} Si une erreur se produit lors de la recherche (500)
     */
    searchPermissionsRoles: withSecureResolver(
      async (_, { validated }, context) => {
    
        /* exemple context JWT décodé ( à revoir):
        {
          userId: "uuid-of-user",
          email: "user@example.com",
          role: "admin"
        }
        */
        /*exemple de requête :
        query searchPermissionsRoles($name: String!) {searchPermissionsRoles(name: $name) {permissions{permission_name}}}

        */
        /* Exemple variables :
        {"name": "et"}
        */
    
        // ========================================
        // RECUPERER LES DONNEES NESSESAIRES
        // ======================================== 

        // Extraction et validation des paramètres de pagination et de tri
        const { limit = 50, offset = 0, order = 'created_at', direction = 'DESC', id_role, query } = validated;

        // Sanitize inputs
        // const cleanLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 100);
        // const cleanOffset = Math.max(parseInt(offset) || 0, 0);
        const validOrders = ['created_at', 'id_role', 'id_permission', 'updated_at'];
        const { order: safeOrder, direction: safeDirection } = validateOrderParams(
          sanitizeStrict(order), 
          sanitizeStrict(direction), 
          validOrders
        );
        const cleanIdRole = sanitizeStrict(query || '');
        const cleanIdPermission = sanitizeStrict(id_permission || '');

        if (!cleanIdRole && !cleanIdPermission) {
          throw new GraphQLError('ID du rôle ou de la permission requis', {
            extensions: { code: 'BAD_USER_INPUT', httpStatus: 400 }
          });
        }

        // Construction sécurisée de la requête
        let whereClause = '';
        const queryParams = [];
        let paramIndex = 1;

        if (cleanIdRole) {
          whereClause += `id_role = $${paramIndex++}`;
          queryParams.push(cleanIdRole);
        }

        if (cleanIdPermission) {
          if (whereClause) whereClause += ' OR ';
          whereClause += `id_permission = $${paramIndex++}`;
          queryParams.push(cleanIdPermission);
        }
        // ========================================
        // REQUETES BASE DE DONNEES
        // ======================================== 
        const result = await db.query(`
          SELECT id_rolehaspermission, id_role, id_permission, created_at, updated_at 
          FROM rolehaspermissions 
          WHERE ${whereClause}
          ORDER BY ${safeOrder} ${safeDirection}
          LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `, [...queryParams, cleanLimit, cleanOffset]);

        const countResult = await db.query(`
          SELECT COUNT(*)::int as count
          FROM rolehaspermissions
          WHERE ${whereClause}
        `, queryParams);
        // ========================================
        // DONNEES RECUPEREES
        // ========================================                
        return {
          roleHasPermissions: result.rows,
          totalCount: countResult.rows[0].count,
          hasNextPage: offset + limit < countResult.rows[0].count,
          httpStatus: 200
        };
      },
      {
        sortingSchema: generalSortingSchema,
        orderSchema: generalOrderRoleHasPermissionSchema,
        inputSchema: searchRoleHasPermissionSchema,
        logAction: 'SEARCH_ROLE_HAS_PERMISSION',
        requiresAuth: true,
        errorMessage: 'Erreur lors de la recherche des rôles et permissions'
      }
    ),
    
  },

  Mutation: {
    /**
     * Ajout d'une relation entre un rôle et une permission
     * 🔒 Route protégée (utilisateur authentifié)
     * @param {object} input - Données de la relation à créer
     * @returns {object} La relation créée
     * @throws {GraphQLError} Si l'utilisateur n'est pas authentifié (401)
     * @throws {GraphQLError} Si une erreur se produit lors de la création (500)
     */
    addPermissionRole: withSecureResolver(
      async (_, { input, validated }, context) => {
    
        /* exemple context JWT décodé ( à revoir):
        {
          userId: "uuid-of-user",
          email: "user@example.com",
          role: "admin"
        }
        */
        /*exemple de requête :
        mutation addPermissionRole($input: CreateRoleHasPermissionInput!) { addPermissionRole(input: $input) {id_rolehaspermission, id_permission, id_role}}

        */
        /* Exemple variables :
        { "input": {
        "id_role": "1",
        "id_permission": "2"
        }
        }               
        */
    
        // ========================================
        // RECUPERER LES DONNEES NESSESAIRES
        // ======================================== 

        // Vérifier si l'input est fourni
        if (!input) {
          throw new GraphQLError('Données de la relation requises', {
            extensions: { code: 'BAD_USER_INPUT', httpStatus: 400 }
          });
        }

        // Sanitize inputs AVANT validation
        const cleanInput = {
          id_role: sanitizeString(input.id_role),
          id_permission: sanitizeString(input.id_permission),
        };

        // Validation des données d'entrée
        validateRolePermissionInput(cleanInput);

        // Vérifier que le rôle existe
        await fetchRoleById(cleanInput.id_role);
        
        // Vérifier que la permission existe
        await fetchPermissionById(cleanInput.id_permission);
        
        // Vérifier qu'il n'y a pas déjà cette relation
        const existingRelation = await db.query(
          'SELECT id_rolehaspermission FROM rolehaspermissions WHERE id_role = $1 AND id_permission = $2',
          [cleanInput.id_role, cleanInput.id_permission]
        );

        if (existingRelation.rows.length > 0) {
          throw new GraphQLError('Cette relation existe déjà', {
            extensions: { code: 'CONFLICT', httpStatus: 409 }
          });
        }
        const id = uuidv4();
        // ========================================
        // REQUETES BASE DE DONNEES
        // ========================================         
        const result = await db.query(`
          INSERT INTO rolehaspermissions (id_rolehaspermission, id_role, id_permission)
          VALUES ($1, $2, $3)
          RETURNING *
        `, [id, cleanInput.id_role, cleanInput.id_permission]);
        // ========================================
        // DONNEES RECUPEREES
        // ======================================== 
        // return {
        //   roleHasPermissions: result.rows[0],
        //   httpStatus: 201
        // };

        if (context?.res?.status) context.res.status(201);
        return result.rows[0];
      },
      {
        logAction: 'ADD_ROLE_HAS_PERMISSION',
        requiresAuth: true,
        errorMessage: 'Erreur lors de l\'ajout de la relation de rôle et de permission'
      }
    ),
    
    /**
     * Met à jour une relation existante
     * 🔒 Route protégée (propriétaire de l'avis ou administrateur)
     * @param {object} input - Données de la relation à mettre à jour
     * @param {string} input.id_rolehaspermission - ID de la relation à mettre à jour
     * @param {string} [input.id_role] - Nouvel ID de rôle
     * @param {string} [input.id_permission] - Nouvel ID de permission
     * @returns {object} Relation mise à jour
     * @throws {GraphQLError} Si l'utilisateur n'est pas authentifié (401)
     * @throws {GraphQLError} Si une erreur se produit lors de la mise à jour de la relation (500)
     */
    updatePermissionRole: withSecureResolver(
      async (_, { input, validated }, context) => {
    
        /* exemple context JWT décodé ( à revoir):
        {
          userId: "uuid-of-user",
          email: "user@example.com",
          role: "admin"
        }
        */
        /*exemple de requête :
        mutation updatePermissionRole($input: UpdateRoleHasPermissionInput!) { updatePermissionRole(input: $input) {id_rolehaspermission role{role_name}, permission{permission_name} }}

        */
        /* Exemple variables :
        { "input": 
        {
        "id_rolehaspermission": "329bb3b5-fb4c-4785-bfc5-06fca44b8f85",
        "id_permission": 3
        }
        }
        */
    
        // ========================================
        // RECUPERER LES DONNEES NESSESAIRES
        // ======================================== 

        // Vérifier si l'id de la relation est fourni
        if (!input.id_rolehaspermission) {
          throw new GraphQLError('ID de la relation requis', {
            extensions: { code: 'BAD_USER_INPUT', httpStatus: 400 }
          });
        }

        // Sanitize inputs
        const cleanIdRoleHasPermission = sanitizeString(input.id_rolehaspermission);

        // Vérifier que la relation existe
        await findRolePermissionOrThrow(input.id_rolehaspermission);

        const updates = [];
        const values = [];
        let paramIndex = 1;

        if (input.id_role !== undefined) {
          const cleanIdRole = sanitizeString(input.id_role);
          
          // Vérifier que le rôle existe
          await fetchRoleById(cleanIdRole);
          
          updates.push(`id_role = $${paramIndex++}`);
          values.push(cleanIdRole);
        }

        if (input.id_permission !== undefined) {
          const cleanIdPermission = sanitizeString(input.id_permission);
          
          // Vérifier que la permission existe
          await fetchPermissionById(cleanIdPermission);
          
          updates.push(`id_permission = $${paramIndex++}`);
          values.push(cleanIdPermission);
        }

        if (updates.length === 0) {
          throw new GraphQLError('Aucun champ à mettre à jour', {
            extensions: { code: 'BAD_USER_INPUT', httpStatus: 400 }
          });
        }

        // Ajouter updated_at
        updates.push(`updated_at = CURRENT_TIMESTAMP`);

        // Ajouter l'ID de la relation
        values.push(cleanIdRoleHasPermission);
        // ========================================
        // REQUETES BASE DE DONNEES
        // ======================================== 
        const result = await db.query(`
          UPDATE rolehaspermissions
          SET ${updates.join(', ')}
          WHERE id_rolehaspermission = $${paramIndex}
          RETURNING *
        `, values);
        // ========================================
        // DONNEES RECUPEREES
        // ========================================         
        if (result.rows.length === 0) {
          throw new GraphQLError("Relation non trouvée", {
            extensions: { code: 'NOT_FOUND', httpStatus: 404 }
          });
        }
        if (context?.res?.status) context.res.status(200);
        return result.rows[0];
      },
      {
        logAction: 'UPDATE_ROLE_HAS_PERMISSION',
        requiresAuth: true,
        errorMessage: 'Erreur lors de la mise à jour de la relation de rôle et de permission'
      }
    ),
    
    /**
     * Supprime une relation existante
     * 🔒 Route protégée (propriétaire de l'avis ou administrateur)
     * @param {object} input - Données de la relation à supprimer
     * @param {string} input.id_rolehaspermission - ID de la relation à supprimer
     * @returns {boolean} true si la relation a été supprimée, false sinon
     * @throws {GraphQLError} Si l'utilisateur n'est pas authentifié (401)
     * @throws {GraphQLError} Si une erreur se produit lors de la suppression de la relation (500)
     */
    deletePermissionRole: withSecureResolver(
      async (_, { input, validated }, context) => {
        /* exemple context JWT décodé ( à revoir):
        {
          userId: "uuid-of-user",
          email: "user@example.com",
          role: "admin"
        }
        */
        /*exemple de requête :
            mutation deletePermissionRole($input: DeleteRoleHasPermissionInput!) { deletePermissionRole(input: $input) }
        */
        /* Exemple variables :
        {"input": {"id_permission":"329bb3b5-fb4c-4785-bfc5-06fca44b8f85"} }
        */
    
        // ========================================
        // RECUPERER LES DONNEES NESSESAIRES
        // ======================================== 

        // Sanitize input
        const cleanIdRoleHasPermission = sanitizeString(input.id_rolehaspermission);

        if (!cleanIdRoleHasPermission) {
          throw new GraphQLError('ID de la relation manquant', {
            // extensions: { code: 'BAD_USER_INPUT', httpStatus: 400 }
            extensions: 200
          });
        }
        
        // Vérifier que la relation existe
        await findRolePermissionOrThrow(cleanIdRoleHasPermission);
        // ========================================
        // REQUETES BASE DE DONNEES
        // ======================================== 
        const result = await db.query(
          'DELETE FROM rolehaspermissions WHERE id_rolehaspermission = $1 RETURNING *',
          [cleanIdRoleHasPermission]
        );
        if (context && context.res && typeof context.res.status === 'function') {
          context.res.status(200);
        }
        // ========================================
        // DONNEES RECUPEREES
        // ======================================== 
        return true;

        /*
        if (result.rows.length === 0) {
          throw new GraphQLError('Relation non trouvée', { extensions: { httpStatus: 404, code: 'NOT_FOUND' }});
        }
        return true; // ou return result.rows[0] si vous renvoyez l'objet supprimé

        ---------------------------------------------------------------------------------------------------------

        if (context?.res?.status) {
          context.res.status(result.rows.length > 0 ? 200 : 404);
        }
        return {
          success: result.rows.length > 0,
          httpStatus: result.rows.length > 0 ? 200 : 404
        };
        */
      },
      {
        logAction: 'DELETE_ROLE_HAS_PERMISSION',
        requiresAuth: true,
        errorMessage: 'Erreur lors de la suppression de la relation de rôle et de permission'
      }
    ),
    
  },

  RoleHasPermissions: {
    role: async (parent) => {
      return fetchRoleById(parent.id_role);
    },

    permissions: async (parent) => {
      const perm = await fetchPermissionById(parent.id_permission);
      // Schema defines `permission: [Permission!]!` (array), so return an array
      //return perm ? [perm] : [];
      return fetchPermissionById(parent.id_permission);
    },
  },
};