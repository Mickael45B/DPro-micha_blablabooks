import db from "../db/connect_DB.js";
import { v4 as uuidv4 } from 'uuid';
import { validateOrderParams, handleDbError } from '../utils/validators.js';

export default {
  Query: {
    getLibraries: async (_, { limit = 50, offset = 0, order = 'created_at', direction = 'ASC' }) => {
      try {
        const validOrders = ['created_at', 'name'];
        const { order: safeOrder, direction: safeDirection } = validateOrderParams(order, direction, validOrders);
        
        const result = await db.query(`
          SELECT * FROM libraries 
          ORDER BY ${safeOrder} ${safeDirection}
          LIMIT $1 OFFSET $2
        `, [limit, offset]);
        
        const countResult = await db.query('SELECT COUNT(*)::int as count FROM libraries');
        const totalCount = countResult.rows[0].count;
        
        return {
          libraries: result.rows,
          totalCount,
          hasNextPage: offset + limit < totalCount,
        };
      } catch (error) {
        throw handleDbError(error, 'fetching libraries');
      }
    },

    getUserLibraries: async (_, { userId }) => {
      try {
        const result = await db.query(
          'SELECT * FROM libraries WHERE id_user = $1',
          [userId]
        );
        return result.rows;
      } catch (error) {
        throw handleDbError(error, 'fetching user libraries');
      }
    },

    getLibrary: async (_, { id_library }) => {
      try {
        const result = await db.query(
          'SELECT * FROM libraries WHERE id_library = $1',
          [id_library]
        );
        return result.rows[0] || null;
      } catch (error) {
        throw handleDbError(error, 'fetching library');
      }
    },

    searchLibraries: async (_, { nameOrLocation, limit = 50, offset = 0 }) => {
      try {
        const searchPattern = `%${nameOrLocation}%`;

        const result = await db.query(`
          SELECT * FROM libraries
          WHERE LOWER(name) LIKE LOWER($1)
          ORDER BY created_at DESC
          LIMIT $2 OFFSET $3
        `, [searchPattern, limit, offset]);
        
        const countResult = await db.query(`
          SELECT COUNT(*)::int as count FROM libraries
          WHERE LOWER(name) LIKE LOWER($1)
        `, [searchPattern]);
        
        return {
          libraries: result.rows,
          totalCount: countResult.rows[0].count,
          hasNextPage: offset + limit < countResult.rows[0].count,
        };
      } catch (error) {
        throw handleDbError(error, 'searching libraries');
      }
    },
  },
  
  Mutation: {
    addLibrary: async (_, { input }) => {
      try {
        const id = uuidv4();
        
        const result = await db.query(`
          INSERT INTO libraries (id_library, name, is_editable, id_user)
          VALUES ($1, $2, $3, $4)
          RETURNING *
        `, [
          id,
          input.name,
          input.isEditable || false,
          input.idUser,
        ]);
        
        return result.rows[0];
      } catch (error) {
        throw handleDbError(error, 'creating library');
      }
    },
    
    updateLibrary: async (_, { input }) => {
      try {
        const updates = [];
        const values = [];
        let paramIndex = 1;

        if (input.name !== undefined) {
          updates.push(`name = $${paramIndex++}`);
          values.push(input.name);
        }
        if (input.isEditable !== undefined) {
          updates.push(`is_editable = $${paramIndex++}`);
          values.push(input.isEditable);
        }

        if (updates.length === 0) {
          throw new Error('No fields to update');
        }

        values.push(input.idLibrary);

        const result = await db.query(`
          UPDATE libraries
          SET ${updates.join(', ')}
          WHERE id_library = $${paramIndex}
          RETURNING *
        `, values);

        if (result.rows.length === 0) {
          throw new Error('Library not found');
        }

        return result.rows[0];
      } catch (error) {
        throw handleDbError(error, 'updating library');
      }
    },
    
    deleteAllLibrariesFromUser: async (_, { userId }) => {
      try {
        const result = await db.query(
          'DELETE FROM libraries WHERE id_user = $1 RETURNING id_library',
          [userId]
        );
        return result.rows.map(row => row.id_library);
      } catch (error) {
        throw handleDbError(error, 'deleting user libraries');
      }
    },

    deleteLibrary: async (_, { input }) => {
      try {
        const result = await db.query(
          'DELETE FROM libraries WHERE id_library = $1 RETURNING id_library',
          [input.idLibrary]
        );

        return result.rows.length > 0;
      } catch (error) {
        throw handleDbError(error, 'deleting library');
      }
    },
  },
  
  Library: {
    user: async (parent) => {
      if (!parent.id_user) return null;

      try {
        const result = await db.query(
          'SELECT id_user, name, email, pseudo, id_role, is_active, created_at, updated_at FROM users WHERE id_user = $1',
          [parent.id_user]
        );
        return result.rows[0] || null;
      } catch (error) {
        console.error('Error fetching library user:', error);
        return null;
      }
    },
  },
};