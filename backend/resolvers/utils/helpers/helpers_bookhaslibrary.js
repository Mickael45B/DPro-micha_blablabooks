import db from "../../../db/connect_DB.js";
import { GraphQLError } from 'graphql';
import { requireOwnershipOrAdmin} from './helpers_general.js';
  





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












const fetchLibraryById = async (id_library) => {

    if (!id_library) return null;

    try {
        const result = await db.query(
            'SELECT * FROM libraries WHERE id_library = $1',
            [id_library]
        );
        return result.rows[0] || null;
    } catch (error) {
        console.error('Error fetching library by ID:', error);
        return null;
    }
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
