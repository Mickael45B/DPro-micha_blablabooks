import db from "../db/connect_DB.js";
import { v4 as uuidv4 } from "uuid";
import { validateOrderParams, handleDbError } from '../utils/validators.js';

export default {
  Query: {
    getReviews: async (_, { limit = 50, offset = 0, order = "created_at", direction = "ASC" }) => {
      try {
        const validOrders = ['created_at', 'rating', 'id_book', 'id_user'];
        const { order: safeOrder, direction: safeDirection } = validateOrderParams(order, direction, validOrders);
        
        const result = await db.query(`
          SELECT * FROM reviews
          ORDER BY ${safeOrder} ${safeDirection}
          LIMIT $1 OFFSET $2
        `, [limit, offset]);

        const countResult = await db.query("SELECT COUNT(*)::int as count FROM reviews");
        const totalCount = countResult.rows[0].count;

        return {
          reviews: result.rows,
          totalCount,
          hasNextPage: offset + limit < totalCount,
        };
      } catch (error) {
        throw handleDbError(error, 'fetching reviews');
      }
    },

    getReview: async (_, { id_review }) => {
      try {
        const result = await db.query(
          "SELECT * FROM reviews WHERE id_review = $1",
          [id_review]
        );
        return result.rows[0] || null;
      } catch (error) {
        throw handleDbError(error, 'fetching review');
      }
    },

    searchReviews: async (_, { content, limit = 50, offset = 0 }) => {
      try {
        const searchPattern = `%${content}%`;

        const result = await db.query(`
          SELECT * FROM reviews
          WHERE LOWER(title_rating) LIKE LOWER($1) OR LOWER(comment) LIKE LOWER($1)
          ORDER BY created_at DESC
          LIMIT $2 OFFSET $3
        `, [searchPattern, limit, offset]);

        const countResult = await db.query(`
          SELECT COUNT(*)::int as count FROM reviews
          WHERE LOWER(title_rating) LIKE LOWER($1) OR LOWER(comment) LIKE LOWER($1)
        `, [searchPattern]);

        return {
          reviews: result.rows,
          totalCount: countResult.rows[0].count,
          hasNextPage: offset + limit < countResult.rows[0].count,
        };
      } catch (error) {
        throw handleDbError(error, 'searching reviews');
      }
    },
  },

  Mutation: {
    addReview: async (_, { input }) => {
      try {
        const id = uuidv4();

        const result = await db.query(`
          INSERT INTO reviews (id_review, id_user, id_book, title_rating, rating, comment)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *
        `, [id, input.idUser, input.idBook, input.titleRating, input.rating, input.comment]);

        return result.rows[0];
      } catch (error) {
        throw handleDbError(error, 'creating review');
      }
    },

    updateReview: async (_, { input }) => {
      try {
        const updates = [];
        const values = [];
        let paramIndex = 1;

        if (input.titleRating !== undefined) {
          updates.push(`title_rating = ${paramIndex++}`);
          values.push(input.titleRating);
        }
        if (input.rating !== undefined) {
          updates.push(`rating = ${paramIndex++}`);
          values.push(input.rating);
        }
        if (input.comment !== undefined) {
          updates.push(`comment = ${paramIndex++}`);
          values.push(input.comment);
        }

        if (updates.length === 0) {
          throw new Error("No fields to update");
        }

        values.push(input.idReview);

        const result = await db.query(`
          UPDATE reviews
          SET ${updates.join(", ")}
          WHERE id_review = ${paramIndex}
          RETURNING *
        `, values);

        if (result.rows.length === 0) {
          throw new Error("Review not found");
        }

        return result.rows[0];
      } catch (error) {
        throw handleDbError(error, 'updating review');
      }
    },

    deleteReview: async (_, { input }) => {
      try {
        const result = await db.query(
          "DELETE FROM reviews WHERE id_review = $1 RETURNING id_review",
          [input.idReview]
        );

        return result.rows.length > 0;
      } catch (error) {
        throw handleDbError(error, 'deleting review');
      }
    },
  },

  Review: {
    user: async (parent) => {
      if (!parent.id_user) return null;
      try {
        const result = await db.query(
          "SELECT id_user, name, email, pseudo, id_role, is_active, created_at, updated_at FROM users WHERE id_user = $1",
          [parent.id_user]
        );
        return result.rows[0] || null;
      } catch (error) {
        console.error("Error fetching review user:", error);
        return null;
      }
    },

    book: async (parent) => {
      if (!parent.id_book) return null;
      try {
        const result = await db.query(
          "SELECT * FROM books WHERE id_book = $1",
          [parent.id_book]
        );
        return result.rows[0] || null;
      } catch (error) {
        console.error("Error fetching review book:", error);
        return null;
      }
    },
  },
};
