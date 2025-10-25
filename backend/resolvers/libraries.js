import db from "../db/connect_DB.js";
import { v4 as uuidv4 } from 'uuid';
import { GraphQLError } from 'graphql';
import sanitizeHtml from 'sanitize-html';
import { validateOrderParams, handleDbError } from '../utils/validators.js';
import { fetchUserById } from './utils/utils_users.js';
import fetchUserRoleNameById from './utils/utils_roles.js';
import { isAuthenticated, requireAuth, requireAdmin, requireOwnershipOrAdmin, sanitizeString, sanitizeInput } from './utils/helpers/helpers_general.js';
import {findLibraryOrThrow, requireEditableLibrary} from './utils/helpers/helpers_library.js';



// ========================================
// RESOLVERS POUR LES BIBLIOTHÈQUES
// ======================================== 

export default {
  Query: {
    
    /**
     * Récupère toutes les bibliothèques avec pagination
     * 🔓 Route publique
     * @returns {object} { libraries, totalCount, hasNextPage }
     */
    getLibraries: async (_, args, context) => {
      try {

        /* exemple context JWT décodé ( à revoir):
        {
          userId: "uuid-of-user",
          email: "user@example.com",
          role: "admin"
        }
        */
        /*exemple de requête :
        query {getLibraries{libraries{name, user{name}}}}
        */
        /* Exemple variables :
        {
        }
        */
        
        const { limit = 50, offset = 0, order = 'created_at', direction = 'ASC' } = args;
        
        // Vérifier les droits d'accès
        //requireAdmin(context);
        
        // Sanitize inputs
        const cleanLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 100);
        const cleanOffset = Math.max(parseInt(offset) || 0, 0);
        
        const validOrders = ['created_at', 'name'];
        const { order: safeOrder, direction: safeDirection } = validateOrderParams(
          sanitizeString(order), 
          sanitizeString(direction), 
          validOrders
        );
        
        const result = await db.query(`
          SELECT *
          FROM libraries
          ORDER BY ${safeOrder} ${safeDirection}
          LIMIT $1 OFFSET $2
        `, [cleanLimit, cleanOffset]);
        
        const countResult = await db.query('SELECT COUNT(*)::int as count FROM libraries');
        const totalCount = countResult.rows[0].count;
        
        return {
          libraries: result.rows,
          totalCount,
          hasNextPage: cleanOffset + cleanLimit < totalCount,
          httpStatus: 200,
        };
      } catch (error) {
        if (error instanceof GraphQLError) throw error;
        throw new GraphQLError('Erreur lors de la récupération des bibliothèques', {
          extensions: { 
            code: 'INTERNAL_SERVER_ERROR',
            httpStatus: 500,
            originalError: error.message
          },
        });
      }
    },

    /**
     * Récupère les bibliothèques d'un utilisateur
     * 🔒 Route protégée - L'utilisateur ne peut voir que ses propres bibliothèques (sauf admin)
     * @param {string} id_user - ID de l'utilisateur
     * @returns {array} Liste des bibliothèques
     */
    getUserLibraries: async (_, { id_user }, context) => {
      try {

        /* exemple context JWT décodé ( à revoir):
        {
          userId: "uuid-of-user",
          email: "user@example.com",
          role: "admin"
        }
        */
       /*exemple de requête :
        query  getUserLibraries($id_user: ID!) {getUserLibraries(id_user: $id_user) {id_library,name }}

        */
        /* Exemple variables :
        {"id_user": "f6g7h8i9-j0k1-2l3m-4n5o-6p7q8r9s0t1u"}
        */
        
        // Sanitize input
        const cleanUserId = sanitizeString(id_user);
        
        // Vérifier les droits d'accès
        //requireOwnershipOrAdmin(cleanUserId, context);
        
        const result = await db.query(
          'SELECT id_library, name, is_editable, id_user, created_at, updated_at FROM libraries WHERE id_user = $1',
          [cleanUserId]
        );
        
        // Pas d'erreur 404 si vide, on retourne un tableau (conforme au schéma GraphQL qui attend une liste)
        // On renvoie directement les rows (array) : [Library]
        if (context?.res?.status) context.res.status(200);
        return result.rows;
      } catch (error) {
        if (error instanceof GraphQLError) throw error;
        throw new GraphQLError('Erreur lors de la récupération des bibliothèques utilisateur', {
          extensions: { 
            code: 'INTERNAL_SERVER_ERROR',
            httpStatus: 500,
            originalError: error.message
          },
        });
      }
    },

    /**
     * Récupère une bibliothèque par son ID
     * 🔓 Route publique
     * @param {string} id_library - ID de la bibliothèque
     * @returns {object} Bibliothèque trouvée
     */
    getLibrary: async (_, { id_library }, context) => {
      try {

        /* exemple context JWT décodé ( à revoir):
        {
          userId: "uuid-of-user",
          email: "user@example.com",
          role: "admin"
        }
        */
       /*exemple de requête :
        query  getLibrary($id_library: ID!) {getLibrary(id_library: $id_library) {id_library,name user{name, role{role_name}} }}

        */
        /* Exemple variables :
        {"id_library": "2b3c4d5e-6f7g-8h9i-0j1k-2l3m4n5o6p7q"}
        */


        // Sanitize input
        const cleanLibraryId = sanitizeString(id_library);
        
        // Trouver la bibliothèque (throw 404 si non trouvée)
        const library = await findLibraryOrThrow(cleanLibraryId);
        
        if (context?.res?.status) context.res.status(200);
        return library;
      } catch (error) {
        if (error instanceof GraphQLError) throw error;
        throw new GraphQLError('Erreur lors de la récupération de la bibliothèque', {
          extensions: { 
            code: 'INTERNAL_SERVER_ERROR',
            httpStatus: 500,
            originalError: error.message
          },
        });
      }
    },

    /**
     * Recherche des bibliothèques par nom
     * 🔓 Route publique
     * @param {string} name - Terme de recherche
     * @returns {object} { libraries, totalCount, hasNextPage }
     */
    searchLibraries: async (_, args, context) => {
      try {

        /* exemple context JWT décodé ( à revoir):
        {
          userId: "uuid-of-user",
          email: "user@example.com",
          role: "admin"
        }
        */
       /*exemple de requête :
        query  searchLibraries($name: String!) {searchLibraries(name: $name) {id_library,name }}

        */
        /* Exemple variables :
        {"name": "bob"}
        */



        const { name, limit = 50, offset = 0 } = args;
        
        // Vérifier les droits d'accès
        requireAuth(context);

        // Validation avec Joi => 1ere couche - défense en profondeur
        const { error } = searchLibrariesSchema.validate({ name: cleanName, limit: cleanLimit, offset: cleanOffset });
        if (error) {
          throw new GraphQLError('Paramètres de recherche invalides', {
            extensions: {
              code: 'BAD_REQUEST',
              httpStatus: 400,
              originalError: error.message
            },
          });
        }

        // Sanitize inputs => 2eme couche - défense en profondeur
        const cleanName = sanitizeString(name);
        const cleanLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 100);
        const cleanOffset = Math.max(parseInt(offset) || 0, 0);
        
        if (!cleanName || cleanName.length < 2) {
          throw new GraphQLError('Le terme de recherche doit contenir au moins 2 caractères', {
            extensions: { 
              code: 'BAD_REQUEST',
              httpStatus: 400
            },
          });
        }
        
        const searchPattern = `%${cleanName}%`;

        const result = await db.query(`
          SELECT id_library, name, is_editable, id_user, created_at, updated_at 
          FROM libraries
          WHERE LOWER(name) LIKE LOWER($1)
          ORDER BY created_at DESC
          LIMIT $2 OFFSET $3
        `, [searchPattern, cleanLimit, cleanOffset]);
        
        const countResult = await db.query(`
          SELECT COUNT(*)::int as count FROM libraries
          WHERE LOWER(name) LIKE LOWER($1)
        `, [searchPattern]);
        
        return {
          libraries: result.rows,
          totalCount: countResult.rows[0].count,
          hasNextPage: cleanOffset + cleanLimit < countResult.rows[0].count,
          httpStatus: 200,
        };
      } catch (error) {
        if (error instanceof GraphQLError) throw error;
        throw new GraphQLError('Erreur lors de la recherche des bibliothèques', {
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
     * Crée une nouvelle bibliothèque
     * 🔒 Route protégée - L'utilisateur ne peut créer que ses propres bibliothèques (sauf admin)
     * @param {object} input - { name, isEditable, idUser }
     * @returns {object} Bibliothèque créée
     */
    addLibrary: async (_, { input }, context) => {
      try {

        /* exemple context JWT décodé ( à revoir):
        {
          userId: "uuid-of-user",
          email: "user@example.com",
          role: "admin"
        }
        */
       /*exemple de requête :
        mutation addLibrary($input: CreateLibraryInput!) { addLibrary(input: $input) {__typename }}

        */
        /* Exemple variables :
        { "input": {
          "name": "bibliothèque de toto",
          "id_user": "1e2d3c4b-5a6f-7e8d-9c0b-1a2f3e4d5c6b"
        }
        }        
        */
        
        // Sanitize input
        const cleanInput = sanitizeInput(input);
        
        // Vérifier les droits
        //requireOwnershipOrAdmin(cleanInput.id_user, context);
        
        // Validation
        if (!cleanInput.name || cleanInput.name.length < 3) {
          throw new GraphQLError('Le nom de la bibliothèque doit contenir au moins 3 caractères', {
            extensions: { 
              code: 'BAD_REQUEST',
              httpStatus: 400
            },
          });
        }
        
        const id = uuidv4();
        
        // inserer les created-at et updated-at en base
        const createdAt = new Date();
        const updatedAt = new Date();


        const result = await db.query(`
          INSERT INTO libraries (id_library, name, is_editable, id_user, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING id_library, name, is_editable, id_user, created_at, updated_at
        `, [
          id,
          cleanInput.name,
          cleanInput.isEditable !== undefined ? cleanInput.isEditable : true,
          cleanInput.id_user,
          createdAt,
          updatedAt
        ]);
        
        if (context?.res?.status) context.res.status(201);
        return result.rows[0];

      } catch (error) {
        if (error instanceof GraphQLError) throw error;
        throw new GraphQLError('Erreur lors de la création de la bibliothèque', {
          extensions: { 
            code: 'INTERNAL_SERVER_ERROR',
            httpStatus: 500,
            originalError: error.message
          },
        });
      }
    },
    
    /**
     * Met à jour une bibliothèque
     * 🔒 Route protégée - L'utilisateur ne peut modifier que ses propres bibliothèques (sauf admin)
     * @param {object} input - { id_library, name?, isEditable? }
     * @returns {object} Bibliothèque mise à jour
     */
    updateLibrary: async (_, { input }, context) => {
      try {

        /* exemple context JWT décodé ( à revoir):
        {
          userId: "uuid-of-user",
          email: "user@example.com",
          role: "admin"
        }
        */
       /*exemple de requête :
        mutation updateLibrary($input: UpdateLibraryInput!) { updateLibrary(input: $input) {__typename }}

        */
        /* Exemple variables :
        { "input": 
        {"id_library": "2b3c4d5e-6f7g-8h9i-0j1k-2l3m4n5o6p7q",
          "name" :"toto au travail"
        }
        }       
        */


        
        // Sanitize input
        const cleanInput = sanitizeInput(input);
        const cleanLibraryId = sanitizeString(cleanInput.id_library);
        
        // Vérifier l'existence
        const library = await findLibraryOrThrow(cleanLibraryId);
        
        // Vérifier les droits
        //requireOwnershipOrAdmin(library.id_user, context);
        
        // Vérifier si modifiable
        requireEditableLibrary(library);
        
        // Construire la requête dynamique
        const updates = [];
        const values = [];
        let paramIndex = 1;

        if (cleanInput.name !== undefined) {
          if (cleanInput.name.length < 3) {
            throw new GraphQLError('Le nom doit contenir au moins 3 caractères', {
              extensions: { 
                code: 'BAD_REQUEST',
                httpStatus: 400
              },
            });
          }
          updates.push(`name = $${paramIndex++}`);
          values.push(cleanInput.name);
        }
        
        if (cleanInput.isEditable !== undefined) {
          updates.push(`is_editable = $${paramIndex++}`);
          values.push(cleanInput.isEditable);
        }

        if (updates.length === 0) {
          throw new GraphQLError('Aucun champ à mettre à jour', {
            extensions: { 
              code: 'BAD_REQUEST',
              httpStatus: 400
            },
          });
        }

        values.push(cleanLibraryId);

        const result = await db.query(`
          UPDATE libraries
          SET ${updates.join(', ')}, updated_at = NOW()
          WHERE id_library = $${paramIndex}
          RETURNING id_library, name, is_editable, id_user, created_at, updated_at
        `, values);

        return {
          data: result.rows[0],
          httpStatus: 200,
        };
      } catch (error) {
        if (error instanceof GraphQLError) throw error;
        throw new GraphQLError('Erreur lors de la mise à jour de la bibliothèque', {
          extensions: { 
            code: 'INTERNAL_SERVER_ERROR',
            httpStatus: 500,
            originalError: error.message
          },
        });
      }
    },
    
    /**
     * Supprime toutes les bibliothèques d'un utilisateur
     * 🔐 Route admin uniquement
     * @param {string} id_user - ID de l'utilisateur
     * @returns {array} IDs des bibliothèques supprimées
     */
    deleteAllLibrariesFromUser: async (_, { id_user }, context) => {
      try {

        /* exemple context JWT décodé ( à revoir):
        {
          userId: "uuid-of-user",
          email: "user@example.com",
          role: "admin"
        }
        */
       /*exemple de requête :
            mutation deleteAllLibrariesFromUser($id_user: ID!) { deleteAllLibrariesFromUser(id_user: $id_user) }
        */
        /* Exemple variables :
        {"id_user":"a1b2c3d4-e5f6-7g8h-9i0j-1k2l3m4n5o6p"}
        */




        //requireAdmin(context);
        
        // Sanitize input
        const cleanUserId = sanitizeString(id_user);
        
        // supprimer toutes les bibliothèques de l'utilisateur sauf ceux non modifiables

        const result = await db.query(
          'DELETE FROM libraries WHERE id_user = $1 AND is_editable = true RETURNING id_library',
          [cleanUserId]
        );

        
  if (context?.res?.status) context.res.status(200);
  return true;
      } catch (error) {
        if (error instanceof GraphQLError) throw error;
        throw new GraphQLError('Erreur lors de la suppression des bibliothèques', {
          extensions: { 
            code: 'INTERNAL_SERVER_ERROR',
            httpStatus: 500,
            originalError: error.message
          },
        });
      }
    },

    /**
     * Supprime une bibliothèque
     * 🔒 Route protégée - L'utilisateur ne peut supprimer que ses propres bibliothèques (sauf admin)
     * @param {object} input - { id_library }
     * @returns {boolean} true si supprimée
     */
    deleteLibrary: async (_, { input }, context) => {
      try {

        /* exemple context JWT décodé ( à revoir):
        {
          userId: "uuid-of-user",
          email: "user@example.com",
          role: "admin"
        }
        */
       /*exemple de requête :
            mutation deleteLibrary($input: DeleteLibraryInput!) { deleteLibrary(input: $input) }
        */
        /* Exemple variables :
        {"input": {"id_library":"2b3c4d5e-6f7g-8h9i-0j1k-2l3m4n5o6p7d"} }
        */

        
        // Sanitize input
        const cleanLibraryId = sanitizeString(input.id_library);
        
        // Vérifier l'existence
        const library = await findLibraryOrThrow(cleanLibraryId);
        
        // Vérifier les droits
        requireOwnershipOrAdmin(library.id_user, context);
        
        // Vérifier si modifiable
        requireEditableLibrary(library);
        
        await db.query(
          'DELETE FROM libraries WHERE id_library = $1',
          [cleanLibraryId]
        );

        if (context?.res?.status) context.res.status(200);
        return true;
      } catch (error) {
        if (error instanceof GraphQLError) throw error;
        throw new GraphQLError('Erreur lors de la suppression de la bibliothèque', {
          extensions: { 
            code: 'INTERNAL_SERVER_ERROR',
            httpStatus: 500,
            originalError: error.message
          },
        });
      }
    },

  },
  
  Library: {

    /**
     * Résout le champ "user" d'une bibliothèque
     * @param {object} parent - Objet bibliothèque parent
     * @returns {object|null} Utilisateur propriétaire
     */
    user: async (parent) => {
      return fetchUserById(parent.id_user);
    },

  },
};