import db from "../db/connect_DB.js";
import { v4 as uuidv4 } from "uuid";
import { validateOrderParams, handleDbError } from '../utils/validators.js';
import { fetchUserById } from './utils/utils_users.js';

export default {
  Query: {
    getReports: async (_, { limit = 50, offset = 0, order = 'created_at', direction = 'ASC' }) => {
      try {
        const validOrders = ['created_at', 'status', 'report_type'];
        const { order: safeOrder, direction: safeDirection } = validateOrderParams(order, direction, validOrders);
        
        const result = await db.query(`
          SELECT id_report, id_user, report_type, reported_id, reason, status, details, created_at, updated_at
          FROM reports
          ORDER BY ${safeOrder} ${safeDirection}
          LIMIT $1 OFFSET $2
        `, [limit, offset]);
        
        const countResult = await db.query('SELECT COUNT(*)::int as count FROM reports');
        const totalCount = countResult.rows[0].count;
        
        return {
          reports: result.rows,
          totalCount,
          hasNextPage: offset + limit < totalCount,
        };
      } catch (error) {
        throw handleDbError(error, 'fetching reports');
      }
    },

    getReport: async (_, { id_report }) => {
      try {
        const result = await db.query(
          'SELECT id_report, id_user, report_type, reported_id, reason, status, details, created_at, updated_at FROM reports WHERE id_report = $1',
          [id_report]
        );
        return result.rows[0] || null;
      } catch (error) {
        throw handleDbError(error, 'fetching report');
      }
    },

    searchReports: async (_, { content, limit = 50, offset = 0 }) => {
      try {
        const searchPattern = `%${content}%`;
        
        const result = await db.query(`
          SELECT id_report, id_user, report_type, reported_id, reason, status, details, created_at, updated_at FROM reports
          WHERE LOWER(reason) LIKE LOWER($1) OR LOWER(details) LIKE LOWER($1)
          ORDER BY created_at DESC
          LIMIT $2 OFFSET $3
        `, [searchPattern, limit, offset]);
        
        const countResult = await db.query(`
          SELECT COUNT(*)::int as count FROM reports
          WHERE LOWER(reason) LIKE LOWER($1) OR LOWER(details) LIKE LOWER($1)
        `, [searchPattern]);
        
        return {
          reports: result.rows,
          totalCount: countResult.rows[0].count,
          hasNextPage: offset + limit < countResult.rows[0].count,
        };
      } catch (error) {
        throw handleDbError(error, 'searching reports');
      }
    },
  },

  Mutation: {
    addReport: async (_, { input }) => {
      try {
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
          input.details || null,
          'pending'
        ]);
        return result.rows[0];
      } catch (error) {
        throw handleDbError(error, 'creating report');
      }
    },

    updateReport: async (_, { input }) => {
      try {
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

        return result.rows[0];
      } catch (error) {
        throw handleDbError(error, 'updating report');
      }
    },

    deleteReport: async (_, { input }) => {
      try {
        const result = await db.query(
          'DELETE FROM reports WHERE id_report = $1 RETURNING id_report',
          [input.idReport]
        );
        return result.rows.length > 0;
      } catch (error) {
        throw handleDbError(error, 'deleting report');
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