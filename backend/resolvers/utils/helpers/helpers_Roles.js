import db from "../../../db/connect_DB.js";
import { GraphQLError } from 'graphql';
import fetchLibraryById from '../utils_librairies.js';
import { requireAuth} from './helpers_general.js';


/** * Vérifie qu'un rôle existe
 * @param {string} roleId - ID du rôle
 * @returns {Promise<object>} Le rôle trouvé
 */
export const findRolesOrThrow = async (roleId) => {
  const result = await db.query(`
    SELECT * FROM roles WHERE id_role = $1
  `, [roleId]);

  if (result.rows.length === 0) {
    throw new GraphQLError('Rôle non trouvé', {
      extensions: { code: 'NOT_FOUND', httpStatus: 404 }
    });
  }

  return result.rows[0];
};

/** * Valide les données d'un rôle
 * @param {object} input - Données du rôle
 * @throws {GraphQLError} Si la validation échoue
 */
export const validateRolesInput = (input) => {
  const { role_name } = input;

  if (!role_name || typeof role_name !== 'string') {
    throw new GraphQLError('Nom de rôle invalide', {
      extensions: { code: 'BAD_USER_INPUT', httpStatus: 400 }
    });
  }

  if (role_name.trim().length < 3) {
    throw new GraphQLError('Le nom du rôle doit contenir au moins 3 caractères', {
      extensions: { 
        code: 'BAD_REQUEST',
        httpStatus: 400
      },
    });
  }
  
  if (role_name.length > 100) {
    throw new GraphQLError('Le nom du rôle ne peut pas dépasser 100 caractères', {
      extensions: { 
        code: 'BAD_REQUEST',
        httpStatus: 400
      },
    });
  }
  // ✅ Ne rien retourner (juste valider)
};