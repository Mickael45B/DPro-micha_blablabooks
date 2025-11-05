import db from "../../../db/connect_DB.js";
import { GraphQLError } from 'graphql';


// ========================================
// HELPERS DE VALIDATION
// ========================================

/**
 * Vérifie qu'une bibliothèque existe
 * @param {string} libraryId - ID de la bibliothèque
 * @returns {Promise<object>} La bibliothèque trouvée
 * @throws {GraphQLError} Si non trouvée (404)
 */
export const findLibraryOrThrow = async (libraryId) => {
  const result = await db.query(
    'SELECT id_library, name, is_editable, id_user, created_at, updated_at FROM libraries WHERE id_library = $1',
    [libraryId]
  );
  
  if (!result.rows[0]) {
    throw new GraphQLError('Bibliothèque non trouvée', {
      extensions: { 
        code: 'NOT_FOUND',
        httpStatus: 404
      },
    });
  }
  
  return result.rows[0];
};

/**
 * Vérifie qu'une bibliothèque est modifiable
 * @param {object} library - Objet bibliothèque
 * @throws {GraphQLError} Si non modifiable
 */
export const requireEditableLibrary = (library) => {
  if (!library.is_editable) {
    throw new GraphQLError('Cette bibliothèque n\'est pas modifiable', {
      extensions: { 
        code: 'FORBIDDEN',
        httpStatus: 403
      },
    });
  }
};


/** * Vérifie la propriété d'une bibliothèque et les droits d'accès
 * @param {string} libraryId - ID de la bibliothèque
 * @param {object} context - Contexte GraphQL 
 * @returns {Promise<object>} La bibliothèque si accessible
 */
export const findUserOrThrow = async (user) => {
  // Cherche de l'utilisateur dans la base de données
  const result = await db.query(
    'SELECT id_user, username, email, role FROM users WHERE id_user = $1',
    [user.id_user]
  );
  if (!result.rows[0]) {
    throw new GraphQLError('Utilisateur non trouvé', {
      extensions: {
        code: 'NOT_FOUND',
        httpStatus: 404
      },
    });
  }
  return result.rows[0];
};