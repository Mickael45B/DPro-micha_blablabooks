import db from "../db/connect_DB.js";
import { v4 as uuidv4 } from 'uuid';
import { validateOrderParams, handleDbError } from '../utils/validators.js';
import { fetchUserById } from './utils/utils_users.js';

import { flattenEdges, makePageInfo, makeEdgeFromBook } from '../utils/helpers_books.js';
import sanitizeHtml from 'sanitize-html';
import { GraphQLError } from 'graphql';
import fetchBookById from './utils/utils_books.js';
import fetchLibraryById from './utils/utils_librairies.js';

// Import des helpers généraux
import { isAuthenticated, requireAuth, requireAdmin, requireOwnershipOrAdmin, sanitizeString, sanitizeInput } from './utils/helpers/helpers_general.js';
// Import des helpers spécifiques aux messages
//import { findBookOrThrow, validateBookInput} from './utils/helpers/helpers_messages.js';



/**
 * Vérifie qu'un message existe
 * @param {string} messageId - ID du message
 * @returns {Promise<object>} Le message trouvé
 * @throws {GraphQLError} Si non trouvé (404)
 */
const findMessageOrThrow = async (messageId) => {
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
const requireMessageAccess = (message, context) => {
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
const validateMessageInput = (input) => {
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

export default {
  Query: {

    /**
     * Récupère les commentaires avec pagination et tri
     * 🔒 Route protégée (administrateur uniquement)
       * @param {number} limit - Limite de résultats (max 100)
       * @param {number} offset - Décalage pour pagination
       * @param {string} order - Champ de tri
       * @param {string} direction - Direction du tri (ASC/DESC)
       * @returns {object} { messages, totalCount, hasNextPage, httpStatus }
       * @throws {GraphQLError} Si l'utilisateur n'a pas les droits (401 ou 403)  
       * @throws {GraphQLError} Si une erreur se produit lors de la récupération des messages (500)
     */
    getMessages: async (_, args, context) => {
      try {
        const { limit = 50, offset = 0, order = 'created_at', direction = 'DESC' } = args;

        // Vérification des droits admin
        requireAdmin(context);

        // Sanitize inputs
        const cleanLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 100);
        const cleanOffset = Math.max(parseInt(offset) || 0, 0);

        // Valider les paramètres de tri
        const validOrders = ['created_at', 'id_sender', 'id_receiver', 'subject', 'is_read', 'updated_at'];
        const { order: safeOrder, direction: safeDirection } = validateOrderParams(
          sanitizeString(order), 
          sanitizeString(direction), 
          validOrders
        );
        
        const result = await db.query(`
          SELECT *
          FROM messages
          ORDER BY ${safeOrder} ${safeDirection}
          LIMIT $1 OFFSET $2
        `, [cleanLimit, cleanOffset]);
        
        const countResult = await db.query('SELECT COUNT(*)::int as count FROM messages');
        const totalCount = countResult.rows[0].count;
        
        return {
          messages: result.rows,
          totalCount,
          hasNextPage: cleanOffset + cleanLimit < totalCount,
          httpStatus: 200
        };
      } catch (error) {
        if (error instanceof GraphQLError) throw error;
        throw new GraphQLError('Erreur lors de la récupération des messages', {
          extensions: { 
            code: 'INTERNAL_SERVER_ERROR',
            httpStatus: 500,
            originalError: error.message
          },
        });
      }
    },

    /**
     * Récupère les commentaires avec pagination et tri
     * * 🔓 Route publique
       * @returns {object} { message, totalCount, hasNextPage, httpStatus }
       * @throws {GraphQLError} Si l'utilisateur n'a pas les droits (401 ou 403)  
       * @throws {GraphQLError} Si une erreur se produit lors de la récupération des messages (500)
     */
    getMessage: async (_, { id_message }, context) => {
      try {

        // Vérification des droits d'accès
        requireAuth(context);

        // Sanitize input
        const cleanIdMessage = sanitizeString(id_message);
        
        // Vérifier que le message existe
        const message = await findMessageOrThrow(cleanIdMessage);

        // Vérifier l'accès
        requireMessageAccess(message, context);

        return {
          data: message,
          httpStatus: 200,
        };
      } catch (error) {
        if (error instanceof GraphQLError) throw error;
        throw new GraphQLError('Erreur lors de la récupération du message', {
          extensions: { 
            code: 'INTERNAL_SERVER_ERROR',
            httpStatus: 500,
            originalError: error.message
          },
        });
      }
    },

    /**
     * Récupère les messages d'un utilisateur (envoyés ou reçus)
     * 🔒 Route protégée - L'utilisateur ne peut voir que ses propres messages
     * @param {string} userId - ID de l'utilisateur
     * @param {string} type - 'sent' ou 'received'
     * @param {number} limit - Limite de résultats
     * @param {number} offset - Décalage pour pagination
     * @returns {object} { messages, totalCount, hasNextPage, httpStatus }
     * @throws {GraphQLError} Si l'utilisateur n'a pas les droits (401 ou 403)  
     * @throws {GraphQLError} Si une erreur se produit lors de la récupération des messages (500)
     */
    getUserMessages: async (_, args, context) => {
      try {
        const { userId, type = 'received', limit = 50, offset = 0 } = args;

        // Vérifier les droits
        requireOwnershipOrAdmin(userId, context);

        // Sanitize inputs
        const cleanUserId = sanitizeString(userId);
        const cleanLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 100);
        const cleanOffset = Math.max(parseInt(offset) || 0, 0);

        // Déterminer la colonne à filtrer
        const column = type === 'sent' ? 'id_sender' : 'id_receiver';

        const result = await db.query(`
          SELECT *
          FROM messages
          WHERE ${column} = $1
          ORDER BY created_at DESC
          LIMIT $2 OFFSET $3
        `, [cleanUserId, cleanLimit, cleanOffset]);

        const countResult = await db.query(`
          SELECT COUNT(*)::int as count FROM messages
          WHERE ${column} = $1
        `, [cleanUserId]);

        return {
          messages: result.rows,
          totalCount: countResult.rows[0].count,
          hasNextPage: cleanOffset + cleanLimit < countResult.rows[0].count,
          httpStatus: 200,
        };
      } catch (error) {
        if (error instanceof GraphQLError) throw error;
        throw new GraphQLError('Erreur lors de la récupération des messages utilisateur', {
          extensions: { 
            code: 'INTERNAL_SERVER_ERROR',
            httpStatus: 500,
            originalError: error.message
          },
        });
      }
    },

    /**
     * Recherche des messages
     * * 🔓 Route publique
     * @param {string} content - Contenu à rechercher
     * @param {number} limit - Limite de résultats (max 100)
     * @param {number} offset - Décalage pour pagination
     * @returns {object} { messages, totalCount, hasNextPage, httpStatus }
       * @throws {GraphQLError} Si l'utilisateur n'a pas les droits (401 ou 403)  
       * @throws {GraphQLError} Si une erreur se produit lors de la récupération des messages (500)
     */
    searchMessages: async (_, args, context) => {
      try {
        const { search, limit = 50, offset = 0 } = args;

        // Vérifier les droits admin
        requireAdmin(context);

        // Sanitize inputs
        const cleanSearch = sanitizeString(search);
        const cleanLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 100);
        const cleanOffset = Math.max(parseInt(offset) || 0, 0);

        if (!cleanSearch || cleanSearch.length < 2) {
          throw new GraphQLError('Le terme de recherche doit contenir au moins 2 caractères', {
            extensions: { 
              code: 'BAD_REQUEST',
              httpStatus: 400
            },
          });
        }

        const searchPattern = `%${cleanSearch}%`;
        
        const result = await db.query(`
          SELECT id_message, id_sender, id_receiver, subject, content, is_read, created_at, updated_at
          FROM messages
          WHERE LOWER(subject) LIKE LOWER($1) OR LOWER(content) LIKE LOWER($1)
          ORDER BY created_at DESC
          LIMIT $2 OFFSET $3
        `, [searchPattern, cleanLimit, cleanOffset]);
        
        const countResult = await db.query(`
          SELECT COUNT(*)::int as count FROM messages
          WHERE LOWER(subject) LIKE LOWER($1) OR LOWER(content) LIKE LOWER($1)
        `, [searchPattern]);
        
        return {
          messages: result.rows,
          totalCount: countResult.rows[0].count,
          hasNextPage: cleanOffset + cleanLimit < countResult.rows[0].count,
          httpStatus: 200,
        };
      } catch (error) {
        if (error instanceof GraphQLError) throw error;
        throw new GraphQLError('Erreur lors de la recherche des messages', {
          extensions: { 
            code: 'INTERNAL_SERVER_ERROR',
            httpStatus: 500,
            originalError: error.message
          },
        });
      }
    },
  },

  Mutation: {

    /**
     * Ajoute un message
     * * 🔓 Route publique
     * @param {object} input - Les données du message à ajouter
     * @returns {object} Le message ajouté
       * @throws {GraphQLError} Si l'utilisateur n'a pas les droits (401 ou 403)  
       * @throws {GraphQLError} Si une erreur se produit lors de la récupération des messages (500)
     */
    addMessage: async (_, { input }, context) => {
      try {
        // Vérifier l'authentification
        requireAuth(context);

        // Sanitize input
        const cleanInput = {
          idSender: sanitizeString(input.idSender),
          idReceiver: sanitizeString(input.idReceiver),
          subject: sanitizeString(input.subject),
          content: sanitizeString(input.content),
        };

        // Vérifier que l'expéditeur est bien l'utilisateur connecté
        const userId = context?.user?.id || context?.user?.id_user;
        if (cleanInput.idSender !== userId && !context.isAdmin) {
          throw new GraphQLError('Vous ne pouvez envoyer des messages qu\'en votre nom', {
            extensions: { 
              code: 'FORBIDDEN',
              httpStatus: 403
            },
          });
        }

        // Validation
        validateMessageInput(cleanInput);

        // Vérifier que le destinataire existe
        const receiverExists = await db.query(
          'SELECT id_user FROM users WHERE id_user = $1',
          [cleanInput.idReceiver]
        );

        if (receiverExists.rows.length === 0) {
          throw new GraphQLError('Le destinataire n\'existe pas', {
            extensions: { 
              code: 'NOT_FOUND',
              httpStatus: 404
            },
          });
        }

        // Empêcher l'envoi de message à soi-même
        if (cleanInput.idSender === cleanInput.idReceiver) {
          throw new GraphQLError('Vous ne pouvez pas vous envoyer un message à vous-même', {
            extensions: { 
              code: 'BAD_REQUEST',
              httpStatus: 400
            },
          });
        }

        const id = uuidv4();

        const result = await db.query(`
          INSERT INTO messages (id_message, id_sender, id_receiver, subject, content, is_read)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING id_message, id_sender, id_receiver, subject, content, is_read, created_at, updated_at
        `, [
          id,
          cleanInput.idSender,
          cleanInput.idReceiver,
          cleanInput.subject,
          cleanInput.content,
          false
        ]);

        return {
          data: result.rows[0],
          httpStatus: 201
        };
      } catch (error) {
        if (error instanceof GraphQLError) throw error;
        throw new GraphQLError("Erreur lors de l'envoi du message", {
          extensions: { 
            code: 'INTERNAL_SERVER_ERROR',
            httpStatus: 500,
            originalError: error.message
          },
        });
      }
    },

    /**
     * Met à jour un message
     * * 🔒 Route protégée
     * @param {object} input - Les données du message à mettre à jour
     * @returns {object} Le message mis à jour
       * @throws {GraphQLError} Si l'utilisateur n'a pas les droits (401 ou 403)  
       * @throws {GraphQLError} Si une erreur se produit lors de la récupération des messages (500)
     */
    updateMessage: async (_, { input }, context) => {
      try {
        // Vérifier l'authentification
        requireAuth(context);

        // Sanitize ID
        const cleanIdMessage = sanitizeString(input.idMessage);

        // Vérifier que le message existe
        const message = await findMessageOrThrow(cleanIdMessage);

        // Vérifier que l'utilisateur est l'expéditeur
        const userId = context?.user?.id || context?.user?.id_user;
        if (message.id_sender !== userId && !context.isAdmin) {
          throw new GraphQLError('Seul l\'expéditeur peut modifier ce message', {
            extensions: { 
              code: 'FORBIDDEN',
              httpStatus: 403
            },
          });
        }

        // Empêcher la modification si déjà lu
        if (message.is_read && !context.isAdmin) {
          throw new GraphQLError('Impossible de modifier un message déjà lu', {
            extensions: { 
              code: 'FORBIDDEN',
              httpStatus: 403
            },
          });
        }

        // Construire la requête dynamique
        const updates = [];
        const values = [];
        let paramIndex = 1;

        if (input.subject !== undefined) {
          const cleanSubject = sanitizeString(input.subject);
          if (cleanSubject.trim().length < 3) {
            throw new GraphQLError('Le sujet doit contenir au moins 3 caractères', {
              extensions: { code: 'BAD_REQUEST', httpStatus: 400 },
            });
          }
          updates.push(`subject = $${paramIndex++}`);
          values.push(cleanSubject);
        }

        if (input.content !== undefined) {
          const cleanContent = sanitizeString(input.content);
          if (cleanContent.trim().length < 10) {
            throw new GraphQLError('Le contenu doit contenir au moins 10 caractères', {
              extensions: { code: 'BAD_REQUEST', httpStatus: 400 },
            });
          }
          updates.push(`content = $${paramIndex++}`);
          values.push(cleanContent);
        }

        if (updates.length === 0) {
          throw new GraphQLError('Aucun champ à mettre à jour', {
            extensions: { 
              code: 'BAD_REQUEST',
              httpStatus: 400
            },
          });
        }

        values.push(cleanIdMessage);

        const result = await db.query(`
          UPDATE messages
          SET ${updates.join(', ')}, updated_at = NOW()
          WHERE id_message = $${paramIndex}
          RETURNING *
        `, values);

        return {
          data: result.rows[0],
          httpStatus: 200
        };
      } catch (error) {
        if (error instanceof GraphQLError) throw error;
        throw new GraphQLError("Erreur lors de la modification du message", {
          extensions: { 
            code: 'INTERNAL_SERVER_ERROR',
            httpStatus: 500,
            originalError: error.message
          },
        });
      }
    },

    /**
     * Marque un message comme lu
     * * 🔒 Route protégée
     * @param {string} id_message - L'ID du message à marquer comme lu
     * @returns {object} Le message mis à jour
       * @throws {GraphQLError} Si l'utilisateur n'a pas les droits (401 ou 403)  
       * @throws {GraphQLError} Si une erreur se produit lors de la récupération des messages (500)
     */
    markMessageAsRead: async (_, { id_message }, context) => {
      try {

        // Vérifier l'authentification
        requireAuth(context);

        // Sanitize input
        const cleanIdMessage = sanitizeString(id_message);

        // Vérifier que le message existe
        const message = await findMessageOrThrow(cleanIdMessage);

        // Vérifier que l'utilisateur est le destinataire
        const userId = context?.user?.id || context?.user?.id_user;
        if (message.id_receiver !== userId && !context.isAdmin) {
          throw new GraphQLError('Seul le destinataire peut marquer ce message comme lu', {
            extensions: { 
              code: 'FORBIDDEN',
              httpStatus: 403
            },
          });
        }

        // Mettre à jour le message
        const result = await db.query(`
          UPDATE messages
          SET is_read = true, updated_at = NOW()
          WHERE id_message = $1
          RETURNING *
        `, [cleanIdMessage]);

        return {
          data: result.rows[0],
          httpStatus: 200
        };
      } catch (error) {
        if (error instanceof GraphQLError) throw error;
        throw new GraphQLError("Erreur lors de la mise à jour du message", {
          extensions: { 
            code: 'INTERNAL_SERVER_ERROR',
            httpStatus: 500,
            originalError: error.message
          },
        });
      }
    },
  
    /**
     * Supprime un message
     * * 🔒 Route protégée (administrateur uniquement)
     * @param {string} id_message - L'ID du message à supprimer
     * @returns {object} Le message supprimé
       * @throws {GraphQLError} Si l'utilisateur n'a pas les droits (401 ou 403)  
       * @throws {GraphQLError} Si une erreur se produit lors de la récupération des messages (500)
     */
    deleteMessage: async (_, { id_message }, context) => {
      try {
        // Vérifier l'authentification
        requireAuth(context);

        // Sanitize input
        const cleanIdMessage = sanitizeString(id_message);

        // Vérifier que le message existe
        const message = await findMessageOrThrow(cleanIdMessage);

        // Vérifier l'accès
        requireMessageAccess(message, context);

        // Supprimer le message
        await db.query(
          'DELETE FROM messages WHERE id_message = $1',
          [cleanIdMessage]
        );

        return {
          data: true,
          httpStatus: 200,
        };
      } catch (error) {
        if (error instanceof GraphQLError) throw error;
        throw new GraphQLError("Erreur lors de la suppression du message", {
          extensions: { 
            code: 'INTERNAL_SERVER_ERROR',
            httpStatus: 500,
            originalError: error.message
          },
        });
      }
    },
  },
  
    Message: {


    sender: async (parent) => {
      return fetchUserById(parent.id_sender);
    },

    receiver: async (parent) => {
      return fetchUserById(parent.id_receiver);
    },

    
  },
};