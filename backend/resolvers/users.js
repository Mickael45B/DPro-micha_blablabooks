import db from "../db/connect_DB.js";
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import { validateOrderParams, handleDbError } from '../utils/validators.js';
import  fetchRoleById  from './utils/utils_roles.js';
import { fetchUserById } from './utils/utils_users.js';
import { flattenEdges, makePageInfo, makeEdgeFromBook } from '../utils/helpers_books.js';
import sanitizeHtml from 'sanitize-html';
import { GraphQLError } from 'graphql';
import fetchBookById from './utils/utils_books.js';
import fetchLibraryById from './utils/utils_librairies.js';

import { isAuthenticated, requireAuth, requireAdmin, requireOwnershipOrAdmin, sanitizeString, sanitizeInput } from './utils/helpers/helpers_general.js';

import { findUserOrThrow, validateUserInput, validatePasswordInput} from './utils/helpers/helpers_Users.js';
import { clean } from "semver";

// Revoir le resolver "changePassword",

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
    getUsers: async (_, args, context) => {
      try {

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

        // Vérification des droits d'accès
        requireAdmin(context);

        // Extraction et validation des paramètres de pagination et de tri
        const { limit = 70, offset = 0, order = 'created_at', direction = 'DESC' } = args;

        // Sanitize inputs
        const cleanLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 100);
        const cleanOffset = Math.max(parseInt(offset) || 0, 0);
        const validOrders = ['created_at', 'name', 'email', 'pseudo', 'id_role', 'id_user'];
        const { order: safeOrder, direction: safeDirection } = validateOrderParams(
          sanitizeString(order), 
          sanitizeString(direction), 
          validOrders
        );
        
        const result = await db.query(`
          SELECT id_user, name, email, pseudo, id_role, status, created_at, updated_at
          FROM users
          ORDER BY ${safeOrder} ${safeDirection}
          LIMIT $1 OFFSET $2
        `, [cleanLimit, cleanOffset]);
        
        const countResult = await db.query('SELECT COUNT(*)::int as count FROM users');
        const totalCount = countResult.rows[0].count;

        return {
          users: result.rows,
          totalCount,
          hasNextPage: cleanOffset + cleanLimit < totalCount,
          httpStatus: 200
        };
      } catch (error) {
        if (error instanceof GraphQLError) throw error;
        throw new GraphQLError('Erreur lors de la récupération des utilisateurs', {
          extensions: { 
            code: 'INTERNAL_SERVER_ERROR',
            httpStatus: 500,
            originalError: error.message
          }
        });
      }
    },

    /**
     * Récupère un avis par son ID
     * 🔒 Route protégée (administrateur uniquement)
     * @param {string} id_review - ID de l'avis
     * @returns {object|null} Avis ou null si non trouvé
     * @throws {GraphQLError} Si l'utilisateur n'est pas authentifié (401)
     * @throws {GraphQLError} Si une erreur se produit lors de la récupération de l'avis (500)
     */
    getUser: async (_, { id_user }, context) => {
      try {

        /* exemple context JWT décodé ( à revoir):
        {
          userId: "uuid-of-user",
          email: "user@example.com",
          role: "admin"
        }
        */
       /*exemple de requête :
        query  getUser($id_user: ID!) {getUser(id_user: $id_user) {id_user,name,pseudo,email }}

        */
        /* Exemple variables :
        {"id_user": "2e3d4c5b-6a7f-8e9d-0c1b-2a3f4e5d6c7b"}
        */


        // Vérification des droits d'accès (propriétaire ou admin)
        requireOwnershipOrAdmin(id_user, context);

        // Sanitize input
        const cleanIdUser = sanitizeString(id_user);

        if (!cleanIdUser) {
          throw new GraphQLError('ID utilisateur manquant', {
            extensions: { code: 'BAD_USER_INPUT', httpStatus: 400 }
          });
        }

        const user = await findUserOrThrow(cleanIdUser);

        if (context?.res?.status) context.res.status(200);
        return user;
      } catch (error) {
        if (error instanceof GraphQLError) throw error;
        throw new GraphQLError("Erreur lors de la récupération de l'utilisateur", {
          extensions: {
            code: 'INTERNAL_SERVER_ERROR',
            httpStatus: 500,
            originalError: error.message
          }
        });
      }
    },

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
    searchUsers: async (_, args, context) => {
      try {

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


        // Vérification des droits d'accès
        requireAdmin(context);

        // Extraction et validation des paramètres de pagination et de tri
        const { limit = 50, offset = 0, order = 'created_at', direction = 'DESC', nameOrPseudo } = args;

        // Sanitize inputs
        const cleanLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 100);
        const cleanOffset = Math.max(parseInt(offset) || 0, 0);
        const validOrders = ['created_at', 'name', 'email', 'pseudo', 'id_role', 'id_user'];
        const { order: safeOrder, direction: safeDirection } = validateOrderParams(
          sanitizeString(order), 
          sanitizeString(direction), 
          validOrders
        );
        const cleanNameOrPseudo = sanitizeString(nameOrPseudo || '');

        if (!cleanNameOrPseudo || typeof cleanNameOrPseudo !== 'string' || cleanNameOrPseudo.trim().length === 0) {
          throw new GraphQLError('Terme de recherche invalide', {
            extensions: { code: 'BAD_USER_INPUT', httpStatus: 400 }
          });
        }

        const searchPattern = `%${cleanNameOrPseudo}%`;

        const result = await db.query(`
          SELECT id_user, name, email, pseudo, id_role, status, created_at, updated_at
          FROM users
          WHERE LOWER(name) LIKE LOWER($1) OR LOWER(email) LIKE LOWER($1) OR LOWER(pseudo) LIKE LOWER($1)
          ORDER BY ${safeOrder} ${safeDirection}
          LIMIT $2 OFFSET $3
        `, [searchPattern, cleanLimit, cleanOffset]);

        const countResult = await db.query(`
          SELECT COUNT(*)::int as count FROM users
          WHERE LOWER(name) LIKE LOWER($1) OR LOWER(email) LIKE LOWER($1) OR LOWER(pseudo) LIKE LOWER($1)
        `, [searchPattern]);

        return {
          users: result.rows,
          totalCount: countResult.rows[0].count,
          hasNextPage: cleanOffset + cleanLimit < countResult.rows[0].count,
          httpStatus: 200
        };
      } catch (error) {
        if (error instanceof GraphQLError) throw error;
        throw new GraphQLError('Erreur lors de la recherche des utilisateurs', {
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
    createUser: async (_, { input }, context) => {
      try {

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

        // Vérification des droits d'accès
         // un visiteur peut créer un utilisateur, donc pas de requireAuth ici

        if (!input || !input.name || !input.email || !input.pseudo || !input.password) {
          throw new GraphQLError('Tous les champs sont requis', {
            extensions: { code: 'BAD_USER_INPUT', httpStatus: 400 }
          });
        }

        const cleanInput = {
          name: sanitizeString(input.name),
          email: sanitizeString(input.email),
          pseudo: sanitizeString(input.pseudo),
          password: sanitizeString(input.password),  
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
        // Ne pas utiliser de placeholder hardcodé — se baser sur la table roles/seed.
        const roleLookup = await db.query(
          'SELECT id_role FROM roles WHERE role_name = $1 LIMIT 1',
          ['user']
        );
        if (!roleLookup.rows || roleLookup.rows.length === 0) {
          throw new GraphQLError('Rôle par défaut introuvable dans la base de données', {
            extensions: { code: 'INTERNAL_SERVER_ERROR', httpStatus: 500 }
          });
        }
        const id_role = roleLookup.rows[0].id_role;
        const status = 1; // Remplacer par le statut par défaut ==> 1=actif, 2=bloqué par admin, 3=bloqué par l'utilisateur lui-même 4=bloqué par les 2 parties 5=supprimé
        const hashedPassword = await bcrypt.hash(cleanInput.password, 10);

        const id = uuidv4();
        
        const result = await db.query(`
          INSERT INTO users (id_user, name, email, pseudo, password, id_role, status, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          RETURNING id_user, name, email, pseudo, id_role, status, created_at, updated_at
        `, [id, cleanInput.name, cleanInput.email, cleanInput.pseudo, hashedPassword, id_role, status]);

        if (context?.res?.status) context.res.status(201);
        return result.rows[0];
      } catch (error) {
        if (error instanceof GraphQLError) throw error;
        throw new GraphQLError('Erreur lors de la création de l\'utilisateur', {
          extensions: { 
            code: 'INTERNAL_SERVER_ERROR',
            httpStatus: 500,
            originalError: error.message
          },
        });
      }
    },  

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
    updateUser: async (_, { input }, context) => {
      try {

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

        const result = await db.query(`
          UPDATE users
          SET ${fields.join(', ')}
          WHERE id_user = $${idx}
          RETURNING id_user, name, email, pseudo, id_role, status, created_at, updated_at
        `, values);

        if (result.rows.length === 0) {
          throw new GraphQLError('Utilisateur non trouvé', {
            extensions: { code: 'NOT_FOUND', httpStatus: 404 }
          });
        }

        if (context?.res?.status) context.res.status(200);
        return result.rows[0];
      } catch (error) {
        if (error instanceof GraphQLError) throw error;
        throw new GraphQLError("Erreur lors de la mise à jour de l'utilisateur", {
          extensions: { 
            code: 'INTERNAL_SERVER_ERROR',
            httpStatus: 500,
            originalError: error.message
          },
        });
      }
    },

    /**
     * Supprime un utilisateur par son ID
     * 🔒 Route protégée (son propre compte ou administrateur )
     * @param {object} input - Données de l'utilisateur à supprimer
     * @param {string} input.id_user - ID de l'utilisateur
     * @returns {boolean} true si la suppression a réussi, false sinon
     * @throws {GraphQLError} Si l'utilisateur n'a pas les droits (401 ou 403)
     * @throws {GraphQLError} Si une erreur se produit lors de la suppression de l'utilisateur (500)
     */
    deleteUser: async (_, { input }, context) => {
      try {

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

        const result = await db.query(
          'DELETE FROM users WHERE id_user = $1 RETURNING id_user',
          [cleanIdUser]
        );

        if (context && context.res && typeof context.res.status === 'function') {
          context.res.status(200);
        }

        return true;
      } catch (error) {
        if (error instanceof GraphQLError) throw error;
        throw new GraphQLError("Erreur lors de la suppression de l'utilisateur", {
          extensions: { 
            code: 'INTERNAL_SERVER_ERROR',
            httpStatus: 500,
            originalError: error.message
          },
        });
      }
    },

    /**
     * Réinitialise le mot de passe d'un utilisateur sans ancien mot de passe(admin only)
     * 🔒 Route protégée (administrateur)
     * @param {object} input - Données de l'utilisateur à supprimer
     * @param {string} input.id_user - ID de l'utilisateur
     * @returns {boolean} true si la suppression a réussi, false sinon
     * @throws {GraphQLError} Si l'utilisateur n'a pas les droits (401 ou 403)
     * @throws {GraphQLError} Si une erreur se produit lors de la suppression de l'utilisateur (500)
     */
    adminResetPassword: async (_, { input }, context) => {
      try {
        // Seul un administrateur peut appeler cette mutation
        requireAdmin(context);

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

        const hashed = await bcrypt.hash(cleanNewPassword, 10);
        await db.query('UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id_user = $2', [hashed, cleanIdUser]);

        if (context?.res?.status) context.res.status(200);
        return true;
      } catch (error) {
        if (error instanceof GraphQLError) throw error;
        throw new GraphQLError('Erreur lors de la réinitialisation du mot de passe', {
          extensions: { code: 'INTERNAL_SERVER_ERROR', httpStatus: 500, originalError: error.message }
        });
      }
    },

    /** 
     * Réinitialise le mot de passe d'un utilisateur sans ancien mot de passe(admin only)
     * 🔒 Route protégée (utilisateur)
     * @param {object} input - Données de l'utilisateur à supprimer
     * @param {string} input.id_user - ID de l'utilisateur
     * @returns {boolean} true si la suppression a réussi, false sinon
     * @throws {GraphQLError} Si l'utilisateur n'a pas les droits (401 ou 403)
     * @throws {GraphQLError} Si une erreur se produit lors de la suppression de l'utilisateur (500)
     */
    changePassword: async (_, { input }, context) => {
        try {

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
          
          // Extraction des paramètres
          const { id_user, oldPassword, newPassword } = input || {};

          if (!id_user || !oldPassword || !newPassword) {
            throw new GraphQLError('Tous les champs sont requis', {
              extensions: { code: 'BAD_USER_INPUT', httpStatus: 400 }
            });
          }

          // Vérification des droits d'accès
          //requireOwnershipOrAdmin(id_user, context);

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

          await db.query(
            'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id_user = $2',
            [hashedNewPassword, cleanIdUser]
          );

          if (context?.res?.status) context.res.status(200);
          return true;
        } catch (error) {
          if (error instanceof GraphQLError) throw error;
          throw new GraphQLError("Erreur lors du changement de mot de passe", {
            extensions: { 
              code: 'INTERNAL_SERVER_ERROR',
              httpStatus: 500,
              originalError: error.message
            },
          });
        }
    },
  },

  User: {

    // Ajoutez des résolveurs de champ personnalisés si nécessaire
    role: async (parent) => {
      return fetchRoleById(parent.id_role);
    },

  },
};