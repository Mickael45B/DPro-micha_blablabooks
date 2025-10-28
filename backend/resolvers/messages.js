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
import { findMessageOrThrow, requireMessageAccess, validateMessageInput} from './utils/helpers/helpers_messages.js';

import {getMessagesSchema, getMessageSchema, getUserMessagesSchema, searchMessagesSchema, addMessageSchema, updateMessageSchema, markMessageAsReadSchema, deleteMessageSchema } from '../schema/schemas_joi/messagesSchema.js';

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

        /* exemple context JWT décodé ( à revoir):
        {
          userId: "uuid-of-user",
          email: "user@example.com",
          role: "admin"
        }
        */
        /*exemple de requête :
        query {getMessages{messages{id_message subject content}}}
        */
        /* Exemple variables :
        {
        }
        */

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

        /* exemple context JWT décodé ( à revoir):
        {
          userId: "uuid-of-user",
          email: "user@example.com",
          role: "admin"
        }
        */
       /*exemple de requête :
        query  getMessage($id_message: ID!) {getMessage(id_message: $id_message) {id_message, subject, content }}

        */
        /* Exemple variables :
        {"id_message": "3c4d5e6f-7g8h-9i0j-1k2l-3m4n5y6p7q8r"}
        */

        // Sanitize input
        const cleanIdMessage = sanitizeString(id_message);
        
        // Vérifier que le message existe
        const message = await findMessageOrThrow(cleanIdMessage);

         // Vérifier l'accès
        requireMessageAccess(message, context);
       

        if (context?.res?.status) context.res.status(200);
        return message;
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



    /* Exemple de requête :
    query GetUserMessages($userId: ID) {getUserMessages(userId: $userId) { messages { id_message subject sender { name } receiver { name } } } }
    */
    /* Exemple variables :
    // Pour voir MES messages (userId optionnel)
    { "type": "received" }
    
    // Pour qu'un admin voie les messages d'un autre user
    { "userId": "autre-user-id", "type": "sent" }
    */


// ✅ Vérifier l'authentification
    requireAuth(context);

    const { userId, type = 'received', limit = 50, offset = 0 } = args;

    // Déterminer l'ID cible
    let targetUserId;
    
    if (userId) {
      // Un userId est fourni → vérifier les droits
      requireOwnershipOrAdmin(userId, context);
      targetUserId = userId;
    } else {
      // Pas de userId → utiliser l'utilisateur connecté
      targetUserId = context.user?.id_user || context.user?.id;
      
      if (!targetUserId) {
        throw new GraphQLError('ID utilisateur introuvable', {
          extensions: { code: 'UNAUTHORIZED', httpStatus: 401 }
        });
      }
    }

    // Sanitize inputs
    const cleanUserId = sanitizeString(targetUserId);
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

        /* exemple context JWT décodé ( à revoir):
        {
          userId: "uuid-of-user",
          email: "user@example.com",
          role: "admin"
        }
        */
       /*exemple de requête :
        query searchMessages($content: String!) {searchMessages(content: $content) {messages{id_message, subject, content,sender{name,pseudo}, receiver{name,pseudo}}}}

        */
        /* Exemple variables :
        {"content": "et"}
        */



        const { content, limit = 50, offset = 0 } = args;

        // Vérifier les droits admin
        //requireAdmin(context);

        // Sanitize inputs
        const cleanContent = sanitizeString(content);
        const cleanLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 100);
        const cleanOffset = Math.max(parseInt(offset) || 0, 0);

        if (!cleanContent || cleanContent.length < 2) {
          throw new GraphQLError('Le terme de recherche doit contenir au moins 2 caractères', {
            extensions: { 
              code: 'BAD_REQUEST',
              httpStatus: 400
            },
          });
        }

        const searchPattern = `%${cleanContent}%`;
        
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

        /* exemple context JWT décodé ( à revoir):
        {
          userId: "uuid-of-user",
          email: "user@example.com",
          role: "admin"
        }
        */
       /*exemple de requête :
        mutation addMessage($input: CreateMessageInput!) { addMessage(input: $input) {id_message, subject, content }}

        */
        /* Exemple variables :
        { "input": {
          content: "Bonjour , ceci est le contenu du message.",
          id_sender: "1e2d3c4b-5a6f-7e8d-9c0b-1a2f3e4d5c6b",
          id_receiver: "5h6g7f8e-9d0c-1b2a-3f4e-5d6c7b8a9f0e",
          subject: "Salut"
        }
        }
               
        */


        // Vérifier l'authentification
        requireAuth(context);

        // Sanitize input
        const cleanInput = {
          idSender: sanitizeString(input.id_sender),
          idReceiver: sanitizeString(input.id_receiver),
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
          RETURNING *
        `, [
          id,
          cleanInput.idSender,
          cleanInput.idReceiver,
          cleanInput.subject,
          cleanInput.content,
          false
        ]);

        if (context?.res?.status) context.res.status(201);
        return result.rows[0];
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

        /* exemple context JWT décodé ( à revoir):
        {
          userId: "uuid-of-user",
          email: "user@example.com",
          role: "admin"
        }
        */
       /*exemple de requête :
        mutation updateMessage($input: UpdateMessageInput!) { updateMessage(input: $input) {__typename }}

        */
        /* Exemple variables :
        { "input": 
        {
          "id_message": "3c4d5e6f-7g8h-9i0j-1k2l-3m4n5y6p7q8r",
          "content": "modification pour tester la mise à jour du message",
          "subject": "modification du sujet"
        }
        }       
        */

        // Vérifier l'authentification
        requireAuth(context);

        // Sanitize ID
        const cleanIdMessage = sanitizeString(input.id_message);

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
    markMessageAsRead: async (_, { input }, context) => {
      try {

        /* exemple context JWT décodé ( à revoir):
        {
          userId: "uuid-of-user",
          email: "user@example.com",
          role: "admin"
        }
        */
       /*exemple de requête :
        mutation markMessageAsRead($input: MarkMessageAsReadInput!) { markMessageAsRead(input: $input) { id_message is_read updated_at } }

        */
        /* Exemple variables :
          { "input": { "id_message": "3c4d5e6f-7g8h-9i0j-1k2l-3m4n5y6p7q8r" } }           
         */

        // Vérifier l'authentification
        requireAuth(context);

        // Support both { input: { id_message } } and legacy { id_message }
        const rawId = input?.id_message ?? input?.idMessage ?? input ?? null;
        // Sanitize input
        const cleanIdMessage = sanitizeString(rawId);

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

        if (context?.res?.status) context.res.status(200);
        return result.rows[0];
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
    deleteMessage: async (_, { input }, context) => {
      try {

        /* exemple context JWT décodé ( à revoir):
        {
          userId: "uuid-of-user",
          email: "user@example.com",
          role: "admin"
        }
        */
       /*exemple de requête :
            mutation deleteMessage($id_message: ID!) { deleteMessage(id_message: $id_message) }
        */
        /* Exemple variables :
        {"input": {"id_message":"a1b2c3d4-e5f6-7g8h-9i0j-1k2l3m4n5o6p"} }
        */

        // Vérifier l'authentification
        requireAuth(context);

        // Sanitize input
        const cleanIdMessage = sanitizeString(input.id_message);

        // Vérifier que le message existe
        const message = await findMessageOrThrow(cleanIdMessage);

        // Vérifier l'accès
        //requireMessageAccess(message, context);

        // Supprimer le message
        await db.query(
          'DELETE FROM messages WHERE id_message = $1',
          [cleanIdMessage]
        );

        if (context?.res?.status) context.res.status(200);
        return true ;
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