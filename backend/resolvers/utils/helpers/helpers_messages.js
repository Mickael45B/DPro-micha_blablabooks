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
export const findMessageOrThrow = async (messageId) => {
  const result = await db.query(
    'SELECT * FROM messages WHERE id_message = $1',
    [messageId]
  );
  
  if (!result.rows[0]) {
    throw new GraphQLError('Message non trouvé', {
      extensions: { 
        code: 'NOT_FOUND',
        httpStatus: 404
      },
    });
  }
  
  return result.rows[0];
};

/**
 * Vérifie que l'utilisateur peut accéder au message
 * @param {object} message - Objet message
 * @param {object} context - Contexte GraphQL
 * @throws {GraphQLError} Si accès refusé
 */
export const requireMessageAccess = (message, context) => {
  requireAuth(context);
  
  const userId = context?.user?.id || context?.user?.id_user;
  
  // L'utilisateur doit être l'expéditeur, le destinataire, ou admin
  if (
    message.id_sender !== userId && 
    message.id_receiver !== userId && 
    !context.isAdmin
  ) {
    throw new GraphQLError('Vous n\'avez pas accès à ce message', {
      extensions: { 
        code: 'FORBIDDEN',
        httpStatus: 403
      },
    });
  }
};

/**
 * Valide les données d'un message
 * @param {object} input - Données du message
 * @throws {GraphQLError} Si validation échoue
 */
export const validateMessageInput = (input) => {
  if (!input.subject || input.subject.trim().length < 3) {
    throw new GraphQLError('Le sujet doit contenir au moins 3 caractères', {
      extensions: { 
        code: 'BAD_REQUEST',
        httpStatus: 400
      },
    });
  }
  
  if (!input.content || input.content.trim().length < 10) {
    throw new GraphQLError('Le contenu doit contenir au moins 10 caractères', {
      extensions: { 
        code: 'BAD_REQUEST',
        httpStatus: 400
      },
    });
  }
  
  if (input.content.length > 5000) {
    throw new GraphQLError('Le contenu ne peut pas dépasser 5000 caractères', {
      extensions: { 
        code: 'BAD_REQUEST',
        httpStatus: 400
      },
    });
  }
};
