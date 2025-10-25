import db from "../../../db/connect_DB.js";
import { GraphQLError } from 'graphql';
import fetchLibraryById from '../utils_librairies.js';
import { requireAuth} from './helpers_general.js';
import bcrypt from 'bcrypt';


/** * Vérifie qu'un Utilisateur existe
 * @param {string} roleId - ID du rôle
 * @returns {Promise<object>} Le rôle trouvé
 */
export const findUserOrThrow = async (userId) => {
  const result = await db.query(
    'SELECT * FROM users WHERE id_user = $1',
    [userId]
  );

  if (result.rows.length === 0) {
    throw new GraphQLError('Utilisateur non trouvé', {
      extensions: { code: 'NOT_FOUND', httpStatus: 404 }
    });
  }

  return result.rows[0];
};

/** * Valide les données d'un Utilisateur
 * @param {object} input - Données de l'utilisateur
 * @throws {GraphQLError} Si la validation échoue
 */
export const validateUserInput = (input) => {
  // Validation du nom
  if (!input.name || typeof input.name !== 'string' || input.name.trim().length < 3) {
    throw new GraphQLError('Nom invalide (3-100 caractères)', {
      extensions: { code: 'BAD_USER_INPUT', httpStatus: 400 }
    });
  }

  if (input.name.length > 100) {
    throw new GraphQLError('Le nom ne peut pas dépasser 100 caractères', {
      extensions: { code: 'BAD_USER_INPUT', httpStatus: 400 }
    });
  }

  // Validation de l'email
  if (!input.email || typeof input.email !== 'string') {
    throw new GraphQLError('Email invalide', {
      extensions: { code: 'BAD_USER_INPUT', httpStatus: 400 }
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(input.email)) {
    throw new GraphQLError('Format d\'email invalide', {
      extensions: { code: 'BAD_USER_INPUT', httpStatus: 400 }
    });
  }

  // Validation du pseudo
  if (!input.pseudo || typeof input.pseudo !== 'string' || input.pseudo.trim().length < 3) {
    throw new GraphQLError('Pseudo invalide (3-32 caractères)', {
      extensions: { code: 'BAD_USER_INPUT', httpStatus: 400 }
    });
  }

  if (input.pseudo.length > 32) {
    throw new GraphQLError('Le pseudo ne peut pas dépasser 32 caractères', {
      extensions: { code: 'BAD_USER_INPUT', httpStatus: 400 }
    });
  }

  // Validation du mot de passe (si fourni)
  if (input.password) {
    if (typeof input.password !== 'string' || input.password.length < 6) {
      throw new GraphQLError('Le mot de passe doit contenir au moins 6 caractères', {
        extensions: { code: 'BAD_USER_INPUT', httpStatus: 400 }
      });
    }

    if (input.password.length > 72) {
      throw new GraphQLError('Le mot de passe ne peut pas dépasser 72 caractères', {
        extensions: { code: 'BAD_USER_INPUT', httpStatus: 400 }
      });
    }
  }
};

/**
    * Valide les données d'un mot de passe
    * @param {object} input - Données du mot de passe
    * @param {string} input.cleanNewPassword - Nouveau mot de passe nettoyé
    * @param {string} input.cleanOldPassword - Ancien mot de passe nettoyé
    * @param {string} input.userId - ID de l'utilisateur
    * @throws {GraphQLError} Si la validation échoue
    */
export const validatePasswordInput = async (input) => {
  const { cleanNewPassword, cleanOldPassword, userId } = input;

  // Récupérer l'utilisateur
  const result = await db.query(`
    SELECT password FROM users WHERE id_user = $1
  `, [userId]);

  if (result.rows.length === 0) {
    throw new GraphQLError('Utilisateur non trouvé', {
      extensions: { code: 'NOT_FOUND', httpStatus: 404 }
    });
  }

  // Validation du nouveau mot de passe
  if (typeof cleanNewPassword !== 'string' || cleanNewPassword.length < 6) {
    throw new GraphQLError('Le mot de passe doit contenir au moins 6 caractères', {
      extensions: { code: 'BAD_USER_INPUT', httpStatus: 400 }
    });
  }

  if (cleanNewPassword.length > 32) {
    throw new GraphQLError('Le mot de passe ne peut pas dépasser 32 caractères', {
      extensions: { code: 'BAD_USER_INPUT', httpStatus: 400 }
    });
  }

  // Validation de l'ancien mot de passe
  if (!cleanOldPassword || typeof cleanOldPassword !== 'string') {
    throw new GraphQLError('Ancien mot de passe invalide', {
      extensions: { code: 'BAD_USER_INPUT', httpStatus: 400 }
    });
  }
    /*
    // Contrôle si l'ancien mot de passe et le nouveau mot de passe sont identiques
    if (cleanOldPassword === cleanNewPassword) {
        throw new GraphQLError('Le nouveau mot de passe doit être différent de l\'ancien', {
        extensions: { code: 'BAD_USER_INPUT', httpStatus: 400 }
        });
    }
    */
}
