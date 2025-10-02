import db from "../db/connect_DB.js";
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import { validateOrderParams, handleDbError } from '../utils/validators.js';

export default {
  Query: {
    getUsers: async (_, { limit = 50, offset = 0, order = 'created_at', direction = 'ASC' }) => {
      try {
        const validOrders = ['created_at', 'name', 'email', 'pseudo'];
        const { order: safeOrder, direction: safeDirection } = validateOrderParams(order, direction, validOrders);
        
        const result = await db.query(`
          SELECT id_user, name, email, pseudo, id_role, is_active, created_at, updated_at 
          FROM users 
          ORDER BY ${safeOrder} ${safeDirection}
          LIMIT $1 OFFSET $2
        `, [limit, offset]);
        
        const countResult = await db.query('SELECT COUNT(*)::int as count FROM users');
        const totalCount = countResult.rows[0].count;
        
        return {
          users: result.rows,
          totalCount,
          hasNextPage: offset + limit < totalCount,
        };
      } catch (error) {
        throw handleDbError(error, 'fetching users');
      }
    },

    getUser: async (_, { id_user }) => {
      try {
        const result = await db.query(
          'SELECT id_user, name, email, pseudo, id_role, is_active, created_at, updated_at FROM users WHERE id_user = $1',
          [id_user]
        );
        return result.rows[0];
      } catch (error) {
        throw handleDbError(error, 'updating message');
      }
    },

    searchUsers: async (_, { query, limit = 50, offset = 0 }) => {
      try {
        const searchQuery = `%${query}%`;
        const result = await db.query(`
          SELECT id_user, name, email, pseudo, id_role, is_active, created_at, updated_at 
          FROM users 
          WHERE name ILIKE $1 OR email ILIKE $1 OR pseudo ILIKE $1
          LIMIT $2 OFFSET $3
        `, [searchQuery, limit, offset]);
        return {
          users: result.rows,
          totalCount: result.rowCount,
          hasNextPage: offset + limit < result.rowCount,
        };
      } catch (error) {
        throw handleDbError(error, 'searching users');
      }
    },
    
  },
  Mutation: {
    createUser: async (_, { input }) => {
      const { name, email, pseudo, password, id_role } = input;
      const hashedPassword = await bcrypt.hash(password, 10);
      try {
        const result = await db.query(`
          INSERT INTO users (name, email, pseudo, password, id_role)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING *
        `, [name, email, pseudo, hashedPassword, id_role]);
        return result.rows[0];
      } catch (error) {
        throw handleDbError(error, 'creating user');
      }
    },
  },

   updateUser: async (_, { input }) => {
    try {
      const { id_user, name, email, pseudo, password, id_role, is_active } = input;
      const fields = [];
      const values = [];
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
      if (id_role !== undefined) {
        fields.push(`id_role = $${idx++}`);
        values.push(id_role);
      }
      if (is_active !== undefined) {
        fields.push(`is_active = $${idx++}`);
        values.push(is_active);
      }

      if (fields.length === 0) {
        throw new Error('No fields to update');
      }

      values.push(id_user);

      const result = await db.query(`
        UPDATE users
        SET ${fields.join(', ')}
        WHERE id_user = $${idx}
        RETURNING *
      `, values);

      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      return result.rows[0];
    } catch (error) {
      throw handleDbError(error, 'updating user');
    }
  },

  deleteMessage: async (_, { input }) => {
      try {
        const result = await db.query(
          'DELETE FROM messages WHERE id_message = $1 RETURNING id_message',
          [input.idMessage]
        );
        return result.rows.length > 0;
      } catch (error) {
        throw handleDbError(error, 'deleting message');
      }
    },
 
  Message: {
    sender: async (parent) => {
      if (!parent.id_sender) return null;
      try {
        const result = await db.query(
          'SELECT id_user, name, email, pseudo, id_role, is_active, created_at, updated_at FROM users WHERE id_user = $1',
          [parent.id_sender]
        );
        return result.rows[0] || null;
      } catch (error) {
        console.error('Error fetching message sender:', error);
        return null;
      }
    },
    
    receiver: async (parent) => {
      if (!parent.id_receiver) return null;
      try {
        const result = await db.query(
          'SELECT id_user, name, email, pseudo, id_role, is_active, created_at, updated_at FROM users WHERE id_user = $1',
          [parent.id_receiver]
        );
        return result.rows[0] || null;
      } catch (error) {
        console.error('Error fetching message receiver:', error);
        return null;
      }
    },
  },
};