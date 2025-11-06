import db from "../db/connect_DB.js";
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import { validateOrderParams, handleDbError } from '../utils/validators.js';
import  fetchRoleById  from './utils/utils_roles.js';
import  fetchStatusById  from './utils/utils_status.js';
import { fetchUserById } from './utils/utils_users.js';
import sanitizeHtml from 'sanitize-html';
import { GraphQLError } from 'graphql';
import fetchBookById from './utils/utils_books.js';
import fetchLibraryById from './utils/utils_librairies.js';
import { validateWithJoi } from './utils/helpers/helpers_books.js';

import { isAuthenticated, requireAuth, requireAdmin, requireOwnershipOrAdmin, sanitizeString, sanitizeInput, flattenEdges, makePageInfo, makeEdgeFromBook, withErrorHandling, withRateLimit } from './utils/helpers/helpers_general.js';

import { findUserOrThrow, validateUserInput, validatePasswordInput} from './utils/helpers/helpers_Users.js';
import { clean } from "semver";

import {getUsersSchema, getUserSchema, searchUsersSchema, createUserSchema, updateUserSchema, deleteUserSchema, adminResetPasswordSchema, changePasswordSchema } from '../schema/schemas_joi/userSchema.js';
import { log } from "console";

import {sanitizeStrict, validateAgainstInjection, withOutputSanitization} from './utils/helpers/helpers_securite.js';

import {generateAccessToken, generateRefreshToken, verifyToken, decodeToken} from './utils/utils_authentification.js';

// Revoir le resolver "changePassword",

// ========================================
// RESOLVERS POUR LES UTILISATEURS
// ======================================== 

const initializationUser = {
  defaultStatus: "active",
  defaultRole: "user",
  librariesStartup: ["Bibliothèque livres lus", "Bibliothèque livres favoris"],
  libraryDefaultEditable: false,
  id_role: 1,
  id_status: 1,
  created_at: new Date(),
  updated_at: new Date()
};

export default {
  Query: {
    /**
     * Récupère les utilisateurs avec pagination et tri
     * 🔒 Route protégée (administrateur uniquement)
       * @param {number} limit - Limite de résultats (max 100)
       * @param {number} offset - Décalage pour pagination
       * @param {string} order - Champ de tri
       * @param {string} direction - Direction du tri (ASC/DESC)
       * @returns {object} { users, totalCount, hasNextPage, httpStatus }
       * @throws {GraphQLError} Si l'utilisateur n'a pas les droits (401 ou 403)  
       * @throws {GraphQLError} Si une erreur se produit lors de la récupération des utilisateurs (500)
     */
    getUsers: withSecureResolver(
      async (_, { validated }, context) => {
        /* exemple context JWT décodé ( à revoir):
        {
          userId: "uuid-of-user",
          email: "user@example.com",
          role: "admin"
        }
        */
        /*exemple de requête :
        query {getUsers{users{id_user, name, pseudo, email}totalCount hasNextPage}}
        */
        /* Exemple variables :
        {
        }
        */
    
        // ========================================
        // RECUPERER LES DONNEES NESSESAIRES
        // ======================================== 

        // Extraction et validation des paramètres de pagination et de tri
        const { limit = 70, offset = 0, order = 'created_at', direction = 'DESC' } = args;

        // Sanitize inputs
        // const cleanLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 100);
        // const cleanOffset = Math.max(parseInt(offset) || 0, 0);
        const validOrders = ['created_at', 'name', 'email', 'pseudo', 'id_role', 'id_user'];
        const { order: safeOrder, direction: safeDirection } = validateOrderParams(
          sanitizeString(order), 
          sanitizeString(direction), 
          validOrders
        );
        // ========================================
        // REQUETES BASE DE DONNEES
        // ======================================== 
        const result = await db.query(`
          SELECT id_user, name, email, pseudo, id_role, id_status, created_at, updated_at
          FROM users
          ORDER BY ${safeOrder} ${safeDirection}
          LIMIT $1 OFFSET $2
          RETURNING id_user, name, email, pseudo, id_role, id_status, created_at, updated_at
        `, [cleanLimit, cleanOffset]);
        
        const countResult = await db.query('SELECT COUNT(*)::int as count FROM users');
        const totalCount = countResult.rows[0].count;
        // ========================================
        // DONNEES RECUPEREES
        // ======================================== 
        return {
          users: result.rows,
          totalCount,
          hasNextPage: cleanOffset + cleanLimit < totalCount,
          httpStatus: 200
        };
      },
      {
        sortingSchema: generalSortingSchema,
        orderSchema: generalOrderUserSchema,
        logAction: 'GET_ALL_USERS',
        requiresAuth: true,
        errorMessage: 'Erreur lors de la récupération des utilisateurs'
      }
    ),
    
    /**
     * Récupère un avis par son ID
     * 🔒 Route protégée (administrateur uniquement)
     * @param {string} id_review - ID de l'avis
     * @returns {object|null} Avis ou null si non trouvé
     * @throws {GraphQLError} Si l'utilisateur n'est pas authentifié (401)
     * @throws {GraphQLError} Si une erreur se produit lors de la récupération de l'avis (500)
     */
    getUser: withSecureResolver(
      async (_, { id_user, validated }, context) => {
        /* exemple context JWT décodé ( à revoir):
        {
          userId: "uuid-of-user",
          email: "user@example.com",
          role: "admin"
        }
        */
        /*exemple de requête :
        query  getUser($id_user: ID!) {getUser(id_user: $id_user) {id_user,name,email }}
        */
        /* Exemple variables :
        {
          "id_user": "29e86cd8-4140-40d9-9814-e5aa62284b1d"
        }
        */
    
        // ========================================
        // RECUPERER LES DONNEES NESSESAIRES
        // ======================================== 
      
        // Sanitize input => 2ème couche - défense en profondeur
        const cleanIdUser = sanitizeStrict(id_user);

        if (!cleanIdUser) {
          throw new GraphQLError('ID utilisateur manquant', {
            extensions: { code: 'BAD_USER_INPUT', httpStatus: 400 }
          });
        }
        // ========================================
        // REQUETES BASE DE DONNEES
        // ======================================== 
        const user = await findUserOrThrow(cleanIdUser);
        // ========================================
        // DONNEES RECUPEREES
        // ========================================        
        if (context?.res?.status) context.res.status(200);
        return user;
      },
      {
        logAction: 'GET_ONE_USER',
        requiresAuth: true,
        errorMessage: 'Erreur lors de la récupération de l\'utilisateur'
      }
    ),
    
    /**
     * Recherche des utilisateurs par nom, email ou pseudo
     * 🔒 Route protégée (administrateur uniquement)
     * @param {string} nameOrPseudo - Terme de recherche
     * @param {number} limit - Limite de résultats (max 100)
     * @param {number} offset - Décalage pour pagination
     * @returns {object} { users, totalCount, hasNextPage }
     * @throws {GraphQLError} Si l'utilisateur n'a pas les droits (401 ou 403)
     * @throws {GraphQLError} Si une erreur se produit lors de la recherche des utilisateurs (500)
     */
    searchUsers: withSecureResolver(
      async (_, { validated }, context) => {
        /* exemple context JWT décodé ( à revoir):
        {
          userId: "uuid-of-user",
          email: "user@example.com",
          role: "admin"
        }
        */
        /*exemple de requête :
        query  searchUsers($nameOrPseudo: String!) {searchUsers(nameOrPseudo: $nameOrPseudo) {id_user,name,pseudo,email }}

        */
        /* Exemple variables :
        {"nameOrPseudo": "ta"}
        */

        // ========================================
        // RECUPERER LES DONNEES NESSESAIRES
        // ======================================== 

        // Extraction et validation des paramètres de pagination et de tri
        const { limit = 50, offset = 0, order = 'created_at', direction = 'DESC', query } = validated;

        // Sanitize inputs
        const cleanLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 100);
        const cleanOffset = Math.max(parseInt(offset) || 0, 0);
        const validOrders = ['created_at', 'name', 'email', 'pseudo', 'id_role', 'id_user'];
        const { order: safeOrder, direction: safeDirection } = validateOrderParams(
          sanitizeStrict(order), 
          sanitizeStrict(direction), 
          validOrders
        );
        const cleanNameOrPseudo = sanitizeStrict(query || '');

        if (!cleanNameOrPseudo || typeof cleanNameOrPseudo !== 'string' || cleanNameOrPseudo.trim().length === 0) {
          throw new GraphQLError('Terme de recherche invalide', {
            extensions: { code: 'BAD_USER_INPUT', httpStatus: 400 }
          });
        }

        const searchPattern = `%${cleanNameOrPseudo}%`;
        // ========================================
        // REQUETES BASE DE DONNEES
        // ======================================== 
        const result = await db.query(`
          SELECT id_user, name, email, pseudo, id_role, id_status, created_at, updated_at
          FROM users
          WHERE LOWER(name) LIKE LOWER($1) OR LOWER(email) LIKE LOWER($1) OR LOWER(pseudo) LIKE LOWER($1)
          ORDER BY ${safeOrder} ${safeDirection}
          LIMIT $2 OFFSET $3
        `, [searchPattern, cleanLimit, cleanOffset]);

        const countResult = await db.query(`
          SELECT COUNT(*)::int as count FROM users
          WHERE LOWER(name) LIKE LOWER($1) OR LOWER(email) LIKE LOWER($1) OR LOWER(pseudo) LIKE LOWER($1)
        `, [searchPattern]);
        // ========================================
        // DONNEES RECUPEREES
        // ========================================                
        return {
          users: result.rows,
          totalCount: countResult.rows[0].count,
          hasNextPage: cleanOffset + cleanLimit < countResult.rows[0].count,
          httpStatus: 200
        };
      },
      {
        sortingSchema: generalSortingSchema,
        orderSchema: generalOrderUserSchema,
        inputSchema: searchUsersSchema,
        logAction: 'SEARCH_USERS',
        requiresAuth: true,
        errorMessage: 'Erreur lors de la recherche d\'utilisateurs'
      }
    ),
    
  },
  Mutation: {
    /**
     * Crée un nouvel utilisateur
     * 🔓 Route publique (aucune authentification requise)
     * @param {object} input - Données de l'utilisateur
     * @param {string} input.name - Nom complet
     * @param {string} input.email - Adresse email
     * @param {string} input.pseudo - Pseudo
     * @param {string} input.password - Mot de passe
     * @returns {object} Utilisateur créé
     * @throws {GraphQLError} Si l'utilisateur n'a pas les droits (401 ou 403)
     * @throws {GraphQLError} Si une erreur se produit lors de la création de l'utilisateur (500)
     */
    createUser: withSecureResolver(
      async (_, { input, validated }, context) => {
        /* exemple context JWT décodé ( à revoir):
        {
          userId: "uuid-of-user",
          email: "user@example.com",
          role: "admin"
        }
        */
        /*exemple de requête :
        mutation createUser($input: CreateUserInput!) { createUser(input: $input) {id_user,name,pseudo,email} }}

        */
        /* Exemple variables : 
          { "input": {
          "name": "johnDoe",
          "pseudo": "reinconnu",
          "email": "johnDoe@example.com",
          "password": "password123"
        }
        }        
        */
        // ========================================
        // RECUPERER LES DONNEES NESSESAIRES
        // ======================================== 
        // Vérification des droits d'accès
         // un visiteur peut créer un utilisateur, donc pas de requireAuth ici

        if (!input || !input.name || !input.email || !input.pseudo || !input.password) {
          throw new GraphQLError('Tous les champs sont requis', {
            extensions: { code: 'BAD_USER_INPUT', httpStatus: 400 }
          });
        }

        const cleanInput = {
          name: sanitizeStrict(input.name),
          email: sanitizeStrict(input.email),
          pseudo: sanitizeStrict(input.pseudo),
          password: sanitizeStrict(input.password),  
        };

        // Valider les données
        validateUserInput(cleanInput);

        // Vérifier que l'email n'existe pas déjà
          const existingEmail = await db.query(
            'SELECT id_user FROM users WHERE LOWER(email) = LOWER($1)',
            [cleanInput.email]
          );

          if (existingEmail.rows.length > 0) {
            throw new GraphQLError('Cet email est déjà utilisé', {
              extensions: { code: 'CONFLICT', httpStatus: 409 }
            });
          }

        // Vérifier que le pseudo n'existe pas déjà
          const existingPseudo = await db.query(
            'SELECT id_user FROM users WHERE LOWER(pseudo) = LOWER($1)',
            [cleanInput.pseudo]
          );

          if (existingPseudo.rows.length > 0) {
            throw new GraphQLError('Ce pseudo est déjà utilisé', {
              extensions: { code: 'CONFLICT', httpStatus: 409 }
            });
          }

        // Déterminer l'ID du rôle par défaut 'user' depuis la table roles
        const roleLookup = await db.query(
          'SELECT id_role FROM roles WHERE role_name = $1 LIMIT 1',
          [initializationUser.defaultRole]
        );

        if (!roleLookup.rows || roleLookup.rows.length === 0) {
          throw new GraphQLError('Rôle par défaut introuvable dans la base de données', {
            extensions: { code: 'INTERNAL_SERVER_ERROR', httpStatus: 500 }
          });
        }
        const role = roleLookup.rows[0].id_role;

        // Déterminer l'ID du statut par défaut 'active' depuis la table status
        const statusLookup = await db.query(
          'SELECT id_status FROM status WHERE status_name = $1 LIMIT 1',
          [initializationUser.defaultStatus]
        );

        if (!statusLookup.rows || statusLookup.rows.length === 0) {
          throw new GraphQLError('Statut par défaut introuvable dans la base de données', {
            extensions: { code: 'INTERNAL_SERVER_ERROR', httpStatus: 500 }
          });
        }
        const status = statusLookup.rows[0].id_status;

        const hashedPassword = await bcrypt.hash(cleanInput.password, 10);

        // Utiliser l'import statique en haut du fichier : uuidv4
        const id = uuidv4();
        // ========================================
        // REQUETES BASE DE DONNEES
        // ========================================         

        // Envelopper la création utilisateur + bibliothèques par défaut dans une transaction
        await db.query('BEGIN');
        try {
          const result = await db.query(`
            INSERT INTO users (id_user, name, email, pseudo, password, id_role, id_status, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING id_user, name, email, pseudo, id_role, id_status, created_at, updated_at
          `, [id, cleanInput.name, cleanInput.email, cleanInput.pseudo, hashedPassword, role, status]);

          if (!result.rows || result.rows.length === 0) {
            throw new Error('Insertion utilisateur échouée');
          }
          console.log('createUser - user created:', result.rows[0]);
          // Créer les bibliothèques par défaut pour l'utilisateur
          const createdLibraries = [];
          for (const libraryName of initializationUser.librariesStartup) {
            const libraryId = uuidv4();
            const libRes = await db.query(`
              INSERT INTO libraries (id_library, id_user, name, is_editable, created_at, updated_at)
              VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
              RETURNING id_library, name, is_editable, id_user, created_at, updated_at
            `, [libraryId, id, libraryName, initializationUser.libraryDefaultEditable]);
            createdLibraries.push(libRes.rows[0]);
          }
          console.log('createUser - createdLibraries:', createdLibraries);
          await db.query('COMMIT');

          // création du token JWT et connexion automatique (le nouvel utilisateur est connecté dès la création de son compte)
          const user = result.rows[0];

          // NOTE : pour des raison de sécurité, le status et le role ne sont pas inclus dans le token d'accès, mais dans le "context" lors de la validation du token
          // Ne pas muter context ici (server.js gère l'enrichissement lors de la validation du token)

          // Générer les tokens
          const accessToken = generateAccessToken({
            id_user: user.id_user,
            pseudo: user.pseudo,
            name: user.name,
          });
          console.log('createUser - accessToken generated', accessToken);
          const refreshToken = generateRefreshToken({ id_user: user.id_user });

          if (context?.res?.status) context.res.status(201);

          // En DEV : on retourne un AuthPayload contenant user + tokens + libraries
          // -> Le schéma a été mis à jour pour createUser: AuthPayload!
          // En production, préférez mettre le refresh token dans un cookie HttpOnly
          // et/ou le stocker côté serveur (BDD) plutôt que de l'exposer dans le body.
          // Exemple (commenté) :
          // if (context?.res?.cookie) {
          //   // cookie settings: HttpOnly, secure en prod, durée courte/raisonnable
          //   context.res.cookie('refresh_token', refreshToken, {
          //     httpOnly: true,
          //     secure: process.env.NODE_ENV === 'production',
          //     sameSite: 'lax',
          //     maxAge: 30 * 24 * 60 * 60 * 1000 // par ex. 30 jours
          //   });
          // }
          // // Optionnel : stocker le refresh token en BDD pour pouvoir le révoquer
          // await db.query('UPDATE users SET refresh_token = $1 WHERE id_user = $2', [refreshToken, user.id_user]);

          // Construire l'AuthPayload
          const authPayload = {
            user,
            last_login: new Date().toISOString(),
            refresh_token: refreshToken,
            accessToken,
            libraries: createdLibraries
          };

          return authPayload;
        } catch (txErr) {
          // rollback et propager erreur
          await db.query('ROLLBACK');
          // Fournir un message plus clair pour le debug
          console.error('createUser transaction error:', txErr && txErr.message ? txErr.message : txErr);
          throw txErr;
        }
        // ========================================
        // DONNEES RECUPEREES
        // ======================================== 
        
      },
      {
        logAction: 'ADD_USER',
        requiresAuth: true,
        errorMessage: 'Erreur lors de l\'ajout de l\'utilisateur'
      }
    ),
    
    /**
     * Met à jour un utilisateur existant
     * 🔒 Route protégée (propriétaire ou administrateur)
     * @param {object} input - Données de l'utilisateur à mettre à jour
     * @param {string} input.id_user - ID de l'utilisateur
     * @param {string} [input.name] - Nouveau nom complet
     * @param {string} [input.email] - Nouvelle adresse email
     * @param {string} [input.pseudo] - Nouveau pseudo
     * @return {object} Utilisateur mis à jour
     * @throws {GraphQLError} Si l'utilisateur n'a pas les droits (401 ou 403)
     * @throws {GraphQLError} Si une erreur se produit lors de la mise à jour de l'utilisateur (500)
     */
    updateUser: withSecureResolver(
      async (_, { input, validated }, context) => {
        /* exemple context JWT décodé ( à revoir):
        {
          userId: "uuid-of-user",
          email: "user@example.com",
          role: "admin"
        }
        */
        /*exemple de requête :
        mutation updateUser($input: UpdateUserInput!) { updateUser(input: $input) {id_user,name,pseudo,email }}

        */
        /* Exemple variables :
        { "input": 
        {
          "id_user": "29e86cd8-4140-40d9-9814-e5aa62284b1d",
          "name" :"john Doe"
        }
        }       
        */
        // ========================================
        // RECUPERER LES DONNEES NESSESAIRES
        // ======================================== 
        // NOTE : on ne peut pas changer le mot de passe ici (pour des raisons de sécurité), il y a une mutation dédiée

        // Extraction des paramètres
        const { id_user, name, email, pseudo } = input;

        if (!id_user) {
          throw new GraphQLError('ID utilisateur manquant', {
            extensions: { code: 'BAD_USER_INPUT', httpStatus: 400 }
          });
        }

        // Sanitize inputs
        const cleanIdUser = sanitizeString(id_user);
        const cleanName = name !== undefined ? sanitizeString(name) : undefined;
        const cleanEmail = email !== undefined ? sanitizeString(email) : undefined;
        const cleanPseudo = pseudo !== undefined ? sanitizeString(pseudo) : undefined;

        requireOwnershipOrAdmin(cleanIdUser, context);

        // Validation des champs fournis
        if (cleanName !== undefined && (typeof cleanName !== 'string' || cleanName.trim().length < 3)) {
          throw new GraphQLError('Nom invalide', {
            extensions: { code: 'BAD_USER_INPUT', httpStatus: 400 }
          });
        }

        if (cleanEmail !== undefined && (typeof cleanEmail !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail))) {
          throw new GraphQLError('Email invalide', {
            extensions: { code: 'BAD_USER_INPUT', httpStatus: 400 }
          });
        }

        if (cleanPseudo !== undefined && (typeof cleanPseudo !== 'string' || cleanPseudo.trim().length < 3)) {
          throw new GraphQLError('Pseudo invalide', {
            extensions: { code: 'BAD_USER_INPUT', httpStatus: 400 }
          });
        }

        // Construction de la requête de mise à jour
        const fields = [];
        const values = [];
        let idx = 1;

        if (cleanName !== undefined) {
          fields.push(`name = $${idx++}`);
          values.push(cleanName);
        }

        if (cleanEmail !== undefined) {
          fields.push(`email = $${idx++}`);
          values.push(cleanEmail);
        }

        if (cleanPseudo !== undefined) {
          fields.push(`pseudo = $${idx++}`);
          values.push(cleanPseudo);
        }

        if (fields.length === 0) {
          throw new GraphQLError('Aucun champ à mettre à jour', {
            extensions: { code: 'BAD_USER_INPUT', httpStatus: 400 }
          });
        }

        // Ajouter updated_at
        fields.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(cleanIdUser);
        // ========================================
        // REQUETES BASE DE DONNEES
        // ======================================== 
        const result = await db.query(`
          UPDATE users
          SET ${fields.join(', ')}
          WHERE id_user = $${idx}
          RETURNING id_user, name, email, pseudo, id_role, id_status, created_at, updated_at
        `, values);
        // ========================================
        // DONNEES RECUPEREES
        // ========================================         
        if (result.rows.length === 0) {
          throw new GraphQLError('Utilisateur non trouvé', {
            extensions: { code: 'NOT_FOUND', httpStatus: 404 }
          });
        }

        if (context?.res?.status) context.res.status(200);
        return result.rows[0];
      },
      {
        logAction: 'UPDATE_USER',
        requiresAuth: true,
        errorMessage: 'Erreur lors de la mise à jour de l\'utilisateur'
      }
    ),
    
    /**
     * Supprime un utilisateur par son ID
     * 🔒 Route protégée (son propre compte ou administrateur )
     * @param {object} input - Données de l'utilisateur à supprimer
     * @param {string} input.id_user - ID de l'utilisateur
     * @returns {boolean} true si la suppression a réussi, false sinon
     * @throws {GraphQLError} Si l'utilisateur n'a pas les droits (401 ou 403)
     * @throws {GraphQLError} Si une erreur se produit lors de la suppression de l'utilisateur (500)
     */
    deleteUser: withSecureResolver(
      async (_, { input, validated }, context) => {
        /* exemple context JWT décodé ( à revoir):
        {
          userId: "uuid-of-user",
          email: "user@example.com",
          role: "admin"
        }
        */
        /*exemple de requête :
        mutation deleteUser($input: DeleteUserInput!) { deleteUser(input: $input) {id_user,name,pseudo,email }}

        */
        /* Exemple variables :
        { "input": 
        {
          "id_user": "29e86cd8-4140-40d9-9814-e5aa62284b1d"
        }
        }       
        */
        // ========================================
        // RECUPERER LES DONNEES NESSESAIRES
        // ======================================== 
        // Extraction des paramètres  
        const { id_user } = input;

        if (!id_user) {
          throw new GraphQLError('ID utilisateur manquant', {
            extensions: { code: 'BAD_USER_INPUT', httpStatus: 400 }
          });
        }

        // Sanitize inputs
        const cleanIdUser = sanitizeString(id_user);

        // Vérification des droits d'accès
        requireOwnershipOrAdmin(cleanIdUser, context);

        // Vérification de l'existence de l'utilisateur
        await findUserOrThrow(cleanIdUser);
        // ========================================
        // REQUETES BASE DE DONNEES
        // ======================================== 

        const result = await db.query(
          'DELETE FROM users WHERE id_user = $1 RETURNING id_user',
          [cleanIdUser]
        );

        if (result.rows.length === 0) {
          throw new GraphQLError('Utilisateur non trouvé', {
            extensions: { code: 'NOT_FOUND', httpStatus: 404 }
          });
        }

        // recuperer l'id de toutes les bibliothèques associées à l'utilisateur
        const librariesResult = await db.query(
          'SELECT id_library FROM libraries WHERE id_user = $1',
          [cleanIdUser]
        );

        // supprimer tous les livres et avis associés à ces bibliothèques
        for (const row of librariesResult.rows) {
          const idLibrary = row.id_library;

          //supprimer les entrées dans bookhaslibrary et reviews associées à cette bibliothèque
          await db.query(
            'DELETE FROM bookhaslibrary WHERE id_library = $1',
            [idLibrary]
          );
        }
          // supprimer tous les avis associés à cet utilisateur
          await db.query(
            'DELETE FROM reviews WHERE id_user = $1',
            [cleanIdUser]
          );

          // supprimer tous les messages associés à cet utilisateur
          await db.query(
            'DELETE FROM messages WHERE id_user = $1',
            [cleanIdUser]
          );

          // supprimer tous les rapports associés à cet utilisateur
          await db.query(
            'DELETE FROM reports WHERE id_user = $1',
            [cleanIdUser]
          );
        // ========================================
        // DONNEES RECUPEREES
        // ======================================== 
        if (context && context.res && typeof context.res.status === 'function') {
          context.res.status(200);
        }

        return true;
      },
      {
        logAction: 'DELETE_USER',
        requiresAuth: true,
        errorMessage: 'Erreur lors de la suppression de l\'utilisateur'
      }
    ),
    
    /**
     * Réinitialise le mot de passe d'un utilisateur sans ancien mot de passe(admin only)
     * 🔒 Route protégée (administrateur)
     * @param {object} input - Données de l'utilisateur à supprimer
     * @param {string} input.id_user - ID de l'utilisateur
     * @returns {boolean} true si la suppression a réussi, false sinon
     * @throws {GraphQLError} Si l'utilisateur n'a pas les droits (401 ou 403)
     * @throws {GraphQLError} Si une erreur se produit lors de la suppression de l'utilisateur (500)
     */
    adminResetPassword: withSecureResolver(
      async (_, { input, validated }, context) => {
        // ========================================
        // RECUPERER LES DONNEES NESSESAIRES
        // ======================================== 

        const { id_user, newPassword } = input || {};
        if (!id_user || !newPassword) {
          throw new GraphQLError('id_user et newPassword sont requis', {
            extensions: { code: 'BAD_USER_INPUT', httpStatus: 400 }
          });
        }

        const cleanIdUser = sanitizeString(id_user);
        const cleanNewPassword = sanitizeString(newPassword);

        if (typeof cleanNewPassword !== 'string' || cleanNewPassword.length < 6) {
          throw new GraphQLError('Le mot de passe doit contenir au moins 6 caractères', {
            extensions: { code: 'BAD_USER_INPUT', httpStatus: 400 }
          });
        }

        // Vérifier que l'utilisateur existe
        await findUserOrThrow(cleanIdUser);
        // ========================================
        // REQUETES BASE DE DONNEES
        // ======================================== 
        const hashed = await bcrypt.hash(cleanNewPassword, 10);
        await db.query('UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id_user = $2', [hashed, cleanIdUser]);
        // ========================================
        // DONNEES RECUPEREES
        // ========================================         
        if (context?.res?.status) context.res.status(200);
        return true;
      },
      {
        logAction: 'UPDATE_PASSWORD_ADMIN',
        requiresAuth: true,
        errorMessage: 'Erreur lors de la mise à jour du mot de passe par l\'administrateur'
      }
    ),
    
    /** 
     * Réinitialise le mot de passe d'un utilisateur sans ancien mot de passe(admin only)
     * 🔒 Route protégée (utilisateur)
     * @param {object} input - Données de l'utilisateur à supprimer
     * @param {string} input.id_user - ID de l'utilisateur
     * @returns {boolean} true si la suppression a réussi, false sinon
     * @throws {GraphQLError} Si l'utilisateur n'a pas les droits (401 ou 403)
     * @throws {GraphQLError} Si une erreur se produit lors de la suppression de l'utilisateur (500)
     */
    changePassword: withSecureResolver(
      async (_, { input, validated }, context) => {
        /* exemple context JWT décodé ( à revoir):
        {
          userId: "uuid-of-user",
          email: "user@example.com",
          role: "admin"
        }
        */
        /*exemple de requête :
        mutation changePassword($input: ChangePasswordInput!) { changePassword(input: $input) {id_user,name,pseudo,email }}

        */
        /* Exemple variables :
        { "input": 
        {
          "id_user": "29e86cd8-4140-40d9-9814-e5aa62284b1d",
          "oldPassword": "password123",
          "newPassword": "password1234"
        }
        }       
        */
          
        // ========================================
        // RECUPERER LES DONNEES NESSESAIRES
        // ======================================== 
        // Extraction des paramètres
          const { id_user, oldPassword, newPassword } = input || {};

          if (!id_user || !oldPassword || !newPassword) {
            throw new GraphQLError('Tous les champs sont requis', {
              extensions: { code: 'BAD_USER_INPUT', httpStatus: 400 }
            });
          }

          // Vérification des droits d'accès
          requireOwnershipOrAdmin(id_user, context);

          // Sanitize inputs
          const cleanIdUser = sanitizeString(id_user);
          const cleanOldPassword = sanitizeString(oldPassword);
          const cleanNewPassword = sanitizeString(newPassword);

          // Vérification de l'existence de l'utilisateur
          const existingUser = await findUserOrThrow(cleanIdUser);

          if (!existingUser) {
            throw new GraphQLError('Utilisateur non trouvé', {
              extensions: { code: 'NOT_FOUND', httpStatus: 404 }
            });
          }

          await validatePasswordInput({
            cleanNewPassword,
            cleanOldPassword,
            userId: cleanIdUser
          });

          // Vérifier que la base contient bien un hash utilisable par bcrypt
          if (!existingUser.password || typeof existingUser.password !== 'string') {
            throw new GraphQLError('Impossible de vérifier l\'ancien mot de passe : aucun hash trouvé', {
              extensions: { code: 'INTERNAL_SERVER_ERROR', httpStatus: 500 }
            });
          }

          // Detecter rapidement si le hash est un bcrypt (commence généralement par "$2a$"/$2b$/$2y$")
          if (!existingUser.password.startsWith('$2')) {
            // Ne pas renvoyer le hash au client — donner une instruction claire
            throw new GraphQLError('Impossible de vérifier l\'ancien mot de passe : algorithme de hash inconnu. Utilisez la procédure de réinitialisation de mot de passe ou contactez un administrateur.', {
              extensions: { code: 'INTERNAL_SERVER_ERROR', httpStatus: 500 }
            });
          }

          // Vérifier que l'ancien mot de passe correspond
          const isMatch = await bcrypt.compare(cleanOldPassword, existingUser.password);
          if (!isMatch) {
            throw new GraphQLError('L\'ancien mot de passe est incorrect', {
              extensions: { code: 'UNAUTHORIZED', httpStatus: 401 }
            });
          }

          const hashedNewPassword = await bcrypt.hash(cleanNewPassword, 10);
        // ========================================
        // REQUETES BASE DE DONNEES
        // ======================================== 
          await db.query(
            'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id_user = $2',
            [hashedNewPassword, cleanIdUser]
          );
        // ========================================
        // DONNEES RECUPEREES
        // ========================================         
          if (context?.res?.status) context.res.status(200);
          return true;
      },
      {
        logAction: 'UPDATE_PASSWORD',
        requiresAuth: true,
        errorMessage: 'Erreur lors de la mise à jour du mot de passe'
      }
    ),
    
// ========================================
    // CONNEXION & DECONNEXION
// ========================================

    /**
     * 🔑 CONNEXION - Vérifier identifiants + générer token
     * @param {object} input - Email/pseudo + password + rememberMe
     * @returns {object} { user, accessToken, refreshToken }
     */
    login: withErrorHandling(
      withRateLimit(
      async (_, { input }, context) => {
        /* exemple de requête :
        mutation Login($input: LoginInput!) {
          login(input: $input) {
            user {
              id_user
              email
              pseudo
              role
            }
            accessToken
            refreshToken
          }
        }
        */
        /* Exemple de variables :
        Variables:
        {
          "input": {
            "emailOrPseudo": "john@example.com",
            "password": "securepassword123",
            "rememberMe": true
          }
        }
        */
        const { emailOrPseudo, password, rememberMe = false } = input;
        
        // Sanitize
        const cleanLogin = sanitizeString(emailOrPseudo);
        const cleanPassword = sanitizeString(password);
        
        if (!cleanLogin || !cleanPassword) {
          throw new GraphQLError('Email/pseudo et mot de passe requis', {
            extensions: { code: 'BAD_USER_INPUT', httpStatus: 400 }
          });
        }
        
        // Chercher l'utilisateur par email OU pseudo
        const result = await db.query(`
          SELECT u.id_user, u.email, u.pseudo, u.password, u.id_role, u.status,
                 r.role_name
          FROM users u
          LEFT JOIN roles r ON u.id_role = r.id_role
          WHERE LOWER(u.email) = LOWER($1) OR LOWER(u.pseudo) = LOWER($1)
        `, [cleanLogin]);
        
        if (result.rows.length === 0) {
          throw new GraphQLError('Email/pseudo ou mot de passe incorrect', {
            extensions: { code: 'UNAUTHORIZED', httpStatus: 401 }
          });
        }
        
        const user = result.rows[0];
        
        // Vérifier le statut du compte (1 = actif)
        if (user.status !== 1) {
          throw new GraphQLError('Votre compte est bloqué', {
            extensions: { code: 'FORBIDDEN', httpStatus: 403 }
          });
        }
        
        // Vérifier le mot de passe
        const isPasswordValid = await bcrypt.compare(cleanPassword, user.password);
        
        if (!isPasswordValid) {
          throw new GraphQLError('Email/pseudo ou mot de passe incorrect', {
            extensions: { code: 'UNAUTHORIZED', httpStatus: 401 }
          });
        }
        
        // Générer les tokens (durée selon rememberMe)
        const accessToken = generateAccessToken({
          id_user: user.id_user,
          email: user.email,
          pseudo: user.pseudo,
          role: user.role_name || 'user',
        }, rememberMe);
        
        const refreshToken = generateRefreshToken({
          id_user: user.id_user,
        });
        
        // Stocker le refresh token en BDD
        // await db.query(`
        //   UPDATE users 
        //   SET refresh_token = $1, last_login = NOW() 
        //   WHERE id_user = $2
        // `, [refreshToken, user.id_user]);
        
        // Retourner sans le mot de passe
        delete user.password;
        
        return {
          user: {
            id_user: user.id_user,
            email: user.email,
            pseudo: user.pseudo,
          },
          accessToken,
          refreshToken,
        };
      },
      // Rate limiting pour éviter les attaques par force brute
      { maxRequests: 60, windowMs: 60000 } // 60 tentatives toutes les 1 minute
      ),
      'Erreur lors de la connexion'
    ),
        
    /**
     * 🔄 REFRESH TOKEN - Renouveler l'access token
     * @param {string} refreshToken - Refresh token
     * @returns {object} { accessToken, refreshToken }
     */
    refreshToken: withErrorHandling(
      async (_, { refreshToken }, context) => {
        /* exemple de requête :
        mutation RefreshToken($refreshToken: String!) {
          refreshToken(refreshToken: $refreshToken) {
            accessToken
            refreshToken
          }
        }
        */
       /* Exemple de Variables:
        {
          "refreshToken": "eyJhbGc..."
        }
        */
        if (!refreshToken) {
          throw new GraphQLError('Refresh token requis', {
            extensions: { code: 'BAD_USER_INPUT', httpStatus: 400 }
          });
        }
        
        // Vérifier le refresh token
        const decoded = verifyToken(refreshToken, true);
        
        if (!decoded || decoded.type !== 'refresh') {
          throw new GraphQLError('Refresh token invalide', {
            extensions: { code: 'UNAUTHORIZED', httpStatus: 401 }
          });
        }
        
        // Vérifier que le token existe en BDD
        const result = await db.query(`
          SELECT u.id_user, u.email, u.pseudo, u.refresh_token, r.role_name
          FROM users u
          LEFT JOIN roles r ON u.id_role = r.id_role
          WHERE u.id_user = $1
        `, [decoded.id_user]);
        
        if (result.rows.length === 0 || result.rows[0].refresh_token !== refreshToken) {
          throw new GraphQLError('Refresh token invalide ou révoqué', {
            extensions: { code: 'UNAUTHORIZED', httpStatus: 401 }
          });
        }
        
        const user = result.rows[0];
        
        // Générer un nouveau access token
        const newAccessToken = generateAccessToken({
          id_user: user.id_user,
          email: user.email,
          pseudo: user.pseudo,
        });
        
        // Optionnel : Rotation du refresh token (plus sécurisé)
        const newRefreshToken = generateRefreshToken({
          id_user: user.id_user,
        });
        
        await db.query(`
          UPDATE users SET refresh_token = $1 WHERE id_user = $2
        `, [newRefreshToken, user.id_user]);
        
        return {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
        };
      },
      'Erreur lors du renouvellement du token'
    ),
    
    /**
     * 🚪 DÉCONNEXION - Invalider le refresh token
     * @param {object} context - Context avec user
     * @returns {boolean} true si déconnexion réussie
     */
    logout: withErrorHandling(
      async (_, args, context) => {
        /*
        mutation Logout {
          logout
        }
        
        Headers:
        {
          "Authorization": "Bearer eyJhbGc..."
        }
        */
        if (!context.isAuthenticated) {
          throw new GraphQLError('Non authentifié', {
            extensions: { code: 'UNAUTHENTICATED', httpStatus: 401 }
          });
        }
        
        const userId = context.user?.id_user;
        
        if (!userId) {
          throw new GraphQLError('ID utilisateur introuvable', {
            extensions: { code: 'UNAUTHORIZED', httpStatus: 401 }
          });
        }
        
        // Supprimer le refresh token en BDD
        await db.query(`
          UPDATE users SET refresh_token = NULL WHERE id_user = $1
        `, [userId]);
        
        return true;
      },
      'Erreur lors de la déconnexion'
    ),
    
  },

  User: {

    // Ajoutez des résolveurs de champ personnalisés si nécessaire
    role: async (parent) => {
      return fetchRoleById(parent.id_role);
    },

    status: (parent) => {
      return fetchStatusById(parent.id_status);
    },
  },
};