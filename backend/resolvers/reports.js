import db from "../db/connect_DB.js";
import { v4 as uuidv4 } from "uuid";
import { validateOrderParams, handleDbError } from '../utils/validators.js';
import sanitizeHtml from 'sanitize-html';
import { GraphQLError } from 'graphql';

import { isAuthenticated, requireAuth, requireAdmin, requireOwnershipOrAdmin, sanitizeInput, flattenEdges, makePageInfo, makeEdgeFromBook, withErrorHandling } from './utils/helpers/helpers_general.js';

import { findBy1ParameterOrThrow, generalSortingSchema} from './utils/helper.js';



// Importer les helpers généralistes
import { withSecureResolver } from './utils/helpers/helpers_general.js';
// Importer les helpers spécifiques

// Importer les schemas Joi spécifiques
import { generalReportSchema, generalOrderReportSchema, searchReportsByUserSchema, searchReportsByStatusSchema, searchReportsByDetailsOrReasonSchema, searchReportsSchema} from '../schema/schemas_joi/reportSchema.js';

// Importer les wrappers et helpers de sécurité
import { sanitizeStrict} from './utils/helpers/helpers_securite.js';

const toDateString = (v) => {
  if (!v) return null;
  if (v instanceof Date) return v.toISOString().split('T')[0];
  if (typeof v === 'string') return v.split('T')[0];
  return null;
};

/**
 * Mappe les enums GraphQL ReportType vers les ID de categoryOfReport
 */
const mapReportTypeToId = (reportType) => {
  const mapping = {
    'USER': 1,
    'REVIEW': 2,
    'MESSAGE': 3,
    'OTHER': 4
  };
  return mapping[reportType] || null;
};

/**
 * Mappe les descriptions textuelles de raison vers les ID de reaseonOfReport
 * Pour simplifier, on va chercher dans la base ou utiliser un mapping par défaut
 */
const mapReasonToId = async (reasonText) => {
  // Mapping des raisons courantes
  const commonMappings = {
    'Spam ou publicité non sollicitée': 3,
    'Contenu inapproprié ou offensant': 2,
    'Harcèlement ou insultes': 1,
    'Violation de droits d\'auteur': 10,
    'Autre raison': 11
  };

  // Si c'est une raison connue, retourner l'ID
  if (commonMappings[reasonText]) {
    return commonMappings[reasonText];
  }

  // Sinon, chercher dans la base par nom
  try {
    const result = await db.query(
      'SELECT id_reason FROM reaseonOfReport WHERE reason_name ILIKE $1 LIMIT 1',
      [reasonText]
    );
    if (result.rows.length > 0) {
      return result.rows[0].id_reason;
    }
  } catch (err) {
    console.error('Erreur lors de la recherche de raison:', err);
  }

  // Par défaut, retourner "Autre"
  return 11;
};

/**
 * Transforme un rapport brut de la BD en remplaçant les IDs par les noms
 * @param {object} report - Rapport de la BD
 * @returns {object} Rapport transformé avec noms au lieu d'IDs
 */
const transformReportData = async (report) => {
  if (!report) return null;

  // Si les noms ne sont pas chargés, faire les requêtes
  let reportTypeName = report.report_type_name;
  let reasonName = report.reason_name;

  if (!reportTypeName && report.report_type) {
    const typeResult = await db.query(
      'SELECT name FROM categoryOfReport WHERE id_category = $1',
      [report.report_type]
    );
    reportTypeName = typeResult.rows[0]?.name || report.report_type;
  }

  if (!reasonName && report.reason) {
    const reasonResult = await db.query(
      'SELECT name FROM reaseonOfReport WHERE id_reason = $1',
      [report.reason]
    );
    reasonName = reasonResult.rows[0]?.name || report.reason;
  }

  return {
    id_report: report.id_report,
    id_user: report.id_user,
    report_type: reportTypeName || report.report_type,
    reported_id: report.reported_id,
    reason: reasonName || report.reason,
    status: report.status,
    details: report.details,
    created_at: toDateString(report.created_at),
    updated_at: toDateString(report.updated_at)
  };
};



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
    getReports: withSecureResolver(
      async (_, { validated }, context) => {
        /* exemple context JWT décodé ( à revoir):
        {
          userId: "uuid-of-user",
          email: "user@example.com",
          role: "admin"
        }
        */
        /*exemple de requête :
        query {getReports{reports{id_report, id_user, report_type, reported_id, reason, status, details, created_at, updated_at}}}
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
        // const cleanLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 100);
        // const cleanOffset = Math.max(parseInt(offset) || 0, 0);
        const validOrders = ['id_report', 'id_user', 'report_type', 'reported_id', 'reason', 'status', 'created_at', 'updated_at'];
        const { order: safeOrder, direction: safeDirection } = validateOrderParams(
          sanitizeStrict(order), 
          sanitizeStrict(direction), 
          validOrders
        );
        // ========================================
        // REQUETES BASE DE DONNEES
        // ======================================== 
        const result = await db.query(`
          SELECT 
            r.id_report, 
            r.id_user, 
            r.report_type,
            c.name AS report_type_name,
            r.reported_id, 
            r.reason,
            ro.name AS reason_name,
            r.status, 
            r.details, 
            r.created_at, 
            r.updated_at
          FROM reports r
          LEFT JOIN categoryOfReport c ON r.report_type = c.id_category
          LEFT JOIN reaseonOfReport ro ON r.reason = ro.id_reason
          ORDER BY ${safeOrder} ${safeDirection}
          LIMIT $1 OFFSET $2
        `, [limit, offset]);
        
        const countResult = await db.query('SELECT COUNT(*)::int as count FROM reports');
        const totalCount = countResult.rows[0].count;
        // ========================================
        // DONNEES RECUPEREES
        // ======================================== 
        //console.log('Fetched reports:', result.rows);

        const reports = result.rows.map(report => ({
          id_report: report.id_report,
          id_user: report.id_user,
          report_type: report.report_type_name || report.report_type, // Utiliser le nom, sinon l'ID
          reported_id: report.reported_id,
          reason: report.reason_name || report.reason, // Utiliser le nom, sinon l'ID
          status: report.status,
          details: report.details,
          created_at: toDateString(report.created_at),
          updated_at: toDateString(report.updated_at)
        }));

        return {
          reports,
          totalCount,
          hasNextPage: offset + limit < totalCount,
          httpStatus: 200
        };
    
      },
      {
        sortingSchema: generalSortingSchema,
        orderSchema: generalOrderReportSchema,
        logAction: 'GET_ALL_REPORTS',
        requiresAuth: true,
        errorMessage: 'Erreur lors de la récupération des rapports'
      }
    ),
    
    /**
     * Récupère une permission par son ID
     * * 🔓 Route publique
     * @param {string} id_permission - ID de la permission
     * @returns {object|null} Permission ou null si non trouvée
     * @throws {GraphQLError} Si l'utilisateur n'a pas les droits (401 ou 403)  
     * @throws {GraphQLError} Si une erreur se produit lors de la récupération de la permission (500)
     */
    getReport: withSecureResolver(
      async (_, { id_report, validated }, context) => {
        /* exemple context JWT décodé ( à revoir):
        {
          userId: "uuid-of-user",
          email: "user@example.com",
          role: "admin"
        }
        */
        /*exemple de requête :
        query  getReport($id_report: ID!) {getReport(id_report: $id_report) {id_report, id_user, report_type, reported_id, reason, status, details, created_at, updated_at}}

        */
        /* Exemple variables :
        {"id_report": "4f9a1c2e-7b5d-4a9f-8c2e-0b3a1d2c5e6f"}
        */

        // ========================================
        // RECUPERER LES DONNEES NESSESAIRES
        // ======================================== 
        // Sanitize input
        const sanitizedId = sanitizeStrict(id_report);

        if (!sanitizedId) {
          throw new GraphQLError('ID du rapport manquant', {
            extensions: { code: 'BAD_USER_INPUT', httpStatus: 400 }
          });
        }
        // ========================================
        // REQUETES BASE DE DONNEES
        // ======================================== 
        const report = await findBy1ParameterOrThrow('reports', 'id_report', sanitizedId, 'Rapport non trouvé');
        const transformedReport = await transformReportData(report.data);
        // ========================================
        // DONNEES RECUPEREES
        // ========================================        
        if (context?.res?.status) context.res.status(200);
        return transformedReport;
      },
      {
        logAction: 'GET_ONE_REPORT',
        requiresAuth: true,
        errorMessage: 'Erreur lors de la récupération du rapport'
      }
    ),

    /**
     * Récupère les signalements de l'utilisateur connecté
     * 🔒 Route protégée (utilisateur authentifié)
     * @param {number} limit - Limite de résultats (par défaut 20)
     * @param {number} offset - Décalage pour pagination (par défaut 0)
     * @returns {object} { reports, totalCount, hasNextPage, httpStatus }
     * @throws {GraphQLError} Si l'utilisateur n'est pas authentifié (401)
     * @throws {GraphQLError} Si une erreur se produit lors de la récupération (500)
     */
    getMyReports: withSecureResolver(
      async (_, { limit, offset }, context) => {
        const id_user = context?.user?.id_user;

        if (!id_user) {
          throw new GraphQLError('Utilisateur non authentifié', {
            extensions: { code: 'UNAUTHENTICATED', httpStatus: 401 }
          });
        }

        // Valider les paramètres de pagination
        const validLimit = Math.min(limit || 20, 100);
        const validOffset = offset || 0;

        try {
          // Compter le nombre total de signalements de l'utilisateur
          const countResult = await db.query(
            'SELECT COUNT(*)::int AS total FROM reports WHERE id_user = $1',
            [id_user]
          );
          const totalCount = countResult.rows[0]?.total || 0;

          // Récupérer les signalements avec pagination
          const result = await db.query(
            `SELECT 
              r.id_report, 
              r.id_user, 
              r.report_type,
              c.name AS report_type_name,
              r.reported_id, 
              r.reason,
              ro.name AS reason_name,
              r.status, 
              r.details, 
              r.created_at, 
              r.updated_at
             FROM reports r
             LEFT JOIN categoryOfReport c ON r.report_type = c.id_category
             LEFT JOIN reaseonOfReport ro ON r.reason = ro.id_reason
             WHERE r.id_user = $1
             ORDER BY r.created_at DESC
             LIMIT $2 OFFSET $3`,
            [id_user, validLimit, validOffset]
          );

          const reports = result.rows.map(row => ({
            id_report: row.id_report,
            id_user: row.id_user,
            report_type: row.report_type_name || row.report_type,
            reported_id: row.reported_id,
            reason: row.reason_name || row.reason,
            details: row.details,
            status: row.status,
            created_at: toDateString(row.created_at),
            updated_at: toDateString(row.updated_at)
          }));

          const hasNextPage = validOffset + validLimit < totalCount;

          if (context?.res?.status) context.res.status(200);
          return {
            reports,
            totalCount,
            hasNextPage,
            httpStatus: 200
          };
        } catch (error) {
          console.error('Erreur lors de la récupération des signalements:', error);
          throw new GraphQLError('Erreur lors de la récupération des signalements', {
            extensions: { code: 'INTERNAL_SERVER_ERROR', httpStatus: 500 }
          });
        }
      },
      {
        logAction: 'GET_MY_REPORTS',
        requiresAuth: true,
        errorMessage: 'Erreur lors de la récupération de vos signalements'
      }
    ),
    
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
    searchReportsByUser: withSecureResolver(
      async (_, { validated }, context) => {
        /* exemple context JWT décodé ( à revoir):
        {
          userId: "uuid-of-user",
          email: "user@example.com",
          role: "admin"
        }
        */
        /*exemple de requête :
        query searchReportsByUser($id_user: ID!) {searchReportsByUser(id_user: $id_user) {reports{id_report, id_user, report_type, reported_id, reason, status, details, created_at, updated_at}}}

        */
        /* Exemple variables :
        {"id_user": "1e2d3c4b-5a6f-7e8d-9c0b-1a2f3e4d5c6b"}
        */
        // ========================================
        // RECUPERER LES DONNEES NESSESAIRES
        // ======================================== 
        const { id_user, limit = 50, offset = 0, direction = 'ASC', order = 'created_at' } = validated;
        const cleanUserId = sanitizeStrict(id_user || '');
        
        const currentUserId = context?.user?.id ?? context?.user?.id_user ?? null;
        const isAdminFlag =
          Boolean(context && (context.isAdmin || context.user?.isAdmin || context.user?.role === 'glossaire'));
        if (!currentUserId) {
          throw new GraphQLError('Utilisateur non authentifié', {
            extensions: { code: 'UNAUTHENTICATED', httpStatus: 401 }
          });
        }
        // si reported_id correspond à l'id_user du "context" il n'est pas affiché (l'utilisateur ne peut pas voir les rapports le concernant même s'il est admin)
        if (context.user.id_user === report.reported_id) {
          report.hidden = true;
        }


        // Sanitize inputs
        // const cleanLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 100);
        // const cleanOffset = Math.max(parseInt(offset) || 0, 0);
        const validOrders = ['id_report', 'id_user', 'report_type', 'reported_id', 'reason', 'status', 'created_at', 'updated_at'];
        const { order: safeOrder, direction: safeDirection } = validateOrderParams(
          sanitizeStrict(order),
          sanitizeStrict(direction),
          validOrders
        );

        // ========================================
        // REQUETES BASE DE DONNEES
        // ======================================== 
        const result = await db.query(`
          SELECT id_report, id_user, report_type, reported_id, reason, status, details, created_at, updated_at
          FROM reports
          WHERE id_user = $1
          OR reported_id = $1
          ORDER BY ${safeOrder} ${safeDirection}
          LIMIT $2 OFFSET $3
        `, [cleanUserId, limit, offset]);

        const countResult = await db.query('SELECT COUNT(*)::int as count FROM reports WHERE id_user = $1 OR reported_id = $1', [cleanUserId]);
        const totalCount = countResult.rows[0].count;
        // ========================================
        // DONNEES RECUPEREES
        // ========================================                
        return {
          reports: result.rows,
          totalCount,
          hasNextPage: cleanOffset + cleanLimit < totalCount,
          httpStatus: 200
        };
      },
      {
        sortingSchema: generalSortingSchema,
        orderSchema: generalOrderReportSchema,
        inputSchema: searchReportsByUserSchema,
        logAction: 'SEARCH_REPORTS',
        requiresAuth: true,
        errorMessage: 'Erreur lors de la recherche de rapports'
      }
    ),
    
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
    searchReportsByStatus: withSecureResolver(
      async (_, { validated }, context) => {
        /* exemple context JWT décodé ( à revoir):
        {
          userId: "uuid-of-user",
          email: "user@example.com",
          role: "admin"
        }
        */
        /*exemple de requête :
        query searchReportsByStatus($status: String!) {searchReportsByStatus(status: $status) {reports{id_report, id_user, report_type, reported_id, reason, status, details, created_at, updated_at}}}

        */
        /* Exemple variables :
        {"status": "pending"}
        */
        // ========================================
        // RECUPERER LES DONNEES NESSESAIRES
        // ======================================== 
        // Vérification des droits d'accès
         requireOwnershipOrAdmin(cleanUserId, context);

        // Extraction et validation des paramètres de pagination et de tri
        const { limit = 50, offset = 0, order = 'created_at', direction = 'DESC', status } = validated;
        const validStatuses = ['id_report', 'id_user', 'report_type', 'reported_id', 'reason', 'status', 'created_at', 'updated_at'];

        if (status && !validStatuses.includes(status)) {
          throw new GraphQLError('Statut invalide', {
            extensions: { code: 'BAD_USER_INPUT', httpStatus: 400 }
          });
        }
        // Sanitize inputs
        // const cleanLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 100);
        // const cleanOffset = Math.max(parseInt(offset) || 0, 0);
        const validOrders = ['created_at', 'status', 'updated_at'];
        const { order: safeOrder, direction: safeDirection } = validateOrderParams(
          sanitizeStrict(order),
          sanitizeStrict(direction),
          validOrders
        );
        const cleanStatus = sanitizeStrict(status || '');

        // Build and run queries with correct parameter bindings depending on presence of status
        let result, countResult;
        if (cleanStatus) {
          // status provided -> bind status as $1, limit as $2, offset as $3
          const params = [cleanStatus, cleanLimit, cleanOffset];

        // ========================================
        // REQUETES BASE DE DONNEES
        // ======================================== 
          result = await db.query(`
            SELECT * FROM reports
            WHERE status = $1
            ORDER BY ${safeOrder} ${safeDirection}
            LIMIT $2 OFFSET $3
          `, params);

          const countQ = `SELECT COUNT(*)::int as count FROM reports WHERE status = $1`;
          countResult = await db.query(countQ, [cleanStatus]);
        } else {
          // no status -> only limit/offset
          result = await db.query(`
            SELECT * FROM reports
            ORDER BY ${safeOrder} ${safeDirection}
            LIMIT $1 OFFSET $2
          `, [cleanLimit, cleanOffset]);

          countResultTotal = await db.query('SELECT COUNT(*)::int as count FROM reports');
        }
        // ========================================
        // DONNEES RECUPEREES
        // ========================================                
        
        if (context?.res?.status) context.res.status(200);
        return {
          reports: result.rows,
          totalCount: countResult.rows[0].count,
          hasNextPage: cleanOffset + cleanLimit < countResult.rows[0].count,
          httpStatus: 200
        };
      },
      {
        sortingSchema: generalSortingSchema,
        orderSchema: generalOrderReportSchema,
        inputSchema: searchReportsByStatusSchema,
        logAction: 'SEARCH_REPORTS',
        requiresAuth: true,
        errorMessage: 'Erreur lors de la recherche de rapports'
      }
    ),
    
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
    searchReportsByDetailsOrReason: withSecureResolver(
      async (_, { validated }, context) => {
        /* exemple context JWT décodé ( à revoir):
        {
          userId: "uuid-of-user",
          email: "user@example.com",
          role: "admin"
        }
        */
        /*exemple de requête :
        query searchReportsByDetailsOrReason($content: String!) {searchReportsByDetailsOrReason(content: $content) {reports{id_report, id_user, report_type, reported_id, reason, status, details, created_at, updated_at}}}

        */
        /* Exemple variables :
        {"content": "et"}
        */
        // ========================================
        // RECUPERER LES DONNEES NESSESAIRES
        // ======================================== 
        // Extraction et validation des paramètres de pagination et de tri
        const { limit = 50, offset = 0, order = 'created_at', direction = 'DESC', content } = args;

        // Sanitize input
        // const cleanLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 100);
        // const cleanOffset = Math.max(parseInt(offset) || 0, 0);
        const validOrders = ['created_at', 'reason', 'status', 'updated_at'];
        const { order: safeOrder, direction: safeDirection } = validateOrderParams(
          sanitizeStrict(order), 
          sanitizeStrict(direction), 
          validOrders
        );
        const cleanContent = sanitizeStrict(content || '');

        if (!cleanContent) {
          throw new GraphQLError('Contenu de recherche manquant', {
            extensions: { code: 'BAD_USER_INPUT', httpStatus: 400 }
          });
        }

        const searchPattern = `%${cleanContent}%`;
        // ========================================
        // REQUETES BASE DE DONNEES
        // ======================================== 
        const result = await db.query(`
          SELECT id_report, id_user, report_type, reported_id, reason, status, details, created_at, updated_at 
          FROM reports
          WHERE LOWER(reason) LIKE LOWER($1) OR LOWER(details) LIKE LOWER($1)
          ORDER BY ${safeOrder} ${safeDirection}
          LIMIT $2 OFFSET $3
        `, [searchPattern, cleanLimit, cleanOffset]);
        
        const countResult = await db.query(`
          SELECT COUNT(*)::int as count FROM reports
          WHERE LOWER(reason) LIKE LOWER($1) OR LOWER(details) LIKE LOWER($1)
        `, [searchPattern]);
        // ========================================
        // DONNEES RECUPEREES
        // ========================================                
        return {
          reports: result.rows,
          totalCount: countResult.rows[0].count,
          hasNextPage: cleanOffset + cleanLimit < countResult.rows[0].count,
          httpStatus: 200
        };
    
      },
      {
        sortingSchema: generalSortingSchema,
        orderSchema: generalOrderReportSchema,
        inputSchema: searchReportsByDetailsOrReasonSchema,
        logAction: 'SEARCH_REPORTS',
        requiresAuth: true,
        errorMessage: 'Erreur lors de la recherche de rapports'
      }
    ),
    
    /**
     * Recherche des rapports avec filtres multiples et pagination
     * 🔓 Route publique
     * @param {string} content - Contenu à rechercher
     * @param {number} limit - Limite de résultats (max 100)
     * @param {number} offset - Décalage pour pagination
     * @returns {object} { reports, totalCount, hasNextPage }
     * @throws {GraphQLError} Si l'utilisateur n'a pas les droits (401 ou 403)
     * @throws {GraphQLError} Si une erreur se produit lors de la recherche des rapports (500)
     */
    searchReports: withSecureResolver(
      async (_, { validated }, context) => {
        /* exemple context JWT décodé ( à revoir):
        {
          userId: "uuid-of-user",
          email: "user@example.com",
          role: "admin"
        }
        */
        /*exemple de requête :
        query searchReports($id_user: ID, $status: String, $limit: Int, $offset: Int) {searchReports(id_user: $id_user, status: $status, limit: $limit, offset: $offset) {reports{id_report, id_user, report_type, reported_id, reason, status, details, created_at, updated_at}}}
        */
        /* Exemple variables :
        {
        "id_user": "1e2d3c4b-5a6f-7e8d-9c0b-1a2f3e4d5c6b",
        "status": "pending",
        "limit": 20,
        "offset": 0        
        }        
        */
        // ========================================
        // RECUPERER LES DONNEES NESSESAIRES
        // ======================================== 
        // Exemples de filtres acceptés : id_report, id_user, status, content
        const { limit = 50, offset = 0, order = 'created_at', direction = 'DESC', id_report, id_user, status, content } = validated;

        // Sanitize & validate
        const cleanLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 100);
        const cleanOffset = Math.max(parseInt(offset) || 0, 0);
        const validOrders = ['id_report', 'id_user', 'report_type', 'reported_id', 'reason', 'status', 'created_at', 'updated_at'];
        const { order: safeOrder, direction: safeDirection } = validateOrderParams(
          sanitizeStrict(order),
          sanitizeStrict(direction),
          validOrders
        );

        const cleanIdReport = sanitizeStrict(args.id_report || '');
        const cleanUserId = sanitizeStrict(args.id_user || '');
        const cleanStatus = sanitizeStrict(args.status || '');
        const cleanContent = sanitizeStrict(args.content || '');

        // Validate status if provided
        const validStatuses = ['PENDING', 'IN_REVIEW', 'RESOLVED', 'DISMISSED'];
        if (cleanStatus && !validStatuses.includes(cleanStatus)) {
          throw new GraphQLError('Statut invalide', { extensions: { code: 'BAD_USER_INPUT', httpStatus: 400 } });
        }

        // Build WHERE clause dynamically and parameters array
        const whereClauses = [];
        const params = [];
        let idx = 1;

        if (cleanIdReport) {
          whereClauses.push(`id_report = $${idx++}`);
          params.push(cleanIdReport);
        }

        if (cleanUserId) {
          whereClauses.push(`(id_user = $${idx} OR reported_id = $${idx})`);
          params.push(cleanUserId);
          idx++;
        }

        if (cleanStatus) {
          whereClauses.push(`status = $${idx++}`);
          params.push(cleanStatus);
        }

        if (cleanContent) {
          whereClauses.push(`(LOWER(reason) LIKE LOWER($${idx}) OR LOWER(details) LIKE LOWER($${idx}))`);
          params.push(`%${cleanContent}%`);
          idx++;
        }

        const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        // Add limit/offset as last parameters
        params.push(cleanLimit);
        params.push(cleanOffset);
        // ========================================
        // REQUETES BASE DE DONNEES
        // ======================================== 
        const query = `
          SELECT id_report, id_user, report_type, reported_id, reason, status, details, created_at, updated_at
          FROM reports
          ${whereSQL}
          ORDER BY ${safeOrder} ${safeDirection}
          LIMIT $${params.length - 1} OFFSET $${params.length}
        `;
 
        const result = await db.query(query, params);

        // Count query: reuse whereSQL but avoid limit/offset
        const countParams = params.slice(0, params.length - 2);
        const countQuery = `SELECT COUNT(*)::int as count FROM reports ${whereSQL}`;
        const countResult = countParams.length > 0 ? await db.query(countQuery, countParams) : await db.query(countQuery);
        // ========================================
        // DONNEES RECUPEREES
        // ========================================                
        if (context?.res?.status) context.res.status(200);
        const totalCount = countResult.rows[0].count;
        return {
          reports: result.rows,
          totalCount,
          hasNextPage: cleanOffset + cleanLimit < totalCount,
          httpStatus: 200
        };
    
      },
      {
        sortingSchema: generalSortingSchema,
        orderSchema: generalOrderReportSchema,
        inputSchema: searchReportsSchema,
        logAction: 'SEARCH_REPORTS',
        requiresAuth: true,
        errorMessage: 'Erreur lors de la recherche de rapports'
      }
    ),
  
    getMyPendingReportsCount: withSecureResolver(
      async (_, { validated }, context) => {
        const { id_user } = context.user;

        const result = await db.query(`
          SELECT COUNT(*)::int AS pending_count
          FROM reports
          WHERE id_user = $1 
            AND status NOT IN ('resolved', 'dismissed')
        `, [id_user]);

        return result.rows[0]?.pending_count || 0;
      },
      {
        logAction: 'GET_PENDING_REPORTS_COUNT',
        requiresAuth: true,
        errorMessage: 'Erreur lors du comptage des signalements en cours'
      }
    ),


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
    addReport: withSecureResolver(
      async (_, { input, validated }, context) => {
        /* exemple context JWT décodé ( à revoir):
        {
          userId: "uuid-of-user",
          email: "user@example.com",
          role: "admin"
        }
        */
        /*exemple de requête :
        mutation addReport($input: CreateReportInput!) { addReport(input: $input) {id_report, id_user, report_type, reported_id, reason, status, details, created_at, updated_at}}

        */
        /* Exemple variables :
        { "input": {
          "id_user": "1e2d3c4b-5a6f-7e8d-9c0b-1a2f3e4d5c6b"
          "report_type": "USER"
          "reported_id": "2e3d4c5b-6a7f-8e9d-0c1b-2a3f4e5d6c7b"
          "reason": "Inappropriate content"
          "details": "This comment contains offensive language."
          "status": "pending"
        }
        }
        */
        // ========================================
        // RECUPERER LES DONNEES NESSESAIRES
        // ======================================== 

        const currentUserId = context?.user?.id ?? context?.user?.id_user ?? null;
        if (!currentUserId) {
          throw new GraphQLError('Utilisateur non authentifié', {
            extensions: { code: 'UNAUTHENTICATED', httpStatus: 401 }
          });
        }

        // Utiliser automatiquement l'ID de l'utilisateur connecté si non fourni
        // ou vérifier que l'utilisateur ne crée pas de rapport au nom d'un autre
        const reportingUserId = input.id_user || currentUserId;
        
        if (input.id_user && currentUserId !== input.id_user && !context.isAdmin) {
          throw new GraphQLError('Vous ne pouvez pas créer un rapport pour un autre utilisateur', {
            extensions: { code: 'FORBIDDEN', httpStatus: 403 }
          });
        }

        // Mettre à jour input.id_user avant validation
        input.id_user = reportingUserId;

        // Mapper les enums GraphQL vers les ID de la base de données
        const reportTypeId = mapReportTypeToId(input.report_type);
        if (!reportTypeId) {
          throw new GraphQLError('Type de rapport invalide', {
            extensions: { code: 'BAD_REQUEST', httpStatus: 400 }
          });
        }

        const reasonId = await mapReasonToId(input.reason);

        // Validation des données d'entrée
        validateReportInput(input);

        // Sanitize inputs
        const cleanInput = {
          id_user: sanitizeStrict(reportingUserId),
          report_type: reportTypeId, // Utiliser l'ID mappé
          reported_id: input.reported_id ? sanitizeStrict(input.reported_id) : null,
          reason: reasonId, // Utiliser l'ID mappé
          details: input.details ? sanitizeStrict(input.details) : null,
          status: sanitizeStrict(input.status || 'pending')
        };

        // ========================================
        // REQUETES BASE DE DONNEES
        // ========================================         
        const id = uuidv4();
        const result = await db.query(`
          INSERT INTO reports (id_report, id_user, report_type, reported_id, reason, details, status)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *
        `, [
          id,
          cleanInput.id_user,
          cleanInput.report_type,
          cleanInput.reported_id,
          cleanInput.reason,
          cleanInput.details,
          cleanInput.status,
        ]);
        // ========================================
        // DONNEES RECUPEREES
        // ======================================== 
        
        if (context?.res?.status) context.res.status(200);
        return {
          ...result.rows[0],
          created_at: toDateString(result.rows[0].created_at),
          updated_at: toDateString(result.rows[0].updated_at)
        };
    
      },
      {
        logAction: 'ADD_BOOK_TO_LIBRARY',
        requiresAuth: true,
        errorMessage: 'Erreur lors de l\'ajout du livre'
      }
    ),
    
    /**
              if (context?.res?.status) context.res.status(201);
              return result.rows[0];
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
    updateReport: withSecureResolver(
      async (_, { input, validated }, context) => {
        /* exemple context JWT décodé ( à revoir):
        {
          userId: "uuid-of-user",
          email: "user@example.com",
          role: "admin"
        }
        */
        /*exemple de requête :
        mutation updateReport($input: UpdateReportInput!) { updateReport(input: $input) {reason, details }}

        */
        /* Exemple variables :
        { "input": 
        {
          "id_report": "4f9a1c2e-7b5d-4a9f-8c2e-0b3a1d2c5e6f",
          "details": "modification du nom du rapport",
        }
        }       
        */
        // ========================================
        // RECUPERER LES DONNEES NESSESAIRES
        // ======================================== 
        // Sanitize inputs
        const cleanIdReport = sanitizeStrict(input.id_report);

        if (!cleanIdReport) {
          throw new GraphQLError('ID de rapport invalide', {
            extensions: { code: 'BAD_USER_INPUT', httpStatus: 400 }
          });
        }

        // Vérifier que le rapport existe
        await findBy1ParameterOrThrow('reports', 'id_report', cleanIdReport, 'Rapport non trouvé');

        // Construction SÉCURISÉE de la requête UPDATE avec paramètres positionnels
        const updates = [];
        const values = [];
        let paramIndex = 1;

        if (input.status !== undefined) {
          const validStatuses = ['PENDING', 'IN_REVIEW', 'RESOLVED', 'DISMISSED'];
          
          const cleanStatus = sanitizeStrict(input.status);

      // ✅ Convertir le statut en minuscules pour correspondre à la contrainte DB
        const dbStatus = cleanStatus ? cleanStatus.toLowerCase() : cleanStatus;
          
          if (!validStatuses.includes(cleanStatus)) {
            throw new GraphQLError('Statut invalide', {
              extensions: { code: 'BAD_USER_INPUT', httpStatus: 400 }
            });
          }
        
          updates.push(`status = $${paramIndex++}`);
          values.push(dbStatus);
        }


        if (input.details !== undefined) {
          const cleanDetails = input.details ? sanitizeStrict(input.details) : null;
          updates.push(`details = $${paramIndex++}`);
          values.push(cleanDetails);
        }

        if (input.reportType !== undefined) {
          const validReportTypes = ['user', 'comment', 'book', 'review', 'message'];
          const cleanReportType = sanitizeStrict(input.reportType);
          
          if (!validReportTypes.includes(cleanReportType)) {
            throw new GraphQLError('Type de rapport invalide', {
              extensions: { code: 'BAD_USER_INPUT', httpStatus: 400 }
            });
          }
          
          updates.push(`report_type = $${paramIndex++}`);
          values.push(cleanReportType);
        }

        if (updates.length === 0) {
          throw new GraphQLError('Aucun champ à mettre à jour', {
            extensions: { code: 'BAD_USER_INPUT', httpStatus: 400 }
          });
        }

        // Ajouter updated_at
        updates.push(`updated_at = CURRENT_TIMESTAMP`);

        // Ajouter l'ID du rapport comme dernier paramètre
        values.push(cleanIdReport);
        // ========================================
        // REQUETES BASE DE DONNEES
        // ======================================== 

        const result = await db.query(`
          UPDATE reports
          SET ${updates.join(', ')}
          WHERE id_report = $${paramIndex}
          RETURNING id_report, id_user, report_type, reported_id, reason, status, details, created_at, updated_at
        `, values);
        // ========================================
        // DONNEES RECUPEREES
        // ========================================         
        if (result.rows.length === 0) {
          throw new GraphQLError('Rapport non trouvé', {
            extensions: { code: 'NOT_FOUND', httpStatus: 404 }
          });
        }

        if (context?.res?.status) context.res.status(201);

        const report = result.rows[0];
        return {
          id_report: report.id_report,
          report_type: report.report_type,
          reason: report.reason,
          details: report.details,
          status: report.status,
          created_at: toDateString(report.created_at),
          updated_at: toDateString(report.updated_at)
        };
      },
      {
        logAction: 'UPDATE_BOOK_IN_LIBRARY',
        requiresAuth: true,
        errorMessage: 'Erreur lors de la mise à jour'
      }
    ),
    
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
    deleteReport: withSecureResolver(
      async (_, { input, validated }, context) => {
        /* exemple context JWT décodé ( à revoir):
        {
          userId: "uuid-of-user",
          email: "user@example.com",
          role: "admin"
        }
        */
        /*exemple de requête :
            mutation deleteReport($input: DeleteReportInput!) { deleteReport(input: $input) }
        */
        /* Exemple variables :
        {"input": {"id_report":"4f9a1c2e-7b5d-4a9f-8c2e-0b3a1d2c5e6f"} }
        */
    
        // ========================================
        // RECUPERER LES DONNEES NESSESAIRES
        // ======================================== 
        // Sanitize input
        const cleanIdReport = sanitizeStrict(input.id_report);

        if (!cleanIdReport) {
          throw new GraphQLError('ID de rapport invalide', {
            extensions: { code: 'BAD_USER_INPUT', httpStatus: 400 }
          });
        }

        // Vérification de l'existence du rapport
        await findBy1ParameterOrThrow('reports', 'id_report', cleanIdReport, 'Rapport non trouvé');
        // ========================================
        // REQUETES BASE DE DONNEES
        // ======================================== 
        // Suppression du rapport
        const result = await db.query(
          'DELETE FROM reports WHERE id_report = $1 RETURNING id_report',
          [cleanIdReport]
        );
        // ========================================
        // DONNEES RECUPEREES
        // ======================================== 
        if (context?.res?.status) context.res.status(200);
        return true ;
    
      },
      {
        logAction: 'DELETE_REPORT',
        requiresAuth: true,
        errorMessage: 'Erreur lors de la suppression du rapport'
      }
    ),
    
  },

  Report: {
    whistleblower: async (parent) => {

      if (!parent?.id_user) return null;
      try {
        const result = await findBy1ParameterOrThrow('users', 'id_user', parent.id_user, 'Utilisateur non trouvé');
        return result?.data ?? result;
      } catch (err) {
        // si utilisateur supprimé / non trouvé -> retourner null au lieu d'échouer tout le query
        if (err && err.extensions && err.extensions.code === 'NOT_FOUND') return null;
        throw err;
      }
    },

    reported: async (parent) => {
      if (!parent?.reported_id) return null;
      try {
        const result = await findBy1ParameterOrThrow('users', 'id_user', parent.reported_id, 'Utilisateur non trouvé');
        return result?.data ?? result;
      } catch (err) {
        if (err && err.extensions && err.extensions.code === 'NOT_FOUND') return null;
        throw err;
      }    
    },

    category: async (parent) => {
      if (!parent?.id_category) return null;
      try {
        const result = await findBy1ParameterOrThrow('categories_of_reports', 'id_category', parent.id_category, 'Catégorie non trouvée');
        return result?.data ?? result;
      } catch (err) {
        if (err && err.extensions && err.extensions.code === 'NOT_FOUND') return null;
        throw err;
      }
    },

    reasonOfReport: async (parent) => {
      if (!parent?.id_reason_of_report) return null;
      try {
        const result = await findBy1ParameterOrThrow('reasons_of_reports', 'id_reason_of_report', parent.id_reason_of_report, 'Raison non trouvée');
        return result?.data ?? result;
      } catch (err) {
        if (err && err.extensions && err.extensions.code === 'NOT_FOUND') return null;
        throw err;
      }
    },

  },
};

/**
 * Valide les données d'un rapport 
 * @param {object} input - Données du rapport
 * @throws {GraphQLError} Si validation échoue
 */
export const validateReportInput = (input) => {
 
  if (!input.reason || input.reason.trim().length < 3) {//TestingMinimumLength(inputTesting,messageError)
    throw new GraphQLError('La raison du rapport doit contenir au moins 3 caractères', {
      extensions: { 
        code: 'BAD_REQUEST',
        httpStatus: 400
      },
    });
  }
    
  if (input.reason.length > 200) {//TestingMaximumLength(inputTesting,messageError)
    throw new GraphQLError('La raison ne peut pas dépasser 200 caractères', {
      extensions: { 
        code: 'BAD_REQUEST',
        httpStatus: 400
      },
    });
  }

  // Validation des détails (optionnel mais avec limite)
  if (input.details && input.details.length > 1000) {//TestingMaximumLength(inputTesting,messageError)
    throw new GraphQLError('Les détails ne peuvent pas dépasser 1000 caractères', {
      extensions: { 
        code: 'BAD_REQUEST',
        httpStatus: 400
      },
    });
  }

  // Validation du type de rapport
  const validReportTypes = ['user', 'comment', 'book', 'review', 'message'];
  if (!input.report_type || !validReportTypes.includes(input.report_type.toLowerCase())) {
    throw new GraphQLError('Type de rapport invalide', {
      extensions: { 
        code: 'BAD_REQUEST',
        httpStatus: 400
      },
    });
  }

  // Validation des IDs requis
  if (!input.id_user || input.id_user.trim().length === 0) {
    throw new GraphQLError('ID utilisateur manquant', {
      extensions: { 
        code: 'BAD_REQUEST',
        httpStatus: 400
      },
    });
  }

  // reported_id est optionnel (peut être vide pour certains types de signalements)
  // Validation seulement si fourni
  if (input.reported_id && input.reported_id.trim && input.reported_id.trim().length === 0) {
    throw new GraphQLError('ID de l\'élément signalé invalide', {
      extensions: { 
        code: 'BAD_REQUEST',
        httpStatus: 400
      },
    });
  }

};
