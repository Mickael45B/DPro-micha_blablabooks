import db from "../db/connect_DB.js";
import { v4 as uuidv4 } from "uuid";
import { validateOrderParams, handleDbError } from '../utils/validators.js';
import { fetchUserById } from './utils/utils_users.js';
import sanitizeHtml from 'sanitize-html';
import { GraphQLError } from 'graphql';
import fetchBookById from './utils/utils_books.js';
import fetchLibraryById from './utils/utils_librairies.js';

import { isAuthenticated, requireAuth, requireAdmin, requireOwnershipOrAdmin, sanitizeString, sanitizeInput, flattenEdges, makePageInfo, makeEdgeFromBook, withErrorHandling } from './utils/helpers/helpers_general.js';

import { findReportOrThrow, validateReportInput} from './utils/helpers/helpers_Reports.js';

import {getReportsSchema, getReportSchema, searchReportsByUserSchema, searchReportsByStatusSchema, searchReportsByDetailsOrReasonSchema, searchReportsSchema, addReportSchema, updateReportSchema, deleteReportSchema } from '../schema/schemas_joi/reportSchema.js';

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
    getReports: withErrorHandling(
      async (_, args, context) => {
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
    
      },
      'Erreur lors de la récupération des messages'
    ),
    
    /**
     * Récupère une permission par son ID
     * * 🔓 Route publique
     * @param {string} id_permission - ID de la permission
     * @returns {object|null} Permission ou null si non trouvée
     * @throws {GraphQLError} Si l'utilisateur n'a pas les droits (401 ou 403)  
     * @throws {GraphQLError} Si une erreur se produit lors de la récupération de la permission (500)
     */
    getReport: withErrorHandling(
      async (_, args, context) => {
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

        // Vérification des droits d'accès
        requireAuth(context);

        const { id_report } = args;

        // Sanitize input
        const sanitizedId = sanitizeString(id_report);

        if (!sanitizedId) {
          throw new GraphQLError('ID du rapport manquant', {
            extensions: { code: 'BAD_USER_INPUT', httpStatus: 400 }
          });
        }

        const report = await findReportOrThrow(sanitizedId);

        if (context?.res?.status) context.res.status(200);
        return report;
      },
      'Erreur lors de la récupération du rapport'
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
    searchReportsByUser: withErrorHandling(
      async (_, args, context) => {
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

        const currentUserId = context?.user?.id ?? context?.user?.id_user ?? null;
        const isAdminFlag =
          Boolean(context && (context.isAdmin || context.user?.isAdmin || context.user?.role === 'admin'));
        if (!currentUserId) {
          throw new GraphQLError('Utilisateur non authentifié', {
            extensions: { code: 'UNAUTHENTICATED', httpStatus: 401 }
          });
        }
        // si reported_id correspond à l'id_user du "context" il n'est pas affiché (l'utilisateur ne peut pas voir les rapports le concernant même s'il est admin)
        if (context.user.id_user === report.reported_id) {
          report.hidden = true;
        }

        // Extraction et validation des paramètres de pagination et de tri
        const { limit = 50, offset = 0, order = 'created_at', direction = 'DESC', id_user } = args;

        // Sanitize inputs
        const cleanLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 100);
        const cleanOffset = Math.max(parseInt(offset) || 0, 0);
        const validOrders = ['created_at', 'reason', 'details', 'updated_at'];
        const { order: safeOrder, direction: safeDirection } = validateOrderParams(
          sanitizeString(order),
          sanitizeString(direction),
          validOrders
        );
        const cleanUserId = sanitizeString(id_user || '');
    
        // Vérification des droits d'accès
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
      },
      "Erreur lors de la recherche des rapports de l'utilisateur"
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
    searchReportsByStatus: withErrorHandling(
      async (_, args, context) => {
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
    
        // Vérification des droits d'accès
         requireOwnershipOrAdmin(cleanUserId, context);

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

        // Build and run queries with correct parameter bindings depending on presence of status
        let result, countResult;
        if (cleanStatus) {
          // status provided -> bind status as $1, limit as $2, offset as $3
          const params = [cleanStatus, cleanLimit, cleanOffset];
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

          countResult = await db.query('SELECT COUNT(*)::int as count FROM reports');
        }
        if (context?.res?.status) context.res.status(200);
        return {
          reports: result.rows,
          totalCount: countResult.rows[0].count,
          hasNextPage: cleanOffset + cleanLimit < countResult.rows[0].count,
          httpStatus: 200
        };
      },
      'Erreur lors de la recherche des rapports par statut'
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
    searchReportsByDetailsOrReason: withErrorHandling(
      async (_, args, context) => {
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
    
        // Vérification des droits d'accès
         requireOwnershipOrAdmin(cleanUserId, context);

        // Extraction et validation des paramètres de pagination et de tri
        const { limit = 50, offset = 0, order = 'created_at', direction = 'DESC', content } = args;

        
        // Sanitize input
        const cleanLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 100);
        const cleanOffset = Math.max(parseInt(offset) || 0, 0);
        const validOrders = ['created_at', 'reason', 'status', 'updated_at'];
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
        
        return {
          reports: result.rows,
          totalCount: countResult.rows[0].count,
          hasNextPage: cleanOffset + cleanLimit < countResult.rows[0].count,
          httpStatus: 200
        };
    
      },
      'Erreur lors de la recherche des rapports'
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
    searchReports: withErrorHandling(
      async (_, args, context) => {
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
    
        // Exemples de filtres acceptés : id_report, id_user, status, content
        const { limit = 50, offset = 0, order = 'created_at', direction = 'DESC', id_report, id_user, status, content } = args;

        // Sanitize & validate
        const cleanLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 100);
        const cleanOffset = Math.max(parseInt(offset) || 0, 0);
        const validOrders = ['created_at', 'reason', 'status', 'updated_at'];
        const { order: safeOrder, direction: safeDirection } = validateOrderParams(
          sanitizeString(order),
          sanitizeString(direction),
          validOrders
        );

        const cleanIdReport = sanitizeString(args.id_report || '');
        const cleanUserId = sanitizeString(args.id_user || '');
        const cleanStatus = sanitizeString(args.status || '');
        const cleanContent = sanitizeString(args.content || '');

        // Validate status if provided
        const validStatuses = ['pending', 'reviewed', 'resolved'];
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

        if (context?.res?.status) context.res.status(200);
        const totalCount = countResult.rows[0].count;
        return {
          reports: result.rows,
          totalCount,
          hasNextPage: cleanOffset + cleanLimit < totalCount,
          httpStatus: 200
        };
    
      },
      'Erreur lors de la recherche des rapports'
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
    addReport: withErrorHandling(
      async (_, { input }, context) => {
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
    
        // Vérification des droits d'accès
        requireAuth(context);

        const currentUserId = context?.user?.id ?? context?.user?.id_user ?? null;
        if (!currentUserId) {
          throw new GraphQLError('Utilisateur non authentifié', {
            extensions: { code: 'UNAUTHENTICATED', httpStatus: 401 }
          });
        }

        if (currentUserId !== input.id_user) {
          throw new GraphQLError('Vous ne pouvez pas créer un rapport pour un autre utilisateur', {
            extensions: { code: 'FORBIDDEN', httpStatus: 403 }
          });
        }

        // Validation des données d'entrée
        validateReportInput(input);

        // Sanitize inputs
        input.id_user = sanitizeString(input.id_user);
        input.report_type = sanitizeString(input.report_type);
        input.reported_id = sanitizeString(input.reported_id);
        input.reason = sanitizeString(input.reason);
        input.details = input.details ? sanitizeInput(input.details) : null;
        input.status = sanitizeHtml(input.status || 'pending');


        const id = uuidv4();
        const result = await db.query(`
          INSERT INTO reports (id_report, id_user, report_type, reported_id, reason, details, status)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *
        `, [
          id,
          input.id_user,
          input.report_type,
          input.reported_id,
          input.reason,
          input.details || null,
          input.status,
        ]);
        if (context?.res?.status) context.res.status(201);
        return result.rows[0];
    
      },
      'Erreur lors de la création du rapport'
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
    updateReport: withErrorHandling(
      async (_, { input }, context) => {
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
    
        // Vérification des droits d'accès
        requireAdmin(context);

        // Sanitize inputs
        const cleanIdReport = sanitizeString(input.id_report);

        if (!cleanIdReport) {
          throw new GraphQLError('ID de rapport invalide', {
            extensions: { code: 'BAD_USER_INPUT', httpStatus: 400 }
          });
        }

        // Vérifier que le rapport existe
        await findReportOrThrow(cleanIdReport);

        // Construction SÉCURISÉE de la requête UPDATE avec paramètres positionnels
        const updates = [];
        const values = [];
        let paramIndex = 1;

        if (input.status !== undefined) {
          const validStatuses = ['pending', 'reviewed', 'resolved'];
          const cleanStatus = sanitizeString(input.status);
          
          if (!validStatuses.includes(cleanStatus)) {
            throw new GraphQLError('Statut invalide', {
              extensions: { code: 'BAD_USER_INPUT', httpStatus: 400 }
            });
          }
        
          updates.push(`status = $${paramIndex++}`);
          values.push(cleanStatus);
        }

        if (input.details !== undefined) {
          const cleanDetails = input.details ? sanitizeString(input.details) : null;
          updates.push(`details = $${paramIndex++}`);
          values.push(cleanDetails);
        }

        if (input.reportType !== undefined) {
          const validReportTypes = ['user', 'comment', 'book', 'review', 'message'];
          const cleanReportType = sanitizeString(input.reportType);
          
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

        const result = await db.query(`
          UPDATE reports
          SET ${updates.join(', ')}
          WHERE id_report = $${paramIndex}
          RETURNING id_report, id_user, report_type, reported_id, reason, status, details, created_at, updated_at
        `, values);

        if (result.rows.length === 0) {
          throw new GraphQLError('Rapport non trouvé', {
            extensions: { code: 'NOT_FOUND', httpStatus: 404 }
          });
        }

        if (context?.res?.status) context.res.status(201);
        return result.rows[0];
      },
      'Erreur lors de la modification du rapport'
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
    deleteReport: withErrorHandling(
      async (_, { input }, context) => {
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
    
        // Vérification des droits d'accès (admin uniquement pour supprimer)
        requireOwnershipOrAdmin(context);

        // Sanitize input
        const cleanIdReport = sanitizeString(input.id_report);

        if (!cleanIdReport) {
          throw new GraphQLError('ID de rapport invalide', {
            extensions: { code: 'BAD_USER_INPUT', httpStatus: 400 }
          });
        }

        // Vérification de l'existence du rapport
        await findReportOrThrow(cleanIdReport);

        // Suppression du rapport
        const result = await db.query(
          'DELETE FROM reports WHERE id_report = $1 RETURNING id_report',
          [cleanIdReport]
        );
        
        if (context?.res?.status) context.res.status(200);
        return true ;
    
      },
      'Erreur lors de la suppression du rapport"'
    ),
    
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