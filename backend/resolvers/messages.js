import db from "../db/connect_DB.js";
import { v4 as uuidv4 } from 'uuid';
import { validateOrderParams, handleDbError } from '../utils/validators.js';
import { fetchUserById } from './utils/utils_users.js';

export default {
  Query: {
    getMessages: async (_, { limit = 50, offset = 0, order = 'created_at', direction = 'ASC' }) => {
      try {
        const validOrders = ['created_at', 'subject', 'is_read'];
        const { order: safeOrder, direction: safeDirection } = validateOrderParams(order, direction, validOrders);
        
        const result = await db.query(`
          SELECT id_message, id_sender, id_receiver, subject, content, is_read, created_at, updated_at
          FROM messages
          ORDER BY ${safeOrder} ${safeDirection}
          LIMIT $1 OFFSET $2
        `, [limit, offset]);
        
        const countResult = await db.query('SELECT COUNT(*)::int as count FROM messages');
        const totalCount = countResult.rows[0].count;
        
        return {
          messages: result.rows,
          totalCount,
          hasNextPage: offset + limit < totalCount,
        };
      } catch (error) {
        throw handleDbError(error, 'fetching messages');
      }
    },

    getMessage: async (_, { id_message }) => {
      try {
        const result = await db.query(
          'SELECT id_message, id_sender, id_receiver, subject, content, is_read, created_at, updated_at FROM messages WHERE id_message = $1',
          [id_message]
        );
        return result.rows[0] || null;
      } catch (error) {
        throw handleDbError(error, 'fetching message');
      }
    },

    searchMessages: async (_, { content, limit = 50, offset = 0 }) => {
      try {
        const searchPattern = `%${content}%`;
        
        const result = await db.query(`
          SELECT id_message, id_sender, id_receiver, subject, content, is_read, created_at, updated_at FROM messages
          WHERE LOWER(subject) LIKE LOWER($1) OR LOWER(content) LIKE LOWER($1)
          ORDER BY created_at DESC
          LIMIT $2 OFFSET $3
        `, [searchPattern, limit, offset]);
        
        const countResult = await db.query(`
          SELECT COUNT(*)::int as count FROM messages
          WHERE LOWER(subject) LIKE LOWER($1) OR LOWER(content) LIKE LOWER($1)
        `, [searchPattern]);
        
        return {
          messages: result.rows,
          totalCount: countResult.rows[0].count,
          hasNextPage: offset + limit < countResult.rows[0].count,
        };
      } catch (error) {
        throw handleDbError(error, 'searching messages');
      }
    },
  },

  Mutation: {
    addMessage: async (_, { input }) => {
      try {
        const id = uuidv4();
        const result = await db.query(`
          INSERT INTO messages (id_message, id_sender, id_receiver, subject, content, is_read)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING id_message, id_sender, id_receiver, subject, content, is_read, created_at, updated_at
        `, [
          id,
          input.idSender,
          input.idReceiver,
          input.subject,
          input.content,
          input.isRead ?? false
        ]);
        return result.rows[0];
      } catch (error) {
        throw handleDbError(error, 'creating message');
      }
    },

    updateMessage: async (_, { input }) => {
      try {
        const updates = [];
        const values = [];
        let paramIndex = 1;

        if (input.subject !== undefined) {
          updates.push(`subject = $${paramIndex++}`);
          values.push(input.subject);
        }
        if (input.content !== undefined) {
          updates.push(`content = $${paramIndex++}`);
          values.push(input.content);
        }
        if (input.isRead !== undefined) {
          updates.push(`is_read = $${paramIndex++}`);
          values.push(input.isRead);
        }

        if (updates.length === 0) {
          throw new Error('No fields to update');
        }

        values.push(input.idMessage);

        const result = await db.query(`
          UPDATE messages
          SET ${updates.join(', ')}
          WHERE id_message = $${paramIndex}
          RETURNING id_message, id_sender, id_receiver, subject, content, is_read, created_at, updated_at
        `, values);

        if (result.rows.length === 0) {
          throw new Error('Message not found');
        }

        return result.rows[0];
      } catch (error) {
        throw handleDbError(error, 'updating message');
      }
    },

    markMessageAsRead: async (_, { id_message }) => {
      try {
        const result = await db.query(`
          UPDATE messages
          SET is_read = true
          WHERE id_message = $1
          RETURNING id_message, id_sender, id_receiver, subject, content, is_read, created_at, updated_at
        `, [id_message]);

        if (result.rows.length === 0) {
          throw new Error('Message not found');
        }

        return result.rows[0];
      } catch (error) {
        throw handleDbError(error, 'marking message as read');
      }
    },
    
    deleteMessage: async (_, { id_message }) => {
      try {
        const result = await db.query(
          'DELETE FROM messages WHERE id_message = $1 RETURNING id_message',
          [id_message]
        );
        return result.rows[0];
      } catch (error) {
        throw handleDbError(error, 'deleting message');
      }
    },
  },
  
    Message: {


    sender: async (parent) => {
      return fetchUserById(parent.id_sender);
    },

    receiver: async (parent) => {
      return fetchUserById(parent.id_receiver);
    },

    
  },
};