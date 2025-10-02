import db from "../db/connect_DB.js";
import { v4 as uuidv4 } from 'uuid';
import { validateOrderParams, handleDbError } from '../utils/validators.js';

export default {
  Query: {
    getPermissions: async (_, { limit = 50, offset = 0, order = 'created_at', direction = 'ASC' }) => {
      try {
        const validOrders = ['created_at', 'name'];
        const { order: safeOrder, direction: safeDirection } = validateOrderParams(order, direction, validOrders);
        
        const result = await db.query(`
          SELECT * FROM permissions
          ORDER BY ${safeOrder} ${safeDirection}
          LIMIT $1 OFFSET $2
        `, [limit, offset]);
        
        const countResult = await db.query('SELECT COUNT(*)::int as count FROM permissions');
        const totalCount = countResult.rows[0].count;
        
        return {
          permissions: result.rows,
          totalCount,
          hasNextPage: offset + limit < totalCount,
        };
      } catch (error) {
        throw handleDbError(error, 'fetching permissions');
      }
    },

    getPermission: async (_, { id_permission }) => {
      try {
        const result = await db.query(
          'SELECT * FROM permissions WHERE id_permission = $1',
          [id_permission]
        );
        return result.rows[0] || null;
      } catch (error) {
        throw handleDbError(error, 'fetching permission');
      }
    },

    searchPermissions: async (_, { name, limit = 50, offset = 0 }) => {
      try {
        const searchPattern = `%${name}%`;
        
        const result = await db.query(`
          SELECT * FROM permissions
          WHERE LOWER(name) LIKE LOWER($1)
          ORDER BY name ASC
          LIMIT $2 OFFSET $3
        `, [searchPattern, limit, offset]);
        
        const countResult = await db.query(`
          SELECT COUNT(*)::int as count FROM permissions
          WHERE LOWER(name) LIKE LOWER($1)
        `, [searchPattern]);
        
        return {
          permissions: result.rows,
          totalCount: countResult.rows[0].count,
          hasNextPage: offset + limit < countResult.rows[0].count,
        };
      } catch (error) {
        throw handleDbError(error, 'searching permissions');
      }
    },
  },

  Mutation: {
    addPermission: async (_, { input }) => {
      try {
        const id = uuidv4();
        const result = await db.query(`
          INSERT INTO permissions (id_permission, name)
          VALUES ($1, $2)
          RETURNING *
        `, [id, input.name]);
        return result.rows[0];
      } catch (error) {
        throw handleDbError(error, 'creating permission');
      }
    },

    updatePermission: async (_, { input }) => {
      try {
        const result = await db.query(`
          UPDATE permissions
          SET name = $1
          WHERE id_permission = $2
          RETURNING *
        `, [input.name, input.idPermission]);

        if (result.rows.length === 0) {
          throw new Error('Permission not found');
        }

        return result.rows[0];
      } catch (error) {
        throw handleDbError(error, 'updating permission');
      }
    },

    deletePermission: async (_, { input }) => {
      try {
        const result = await db.query(
          'DELETE FROM permissions WHERE id_permission = $1 RETURNING id_permission',
          [input.idPermission]
        );
        return result.rows.length > 0;
      } catch (error) {
        throw handleDbError(error, 'deleting permission');
      }
    },
  },

  Permission: {},
};