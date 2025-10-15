import db from "../db/connect_DB.js";
import { v4 as uuidv4 } from 'uuid';
import { validateOrderParams, handleDbError } from '../utils/validators.js';
import { fetchUserById } from './utils/utils_users.js';
import { flattenEdges, makePageInfo, makeEdgeFromBook } from '../utils/helpers_books.js';
import sanitizeHtml from 'sanitize-html';
import { GraphQLError } from 'graphql';
import fetchBookById from './utils/utils_books.js';
import fetchLibraryById from './utils/utils_librairies.js';

import { isAuthenticated, requireAuth, requireAdmin, requireOwnershipOrAdmin, sanitizeString, sanitizeInput } from './utils/helpers/helpers_general.js';

import { findPermissionsOrThrow, validatePermissionInput} from './utils/helpers/helpers_permissions.js';


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
    getPermissions: async (_, args, context) => {
      try {
        // Vérification des droits d'accès
        requireAdmin(context);

        // Extraction et validation des paramètres de pagination et de tri
        const { limit = 50, offset = 0, order = 'created_at', direction = 'DESC' } = args;

        // Sanitize inputs
        const cleanLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 100);
        const cleanOffset = Math.max(parseInt(offset) || 0, 0);
        const validOrders = ['created_at', 'permission_name', 'updated_at'];
        const { order: safeOrder, direction: safeDirection } = validateOrderParams(
          sanitizeString(order), 
          sanitizeString(direction), 
          validOrders
        );

        // Requête SQL pour récupérer toutes les permissions
        const result = await db.query(`
          SELECT id_permission, permission_name, created_at, updated_at
          FROM permissions
          ORDER BY ${safeOrder} ${safeDirection}
          LIMIT $1 OFFSET $2
        `, [cleanLimit, cleanOffset]);
        
        const countResult = await db.query('SELECT COUNT(*)::int as count FROM permissions');
        const totalCount = countResult.rows[0].count;
        
        return {
          permissions: result.rows,
          totalCount,
          hasNextPage: cleanOffset + cleanLimit < totalCount,
          httpStatus: 200,
        };
      } catch (error) {
        throw new GraphQLError('Erreur lors de la récupération des messages', {
          extensions: { 
            code: 'INTERNAL_SERVER_ERROR',
            httpStatus: 500,
            originalError: error.message
          }
        });
      }
    },

    /**
     * Récupère une permission par son ID
     * 🔒 Route protégée (administrateur uniquement)
     * @param {string} id_permission - ID de la permission
     * @returns {object|null} Permission ou null si non trouvée
     * @throws {GraphQLError} Si l'utilisateur n'a pas les droits (401 ou 403)  
     * @throws {GraphQLError} Si une erreur se produit lors de la récupération de la permission (500)
     */
    getPermission: async (_, { id_permission }, context) => {
      try {

        // Vérification des droits d'accès
        requireAdmin(context);  

        // Sanitize input
        const cleanIdPermission = sanitizeString(id_permission);

        // Validation de l'ID de la permission
        if (!cleanIdPermission) {
          throw new GraphQLError('ID de la permission manquant', {
            extensions: { code: 'BAD_USER_INPUT', httpStatus: 400 }
          });
        }

        // Recherche de l'existence (ou non) de la permission dans la base de données
        const permission = await findPermissionsOrThrow(cleanIdPermission);

        return {
          permission,
          httpStatus: 200,
        };

      } catch (error) {
        if (error instanceof GraphQLError) throw error;
        throw new GraphQLError('Erreur lors de la récupération de la permission', {
          extensions: { 
            code: 'INTERNAL_SERVER_ERROR',
            httpStatus: 500,
            originalError: error.message
          },
        });
      }
    },

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
    searchPermissions: async (_, args, context) => {
      try {

        // Vérification des droits d'accès
        requireAdmin(context);

        // Extraction et validation des paramètres de pagination et de tri
        const { limit = 50, offset = 0, order = 'created_at', direction = 'DESC', name } = args;

        // Sanitize inputs
        const cleanLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 100);
        const cleanOffset = Math.max(parseInt(offset) || 0, 0);
        const validOrders = ['created_at', 'permission_name', 'updated_at'];
        const { order: safeOrder, direction: safeDirection } = validateOrderParams(
          sanitizeString(order), 
          sanitizeString(direction), 
          validOrders
        );
        const cleanName = sanitizeString(name || '');

        if (!cleanName) {
          throw new GraphQLError('Nom de la permission manquant', {
            extensions: { code: 'BAD_USER_INPUT', httpStatus: 400 }
          });
        }

        const searchPattern = `%${cleanPermissionName}%`;
        
        const result = await db.query(`
          SELECT * FROM permissions
          WHERE permission_name LIKE LOWER($1)
          ORDER BY permission_name ASC
          LIMIT $2 OFFSET $3
        `, [searchPattern, cleanLimit, cleanOffset]);
        
        const countResult = await db.query(`
          SELECT COUNT(*)::int as count FROM permissions
          WHERE permission_name LIKE LOWER($1)
        `, [searchPattern]);
        
        return {
          permissions: result.rows,
          totalCount: countResult.rows[0].count,
          hasNextPage: cleanOffset + cleanLimit < countResult.rows[0].count,
          httpStatus: 200,
        };
      } catch (error) {
        if (error instanceof GraphQLError) throw error;
        throw new GraphQLError('Erreur lors de la recherche des permissions', {
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
     * Ajoute une nouvelle permission
     * 🔒 Route protégée (administrateur uniquement)
     * @param {object} input - Données de la permission
     * @param {string} input.name - Nom de la permission
     * @returns {object} La permission créée
     * @throws {GraphQLError} Si l'utilisateur n'a pas les droits (401 ou 403)  
     * @throws {GraphQLError} Si une erreur se produit lors de la création de la permission (500)
     */
    addPermission: async (_, { input }, context) => {
      try {

        // Vérification des droits d'accès
        requireAdmin(context);

        // Sanitize input
        const cleanName = sanitizeString(input.name);

        if (!cleanName) {
          throw new GraphQLError('Nom de la permission manquant', {
            extensions: { code: 'BAD_USER_INPUT', httpStatus: 400 }
          });
        }

        // vérification des données d'entrée
        validatePermissionInput(cleanName);

        const id = uuidv4();
        const result = await db.query(`
          INSERT INTO permissions (id_permission, permission_name)
          VALUES ($1, $2)
          RETURNING *
        `, [id, cleanName]);
        return {
          data: result.rows[0],
          httpStatus: 201
        };
      } catch (error) {
        if (error instanceof GraphQLError) throw error;
        throw new GraphQLError("Erreur lors de l'ajout de la permission", {
          extensions: { 
            code: 'INTERNAL_SERVER_ERROR',
            httpStatus: 500,
            originalError: error.message
          },
        });
      }
    },

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
    updatePermission: async (_, { input }, context) => {
      try {

        // Vérification des droits d'accès
        requireAdmin(context);

        // Sanitize input
        const cleanIdPermission = sanitizeString(input.id_permission);
        const cleanName = sanitizeString(input.name);


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
        await findPermissionsOrThrow(cleanIdPermission);

        // Validation des données d'entrée
        validatePermissionInput(cleanName);

        const result = await db.query(`
          UPDATE permissions
          SET permission_name = $1
          WHERE id_permission = $2
          RETURNING *
        `, [cleanName, cleanIdPermission]);

        if (result.rows.length === 0) {
          throw new GraphQLError('Permission non trouvée', {
            extensions: { code: 'NOT_FOUND', httpStatus: 404 }
          });
        }

        return {
          data: result.rows[0],
          httpStatus: 200
        };
        
      } catch (error) {
        if (error instanceof GraphQLError) throw error;
        throw new GraphQLError("Erreur lors de la modification de la permission", {
          extensions: { 
            code: 'INTERNAL_SERVER_ERROR',
            httpStatus: 500,
            originalError: error.message
          },
        });
      }
    },

    /**
     * Supprime une permission par son ID
     * 🔒 Route protégée (administrateur uniquement)
     * @param {object} input - Données d'entrée
     * @param {string} input.id_permission - ID de la permission à supprimer
     * @returns {boolean} true si la permission a été supprimée, false sinon
     * @throws {GraphQLError} Si l'utilisateur n'a pas les droits (401 ou 403)  
     * @throws {GraphQLError} Si une erreur se produit lors de la suppression de la permission (500)
     */
    deletePermission: async (_, { input }, context) => {
      try {
        // Vérification des droits d'accès
        requireAdmin(context);

        // Sanitize input
        const cleanIdPermission = sanitizeString(input.id_permission);

        if (!cleanIdPermission) {
          throw new GraphQLError('ID de la permission manquant', {
            extensions: { code: 'BAD_USER_INPUT', httpStatus: 400 }
          });
        }

        // Vérification de l'existence de la permission
        await findPermissionsOrThrow(cleanIdPermission);

        const result = await db.query(
          'DELETE FROM permissions WHERE id_permission = $1 RETURNING id_permission',
          [cleanIdPermission]
        );
        return result.rows.length > 0;
      } catch (error) {
        if (error instanceof GraphQLError) throw error;
        throw new GraphQLError("Erreur lors de la suppression de la permission", {
          extensions: { 
            code: 'INTERNAL_SERVER_ERROR',
            httpStatus: 500,
            originalError: error.message
          },
        });
      }
    },
  },

  Permission: {},
};