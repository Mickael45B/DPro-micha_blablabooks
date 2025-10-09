import db from "../db/connect_DB.js";
import { v4 as uuidv4 } from "uuid";
import { handleDbError } from '../utils/validators.js';

import fetchBookById from './utils/utils_books.js';
import fetchLibraryById from './utils/utils_librairies.js';

export default {
  Query: {
    getBooksInLibrary: async (_, { limit = 50, offset = 0, order = 'created_at', direction = 'ASC' }) => {
      try {
        const validOrders = ['created_at', 'is_read', 'is_favorite'];
        const validDirections = ['ASC', 'DESC'];
        const safeOrder = validOrders.includes(order) ? order : 'created_at';
        const safeDirection = validDirections.includes(direction?.toUpperCase()) ? direction.toUpperCase() : 'ASC';
        
        const result = await db.query(`
          SELECT * FROM bookhaslibrary
          ORDER BY ${safeOrder} ${safeDirection}
          LIMIT $1 OFFSET $2
        `, [limit, offset]);
        
        const countResult = await db.query('SELECT COUNT(*)::int as count FROM bookhaslibrary');
        const totalCount = countResult.rows[0].count;
        
        return {
          books: result.rows,
          totalCount,
          hasNextPage: offset + limit < totalCount,
        };
      } catch (error) {
        throw handleDbError(error, 'fetching books in library');
      }
    },

    getBookInLibrary: async (_, { id_book_library }) => {
      try {
        const result = await db.query(
          'SELECT * FROM bookhaslibrary WHERE id_bookhaslibrary = $1',
          [id_book_library]
        );
        return result.rows[0] || null;
      } catch (error) {
        throw handleDbError(error, 'fetching book in library');
      }
    },

    searchBooksInLibrary: async (_, { titleOrAuthor, limit = 50, offset = 0 }) => {
      try {
        const searchPattern = `%${titleOrAuthor}%`;
        
        const result = await db.query(`
          SELECT bhl.* FROM bookhaslibrary bhl
          JOIN books b ON bhl.id_book = b.id_book
          WHERE LOWER(b.title) LIKE LOWER($1) OR LOWER(b.author) LIKE LOWER($1)
          ORDER BY bhl.created_at DESC
          LIMIT $2 OFFSET $3
        `, [searchPattern, limit, offset]);
        
        const countResult = await db.query(`
          SELECT COUNT(*)::int as count FROM bookhaslibrary bhl
          JOIN books b ON bhl.id_book = b.id_book
          WHERE LOWER(b.title) LIKE LOWER($1) OR LOWER(b.author) LIKE LOWER($1)
        `, [searchPattern]);
        
        return {
          books: result.rows,
          totalCount: countResult.rows[0].count,
          hasNextPage: offset + limit < countResult.rows[0].count,
        };
      } catch (error) {
        throw handleDbError(error, 'searching books in library');
      }
    },
  },

  Mutation: {
    addBookHasLibrary: async (_, { input }) => {
      try {
        const id = uuidv4();
        const result = await db.query(`
          INSERT INTO bookhaslibrary (id_bookhaslibrary, id_book, id_library, is_read, is_favorite)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING *
        `, [
          id,
          input.bookId,
          input.libraryId,
          false,
          false
        ]);
        return result.rows[0];
      } catch (error) {
        throw handleDbError(error, 'adding book to library');
      }
    },

    updateBookHasLibrary: async (_, { input }) => {
      try {
        const updates = [];
        const values = [];
        let paramIndex = 1;

        if (input.bookId !== undefined) {
          updates.push(`id_book = $${paramIndex++}`);
          values.push(input.bookId);
        }
        if (input.libraryId !== undefined) {
          updates.push(`id_library = $${paramIndex++}`);
          values.push(input.libraryId);
        }
        if (input.isRead !== undefined) {
          updates.push(`is_read = $${paramIndex++}`);
          values.push(input.isRead);
        }
        if (input.isFavorite !== undefined) {
          updates.push(`is_favorite = $${paramIndex++}`);
          values.push(input.isFavorite);
        }

        if (updates.length === 0) {
          throw new Error('No fields to update');
        }

        values.push(input.id);

        const result = await db.query(`
          UPDATE bookhaslibrary
          SET ${updates.join(', ')}
          WHERE id_bookhaslibrary = $${paramIndex}
          RETURNING *
        `, values);

        if (result.rows.length === 0) {
          throw new Error('Book in library not found');
        }

        return result.rows[0];
      } catch (error) {
        throw handleDbError(error, 'updating book in library');
      }
    },

    deleteBookHasLibrary: async (_, { input }) => {
      try {
        const result = await db.query(
          'DELETE FROM bookhaslibrary WHERE id_bookhaslibrary = $1 RETURNING id_bookhaslibrary',
          [input.id_bookhaslibrary]
        );
        return result.rows.length > 0;
      } catch (error) {
        throw handleDbError(error, 'deleting book from library');
      }
    },

    addBooksToLibrary: async (_, { input }) => {
      const client = await db.connect();
      try {
        await client.query('BEGIN');
        const promises = input.bookIds.map(bookId => {
          const id = uuidv4();
          return client.query(`
            INSERT INTO bookhaslibrary (id_bookhaslibrary, id_book, id_library, is_read, is_favorite)
            VALUES ($1, $2, $3, $4, $5)
          `, [id, bookId, input.libraryId, false, false]);
        });
        await Promise.all(promises);
        await client.query('COMMIT');
        return true;
      } catch (error) {
        await client.query('ROLLBACK');
        throw handleDbError(error, 'adding books to library');
      } finally {
        client.release();
      }
    },  

    removeBooksFromLibrary: async (_, { input }) => {
      const client = await db.connect();
      try {
        await client.query('BEGIN');
        const promises = input.bookIds.map(bookId => {
          return client.query(`
            DELETE FROM bookhaslibrary
            WHERE id_book = $1 AND id_library = $2
          `, [bookId, input.libraryId]);
        });
        await Promise.all(promises);
        await client.query('COMMIT');
        return true;
      } catch (error) {
        await client.query('ROLLBACK');
        throw handleDbError(error, 'removing books from library');
      } finally {
        client.release();
      }
    },
  },

  BookHasLibrary: {
    book: async (parent) => {
      return fetchBookById(parent.id_book);
    },
    
    library: async (parent) => {
      return fetchLibraryById(parent.id_library);
    },
  },
};