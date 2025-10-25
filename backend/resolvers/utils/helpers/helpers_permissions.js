import db from "../../../db/connect_DB.js";
import { GraphQLError } from 'graphql';
import fetchLibraryById from '../utils_librairies.js';
import { requireAuth} from './helpers_general.js';

/**
 * Vérifie qu'un message existe
 * @param {string} messageId - ID du message
 * @returns {Promise<object>} Le message trouvé
 * @throws {GraphQLError} Si non trouvé (404)
 */
export const findPermissionsOrThrow = async (permissionId) => {
  const result = await db.query(
    'SELECT * FROM permissions WHERE id_permission = $1',
    [permissionId]
  );
  
  if (!result.rows[0]) {
    throw new GraphQLError('Permission non trouvé', {
      extensions: { 
        code: 'NOT_FOUND',
        httpStatus: 404
      },
    });
  }
  
  return result.rows[0];
};

/**
 * Valide les données d'un message
 * @param {object} input - Données du message
 * @throws {GraphQLError} Si validation échoue
 */
export const validatePermissionInput = (name) => {
if (!name || name.trim().length < 3) {
    throw new GraphQLError('La permission doit contenir au moins 3 caractères', {
      extensions: { 
        code: 'BAD_REQUEST',
        httpStatus: 400
      },
    });
  }
    
  if (name.length > 100) {
    throw new GraphQLError('La permission ne peut pas dépasser 100 caractères', {
      extensions: { 
        code: 'BAD_REQUEST',
        httpStatus: 400
      },
    });
  }
};

