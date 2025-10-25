import db from "../../../db/connect_DB.js";
import { GraphQLError } from 'graphql';
import fetchLibraryById from '../utils_librairies.js';
import { requireAuth} from './helpers_general.js';




/**
 * Vérifie qu'un rapport existe
 * @param {string} reportId - ID du rapport
 * @returns {Promise<object>} Le rapport trouvé
 * @throws {GraphQLError} Si non trouvé (404)
 */
export const findReportOrThrow = async (reportId) => {
  const result = await db.query(
    'SELECT * FROM reports WHERE id_report = $1',
    [reportId]
  );
  
  if (!result.rows[0]) {
    throw new GraphQLError('Rapport non trouvé', {
      extensions: { 
        code: 'NOT_FOUND',
        httpStatus: 404
      },
    });
  }
  
  return result.rows[0];
};

/**
 * Valide les données d'un rapport 
 * @param {object} input - Données du rapport
 * @throws {GraphQLError} Si validation échoue
 */
export const validateReportInput = (input) => {
 
  if (!input.reason || input.reason.trim().length < 3) {
    throw new GraphQLError('La raison du rapport doit contenir au moins 3 caractères', {
      extensions: { 
        code: 'BAD_REQUEST',
        httpStatus: 400
      },
    });
  }
    
  if (input.reason.length > 200) {
    throw new GraphQLError('La raison ne peut pas dépasser 200 caractères', {
      extensions: { 
        code: 'BAD_REQUEST',
        httpStatus: 400
      },
    });
  }

  // Validation des détails (optionnel mais avec limite)
  if (input.details && input.details.length > 1000) {
    throw new GraphQLError('Les détails ne peuvent pas dépasser 1000 caractères', {
      extensions: { 
        code: 'BAD_REQUEST',
        httpStatus: 400
      },
    });
  }

  // Validation du type de rapport
  const validReportTypes = ['user', 'comment', 'book', 'review', 'message'];
  if (!input.report_type || !validReportTypes.includes(input.report_type.toLowerCase())) {
    throw new GraphQLError('Type de rapport invalide', {
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

  if (!input.reported_id || input.reported_id.trim().length === 0) {
    throw new GraphQLError('ID de l\'élément signalé manquant', {
      extensions: { 
        code: 'BAD_REQUEST',
        httpStatus: 400
      },
    });
  }

};

