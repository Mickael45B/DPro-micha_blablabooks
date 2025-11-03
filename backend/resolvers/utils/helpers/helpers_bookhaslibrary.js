import db from "../../../db/connect_DB.js";
import { GraphQLError } from 'graphql';
import fetchLibraryById from '../utils_librairies.js';
import { requireOwnershipOrAdmin} from './helpers_general.js';
  



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





















/**
 * Vérifie que l'utilisateur peut accéder à cette bibliothèque
 */
export const verifyUserOwnsLibrary = async (libraryId, context) => {
  const library = await fetchLibraryById(libraryId);
  
  if (!library) {
    throw new GraphQLError('Bibliothèque non trouvée', {
      extensions: { code: 'NOT_FOUND', httpStatus: 404 }
    });
  }
  
  // Admin = accès total
  if (context.user?.role === 'admin' || context.isAdmin) {
    return library;
  }
  
  // Utilisateur normal = uniquement ses bibliothèques
  if (library.id_user !== context.user?.id_user) {
    throw new GraphQLError('Vous ne pouvez accéder qu\'à vos propres bibliothèques', {
      extensions: { code: 'FORBIDDEN', httpStatus: 403 }
    });
  }
  
  return library;
};
