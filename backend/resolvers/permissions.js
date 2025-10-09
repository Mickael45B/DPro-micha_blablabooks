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
          SELECT id_permission, permission_name, created_at, updated_at
          FROM permissions
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
        console.log('Fetching permission with id_permission:', id_permission);
        const result = await db.query(
          'SELECT id_permission, permission_name, created_at, updated_at FROM permissions WHERE id_permission = $1',
          [id_permission]
        );
        console.log('Result from database:', result.rows);
        return result.rows[0] || null;
      } catch (error) {
        console.error('Error fetching permission:', error);
        throw handleDbError(error, 'fetching permission');
      }
    },

    searchPermissions: async (_, { id_permission, limit = 50, offset = 0 }) => {
      try {
        console.log('Fetching permission with id_permission:', id_permission);
            
        const searchPattern = `%${id_permission}%`;
        
        const result = await db.query(`
          SELECT id_permission, permission_name, created_at, updated_at FROM permissions
          WHERE id_permission LIKE LOWER($1)
          ORDER BY permission_name ASC
          LIMIT $2 OFFSET $3
        `, [searchPattern, limit, offset]);
        
        const countResult = await db.query(`
          SELECT COUNT(*)::int as count FROM permissions
          WHERE id_permission LIKE LOWER($1)
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
          INSERT INTO permissions (id_permission, permission_name)
          VALUES ($1, $2)
          RETURNING id_permission, permission_name, created_at, updated_at
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
          SET permission_name = $1
          WHERE id_permission = $2
          RETURNING id_permission, permission_name, created_at, updated_at
        `, [input.name, input.id_permission]);

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
          [input.id_permission]
        );
        return result.rows.length > 0;
      } catch (error) {
        throw handleDbError(error, 'deleting permission');
      }
    },
  },

  Permission: {},
};