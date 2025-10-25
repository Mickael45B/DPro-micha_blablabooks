import db from "../../../db/connect_DB.js";
import { GraphQLError } from 'graphql';
import fetchLibraryById from '../utils_librairies.js';
import { requireAuth} from './helpers_general.js';


/** * Vérifie qu'un rôle existe
 * @param {string} roleId - ID du rôle
 * @returns {Promise<object>} Le rôle trouvé
 */
export const findRolePermissionOrThrow = async (roleId) => {

  const result = await db.query(`
    SELECT * FROM rolehaspermissions WHERE id_rolehaspermission = $1
  `, [roleId]);

  if (result.rows.length === 0) {
    throw new GraphQLError('Relation non trouvée', {
      extensions: { code: 'NOT_FOUND', httpStatus: 404 }
    });
  }

  return result.rows[0];
};

/** 
 * Valide les données d'un rôle
 * @param {object} input - Données de la relation
 * @throws {GraphQLError} Si la validation échoue
 */
export const validateRolePermissionInput = (input) => {
  // Validation des IDs requis
  if (!input.id_role || input.id_role.trim().length === 0) {
    throw new GraphQLError('ID du rôle requis', {
      extensions: { code: 'BAD_USER_INPUT', httpStatus: 400 }
    });
  }

  if (!input.id_permission || input.id_permission.trim().length === 0) {
    throw new GraphQLError('ID de la permission requis', {
      extensions: { code: 'BAD_USER_INPUT', httpStatus: 400 }
    });
  }

};