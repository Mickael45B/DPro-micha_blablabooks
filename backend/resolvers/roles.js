import db from "../db/connect_DB.js";
import { v4 as uuidv4 } from "uuid";
import { validateOrderParams, handleDbError } from '../utils/validators.js';
import { fetchUserById } from './utils/utils_users.js';
import fetchBookById from './utils/utils_books.js'; 
import { flattenEdges, makePageInfo, makeEdgeFromBook } from '../utils/helpers_books.js';
import sanitizeHtml from 'sanitize-html';
import { GraphQLError } from 'graphql';
import fetchLibraryById from './utils/utils_librairies.js';

import { isAuthenticated, requireAuth, requireAdmin, requireOwnershipOrAdmin, sanitizeString, sanitizeInput } from './utils/helpers/helpers_general.js';

import { findRolesOrThrow, validateRolesInput} from './utils/helpers/helpers_Roles.js';

import {getRolesSchema, getRoleSchema, searchRolesSchema, addRoleSchema, updateRoleSchema, deleteRoleSchema } from '../schema/schemas_joi/roleSchema.js';


export default {
  Query: {

    /**
     * Récupère les rôles avec pagination et tri
     * 🔒 Route protégée (administrateur uniquement)
       * @param {number} limit - Limite de résultats (max 100)
       * @param {number} offset - Décalage pour pagination
       * @param {string} order - Champ de tri
       * @param {string} direction - Direction du tri (ASC/DESC)
       * @returns {object} { roles, totalCount, hasNextPage, httpStatus }
       * @throws {GraphQLError} Si l'utilisateur n'a pas les droits (401 ou 403)  
       * @throws {GraphQLError} Si une erreur se produit lors de la récupération des rôles (500)
     */
    getRoles: async (_, args, context) => {
      try {

        /* exemple context JWT décodé ( à revoir):
        {
          userId: "uuid-of-user",
          email: "user@example.com",
          role: "admin"
        }
        */
        /*exemple de requête :
        query {getRoles{roles{id_role, role_name, created_at, updated_at}}}
        */
        /* Exemple variables :
        {
        }
        */


        // Vérification des droits d'accès
        requireAdmin(context);

        // Extraction et validation des paramètres de pagination et de tri
        const { limit = 50, offset = 0, order = 'created_at', direction = 'ASC' } = args;

        // Sanitize inputs
        const cleanLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 100);
        const cleanOffset = Math.max(parseInt(offset) || 0, 0);
        const validOrders = ['created_at', 'role_name', 'updated_at'];
        const { order: safeOrder, direction: safeDirection } = validateOrderParams(
          sanitizeString(order), 
          sanitizeString(direction), 
          validOrders
        );
        
        const result = await db.query(`
          SELECT id_role, role_name, created_at, updated_at
          FROM roles
          ORDER BY ${safeOrder} ${safeDirection}
          LIMIT $1 OFFSET $2
        `, [cleanLimit, cleanOffset]);
        
        const countResult = await db.query('SELECT COUNT(*)::int as count FROM roles');
        const totalCount = countResult.rows[0].count;
        
        return {
          roles: result.rows,
          totalCount,
          hasNextPage: cleanOffset + cleanLimit < totalCount,
          httpStatus: 200
        };
      } catch (error) {
        if (error instanceof GraphQLError) throw error;
        throw new GraphQLError('Erreur lors de la récupération des rôles', {
          extensions: { 
            code: 'INTERNAL_SERVER_ERROR',
            httpStatus: 500,
            originalError: error.message
          }
        });
      }
    },

    /**
     * Récupère un rôle par son ID
     * 🔒 Route protégée (administrateur uniquement)
     * @param {string} id_role - ID du rôle
     * @returns {object|null} Rôle ou null si non trouvé
     * @throws {GraphQLError} Si l'utilisateur n'a pas les droits (401 ou 403)
     * @throws {GraphQLError} Si une erreur se produit lors de la récupération du rôle (500)
     */
    getRole: async (_, { id_role }, context) => {
      try {

        /* exemple context JWT décodé ( à revoir):
        {
          userId: "uuid-of-user",
          email: "user@example.com",
          role: "admin"
        }
        */
       /*exemple de requête :
        query  getRole($id_role: ID!) {getRole(id_role: $id_role) {id_role, role_name, created_at, updated_at}}

        */
        /* Exemple variables :
        {"id_role": 1}
        */

        // Vérification des droits d'accès
        requireAdmin(context);

        // Validation de l'ID du rôle
        if (!id_role) {
          throw new GraphQLError('ID du rôle requis', {
            extensions: { code: 'BAD_USER_INPUT', httpStatus: 400 }
          });
        }

        // Sanitize input
        const cleanIdRole = sanitizeString(id_role);

        // Vérifie si le rôle existe et le retourne
        const role = await findRolesOrThrow(cleanIdRole);

        if (context?.res?.status) context.res.status(200);
        return role;
      } catch (error) {
        if (error instanceof GraphQLError) throw error;
        throw new GraphQLError("Erreur lors de la récupération du rôle", {
          extensions: {
            code: 'INTERNAL_SERVER_ERROR',
            httpStatus: 500,
            originalError: error.message
          }
        });
      }
    },

    /**
     * Recherche des rôles par nom
     * @param {string} role_name - Nom du rôle à rechercher
     * @param {number} limit - Limite de résultats
     * @param {number} offset - Décalage pour la pagination
     * @returns {object} Résultats de la recherche
     * @throws {GraphQLError} Si une erreur se produit lors de la recherche (500)
     */
    searchRoles: async (_, args, context) => {
      try {

        /* exemple context JWT décodé ( à revoir):
        {
          userId: "uuid-of-user",
          email: "user@example.com",
          role: "admin"
        }
        */
       /*exemple de requête :
        query  searchRoles($role_name: String!) {searchRoles(role_name: $role_name) {roles{ id_role, role_name, created_at, updated_at}}}
        */
        /* Exemple variables :
        {"role_name": "adm"}
        */



        // Vérification des droits d'accès
        requireAdmin(context);

        // Extraction et validation des paramètres de pagination et de tri
        const { limit = 50, offset = 0, order = 'created_at', direction = 'DESC', role_name } = args;

        // Sanitize inputs
        const cleanLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 100);
        const cleanOffset = Math.max(parseInt(offset) || 0, 0);
        const validOrders = ['created_at', 'role_name', 'updated_at'];
        const { order: safeOrder, direction: safeDirection } = validateOrderParams(
          sanitizeString(order), 
          sanitizeString(direction), 
          validOrders
        );
        const cleanRoleName = sanitizeString(role_name || '');

        if (!cleanRoleName) {
          throw new GraphQLError('Nom du rôle requis', {
            extensions: { code: 'BAD_USER_INPUT', httpStatus: 400 }
          });
        }

        const searchPattern = `%${cleanRoleName}%`;

        const result = await db.query(`
          SELECT id_role, role_name, created_at, updated_at FROM roles
          WHERE LOWER(role_name) LIKE LOWER($1)
          ORDER BY ${safeOrder} ${safeDirection}
          LIMIT $2 OFFSET $3
        `, [searchPattern, cleanLimit, cleanOffset]);
        
        const countResult = await db.query(`
          SELECT COUNT(*)::int as count FROM roles
          WHERE LOWER(role_name) LIKE LOWER($1)
        `, [searchPattern]);
        
        return {
          roles: result.rows,
          totalCount: countResult.rows[0].count,
          hasNextPage: cleanOffset + cleanLimit < countResult.rows[0].count,
          httpStatus: 200
        };
      } catch (error) {
        if (error instanceof GraphQLError) throw error;
        throw new GraphQLError('Erreur lors de la recherche des rôles', {
          extensions: { 
            code: 'INTERNAL_SERVER_ERROR',
            httpStatus: 500,
            originalError: error.message
          },
        });
      }
    },
},

  Mutation: {

    /**
     * Ajoute un nouvel avis
     * 🔒 Route protégée (utilisateur authentifié)
     * @param {object} input - Données du rôle
     * @param {string} input.role_name - Nom du rôle
     * @returns {object} Rôle créé
     * @throws {GraphQLError} Si l'utilisateur n'est pas authentifié (401)
     * @throws {GraphQLError} Si les données d'entrée sont invalides (400)
     * @throws {GraphQLError} Si une erreur se produit lors de la création du rôle (500)
     */
    addRole: async (_, { input }, context) => {
      try {

        /* exemple context JWT décodé ( à revoir):
        {
          userId: "uuid-of-user",
          email: "user@example.com",
          role: "admin"
        }
        */
       /*exemple de requête :
        mutation addRole($input: CreateRoleInput!) { addRole(input: $input) {id_role, role_name, created_at, updated_at} }

        */
        /* Exemple variables :
        { "input": {
          "role_name": "admin"
        }
        }        
        */

        // Vérification des droits d'accès
        requireAdmin(context);

        // Sanitize input AVANT validation
        const cleanRoleName = sanitizeString(input.role_name || '');

        if (!cleanRoleName) {
          throw new GraphQLError('Nom du rôle requis', {
            extensions: { code: 'BAD_USER_INPUT', httpStatus: 400 }
          });
        }

        validateRolesInput({ role_name: cleanRoleName });

        // Vérifier si le rôle existe déjà dans la base de données
        const existingRole = await db.query(
          'SELECT * FROM roles WHERE LOWER(role_name) = LOWER($1)',
          [cleanRoleName]
        );

        if (existingRole.rows.length > 0) {
          throw new GraphQLError('Ce rôle existe déjà', {
            extensions: { code: 'CONFLICT', httpStatus: 409 }
          });
        }

        const id = uuidv4();
        const result = await db.query(`
          INSERT INTO roles (id_role, role_name)
          VALUES ($1, $2)
          RETURNING id_role, role_name, created_at, updated_at
        `, [id, cleanRoleName]);

        if (context?.res?.status) context.res.status(201);
        return result.rows[0];
      } catch (error) {
        if (error instanceof GraphQLError) throw error;
        throw new GraphQLError("Erreur lors de l'ajout d'un rôle", {
          extensions: { 
            code: 'INTERNAL_SERVER_ERROR',
            httpStatus: 500,
            originalError: error.message
          },
        });
      }
    },

    /**
     * Met à jour un rôle existant
     * 🔒 Route protégée (utilisateur authentifié)
     * @param {object} input - Données du rôle
     * @param {string} input.idRole - ID du rôle à mettre à jour
     * @param {string} input.name - Nouveau nom du rôle
     * @returns {object} Rôle mis à jour
     * @throws {GraphQLError} Si l'utilisateur n'est pas authentifié (401)
     * @throws {GraphQLError} Si les données d'entrée sont invalides (400)
     * @throws {GraphQLError} Si une erreur se produit lors de la mise à jour du rôle (500)
     */
    updateRole: async (_, { input }, context) => {
      try {

        /* exemple context JWT décodé ( à revoir):
        {
          userId: "uuid-of-user",
          email: "user@example.com",
          role: "admin"
        }
        */
       /*exemple de requête :
        mutation updateRole($input: UpdateRoleInput!) { updateRole(input: $input) {__typename }}

        */
        /* Exemple variables :
        { "input": 
        {"id_role": "95f96df5-820a-4001-be5d-89fa6921ef80",
          "role_name" :"toto au travail",
        }
        }       
        */
        
        // Vérification des droits d'accès
        requireAdmin(context);

        // Sanitize inputs
        const cleanRoleName = sanitizeString(input.role_name || '');
        const cleanIdRole = sanitizeString(input.id_role || '');

        if (!cleanIdRole) {
          throw new GraphQLError('ID du rôle requis', {
            extensions: { code: 'BAD_USER_INPUT', httpStatus: 400 }
          });
        }

        if (!cleanRoleName) {
          throw new GraphQLError('Nom du rôle requis', {
            extensions: { code: 'BAD_USER_INPUT', httpStatus: 400 }
          });
        }

        // Vérifier que le rôle existe AVANT de le mettre à jour
        await findRolesOrThrow(cleanIdRole);

        // Valider le nouveau nom
        validateRolesInput({ role_name: cleanRoleName });

        // Vérifier que le nouveau nom n'existe pas déjà (sauf s'il appartient au même rôle)
        const duplicateRole = await db.query(
          'SELECT id_role FROM roles WHERE LOWER(role_name) = LOWER($1) AND id_role != $2',
          [cleanRoleName, cleanIdRole]
        );

        if (duplicateRole.rows.length > 0) {
          throw new GraphQLError('Un rôle avec ce nom existe déjà', {
            extensions: { code: 'CONFLICT', httpStatus: 409 }
          });
        }

        const result = await db.query(`
          UPDATE roles
          SET role_name = $1, updated_at = CURRENT_TIMESTAMP
          WHERE id_role = $2
          RETURNING id_role, role_name, created_at, updated_at
        `, [cleanRoleName, cleanIdRole]);

        if (result.rows.length === 0) {
          throw new GraphQLError('Rôle non trouvé', {
            extensions: { code: 'NOT_FOUND', httpStatus: 404 }
          });
        }

        if (context?.res?.status) context.res.status(200);
        return result.rows[0];
      } catch (error) {
        if (error instanceof GraphQLError) throw error;
        throw new GraphQLError("Erreur lors de la mise à jour du rôle", {
          extensions: { 
            code: 'INTERNAL_SERVER_ERROR',
            httpStatus: 500,
            originalError: error.message
          },
        });
      }
    },

    /**
     * Supprime un rôle
     * 🔒 Route protégée (utilisateur authentifié)
     * @param {object} input - Données du rôle
     * @param {string} input.idRole - ID du rôle à supprimer
     * @returns {boolean} true si le rôle a été supprimé, false sinon
     * @throws {GraphQLError} Si l'utilisateur n'est pas authentifié (401)
     * @throws {GraphQLError} Si les données d'entrée sont invalides (400)
     * @throws {GraphQLError} Si une erreur se produit lors de la suppression du rôle (500)
     */
    deleteRole: async (_, { input }, context) => {
      try {

        /* exemple context JWT décodé ( à revoir):
        {
          userId: "uuid-of-user",
          email: "user@example.com",
          role: "admin"
        }
        */
       /*exemple de requête :
            mutation deleteRole($input: DeleteRoleInput!) { deleteRole(input: $input) }
        */
        /* Exemple variables :
        {"input": {"id_role":"95f96df5-820a-4001-be5d-89fa6921ef80"} }
        */


        // Vérification des droits d'accès
        requireAdmin(context);

        // Sanitize input
        const cleanIdRole = sanitizeString(input.id_role || '');

        if (!cleanIdRole) {
          throw new GraphQLError('ID du rôle requis', {
            extensions: { code: 'BAD_USER_INPUT', httpStatus: 400 }
          });
        }

        // Vérifier l'existence avant suppression
        await findRolesOrThrow(cleanIdRole);

        const result = await db.query(
          'DELETE FROM roles WHERE id_role = $1 RETURNING *',
          [cleanIdRole]
        );

        if (context?.res?.status) context.res.status(200);
        return true ;
      } catch (error) {
        if (error instanceof GraphQLError) throw error;
        throw new GraphQLError('Erreur lors de la suppression du rôle', {
          extensions: { 
            code: 'INTERNAL_SERVER_ERROR',
            httpStatus: 500,
            originalError: error.message
          }
        });
      }
    },

  },

  Role: {},
};

