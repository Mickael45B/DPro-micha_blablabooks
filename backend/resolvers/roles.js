import db from "../db/connect_DB.js";
import { v4 as uuidv4 } from "uuid";
import { validateOrderParams, handleDbError } from '../utils/validators.js';

export default {
  Query: {
    getRoles: async (_, { limit = 50, offset = 0, order = 'created_at', direction = 'ASC' }) => {
      try {
        const validOrders = ['created_at', 'name'];
        const { order: safeOrder, direction: safeDirection } = validateOrderParams(order, direction, validOrders);
        
        const result = await db.query(`
          SELECT * FROM roles
          ORDER BY ${safeOrder} ${safeDirection}
          LIMIT $1 OFFSET $2
        `, [limit, offset]);
        
        const countResult = await db.query('SELECT COUNT(*)::int as count FROM roles');
        const totalCount = countResult.rows[0].count;
        
        return {
          roles: result.rows,
          totalCount,
          hasNextPage: offset + limit < totalCount,
        };
      } catch (error) {
        throw handleDbError(error, 'fetching roles');
      }
    },

    getRole: async (_, { id_role }) => {
      try {
        const result = await db.query(
          'SELECT * FROM roles WHERE id_role = $1',
          [id_role]
        );
        return result.rows[0] || null;
      } catch (error) {
        throw handleDbError(error, 'fetching role');
      }
    },

    searchRoles: async (_, { name, limit = 50, offset = 0 }) => {
      try {
        const searchPattern = `%${name}%`;
        
        const result = await db.query(`
          SELECT * FROM roles
          WHERE LOWER(name) LIKE LOWER($1)
          ORDER BY name ASC
          LIMIT $2 OFFSET $3
        `, [searchPattern, limit, offset]);
        
        const countResult = await db.query(`
          SELECT COUNT(*)::int as count FROM roles
          WHERE LOWER(name) LIKE LOWER($1)
        `, [searchPattern]);
        
        return {
          roles: result.rows,
          totalCount: countResult.rows[0].count,
          hasNextPage: offset + limit < countResult.rows[0].count,
        };
      } catch (error) {
        throw handleDbError(error, 'searching roles');
      }
    },
  },

  Mutation: {
    addRole: async (_, { input }) => {
      try {
        const id = uuidv4();
        const result = await db.query(`
          INSERT INTO roles (id_role, name)
          VALUES ($1, $2)
          RETURNING *
        `, [id, input.name]);
        return result.rows[0];
      } catch (error) {
        throw handleDbError(error, 'creating role');
      }
    },

    updateRole: async (_, { input }) => {
      try {
        const result = await db.query(`
          UPDATE roles
          SET name = $1
          WHERE id_role = $2
          RETURNING *
        `, [input.name, input.idRole]);

        if (result.rows.length === 0) {
          throw new Error('Role not found');
        }

        return result.rows[0];
      } catch (error) {
        throw handleDbError(error, 'updating role');
      }
    },

    deleteRole: async (_, { input }) => {
      try {
        const result = await db.query(
          'DELETE FROM roles WHERE id_role = $1 RETURNING id_role',
          [input.idRole]
        );
        return result.rows.length > 0;
      } catch (error) {
        throw handleDbError(error, 'deleting role');
      }
    },
  },

  Role: {},
};
