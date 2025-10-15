import db from "../db/connect_DB.js";
import { v4 as uuidv4 } from "uuid";
import { validateOrderParams, handleDbError } from '../utils/validators.js';
import { fetchUserById } from './utils/utils_users.js';
import { flattenEdges, makePageInfo, makeEdgeFromBook } from '../utils/helpers_books.js';
import sanitizeHtml from 'sanitize-html';
import { GraphQLError } from 'graphql';
import fetchBookById from './utils/utils_books.js';
import fetchLibraryById from './utils/utils_librairies.js';

import { isAuthenticated, requireAuth, requireAdmin, requireOwnershipOrAdmin, sanitizeString, sanitizeInput } from './utils/helpers/helpers_general.js';

import { findReportOrThrow, validateReportInput} from './utils/helpers/helpers_Reports.js';






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
    getReports: async (_, args, context) => {
      try {

        // Vérification des droits d'accès
        requireAdmin(context);

        // Extraction et validation des paramètres de pagination et de tri
        const { limit = 50, offset = 0, order = 'created_at', direction = 'DESC' } = args;

        // Sanitize inputs
        const cleanLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 100);
        const cleanOffset = Math.max(parseInt(offset) || 0, 0);
        const validOrders = ['created_at', 'reason', 'details', 'updated_at'];
        const { order: safeOrder, direction: safeDirection } = validateOrderParams(
          sanitizeString(order), 
          sanitizeString(direction), 
          validOrders
        );
        
        const result = await db.query(`
          SELECT id_report, id_user, report_type, reported_id, reason, status, details, created_at, updated_at
          FROM reports
          ORDER BY ${safeOrder} ${safeDirection}
          LIMIT $1 OFFSET $2
        `, [cleanLimit, cleanOffset]);
        
        const countResult = await db.query('SELECT COUNT(*)::int as count FROM reports');
        const totalCount = countResult.rows[0].count;
        
        return {
          reports: result.rows,
          totalCount,
          hasNextPage: cleanOffset + cleanLimit < totalCount,
          httpStatus: 200
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
     * * 🔓 Route publique
     * @param {string} id_permission - ID de la permission
     * @returns {object|null} Permission ou null si non trouvée
     * @throws {GraphQLError} Si l'utilisateur n'a pas les droits (401 ou 403)  
     * @throws {GraphQLError} Si une erreur se produit lors de la récupération de la permission (500)
     */
    getReport: async (_, { id_report }, context) => {
      try {

        // Vérification des droits d'accès
        requireAuth(context);

        // Sanitize input
        const sanitizedId = sanitizeString(id_report);

        if (!sanitizedId) {
          throw new GraphQLError('ID du rapport manquant', {
            extensions: { code: 'BAD_USER_INPUT', httpStatus: 400 }
          });
        }

        const report = await findReportOrThrow(sanitizedId);

        return { 
          report,
          httpStatus: 200
        };
      } catch (error) {
        throw new GraphQLError('Erreur lors de la récupération du rapport', {
          extensions: {
            code: 'INTERNAL_SERVER_ERROR',
            httpStatus: 500,
            originalError: error.message
          }
        });
      }
        return result.rows[0] || null;
    },

    /**
     * Recherche des rapports par ID avec pagination
     * * 🔓 Route publique
     * @param {string} id_report - ID (partiel) du rapport à rechercher
     * @param {number} limit - Limite de résultats (max 100)
     * @param {number} offset - Décalage pour pagination
     * @returns {object} { reports, totalCount, hasNextPage }
     * @throws {GraphQLError} Si l'utilisateur n'a pas les droits (401 ou 403)  
     * @throws {GraphQLError} Si une erreur se produit lors de la recherche des rapports (500)
     */
    searchReportsByUser: async (_, args, context) => {
      try {
        // Vérification des droits d'accès
         requireAuth(context);

        const currentUserId = context?.user?.id ?? context?.user?.id_user ?? null;
        const isAdminFlag =
          Boolean(context && (context.isAdmin || context.user?.isAdmin || context.user?.role === 'admin'));
        if (!currentUserId) {
          throw new GraphQLError('Utilisateur non authentifié', {
            extensions: { code: 'UNAUTHENTICATED', httpStatus: 401 }
          });
        }
        // Extraction et validation des paramètres de pagination et de tri
        const { limit = 50, offset = 0, order = 'created_at', direction = 'DESC', userId } = args;

        // Sanitize inputs
        const cleanLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 100);
        const cleanOffset = Math.max(parseInt(offset) || 0, 0);
        const validOrders = ['created_at', 'reason', 'details', 'updated_at'];
        const { order: safeOrder, direction: safeDirection } = validateOrderParams(
          sanitizeString(order),
          sanitizeString(direction),
          validOrders
        );
        const cleanUserId = sanitizeString(userId || '');

        requireOwnershipOrAdmin(cleanUserId, context);

        const result = await db.query(`
          SELECT id_report, id_user, report_type, reported_id, reason, status, details, created_at, updated_at
          FROM reports
          WHERE id_user = $1
          OR reported_id = $1
          ORDER BY ${safeOrder} ${safeDirection}
          LIMIT $2 OFFSET $3
        `, [cleanUserId, cleanLimit, cleanOffset]);

        const countResult = await db.query('SELECT COUNT(*)::int as count FROM reports WHERE id_user = $1 OR reported_id = $1', [cleanUserId]);
        const totalCount = countResult.rows[0].count;

        return {
          reports: result.rows,
          totalCount,
          hasNextPage: cleanOffset + cleanLimit < totalCount,
          httpStatus: 200
        };
      } catch (error) {
        throw new GraphQLError('Erreur lors de la recherche des rapports de l\'utilisateur', {
          extensions: {
            code: 'INTERNAL_SERVER_ERROR',
            httpStatus: 500,
            originalError: error.message
          }
        });
      }
    },

    /**
     * Recherche des rapports par statut 
     * * 🔓 Route publique
     * @param {string} id_report - ID (partiel) du rapport à rechercher
     * @param {number} limit - Limite de résultats (max 100)
     * @param {number} offset - Décalage pour pagination
     * @returns {object} { reports, totalCount, hasNextPage }
     * @throws {GraphQLError} Si l'utilisateur n'a pas les droits (401 ou 403)  
     * @throws {GraphQLError} Si une erreur se produit lors de la recherche des rapports (500)
     */
    searchReportsByStatus: async (_, args, context) => {
      try {
        // Vérification des droits d'accès
         requireAdmin(context);

        // Extraction et validation des paramètres de pagination et de tri
        const { limit = 50, offset = 0, order = 'created_at', direction = 'DESC', status } = args;
        const validStatuses = ['pending', 'reviewed', 'resolved'];

        if (status && !validStatuses.includes(status)) {
          throw new GraphQLError('Statut invalide', {
            extensions: { code: 'BAD_USER_INPUT', httpStatus: 400 }
          });
        }
        // Sanitize inputs
        const cleanLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 100);
        const cleanOffset = Math.max(parseInt(offset) || 0, 0);
        const validOrders = ['created_at', 'status', 'updated_at'];
        const { order: safeOrder, direction: safeDirection } = validateOrderParams(
          sanitizeString(order),
          sanitizeString(direction),
          validOrders
        );
        const cleanStatus = sanitizeString(status || '');

        const queryParams = [cleanLimit, cleanOffset];
        let whereClause = '';
        if (cleanStatus) {
          whereClause = 'WHERE status = $3';
          queryParams.push(cleanStatus);
        }
        const result = await db.query(`
          SELECT * FROM reports
          ${whereClause}
          ORDER BY ${safeOrder} ${safeDirection}
          LIMIT $1 OFFSET $2
        `, queryParams);
        const countQuery = `
          SELECT COUNT(*)::int as count FROM reports
          ${whereClause}
        `;
        const countResult = await db.query(countQuery, cleanStatus ? [cleanStatus] : []);
        return {
          reports: result.rows,
          totalCount: countResult.rows[0].count,
          hasNextPage: cleanOffset + cleanLimit < countResult.rows[0].count,
          httpStatus: 200
        };
      } catch (error) {
        throw new GraphQLError('Erreur lors de la recherche des rapports par statut', {
          extensions: {   
            code: 'INTERNAL_SERVER_ERROR',
            httpStatus: 500,
            originalError: error.message
          }
        });
      }
    },

    /**
     * Recherche des rapports par contenu (raison, détails) avec pagination
     * * 🔓 Route publique
     * @param {string} content - Contenu à rechercher
     * @param {number} limit - Limite de résultats (max 100)
     * @param {number} offset - Décalage pour pagination
     * @returns {object} { reports, totalCount, hasNextPage }
     * @throws {GraphQLError} Si l'utilisateur n'a pas les droits (401 ou 403)
     * @throws {GraphQLError} Si une erreur se produit lors de la recherche des rapports (500)
     */
    searchReportsByContent: async (_, args, context) => {
      try {
        // Vérification des droits d'accès
         requireAuth(context);

        // Extraction et validation des paramètres de pagination et de tri
        const { limit = 50, offset = 0, order = 'created_at', direction = 'DESC', content } = args;

        
        // Sanitize input
        const cleanLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 100);
        const cleanOffset = Math.max(parseInt(offset) || 0, 0);
        const validOrders = ['created_at', 'permission_name', 'updated_at'];
        const { order: safeOrder, direction: safeDirection } = validateOrderParams(
          sanitizeString(order), 
          sanitizeString(direction), 
          validOrders
        );
        const cleanContent = sanitizeString(content || '');

        if (!cleanContent) {
          throw new GraphQLError('Contenu de recherche manquant', {
            extensions: { code: 'BAD_USER_INPUT', httpStatus: 400 }
          });
        }

        const searchPattern = `%${cleanContent}%`;
        
        const result = await db.query(`
          SELECT id_report, id_user, report_type, reported_id, reason, status, details, created_at, updated_at FROM reports
          WHERE LOWER(reason) LIKE LOWER($1) OR LOWER(details) LIKE LOWER($1)
          ORDER BY created_at DESC
          LIMIT $2 OFFSET $3
        `, [searchPattern, cleanLimit, cleanOffset]);
        
        const countResult = await db.query(`
          SELECT COUNT(*)::int as count FROM reports
          WHERE LOWER(reason) LIKE LOWER($1) OR LOWER(details) LIKE LOWER($1)
        `, [searchPattern]);
        
        return {
          reports: result.rows,
          totalCount: countResult.rows[0].count,
          hasNextPage: cleanOffset + cleanLimit < countResult.rows[0].count,
          httpStatus: 200
        };
      } catch (error) {
        if (error instanceof GraphQLError) throw error;
        throw new GraphQLError('Erreur lors de la recherche des rapports', {
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
     * Ajoute une nouveau rapport
     * * 🔓 Route publique
     * @param {object} input - Données du rapport
     * @param {string} input.idUser - ID de l'utilisateur qui signale
     * @param {string} input.reportType - Type de rapport
     * @param {string} input.reportedId - ID de l'utilisateur signalé
     * @param {string} input.reason - Raison du rapport
     * @param {string} input.details - Détails du rapport
     * @returns {object} Le rapport créé
     * @throws {GraphQLError} Si l'utilisateur n'a pas les droits (401 ou 403)
     * @throws {GraphQLError} Si une erreur se produit lors de la création du rapport (500)
     */
    addReport: async (_, { input }) => {
      try {

        // Vérification des droits d'accès
        requireAuth(context);

        const currentUserId = context?.user?.id ?? context?.user?.id_user ?? null;
        if (!currentUserId) {
          throw new GraphQLError('Utilisateur non authentifié', {
            extensions: { code: 'UNAUTHENTICATED', httpStatus: 401 }
          });
        }

        if (currentUserId !== input.idUser) {
          throw new GraphQLError('Vous ne pouvez pas créer un rapport pour un autre utilisateur', {
            extensions: { code: 'FORBIDDEN', httpStatus: 403 }
          });
        }

        // Validation des données d'entrée
        validateReportInput(input);

        // Sanitize inputs
        input.idUser = sanitizeString(input.idUser);
        input.reportType = sanitizeString(input.reportType);
        input.reportedId = sanitizeString(input.reportedId);
        input.reason = sanitizeString(input.reason);
        input.details = input.details ? sanitizeInput(input.details) : null;


        const id = uuidv4();
        const result = await db.query(`
          INSERT INTO reports (id_report, id_user, report_type, reported_id, reason, details, status)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING id_report, id_user, report_type, reported_id, reason, status, details, created_at, updated_at
        `, [
          id,
          input.idUser,
          input.reportType,
          input.reportedId,
          input.reason,
          'pending',
          input.details || null
        ]);
        return {
          report: result.rows[0],
          httpStatus: 201
        };
      } catch (error) {
        if (error instanceof GraphQLError) throw error;
        throw new GraphQLError('Erreur lors de la création du rapport', {
          extensions: { 
            code: 'INTERNAL_SERVER_ERROR',
            httpStatus: 500,
            originalError: error.message
          },
        });
      }
    },

    /**
     * Met à jour un rapport existant
     * * 🔓 Route publique
     * @param {object} input - Données du rapport
     * @param {string} input.idUser - ID de l'utilisateur qui signale
     * @param {string} input.reportType - Type de rapport
     * @param {string} input.reportedId - ID de l'utilisateur signalé
     * @param {string} input.reason - Raison du rapport
     * @param {string} input.details - Détails du rapport
     * @returns {object} Le rapport créé
     * @throws {GraphQLError} Si l'utilisateur n'a pas les droits (401 ou 403)
     * @throws {GraphQLError} Si une erreur se produit lors de la création du rapport (500)
     */
    updateReport: async (_, { input }) => {
      try {
        // Vérification des droits d'accès
        requireAuth(context);

        const currentUserId = context?.user?.id ?? context?.user?.id_user ?? null;
        if (!currentUserId) {
          throw new GraphQLError('Utilisateur non authentifié', {
            extensions: { code: 'UNAUTHENTICATED', httpStatus: 401 }
          });
        }

        if (currentUserId !== input.idUser) {
          throw new GraphQLError('Vous ne pouvez pas mettre à jour un rapport pour un autre utilisateur', {
            extensions: { code: 'FORBIDDEN', httpStatus: 403 }
          });
        }
        // Validation des données d'entrée
        validateReportInput(input); 

        // Sanitize inputs
        const cleanIdReport = sanitizeString(input.idReport);
        const cleanStatus = sanitizeString(input.status);
        const cleanReportType = sanitizeString(input.reportType);
        const cleanDetails = sanitizeInput(input.details);

        if (!cleanIdReport) {
          throw new GraphQLError('ID de rapport invalide', {
            extensions: { code: 'BAD_USER_INPUT', httpStatus: 400 }
          });
        }

        if (!cleanStatus) {
          throw new GraphQLError('Statut de rapport invalide', {
            extensions: { code: 'BAD_USER_INPUT', httpStatus: 400 }
          });
        }

        if (!cleanReportType) {
          throw new GraphQLError('Type de rapport invalide', {
            extensions: { code: 'BAD_USER_INPUT', httpStatus: 400 }
          });
        }

        if (input.details !== undefined || cleanDetails === null) {
          throw new GraphQLError('Détails de rapport invalides', {
            extensions: { code: 'BAD_USER_INPUT', httpStatus: 400 }
          });
        }


        // Construction dynamique de la requête UPDATE
        const updates = [];
        const values = [];
        let paramIndex = 1;

        if (input.status !== undefined) {
          updates.push(`status = ${paramIndex++}`);
          values.push(input.status);
        }

        if (input.details !== undefined) {
          updates.push(`details = ${paramIndex++}`);
          values.push(input.details);
        }

        if (input.reportType !== undefined) {
          updates.push(`report_type = ${paramIndex++}`);
          values.push(input.reportType);
        }

        if (updates.length === 0) {
          throw new Error('No fields to update');
        }

        values.push(input.idReport);

        const result = await db.query(`
          UPDATE reports
          SET ${updates.join(', ')}
          WHERE id_report = ${paramIndex}
          RETURNING id_report, id_user, report_type, reported_id, reason, status, details, created_at, updated_at
        `, values);

        if (result.rows.length === 0) {
          throw new Error('Report not found');
        }

        return {
          ...result.rows[0],
          httpStatus: 200
        };

      } catch (error) {
        if (error instanceof GraphQLError) throw error;
        throw new GraphQLError("Erreur lors de la modification du rapport", {
          extensions: { 
            code: 'INTERNAL_SERVER_ERROR',
            httpStatus: 500,
            originalError: error.message
          },
        });
      }
    },

    /**
     * Supprime un rapport existant
     * * 🔓 Route publique
     * @param {object} input - Données du rapport
     * @param {string} input.idUser - ID de l'utilisateur qui signale
     * @param {string} input.reportType - Type de rapport
     * @param {string} input.reportedId - ID de l'utilisateur signalé
     * @param {string} input.reason - Raison du rapport
     * @param {string} input.details - Détails du rapport
     * @returns {object} Le rapport créé
     * @throws {GraphQLError} Si l'utilisateur n'a pas les droits (401 ou 403)
     * @throws {GraphQLError} Si une erreur se produit lors de la suppression du rapport (500)
     */
    deleteReport: async (_, { input }) => {
      try {

        // Vérification des droits d'accès
        requireAuth(context);

        // Sanitize input
        const cleanIdReport = sanitizeString(input.idReport);

        if (!cleanIdReport) {
          throw new GraphQLError('ID de rapport invalide', {
            extensions: { code: 'BAD_USER_INPUT', httpStatus: 400 }
          });
        }

        //Vérification de l'existence du rapport
        const report = await findReportOrThrow(cleanIdReport);

        // Suppression du rapport
        const result = await db.query(
          'DELETE FROM reports WHERE id_report = $1 RETURNING id_report',
          [cleanIdReport]
        );
        return {
          success: result.rows.length > 0,
          httpStatus: 200
        };
      } catch (error) {
        if (error instanceof GraphQLError) throw error;
        throw new GraphQLError("Erreur lors de la suppression du rapport", {
          extensions: { 
            code: 'INTERNAL_SERVER_ERROR',
            httpStatus: 500,
            originalError: error.message
          },
        });
      }
    },
  },

  Report: {
    whistleblower: async (parent) => {
      return fetchUserById(parent.id_user);
    },

    reported: async (parent) => {
      return fetchUserById(parent.reported_id);
    },
  },
};