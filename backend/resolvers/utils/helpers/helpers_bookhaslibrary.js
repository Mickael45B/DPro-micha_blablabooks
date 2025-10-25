import db from "../../../db/connect_DB.js";
import { GraphQLError } from 'graphql';
import fetchLibraryById from '../utils_librairies.js';
import { requireOwnershipOrAdmin} from './helpers_general.js';
  

/** * Valide les données avec un schéma Joi
 * @param {Joi.Schema} schema - Schéma de validation Joi
 * @param {object} data - Données à valider
 */
export const validateWithJoi = (schema, data) => {
  const { error, value } = schema.validate(data, {
    abortEarly: false, // Récupère toutes les erreurs
    stripUnknown: true, // Supprime les champs non définis dans le schéma
  });

  if (error) {
    const messages = error.details.map(detail => detail.message).join(', ');
    throw new GraphQLError(messages, {
      extensions: { 
        code: 'BAD_REQUEST',
        httpStatus: 400,
        originalError: error.message
      },
    });
  }

  return value;
};





/**
 * Vérifie qu'une relation livre-bibliothèque existe
 * @param {string} bookLibraryId - ID de la relation
 * @returns {Promise<object>} La relation trouvée
 * @throws {GraphQLError} Si non trouvée (404)
 */
export const findBookLibraryOrThrow = async (bookLibraryId) => {
  //console.log('findBookLibraryOrThrow called with bookLibraryId2:', bookLibraryId);
  const result = await db.query(
    'SELECT * FROM bookhaslibrary WHERE id_bookhaslibrary = $1',
    [bookLibraryId]
  );
  //console.log('Database result for bookhaslibrary:', result.rows[0]);
  if (!result.rows[0]) {
    throw new GraphQLError('Livre en bibliothèque non trouvé', {
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

/**
 * Vérifie la propriété d'une bibliothèque et les droits d'accès
 * @param {string} libraryId - ID de la bibliothèque
 * @param {object} context - Contexte GraphQL
 * @returns {Promise<object>} La bibliothèque si accessible
 */
export const verifyLibraryAccess = async (libraryId, context) => {
  const library = await fetchLibraryById(libraryId);
  
  if (!library) {
    throw new GraphQLError('Bibliothèque non trouvée', {
      extensions: { 
        code: 'NOT_FOUND',
        httpStatus: 404
      },
    });
  }
  
  //requireOwnershipOrAdmin(library.id_user, context);
  return library;
};
