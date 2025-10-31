import db from "../db/connect_DB.js";
import { v4 as uuidv4 } from "uuid";
import { validateOrderParams, handleDbError } from '../utils/validators.js';
import { fetchUserById } from './utils/utils_users.js';
import fetchBookById from './utils/utils_books.js'; 
import sanitizeHtml from 'sanitize-html';
import { GraphQLError } from 'graphql';
import fetchLibraryById from './utils/utils_librairies.js';

import { isAuthenticated, requireAuth, requireAdmin, requireOwnershipOrAdmin, sanitizeString, sanitizeInput, flattenEdges, makePageInfo, makeEdgeFromBook, withErrorHandling } from './utils/helpers/helpers_general.js';

import { findReviewOrThrow, validateReviewInput} from './utils/helpers/helpers_Reviews.js';
import { console } from "node:inspector";

import {getReviewsSchema, getReviewSchema, searchReviewsSchema, addReviewSchema, updateReviewSchema, deleteReviewSchema } from '../schema/schemas_joi/reviewSchema.js';


export default {
  Query: {
    /**
     * Récupère les avis avec pagination et tri
     * 🔒 Route protégée (administrateur uniquement)
       * @param {number} limit - Limite de résultats (max 100)
       * @param {number} offset - Décalage pour pagination
       * @param {string} order - Champ de tri
       * @param {string} direction - Direction du tri (ASC/DESC)
       * @returns {object} { avis, totalCount, hasNextPage, httpStatus }
       * @throws {GraphQLError} Si l'utilisateur n'a pas les droits (401 ou 403)  
       * @throws {GraphQLError} Si une erreur se produit lors de la récupération des avis (500)
     */
    getReviews: withErrorHandling(
      async (_, args, context) => {
        /* exemple context JWT décodé ( à revoir):
        {
          userId: "uuid-of-user",
          email: "user@example.com",
          role: "admin"
        }
        */
        /*exemple de requête :
        query {getReviews{reviews{id_review, id_user, book{title, author}, title_rating, rating, comment, created_at, updated_at}}}
        */
        /* Exemple variables :
        {
        }
        */
    
        // Vérification des droits d'accès
        requireAuth(context);

        // Extraction et validation des paramètres de pagination et de tri
        const { limit = 150, offset = 0, order = 'created_at', direction = 'DESC' } = args;

        // Sanitize inputs
        const cleanLimit = Math.min(Math.max(parseInt(limit) || 150, 1), 1000);
        const cleanOffset = Math.max(parseInt(offset) || 0, 0);
        const validOrders = ['created_at', 'rating', 'id_book', 'id_user'];
        const { order: safeOrder, direction: safeDirection } = validateOrderParams(
          sanitizeString(order), 
          sanitizeString(direction), 
          validOrders
        );
        
        const result = await db.query(`
          SELECT id_review, id_user, id_book, title_rating, rating, comment, created_at, updated_at
          FROM reviews
          ORDER BY ${safeOrder} ${safeDirection}
          LIMIT $1 OFFSET $2
        `, [cleanLimit, cleanOffset]);

        const countResult = await db.query("SELECT COUNT(*)::int as count FROM reviews");
        const totalCount = countResult.rows[0].count;

        return {
          reviews: result.rows,
          totalCount,
          hasNextPage: cleanOffset + cleanLimit < totalCount,
          httpStatus: 200
        };
    
      },
      'Erreur lors de la récupération des avis'
    ),
    
    /**
     * Récupère un avis par son ID
     * 🔒 Route protégée (utilisateur authentifié)
     * @param {string} id_review - ID de l'avis
     * @returns {object|null} Avis ou null si non trouvé
     * @throws {GraphQLError} Si l'utilisateur n'est pas authentifié (401)
     * @throws {GraphQLError} Si une erreur se produit lors de la récupération de l'avis (500)
     */
    getReview: withErrorHandling(
      async (_, { id_review }, context) => {
        /* exemple context JWT décodé ( à revoir):
        {
          userId: "uuid-of-user",
          email: "user@example.com",
          role: "admin"
        }
        */
        /*exemple de requête :
        query  getReview($id_review: ID!) {getReview(id_review: $id_review) {id_review,id_user,book{title,author},title_rating,rating,comment,created_at,updated_at}}

        */
        /* Exemple variables :
        {"id_review": "1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n1o6p"}
        */
    
        // Vérification des droits d'accès
        requireAuth(context);

        // Sanitize input
        const cleanIdReview = sanitizeString(id_review);

        if (!cleanIdReview) {
          throw new GraphQLError('ID de l\'avis manquant', {
            extensions: { code: 'BAD_USER_INPUT', httpStatus: 400 }
          });
        }

        const review = await findReviewOrThrow(cleanIdReview);

        if (context?.res?.status) context.res.status(200);
        return review;
      },
      "Erreur lors de la récupération de l'avis"
    ),
    
    /**
     * Recherche des avis par contenu avec pagination
     * 🔒 Route protégée (utilisateur authentifié)
     * @param {string} content - Contenu à rechercher dans le titre ou le commentaire
     * @param {number} limit - Limite de résultats (max 100)
     * @param {number} offset - Décalage pour pagination
     * @returns {object} { avis, totalCount, hasNextPage, httpStatus }
     * @throws {GraphQLError} Si l'utilisateur n'est pas authentifié (401)
     * @throws {GraphQLError} Si une erreur se produit lors de la recherche des avis (500)
     */
    searchReviews: withErrorHandling(
      async (_, args, context) => {
        /* exemple context JWT décodé ( à revoir):
        {
          userId: "uuid-of-user",
          email: "user@example.com",
          role: "admin"
        }
        */
        /*exemple de requête :
        query searchReviews($content: String!) { searchReviews(content: $content) { totalCount, reviews{id_review,id_user,book{title,author},title_rating,rating,comment,created_at,updated_at} }}
        */
        /* Exemple variables :
        {"content": "bien"}
        */

        // Vérification des droits d'accès
        requireAuth(context);

        // Extraction et validation des paramètres de pagination et de tri
        const { limit = 50, offset = 0, order = 'created_at', direction = 'DESC', content } = args;

        // Sanitize inputs
        const cleanLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 100);
        const cleanOffset = Math.max(parseInt(offset) || 0, 0);
        const validOrders = ['created_at', 'rating', 'updated_at', 'title_rating'];
        const { order: safeOrder, direction: safeDirection } = validateOrderParams(
          sanitizeString(order), 
          sanitizeString(direction), 
          validOrders
        );
        const cleanComment = sanitizeString(content || '');

        if (!cleanComment) {
          throw new GraphQLError('Commentaire manquant', {
            extensions: { code: 'BAD_USER_INPUT', httpStatus: 400 }
          });
        }

        const searchPattern = `%${cleanComment}%`;

        const result = await db.query(`
          SELECT id_review, id_user, id_book, title_rating, rating, comment, created_at, updated_at
          FROM reviews
          WHERE LOWER(COALESCE(title_rating, '')) LIKE LOWER($1) OR LOWER(COALESCE(comment, '')) LIKE LOWER($1)
          ORDER BY ${safeOrder} ${safeDirection}
          LIMIT $2 OFFSET $3
        `, [searchPattern, cleanLimit, cleanOffset]);

        const countResult = await db.query(`
          SELECT COUNT(*)::int as count FROM reviews
          WHERE LOWER(COALESCE(title_rating, '')) LIKE LOWER($1) OR LOWER(COALESCE(comment, '')) LIKE LOWER($1)
        `, [searchPattern]);

        return {
          reviews: result.rows,
          totalCount: countResult.rows[0].count,
          hasNextPage: cleanOffset + cleanLimit < countResult.rows[0].count,
          httpStatus: 200
        };    
      },
      'Erreur lors de la recherche des avis'
    ),
    
  },

  Mutation: {
    /**
     * Ajoute un nouvel avis
     * 🔒 Route protégée (utilisateur authentifié)
     * @param {object} input - Données de l'avis
     * @param {string} input.id_user - ID de l'utilisateur (doit correspondre à l'utilisateur connecté)
     * @param {string} input.id_book - ID du livre
     * @param {string} input.title_rating - Titre de l'avis
     * @param {number} input.rating - Note (1-5)
     * @param {string} input.comment - Commentaire de l'avis
     * @returns {object} Avis créé
     * @throws {GraphQLError} Si l'utilisateur n'est pas authentifié (401)
     * @throws {GraphQLError} Si les données d'entrée sont invalides (400)
     * @throws {GraphQLError} Si une erreur se produit lors de la création de l'avis (500)
     */
    addReview: withErrorHandling(
      async (_, { input }, context) => {
        /* exemple context JWT décodé ( à revoir):
        {
          userId: "uuid-of-user",
          email: "user@example.com",
          role: "admin"
        }
        */
        /*exemple de requête :
        mutation addReview($input: CreateReviewInput!) { addReview(input: $input) {id_review, id_user, id_book, title_rating, comment, rating} }

        */
        /* Exemple variables :
        { "input": {
          id_user: "1e2d3c4b-5a6f-7e8d-9c0b-1a2f3e4d5c6b"
          id_book: "3c4d5e6f-7g8h-9i0j-1k2l-3m4n5o6p7q8r"
          title_rating: "Mon avis sur le livre"
          comment: "C'est un excellent livre que je recommande à tous."
          rating: 5
        }
        }        
        */
    
        // Vérification de l'authentification de l'utilisateur
        requireAuth(context);

        const currentUserId = context?.user?.id ?? context?.user?.id_user ?? null;
        if (!currentUserId) {
          throw new GraphQLError('Utilisateur non authentifié', {
            extensions: { code: 'UNAUTHENTICATED', httpStatus: 401 }
          });
        }

        // Vérifier que l'utilisateur crée un avis pour lui-même
        if (currentUserId !== input.id_user) {
          throw new GraphQLError('Vous ne pouvez créer un avis qu\'en votre nom', {
            extensions: { code: 'FORBIDDEN', httpStatus: 403 }
          });
        }

        // Sanitize inputs AVANT validation
        const cleanInput = {
          id_user: sanitizeString(input.id_user),
          id_book: sanitizeString(input.id_book),
          title_rating: sanitizeString(input.title_rating),
          rating: parseInt(input.rating), 
          comment: sanitizeString(input.comment || ''),
        };

        // Vérifier que le livre existe
        await fetchBookById(cleanInput.id_book);
        
        // Validation des données d'entrée
        validateReviewInput(cleanInput);

        const id = uuidv4();

        const result = await db.query(`
          INSERT INTO reviews (id_review, id_user, id_book, title_rating, rating, comment) 
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *
        `, [id, cleanInput.id_user, cleanInput.id_book, cleanInput.title_rating, cleanInput.rating, cleanInput.comment]);

        if (context?.res?.status) context.res.status(201);
        return result.rows[0];
    
      },
      "Erreur lors de l'ajout de l'avis"
    ),
    
    /**
     * Met à jour un avis existant
     * 🔒 Route protégée (propriétaire de l'avis ou administrateur)
     * @param {object} input - Données de l'avis à mettre à jour
     * @param {string} input.id_review - ID de l'avis à mettre à jour
     * @param {string} [input.title_rating] - Nouveau titre de l'avis
     * @param {number} [input.rating] - Nouvelle note (1-5)
     * @param {string} [input.comment] - Nouveau commentaire
     * @returns {object} Avis mis à jour
     * @throws {GraphQLError} Si l'utilisateur n'est pas authentifié (401)
     * @throws {GraphQLError} Si une erreur se produit lors de la mise à jour de l'avis (500)
     */
    updateReview: withErrorHandling(
      async (_, { input }, context) => {
        /* exemple context JWT décodé ( à revoir):
        {
          userId: "uuid-of-user",
          email: "user@example.com",
          role: "admin"
        }
        */
        /*exemple de requête :
        mutation updateReview($input: UpdateReviewInput!) { updateReview(input: $input) {review{id_review, id_user, id_book, title_rating, comment, rating, created_at, updated_at}, httpStatus} }

        */
        /* Exemple variables :
        { "input": 
        {
          "id_review": "4bb6dccc-14fb-4e50-985d-e49405785e28",
          "title_rating": "toto au travail",
          "comment": "Mise à jour de mon avis",
          "rating": 5
        }
        }       
        */
    
        // Sanitize input
        const cleanIdReview = sanitizeString(input.id_review);

        if (!cleanIdReview) {
          throw new GraphQLError('ID de l\'avis manquant', {
            extensions: { code: 'BAD_USER_INPUT', httpStatus: 400 }
          });
        }

        // Vérification de l'existence de l'avis
        const existingReview = await findReviewOrThrow(cleanIdReview);

        // Vérification de l'authentification de l'utilisateur
        requireOwnershipOrAdmin(existingReview.id_user, context);

        // Construction SÉCURISÉE de la requête UPDATE avec paramètres positionnels
        const updates = [];
        const values = [];
        let paramIndex = 1;

        if (input.title_rating !== undefined) {
          const cleanTitle = sanitizeString(input.title_rating);
          if (cleanTitle.trim().length < 3 || cleanTitle.length > 100) {
            throw new GraphQLError('Titre invalide (3-100 caractères)', {
              extensions: { code: 'BAD_USER_INPUT', httpStatus: 400 }
            });
          }
          updates.push(`title_rating = $${paramIndex++}`);
          values.push(cleanTitle);
        }

        if (input.rating !== undefined) {
          const cleanRating = parseInt(input.rating);
          if (isNaN(cleanRating) || cleanRating < 1 || cleanRating > 5) {
            throw new GraphQLError('Note invalide (1-5)', {
              extensions: { code: 'BAD_USER_INPUT', httpStatus: 400 }
            });
          }
          updates.push(`rating = $${paramIndex++}`);
          values.push(cleanRating);
        }

        if (input.comment !== undefined) {
          const cleanComment = sanitizeString(input.comment || '');
          if (cleanComment.length > 2000) {
            throw new GraphQLError('Commentaire trop long (max 2000)', {
              extensions: { code: 'BAD_USER_INPUT', httpStatus: 400 }
            });
          }
          updates.push(`comment = $${paramIndex++}`);
          values.push(cleanComment);
        }

        if (updates.length === 0) {
          throw new GraphQLError("Aucun champ à mettre à jour", {
            extensions: { code: 'BAD_USER_INPUT', httpStatus: 400 }
          });
        }

        // Ajouter updated_at
        updates.push(`updated_at = CURRENT_TIMESTAMP`);

        // Ajouter l'ID comme dernier paramètre
        values.push(cleanIdReview);

        const result = await db.query(`
          UPDATE reviews
          SET ${updates.join(", ")}
          WHERE id_review = $${paramIndex}
          RETURNING *
        `, values);

        if (result.rows.length === 0) {
          throw new GraphQLError("Avis non trouvé", {
            extensions: { code: 'NOT_FOUND', httpStatus: 404 }
          });
        }

        if (context?.res?.status) context.res.status(200);
        // Return the Review object directly to match the GraphQL schema
        return result.rows[0];
    
    
    
    
    
    
    
    
    
    
      },
      "Erreur lors de la mise à jour de l'avis"
    ),
    
    /**     
     * Supprime un avis
     * 🔒 Route protégée (propriétaire de l'avis ou administrateur)
     * @param {object} input - Données de l'avis à supprimer
     * @param {string} input.id_review - ID de l'avis à supprimer
     * @returns {boolean} true si l'avis a été supprimé, false sinon
     * @throws {GraphQLError} Si l'utilisateur n'est pas authentifié (401)
     * @throws {GraphQLError} Si une erreur se produit lors de la suppression de l'avis (500)
     */
    deleteReview: withErrorHandling(
      async (_, args, context) => {
        /* exemple context JWT décodé ( à revoir):
          {
            userId: "uuid-of-user",
            email: "user@example.com",
            role: "admin"
          }
        */
        /*exemple de requête :
            mutation deleteReview($input: DeleteReviewInput!) { deleteReview(input: $input) }
        */
        /* Exemple variables :
          {"input": {"id_review":"4bb6dccc-14fb-4e50-985d-e49405785e28"} }
        */

        const { input } = args;
        
        // Vérification de l'authentification de l'utilisateur
        requireOwnershipOrAdmin(existingReview.id_user, context);

        // Sanitize input
        const cleanIdReview = sanitizeString(input.id_review);

        if (!cleanIdReview) {
          throw new GraphQLError('ID de l\'avis manquant', {
            extensions: { code: 'BAD_USER_INPUT', httpStatus: 400 }
          });
        }

        // Vérification de l'existence de l'avis
        const existingReview = await findReviewOrThrow(cleanIdReview);
        
        const result = await db.query(
          "DELETE FROM reviews WHERE id_review = $1 RETURNING id_review",
          [cleanIdReview] 
        );

        if (context && context.res && typeof context.res.status === 'function') {
          context.res.status(200);
        }

        return true;
      },
      "Erreur lors de la suppression de l'avis"
    ),
    
  },

  Review: {
    user: async (parent) => {
      return fetchUserById(parent.id_user);
    },

    book: async (parent) => {
      return fetchBookById(parent.id_book);
    },
  },
};
