import db from "../../../db/connect_DB.js";
import { GraphQLError } from 'graphql';
import fetchLibraryById from '../utils_librairies.js';
import { requireAuth} from './helpers_general.js';




/**
 * Vérifie qu'un rapport existe
 * @param {string} reviewId - ID du rapport
 * @returns {Promise<object>} L'avis trouvé
 * @throws {GraphQLError} Si non trouvé (404)
 */
export const findReviewOrThrow = async (reviewId) => {
  const result = await db.query(
    'SELECT * FROM reviews WHERE id_review = $1',
    [reviewId]
  );
  
  if (!result.rows[0]) {
    throw new GraphQLError('Avis non trouvé', {
      extensions: { 
        code: 'NOT_FOUND',
        httpStatus: 404
      },
    });
  }
  
  return result.rows[0];
};

/**
 * Valide les données d'un avis 
 * @param {object} input - Données de l'avis
 * @throws {GraphQLError} Si validation échoue
 */
export const validateReviewInput = (input) => {
 
  if (!input.title_rating || input.title_rating.trim().length < 3) {    
    throw new GraphQLError('Le titre de l\'avis doit contenir au moins 3 caractères', {
      extensions: { 
        code: 'BAD_REQUEST',
        httpStatus: 400
      },
    });
  }
  
  if (input.title_rating.length > 100) {
    throw new GraphQLError('Le titre de l\'avis ne peut pas dépasser 100 caractères', {
      extensions: { 
        code: 'BAD_REQUEST',
        httpStatus: 400
      },
    });
  }
  
  if (typeof input.rating !== 'number' || input.rating < 1 || input.rating > 5) {
    throw new GraphQLError('La note doit être un nombre entre 1 et 5', {
      extensions: {
        code: 'BAD_REQUEST',
        httpStatus: 400
      },
    });
  }

  //  Validation du commentaire (optionnel mais limité)
  if (input.comment && input.comment.length > 2000) {
    throw new GraphQLError('Le commentaire ne peut pas dépasser 2000 caractères', {
      extensions: {
        code: 'BAD_REQUEST',
        httpStatus: 400
      },
    });
  }

  // Validation des IDs requis
  if (!input.id_user || input.id_user.trim().length === 0) {
    throw new GraphQLError('ID utilisateur manquant', {
      extensions: {
        code: 'BAD_REQUEST',
        httpStatus: 400
      },
    });
  }

  if (!input.id_book || input.id_book.trim().length === 0) {
    throw new GraphQLError('ID du livre manquant', {
      extensions: {
        code: 'BAD_REQUEST',
        httpStatus: 400
      },
    });
  }
};