import db from "../db/connect_DB.js";
import { v4 as uuidv4 } from 'uuid';
import { validateOrderParams, handleDbError } from '../utils/validators.js';
import { fetchUserById } from './utils/utils_users.js';

import sanitizeHtml from 'sanitize-html';
import { GraphQLError } from 'graphql';
import fetchBookById from './utils/utils_books.js';
import fetchLibraryById from './utils/utils_librairies.js';

// Import des helpers généraux
import { isAuthenticated, requireAuth, requireAdmin, requireOwnershipOrAdmin, sanitizeString, sanitizeInput, flattenEdges, makePageInfo, makeEdgeFromBook, withErrorHandling } from './utils/helpers/helpers_general.js';

import { findBy1ParameterOrThrow } from './utils/helper.js';

// Importer les helpers généralistes
import { withSecureResolver } from './utils/helpers/helpers_general.js';
// Importer les helpers spécifiques
import { requireMessageAccess, validateMessageInput} from './utils/helpers/helpers_messages.js';

// Importer le schema Joi genéral
import { generalSortingSchema } from '../schema/schemas_joi/generalSchema.js';
// Importer les schemas Joi spécifiques
import { generalMessagesSchema, generalOrderMessagesSchema, searchMessagesSchema} from '../schema/schemas_joi/messagesSchema.js';

// Importer les wrappers et helpers de sécurité
import { sanitizeStrict} from './utils/helpers/helpers_securite.js';

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
    getMessages: withSecureResolver(
      async (_, { validated }, context) => {
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
        // ========================================
        // RECUPERER LES DONNEES NESSESAIRES
        // ======================================== 
        const { limit = 50, offset = 0, order = 'created_at', direction = 'DESC' } = validated;
        const validOrders = ['created_at', 'id_message', 'id_sender', 'id_receiver', 'is_read', 'updated_at'];
        const { order: safeOrder, direction: safeDirection } = validateOrderParams(
          order,
          direction,
          validOrders
        );

        // ========================================
        // REQUETES BASE DE DONNEES
        // ======================================== 
        const result = await db.query(`
          SELECT *
          FROM messages
          ORDER BY ${safeOrder} ${safeDirection}
          LIMIT $1 OFFSET $2
        `, [limit, offset]);
        
        const countResult = await db.query('SELECT COUNT(*)::int as count FROM messages');
        const totalCount = countResult.rows[0].count;

        // ========================================
        // DONNEES RECUPEREES
        // ======================================== 
             
        return {
          messages: result.rows,
          totalCount,
          hasNextPage: offset + limit < totalCount,
          httpStatus: 200
        };
      },
      {
        sortingSchema: generalSortingSchema,
        orderSchema: generalOrderMessagesSchema,
        logAction: 'GET_ALL_MESSAGES',
        requiresAuth: true,
        errorMessage: 'Erreur lors de la récupération des messages'
      }
    ),
    
    /**
     * Récupère les commentaires avec pagination et tri
     * * 🔓 Route publique
       * @returns {object} { message, totalCount, hasNextPage, httpStatus }
       * @throws {GraphQLError} Si l'utilisateur n'a pas les droits (401 ou 403)  
       * @throws {GraphQLError} Si une erreur se produit lors de la récupération des messages (500)
     */
    getMessage: withSecureResolver(
      async (_, { id_message, validated }, context) => {
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
    
        // ========================================
        // RECUPERER LES DONNEES NESSESAIRES
        // ======================================== 
        const cleanIdMessage = sanitizeStrict(id_message);
        
        // ========================================
        // REQUETES BASE DE DONNEES
        // ======================================== 
        const message = await findBy1ParameterOrThrow('messages', 'id_message', cleanIdMessage, 'Message non trouvé');

        // ========================================
        // DONNEES RECUPEREES
        // ========================================        

        if (context?.res?.status) context.res.status(200);
        return message.data;
    
      },
      {
        logAction: 'GET_ONE_BOOK_IN_LIBRARY',
        requiresAuth: true,
        errorMessage: 'Erreur lors de la récupération du livre en bibliothèque'
      }
    ),
    
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
    getUserMessages: withSecureResolver(
      async (_, { userId, validated }, context) => {
        /* Exemple de requête :
        query GetUserMessages($userId: ID) {getUserMessages(userId: $userId) { messages { id_message subject sender { name } receiver { name } } } }
        */
        /* Exemple variables :
        // Pour voir MES messages (userId optionnel)
        { "type": "received" }
        */
        /* Exemple variables :
        // Pour qu'un admin voie les messages d'un autre user
        { "userId": "autre-user-id", "type": "sent" }
        */
        // ========================================
        // RECUPERER LES DONNEES NESSESAIRES
        // ======================================== 
        const {  type = 'received', limit = 50, offset = 0 } = args;

        const cleanUserId = sanitizeStrict(userId);

        const validOrders = ['created_at', 'id_message', 'id_sender', 'id_receiver', 'is_read', 'updated_at'];
        const { order: safeOrder, direction: safeDirection } = validateOrderParams(
          order,
          direction,
          validOrders
        );

        // ========================================
        // REQUETES BASE DE DONNEES
        // ======================================== 
        const result = await db.query(`
          SELECT *
          FROM messages
          WHERE id_sender = $1 OR id_receiver =$1
          ORDER BY ${safeOrder} ${safeDirection}
          LIMIT $2 OFFSET $3
          `, [cleanUserId, cleanLimit, cleanOffset]
        );

        const countResult = await db.query(`
          SELECT COUNT(*)::int as count FROM messages
          WHERE id_sender = $1 OR id_receiver =$1
          `, [cleanUserId]
        );

        return {
          messages: result.rows,
          totalCount: countResult.rows[0].count,
          hasNextPage: cleanOffset + cleanLimit < countResult.rows[0].count,
        };
    
      },
      {
        logAction: 'GET_MESSAGES_OF_USER',
        requiresAuth: true,
        errorMessage: 'Erreur lors de la récupération des messages de l\'utilisateur'
      }
    ),
    
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
    searchMessages: withSecureResolver(
      async (_, { validated }, context) => {
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
        // ========================================
        // RECUPERER LES DONNEES NESSESAIRES
        // ======================================== 
        const { subjectOrContent, limit = 50, offset = 0, direction = 'ASC', order = 'created_at' } = validated;
        const cleanContent = sanitizeStrict(subjectOrContent);

        if (!cleanContent || cleanContent.length < 2) {
          throw new GraphQLError('Le terme de recherche doit contenir au moins 2 caractères', {
            extensions: {
              code: 'BAD_REQUEST',
              httpStatus: 400
            },
          });
        }

        const searchPattern = `%${cleanQuery}%`;

        const validOrders = ['id_book', 'created_at', 'updated_at'];
        const { order: safeOrder, direction: safeDirection } = validateOrderParams(
          order,
          direction,
          validOrders
        );

        // ========================================
        // REQUETES BASE DE DONNEES
        // ======================================== 
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

        // ========================================
        // DONNEES RECUPEREES
        // ========================================                
        return {
          messages: result.rows,
          totalCount: countResult.rows[0].count,
          hasNextPage: cleanOffset + cleanLimit < countResult.rows[0].count,
          httpStatus: 200,
        };
        
      },
      {
        sortingSchema: generalSortingSchema,
        orderSchema: generalOrderMessagesSchema,
        inputSchema: searchMessagesSchema,
        logAction: 'SEARCH_MESSAGES',
        requiresAuth: true,
        errorMessage: 'Erreur lors de la recherche de messages'
      }
    ),
    
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
    addMessage: withSecureResolver(
      async (_, { input, validated }, context) => {
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
        // ========================================
        // RECUPERER LES DONNEES NESSESAIRES
        // ======================================== 
        const cleanInput = {
          idSender: sanitizeStrict(input.id_sender),
          idReceiver: sanitizeStrict(input.id_receiver),
          subject: sanitizeStrict(input.subject),
          content: sanitizeStrict(input.content),
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
        validateMessageInput(cleanInput);

        // ========================================
        // REQUETES BASE DE DONNEES
        // ========================================         
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

        // ========================================
        // DONNEES RECUPEREES
        // ======================================== 
        if (context?.res?.status) context.res.status(201);
        return result.rows[0];
    
      },
      {
        logAction: 'ADD_MESSAGE',
        requiresAuth: true,
        errorMessage: 'Erreur lors de l\'ajout du message'
      }
    ),
    
    /**
     * Met à jour un message
     * * 🔒 Route protégée
     * @param {object} input - Les données du message à mettre à jour
     * @returns {object} Le message mis à jour
       * @throws {GraphQLError} Si l'utilisateur n'a pas les droits (401 ou 403)  
       * @throws {GraphQLError} Si une erreur se produit lors de la récupération des messages (500)
     */
    updateMessage: withErrorHandling(
      async (_, { input, validated }, context) => {
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
        // ========================================
        // RECUPERER LES DONNEES NESSESAIRES
        // ======================================== 
        const cleanIdMessage = sanitizeStrict(input.id_message);
        // Vérifier que le message existe
        const message = await findBy1ParameterOrThrow('messages', 'id_message', cleanIdMessage, 'Message non trouvé');

        // Vérifier que l'utilisateur est l'expéditeur
        const userId = context?.user?.id || context?.user?.id_user;
        if (message.data.id_sender !== userId && !context.isAdmin) {
          throw new GraphQLError('Seul l\'expéditeur peut modifier ce message', {
            extensions: { 
              code: 'FORBIDDEN',
              httpStatus: 403
            },
          });
        }

        // Empêcher la modification si déjà lu
        if (message.data.is_read && !context.isAdmin) {
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

        // ========================================
        // REQUETES BASE DE DONNEES
        // ========================================         
        const result = await db.query(`
          UPDATE messages
          SET ${updates.join(', ')}, updated_at = NOW()
          WHERE id_message = $${paramIndex}
          RETURNING *
        `, values);

        // ========================================
        // DONNEES RECUPEREES
        // ======================================== 

        return {
          data: result.rows[0],
          httpStatus: 200
        };
    
      },
      {
        logAction: 'UPDATE_MESSAGE',
        requiresAuth: true,
        errorMessage: 'Erreur lors de la mise à jour du message'
      }
    ),
    
    /**
     * Marque un message comme lu
     * * 🔒 Route protégée
     * @param {string} id_message - L'ID du message à marquer comme lu
     * @returns {object} Le message mis à jour
       * @throws {GraphQLError} Si l'utilisateur n'a pas les droits (401 ou 403)  
       * @throws {GraphQLError} Si une erreur se produit lors de la récupération des messages (500)
     */
    markMessageAsRead: withErrorHandling(
      async (_, { input, validated }, context) => {
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
        // ========================================
        // RECUPERER LES DONNEES NESSESAIRES
        // ======================================== 
        const cleanIdMessage = sanitizeStrict(rawId);

        // Vérifier que le message existe
        const message = await findBy1ParameterOrThrow('messages', 'id_message', cleanIdMessage, 'Message non trouvé');

        // Vérifier que l'utilisateur est le destinataire
        const userId = context?.user?.id || context?.user?.id_user;
        if (message.data.id_receiver !== userId && !context.isAdmin) {
          throw new GraphQLError('Seul le destinataire peut marquer ce message comme lu', {
            extensions: { 
              code: 'FORBIDDEN',
              httpStatus: 403
            },
          });
        }
        // ========================================
        // REQUETES BASE DE DONNEES
        // ========================================         
        // Mettre à jour le message
        const result = await db.query(`
          UPDATE messages
          SET is_read = true, updated_at = NOW()
          WHERE id_message = $1
          RETURNING *
        `, [cleanIdMessage]);
        // ========================================
        // DONNEES RECUPEREES
        // ======================================== 
        if (context?.res?.status) context.res.status(200);
        return result.rows[0];
    
      },
      {
        logAction: 'MARK_MESSAGE_AS_READ',
        requiresAuth: true,
        errorMessage: 'Erreur lors du marquage du message comme lu'
      }
    ),
  
    /**
     * Supprime un message
     * * 🔒 Route protégée (administrateur uniquement)
     * @param {string} id_message - L'ID du message à supprimer
     * @returns {object} Le message supprimé
       * @throws {GraphQLError} Si l'utilisateur n'a pas les droits (401 ou 403)  
       * @throws {GraphQLError} Si une erreur se produit lors de la récupération des messages (500)
     */
    deleteMessage: withErrorHandling(
      async (_, { input, validated }, context) => {
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
        // ========================================
        // RECUPERER LES DONNEES NESSESAIRES
        // ======================================== 
        // Sanitize input
        const cleanIdMessage = sanitizeStrict(input.id_message);

        // Vérifier que le message existe
        const message = await findBy1ParameterOrThrow('messages', 'id_message', cleanIdMessage, 'Message non trouvé');

        // Vérifier l'accès
        requireMessageAccess(message.data, context);
        // ========================================
        // REQUETES BASE DE DONNEES
        // ======================================== 
        // Supprimer le message
        await db.query(
          'DELETE FROM messages WHERE id_message = $1',
          [cleanIdMessage]
        );
        // ========================================
        // DONNEES RECUPEREES
        // ======================================== 
        if (context?.res?.status) context.res.status(200);
        return true ;
      },
      {
        logAction: 'DELETE_MESSAGE',
        requiresAuth: true,
        errorMessage: 'Erreur lors de la suppression du message'
      }
    ),
  },
  
    Message: {

    sender: async (parent) => {

      if (!parent?.id_sender) return null;
      try {
        const result = await findBy1ParameterOrThrow('users', 'id_user', parent.id_sender, 'Utilisateur expéditeur non trouvé');
        return result?.data ?? result;
      } catch (err) {
        // si utilisateur supprimé / non trouvé -> retourner null au lieu d'échouer tout le query
        if (err && err.extensions && err.extensions.code === 'NOT_FOUND') return null;
        throw err;
      }
      
    },

    receiver: async (parent) => {

      if (!parent?.id_receiver) return null;
      try {
        const result = await findBy1ParameterOrThrow('users', 'id_user', parent.id_receiver, 'Utilisateur destinataire non trouvé');
        return result?.data ?? result;
      } catch (err) {
        // si utilisateur supprimé / non trouvé -> retourner null au lieu d'échouer tout le query
        if (err && err.extensions && err.extensions.code === 'NOT_FOUND') return null;
        throw err;
      }
      
    },
    
  },
};