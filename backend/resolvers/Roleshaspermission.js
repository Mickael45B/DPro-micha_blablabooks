import db from "../db/connect_DB.js";
import { v4 as uuidv4 } from "uuid";
import { validateOrderParams, handleDbError } from '../utils/validators.js';

export default {
  Query: {
    getPermissionsRoles: async (_, { limit = 50, offset = 0, order = 'created_at', direction = 'ASC' }) => {
      try {
        const validOrders = ['created_at', 'id_role', 'id_permission'];
        const { order: safeOrder, direction: safeDirection } = validateOrderParams(order, direction, validOrders);
        
        const result = await db.query(`
          SELECT * FROM rolehaspermissions
          ORDER BY ${safeOrder} ${safeDirection}
          LIMIT $1 OFFSET $2
        `, [limit, offset]);
        
        const countResult = await db.query('SELECT COUNT(*)::int as count FROM rolehaspermissions');
        const totalCount = countResult.rows[0].count;
        
        return {
          roleHasPermissions: result.rows,
          totalCount,
          hasNextPage: offset + limit < totalCount,
        };
      } catch (error) {
        throw handleDbError(error, 'fetching roles permissions');
      }
    },

    getPermissionRole: async (_, { id_permission_role }) => {
      try {
        const result = await db.query(
          'SELECT * FROM rolehaspermissions WHERE id_rolehaspermission = $1',
          [id_permission_role]
        );
        return result.rows[0] || null;
      } catch (error) {
        throw handleDbError(error, 'fetching permission role');
      }
    },

    searchPermissionsRoles: async (_, { name, limit = 50, offset = 0 }) => {
      try {
        const searchPattern = `%${name}%`;
        
        const result = await db.query(`
          SELECT rhp.* FROM rolehaspermissions rhp
          JOIN roles r ON rhp.id_role = r.id_role
          JOIN permissions p ON rhp.id_permission = p.id_permission
          WHERE LOWER(r.name) LIKE LOWER($1) OR LOWER(p.name) LIKE LOWER($1)
          ORDER BY rhp.created_at DESC
          LIMIT $2 OFFSET $3
        `, [searchPattern, limit, offset]);
        
        const countResult = await db.query(`
          SELECT COUNT(*)::int as count FROM rolehaspermissions rhp
          JOIN roles r ON rhp.id_role = r.id_role
          JOIN permissions p ON rhp.id_permission = p.id_permission
          WHERE LOWER(r.name) LIKE LOWER($1) OR LOWER(p.name) LIKE LOWER($1)
        `, [searchPattern]);
        
        return {
          roleHasPermissions: result.rows,
          totalCount: countResult.rows[0].count,
          hasNextPage: offset + limit < countResult.rows[0].count,
        };
      } catch (error) {
        throw handleDbError(error, 'searching permissions roles');
      }
    },
  },

  Mutation: {
    addPermissionRole: async (_, { input }) => {
      try {
        const id = uuidv4();
        const result = await db.query(`
          INSERT INTO rolehaspermissions (id_rolehaspermission, id_role, id_permission)
          VALUES ($1, $2, $3)
          RETURNING *
        `, [id, input.roleId, input.permissionId]);
        return result.rows[0];
      } catch (error) {
        throw handleDbError(error, 'adding permission to role');
      }
    },

    updatePermissionRole: async (_, { input }) => {
      try {
        const updates = [];
        const values = [];
        let paramIndex = 1;

        if (input.roleId !== undefined) {
          updates.push(`id_role = ${paramIndex++}`);
          values.push(input.roleId);
        }
        if (input.permissionId !== undefined) {
          updates.push(`id_permission = ${paramIndex++}`);
          values.push(input.permissionId);
        }

        if (updates.length === 0) {
          throw new Error('No fields to update');
        }

        values.push(input.id);

        const result = await db.query(`
          UPDATE rolehaspermissions
          SET ${updates.join(', ')}
          WHERE id_rolehaspermission = ${paramIndex}
          RETURNING *
        `, values);

        if (result.rows.length === 0) {
          throw new Error('Permission role not found');
        }

        return result.rows[0];
      } catch (error) {
        throw handleDbError(error, 'updating permission role');
      }
    },

    deletePermissionRole: async (_, { input }) => {
      try {
        const result = await db.query(
          'DELETE FROM rolehaspermissions WHERE id_rolehaspermission = $1 RETURNING id_rolehaspermission',
          [input.id]
        );
        return result.rows.length > 0;
      } catch (error) {
        throw handleDbError(error, 'deleting permission role');
      }
    },
  },

  RoleHasPermissions: {
    role: async (parent) => {
      if (!parent.id_role) return null;
      try {
        const result = await db.query(
          'SELECT * FROM roles WHERE id_role = $1',
          [parent.id_role]
        );
        return result.rows[0] || null;
      } catch (error) {
        console.error('Error fetching role:', error);
        return null;
      }
    },

    permission: async (parent) => {
      if (!parent.id_permission) return null;
      try {
        const result = await db.query(
          'SELECT * FROM permissions WHERE id_permission = $1',
          [parent.id_permission]
        );
        return [result.rows[0]].filter(Boolean);
      } catch (error) {
        console.error('Error fetching permission:', error);
        return [];
      }
    },
  },
};