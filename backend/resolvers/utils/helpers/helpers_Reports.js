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
if (!input.report_termSearch || input.report_termSearch.trim().length < 3) {
    throw new GraphQLError('Le rapport doit contenir au moins 3 caractères', {
      extensions: { 
        code: 'BAD_REQUEST',
        httpStatus: 400
      },
    });
  }
    
  if (input.report_termSearch.length > 100) {
    throw new GraphQLError('Le rapport ne peut pas dépasser 100 caractères', {
      extensions: { 
        code: 'BAD_REQUEST',
        httpStatus: 400
      },
    });
  }
};

