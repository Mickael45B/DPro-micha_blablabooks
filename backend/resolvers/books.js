import db from "../db/connect_DB.js";
import { v4 as uuidv4 } from 'uuid';
import { validateOrderParams, handleDbError } from '../utils/validators.js';

export default {
  Query: {
    // Récupérer les livres avec pagination et tri
    getBooks: async (_, { limit = 50, offset = 0, order = 'created_at', direction = 'ASC' }) => {
      try {
        const validOrders = ['created_at', 'title', 'author', 'avg_rating', 'nb_reviews', 'is_in_favorite', 'publication_date'];// Definir les colonnes valides pour le tri
        const { order: safeOrder, direction: safeDirection } = validateOrderParams(order, direction, validOrders);// Valider les paramètres de tri

        // Requête SQL avec tri et pagination 
        const result = await db.query(`
          SELECT * FROM books
          ORDER BY ${safeOrder} ${safeDirection}
          LIMIT $1 OFFSET $2
        `, [limit, offset]);
        
        const countResult = await db.query('SELECT COUNT(*)::int as count FROM books');// Obtenir le nombre total de livres
        const totalCount = countResult.rows[0].count;// Nombre total de livres

        // Transformer les résultats en une structure conforme à BookConnection
        const books = result.rows.map((book) => ({
          node: book, // Chaque livre devient un "node"
          cursor: Buffer.from(book.id_book).toString('base64'), // Générer un curseur basé sur l'ID
        }));

        // Retourner les résultats avec les informations de pagination
        return {
          books,
          pageInfo: {
            hasNextPage: offset + limit < totalCount,
            hasPreviousPage: offset > 0,
            startCursor: books.length > 0 ? books[0].cursor : null,
            endCursor: books.length > 0 ? books[books.length - 1].cursor : null,
          },
          totalCount,
        };
      } catch (error) {
        throw handleDbError(error, 'fetching books');// Gérer les erreurs de la base de données
      }
    },

    getBook: async (_, { id_book }) => {
      try {
        const result = await db.query(
          'SELECT * FROM books WHERE id_book = $1',
          [id_book]
        );
        return result.rows[0] || null;
      } catch (error) {
        throw handleDbError(error, 'fetching book');
      }
    },

    searchBooks: async (_, { titleOrAuthor, limit = 50, offset = 0 }) => {
      try {
        const searchPattern = `%${titleOrAuthor}%`;

        const result = await db.query(`
          SELECT * FROM books
          WHERE LOWER(title) LIKE LOWER($1) OR LOWER(author) LIKE LOWER($1)
          ORDER BY avg_rating DESC NULLS LAST, nb_reviews DESC
          LIMIT $2 OFFSET $3
        `, [searchPattern, limit, offset]);
        
        const countResult = await db.query(`
          SELECT COUNT(*)::int as count FROM books
          WHERE LOWER(title) LIKE LOWER($1) OR LOWER(author) LIKE LOWER($1)
        `, [searchPattern]);
        
        return {
          books: result.rows,
          totalCount: countResult.rows[0].count,
          hasNextPage: offset + limit < countResult.rows[0].count,
        };
      } catch (error) {
        throw handleDbError(error, 'searching books');
      }
    },
  },
  
  Mutation: {
    addBook: async (_, { input }) => {
      try {
        const id = uuidv4();

        const result = await db.query(`
          INSERT INTO books (
            id_book, title, author, publication_date, genre, isbn, 
            editor, vignetteimage, bookimage, age_limit, description, series
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          RETURNING *
        `, [
          id,
          input.title,
          input.author || null,
          input.publicationDate || null,
          input.genre || null,
          input.isbn || null,
          input.editor || null,
          input.vignetteImage || null,
          input.bookImage || null,
          input.ageLimit || null,
          input.description || null,
          input.series || null
        ]);

        return result.rows[0];
      } catch (error) {
        throw handleDbError(error, 'creating book');
      }
    },

    updateBook: async (_, { input }) => {
      try {
        const updates = [];
        const values = [];
        let paramIndex = 1;

        if (input.title !== undefined) {
          updates.push(`title = $${paramIndex++}`);
          values.push(input.title);
        }
        if (input.author !== undefined) {
          updates.push(`author = $${paramIndex++}`);
          values.push(input.author);
        }
        if (input.publicationDate !== undefined) {
          updates.push(`publication_date = $${paramIndex++}`);
          values.push(input.publicationDate);
        }
        if (input.genre !== undefined) {
          updates.push(`genre = $${paramIndex++}`);
          values.push(input.genre);
        }
        if (input.isbn !== undefined) {
          updates.push(`isbn = $${paramIndex++}`);
          values.push(input.isbn);
        }
        if (input.editor !== undefined) {
          updates.push(`editor = $${paramIndex++}`);
          values.push(input.editor);
        }
        if (input.vignetteImage !== undefined) {
          updates.push(`vignetteimage = $${paramIndex++}`);
          values.push(input.vignetteImage);
        }
        if (input.bookImage !== undefined) {
          updates.push(`bookimage = $${paramIndex++}`);
          values.push(input.bookImage);
        }
        if (input.ageLimit !== undefined) {
          updates.push(`age_limit = $${paramIndex++}`);
          values.push(input.ageLimit);
        }
        if (input.description !== undefined) {
          updates.push(`description = $${paramIndex++}`);
          values.push(input.description);
        }
        if (input.series !== undefined) {
          updates.push(`series = $${paramIndex++}`);
          values.push(input.series);
        }

        if (updates.length === 0) {
          throw new Error('No fields to update');
        }

        values.push(input.idBook);

        const result = await db.query(`
          UPDATE books
          SET ${updates.join(', ')}
          WHERE id_book = $${paramIndex}
          RETURNING *
        `, values);

        if (result.rows.length === 0) {
          throw new Error('Book not found');
        }

        return result.rows[0];
      } catch (error) {
        throw handleDbError(error, 'updating book');
      }
    },

    deleteBook: async (_, { input }) => {
      try {
        const result = await db.query(
          'DELETE FROM books WHERE id_book = $1 RETURNING id_book',
          [input.id_book]
        );

        return result.rows.length > 0;
      } catch (error) {
        throw handleDbError(error, 'deleting book');
      }
    },
  },

  Book: {},
};
