import db from "../db/connect_DB.js";
import { v4 as uuidv4 } from "uuid";
import { validateOrderParams, handleDbError } from '../utils/validators.js';
import fetchRoleById from './utils/utils_roles.js';
import  fetchPermissionById  from './utils/utils_permissions.js';

export default {
  Query: {
    getPermissionsRoles: async (_, { limit = 50, offset = 0, order = 'created_at', direction = 'ASC' }) => {
      try {
        const validOrders = ['created_at', 'id_role', 'id_permission'];
        const { order: safeOrder, direction: safeDirection } = validateOrderParams(order, direction, validOrders);
        
        const result = await db.query(`
          SELECT id_rolehaspermission, id_role, id_permission, created_at, updated_at
          FROM rolehaspermissions
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
          'SELECT id_rolehaspermission, id_role, id_permission, created_at, updated_at FROM rolehaspermissions WHERE id_rolehaspermission = $1',
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

    // Requête principale avec jointure
    const result = await db.query(`
      SELECT rhp.*, r.role_name, p.permission_name
      FROM rolehaspermissions rhp
      JOIN roles r ON rhp.id_role = r.id_role
      JOIN permissions p ON rhp.id_permission = p.id_permission
      WHERE LOWER(r.role_name) LIKE LOWER($1)
         OR LOWER(p.permission_name) LIKE LOWER($1)
      ORDER BY r.role_name ASC
      LIMIT $2 OFFSET $3
    `, [searchPattern, limit, offset]);

    // Requête pour compter le total des résultats
    const countResult = await db.query(`
      SELECT COUNT(*)::int as count
      FROM rolehaspermissions rhp
      JOIN roles r ON rhp.id_role = r.id_role
      JOIN permissions p ON rhp.id_permission = p.id_permission
      WHERE LOWER(r.role_name) LIKE LOWER($1)
         OR LOWER(p.permission_name) LIKE LOWER($1)
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
          RETURNING id_rolehaspermission, id_role, id_permission, created_at, updated_at
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

        if (input.id_role !== undefined) {
          updates.push(`id_role = ${paramIndex++}`);
          values.push(input.id_role);
        }
        if (input.id_permission !== undefined) {
          updates.push(`id_permission = ${paramIndex++}`);
          values.push(input.id_permission);
        }

        if (updates.length === 0) {
          throw new Error('No fields to update');
        }

        values.push(input.id);

        const result = await db.query(`
          UPDATE rolehaspermissions
          SET ${updates.join(', ')}
          WHERE id_rolehaspermission = ${paramIndex}
          RETURNING id_rolehaspermission, id_role, id_permission, created_at, updated_at
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
          [input.id_rolehaspermission]
        );
        return result.rows.length > 0;
      } catch (error) {
        throw handleDbError(error, 'deleting permission role');
      }
    },
  },

  RoleHasPermissions: {
    role: async (parent) => {
      return fetchRoleById(parent.id_role);
    },

    permission: async (parent) => {
      return fetchPermissionById(parent.id_permission);
    },
  },
};