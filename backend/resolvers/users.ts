import db from "../db/connect_DB.js";
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import { validateOrderParams, handleDbError } from '../utils/validators.js';
import fetchRoleById from './utils/utils_roles.js';

// Types minimaux pour garder la conversion simple
// Typages minimalistes pour les résultats SQL
interface UserRow {
  id_user: string;
  name?: string | null;
  email: string;
  pseudo?: string | null;
  id_role?: string | null;
  status?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

type AnyObj = { [key: string]: any };

const usersResolvers = {
  Query: {
    getUsers: async (_: any, { limit = 50, offset = 0, order = 'created_at', direction = 'ASC' }: AnyObj): Promise<AnyObj> => {
      try {
        const validOrders = ['created_at', 'name', 'email', 'pseudo'];
        const { order: safeOrder, direction: safeDirection } = validateOrderParams(order, direction, validOrders);
        
        const result = await db.query(`
          SELECT id_user, name, email, pseudo, id_role, status, created_at, updated_at
          FROM users
          ORDER BY ${safeOrder} ${safeDirection}
          LIMIT $1 OFFSET $2
        `, [limit, offset]);
        
  const countResult = await db.query('SELECT COUNT(*)::int as count FROM users');
  const totalCount = Number(((countResult.rows[0] as any)?.count) ?? 0);
        
        const users = result.rows;
        if (!users || users.length === 0) {
          throw new Error('No users found');
        }

        return {
          users,
          totalCount,
          hasNextPage: offset + limit < totalCount,
        };
      } catch (error) {
        throw handleDbError(error, 'fetching users');
      }
    },

    getUser: async (_: any, { id_user }: AnyObj): Promise<AnyObj | null> => {
      try {
        const result = await db.query(
          'SELECT id_user, name, email, pseudo, id_role, status, created_at, updated_at FROM users WHERE id_user = $1',
          [id_user]
        );
  return ((result.rows[0] as unknown) as UserRow) || null;
      } catch (error) {
        throw handleDbError(error, 'fetching user');
      }
    },

    searchUsers: async (_: any, { nameOrPseudo, limit = 50, offset = 0 }: AnyObj): Promise<AnyObj> => {
      try {
        const searchQuery = `%${nameOrPseudo}%`;
        const result = await db.query(`
          SELECT id_user, name, email, pseudo, id_role, status, created_at, updated_at
          FROM users
          WHERE LOWER(name) LIKE LOWER($1) OR LOWER(email) LIKE LOWER($1) OR LOWER(pseudo) LIKE LOWER($1)
          LIMIT $2 OFFSET $3
        `, [searchQuery, limit, offset]);

        const countResult = await db.query(`
          SELECT COUNT(*)::int as count FROM users
          WHERE LOWER(name) LIKE LOWER($1) OR LOWER(email) LIKE LOWER($1) OR LOWER(pseudo) LIKE LOWER($1)
        `, [searchQuery]);

  const searchTotal = Number(((countResult.rows[0] as any)?.count) ?? 0);

        return {
          users: result.rows,
          totalCount: searchTotal,
          hasNextPage: offset + limit < searchTotal,
        };
      } catch (error) {
        throw handleDbError(error, 'searching users');
      }
    },
  },

  Mutation: {
    createUser: async (_: any, { input }: AnyObj): Promise<AnyObj> => {
      const { name, email, pseudo, password, id_role } = input;
      const hashedPassword = await bcrypt.hash(password, 10);
      try {
        const result = await db.query(`
          INSERT INTO users (name, email, pseudo, password, id_role)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id_user, name, email, pseudo, id_role, status, created_at, updated_at
        `, [name, email, pseudo, hashedPassword, id_role]);
  return ((result.rows[0] as unknown) as UserRow);
      } catch (error) {
        throw handleDbError(error, 'creating user');
      }
    },

    updateUser: async (_: any, { input }: AnyObj): Promise<AnyObj> => {
      try {
        const { id_user, name, email, pseudo, password, id_role, status, role } = input;
        const fields: string[] = [];
        const values: any[] = [];
        let idx = 1;

        if (name !== undefined) {
          fields.push(`name = $${idx++}`);
          values.push(name);
        }
        if (email !== undefined) {
          fields.push(`email = $${idx++}`);
          values.push(email);
        }
        if (pseudo !== undefined) {
          fields.push(`pseudo = $${idx++}`);
          values.push(pseudo);
        }
        if (password !== undefined) {
          const hashedPassword = await bcrypt.hash(password, 10);
          fields.push(`password = $${idx++}`);
          values.push(hashedPassword);
        }
        if (status !== undefined) {
          fields.push(`status = $${idx++}`);
          values.push(status);
        }
        if (id_role !== undefined) {
          fields.push(`id_role = $${idx++}`);
          values.push(id_role);
        }
        if (role !== undefined) {
          fields.push(`role = $${idx++}`);
          values.push(role);
        }

        if (fields.length === 0) {
          throw new Error('No fields to update');
        }

        values.push(id_user);

        const result = await db.query(`
          UPDATE users
          SET ${fields.join(', ')}
          WHERE id_user = $${idx}
          RETURNING id_user, name, email, pseudo, id_role, status, created_at, updated_at
        `, values);

        if (result.rows.length === 0) {
          throw new Error('User not found');
        }

        return result.rows[0];
      } catch (error) {
        throw handleDbError(error, 'updating user');
      }
    },

    deleteUser: async (_: any, { input }: AnyObj): Promise<boolean> => {
      try {
        const result = await db.query(
          'DELETE FROM users WHERE id_user = $1 RETURNING id_user',
          [input.id_user]
        );
        return result.rows.length > 0;
      } catch (error) {
        throw handleDbError(error, 'deleting user');
      }
    },

    changePassword: async (_: any, { input }: AnyObj): Promise<boolean> => {
      try {
        const { id_user, oldPassword, newPassword } = input;
        const userResult = await db.query(
          'SELECT password FROM users WHERE id_user = $1',
          [id_user]
        );
        if (userResult.rows.length === 0) {
          throw new Error('User not found');
        }
  const storedHash = String(((userResult.rows[0] as any)?.password) ?? '');
  const isMatch = await bcrypt.compare(oldPassword, storedHash);
        if (!isMatch) {
          throw new Error('Old password is incorrect');
        }
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        await db.query(
          'UPDATE users SET password = $1 WHERE id_user = $2',
          [hashedNewPassword, id_user]
        );
        return true;
      } catch (error) {
        throw handleDbError(error, 'changing password');
      }
    },
  },

  User: {
    role: async (parent: AnyObj): Promise<any> => {
      return fetchRoleById(parent.id_role);
    },
  },
} as const;

export default usersResolvers;
