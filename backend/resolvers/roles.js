import db from "../db/connect_DB.js";
import { v4 as uuidv4 } from "uuid";
import { validateOrderParams, handleDbError } from '../utils/validators.js';
import { fetchUserById } from './utils/utils_users.js';
import fetchBookById from './utils/utils_books.js'; 
import sanitizeHtml from 'sanitize-html';
import { GraphQLError } from 'graphql';
import fetchLibraryById from './utils/utils_librairies.js';

import { isAuthenticated, requireAuth, requireAdmin, requireOwnershipOrAdmin, sanitizeString, sanitizeInput, flattenEdges, makePageInfo, makeEdgeFromBook, withErrorHandling } from './utils/helpers/helpers_general.js';

// Importer les helpers généralistes
import { withSecureResolver } from './utils/helpers/helpers_general.js';
// Importer les helpers spécifiques
import { findRolesOrThrow, validateRolesInput} from './utils/helpers/helpers_Roles.js';
import { findBy1ParameterOrThrow } from './utils/helper.js';


// Importer le schema Joi genéral
import { generalSortingSchema } from '../schema/schemas_joi/generalSchema.js';
// Importer les schemas Joi spécifiques
import { generalRoleSchema, generalOrderRoleSchema, searchRolesSchema} from '../schema/schemas_joi/roleSchema.js';

// Importer les wrappers et helpers de sécurité
import { sanitizeStrict} from './utils/helpers/helpers_securite.js';



export default {
  Query: {

    /**
     * Récupère les rôles avec pagination et tri
     * 🔒 Route protégée (administrateur uniquement)
       * @param {number} limit - Limite de résultats (max 100)
       * @param {number} offset - Décalage pour pagination
       * @param {string} order - Champ de tri
       * @param {string} direction - Direction du tri (ASC/DESC)
       * @returns {object} { roles, totalCount, hasNextPage, httpStatus }
       * @throws {GraphQLError} Si l'utilisateur n'a pas les droits (401 ou 403)  
       * @throws {GraphQLError} Si une erreur se produit lors de la récupération des rôles (500)
     */
    getRoles: withSecureResolver(
      async (_, { validated }, context) => {
        /* exemple context JWT décodé ( à revoir):
        {
          userId: "uuid-of-user",
          email: "user@example.com",
          role: "admin"
        }
        */
        /*exemple de requête :
        query {getRoles{roles{id_role, role_name, created_at, updated_at}}}
        */
        /* Exemple variables :
        {
        }
        */
        // ========================================
        // RECUPERER LES DONNEES NESSESAIRES
        // ======================================== 

        // Extraction et validation des paramètres de pagination et de tri
        const { limit = 50, offset = 0, order = 'created_at', direction = 'ASC' } = validated;

        // Sanitize inputs
        // const cleanLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 100);
        // const cleanOffset = Math.max(parseInt(offset) || 0, 0);
        const validOrders = ['created_at', 'role_name', 'updated_at'];
        const { order: safeOrder, direction: safeDirection } = validateOrderParams(
          sanitizeStrict(order), 
          sanitizeStrict(direction), 
          validOrders
        );
        // ========================================
        // REQUETES BASE DE DONNEES
        // ======================================== 
        const result = await db.query(`
          SELECT id_role, role_name, created_at, updated_at
          FROM roles
          ORDER BY ${safeOrder} ${safeDirection}
          LIMIT $1 OFFSET $2
        `, [cleanLimit, cleanOffset]);
        
        const countResult = await db.query('SELECT COUNT(*)::int as count FROM roles');
        const totalCount = countResult.rows[0].count;
        // ========================================
        // DONNEES RECUPEREES
        // ======================================== 
        return {
          roles: result.rows,
          totalCount,
          hasNextPage: cleanOffset + cleanLimit < totalCount,
          httpStatus: 200
        };
    
      },
      {
        sortingSchema: generalSortingSchema,
        orderSchema: generalOrderRoleSchema,
        logAction: 'GET_ALL_ROLES',
        requiresAuth: true,
        errorMessage: 'Erreur lors de la récupération des rôles'
      }
    ),
    
    /**
     * Récupère un rôle par son ID
     * 🔒 Route protégée (administrateur uniquement)
     * @param {string} id_role - ID du rôle
     * @returns {object|null} Rôle ou null si non trouvé
     * @throws {GraphQLError} Si l'utilisateur n'a pas les droits (401 ou 403)
     * @throws {GraphQLError} Si une erreur se produit lors de la récupération du rôle (500)
     */
    getRole: withSecureResolver(
      async (_, { id_role, validated }, context) => {
        /* exemple context JWT décodé ( à revoir):
        {
          userId: "uuid-of-user",
          email: "user@example.com",
          role: "admin"
        }
        */
        /*exemple de requête :
        query  getRole($id_role: ID!) {getRole(id_role: $id_role) {id_role, role_name, created_at, updated_at}}

        */
        /* Exemple variables :
        {"id_role": 1}
        */
        // ========================================
        // RECUPERER LES DONNEES NESSESAIRES
        // ======================================== 
        // Validation de l'ID du rôle
        if (!id_role) {
          throw new GraphQLError('ID du rôle requis', {
            extensions: { code: 'BAD_USER_INPUT', httpStatus: 400 }
          });
        }

        // Sanitize input
        const cleanIdRole = sanitizeStrict(id_role);
        // ========================================
        // REQUETES BASE DE DONNEES
        // ======================================== 
        // Vérifie si le rôle existe et le retourne
        const role = await findBy1ParameterOrThrow('roles', 'id_role', cleanIdRole, 'Rôle non trouvé');
        // ========================================
        // DONNEES RECUPEREES
        // ========================================        
        if (context?.res?.status) context.res.status(200);
        return role.data;
    
      },
      {
        logAction: 'GET_ONE_ROLE',
        requiresAuth: true,
        errorMessage: 'Erreur lors de la récupération du rôle'
      }
    ),
    
    /**
     * Recherche des rôles par nom
     * @param {string} role_name - Nom du rôle à rechercher
     * @param {number} limit - Limite de résultats
     * @param {number} offset - Décalage pour la pagination
     * @returns {object} Résultats de la recherche
     * @throws {GraphQLError} Si une erreur se produit lors de la recherche (500)
     */
    searchRoles: withSecureResolver(
      async (_, { validated }, context) => {
        /* exemple context JWT décodé ( à revoir):
        {
          userId: "uuid-of-user",
          email: "user@example.com",
          role: "admin"
        }
        */
        /*exemple de requête :
        query  searchRoles($role_name: String!) {searchRoles(role_name: $role_name) {roles{ id_role, role_name, created_at, updated_at}}}
        */
        /* Exemple variables :
        {"role_name": "adm"}
        */
        // ========================================
        // RECUPERER LES DONNEES NESSESAIRES
        // ======================================== 

        // Extraction et validation des paramètres de pagination et de tri
        const { limit = 50, offset = 0, order = 'created_at', direction = 'DESC', query } = validated;

        // Sanitize inputs
        // const cleanLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 100);
        // const cleanOffset = Math.max(parseInt(offset) || 0, 0);
        const validOrders = ['created_at', 'role_name', 'updated_at'];
        const { order: safeOrder, direction: safeDirection } = validateOrderParams(
          sanitizeStrict(order), 
          sanitizeStrict(direction), 
          validOrders
        );
        const cleanRoleName = sanitizeStrict(query || '');

        if (!cleanRoleName) {
          throw new GraphQLError('Nom du rôle requis', {
            extensions: { code: 'BAD_USER_INPUT', httpStatus: 400 }
          });
        }

        const searchPattern = `%${cleanRoleName}%`;
        // ========================================
        // REQUETES BASE DE DONNEES
        // ======================================== 
        const result = await db.query(`
          SELECT id_role, role_name, created_at, updated_at FROM roles
          WHERE LOWER(role_name) LIKE LOWER($1)
          ORDER BY ${safeOrder} ${safeDirection}
          LIMIT $2 OFFSET $3
        `, [searchPattern, cleanLimit, cleanOffset]);
        
        const countResult = await db.query(`
          SELECT COUNT(*)::int as count FROM roles
          WHERE LOWER(role_name) LIKE LOWER($1)
        `, [searchPattern]);
        // ========================================
        // DONNEES RECUPEREES
        // ========================================                
        return {
          roles: result.rows,
          totalCount: countResult.rows[0].count,
          hasNextPage: cleanOffset + cleanLimit < countResult.rows[0].count,
          httpStatus: 200
        };
    
      },
      {
        sortingSchema: generalSortingSchema,
        orderSchema: generalOrderRoleSchema,
        inputSchema: searchRolesSchema,
        logAction: 'SEARCH_ROLES',
        requiresAuth: true,
        errorMessage: 'Erreur lors de la recherche de rôles'
      }
    ),
  },

  Mutation: {

    /**
     * Ajoute un nouvel avis
     * 🔒 Route protégée (utilisateur authentifié)
     * @param {object} input - Données du rôle
     * @param {string} input.role_name - Nom du rôle
     * @returns {object} Rôle créé
     * @throws {GraphQLError} Si l'utilisateur n'est pas authentifié (401)
     * @throws {GraphQLError} Si les données d'entrée sont invalides (400)
     * @throws {GraphQLError} Si une erreur se produit lors de la création du rôle (500)
     */
    addRole: withSecureResolver(
      async (_, { input, validated }, context) => {
        /* exemple context JWT décodé ( à revoir):
        {
          userId: "uuid-of-user",
          email: "user@example.com",
          role: "admin"
        }
        */
        /*exemple de requête :
        mutation addRole($input: CreateRoleInput!) { addRole(input: $input) {id_role, role_name, created_at, updated_at} }

        */
        /* Exemple variables :
        { "input": {
          "role_name": "admin"
        }
        }        
        */
        // ========================================
        // RECUPERER LES DONNEES NESSESAIRES
        // ======================================== 

        // Sanitize input AVANT validation
        const cleanRoleName = sanitizeStrict(input.role_name || '');

        if (!cleanRoleName) {
          throw new GraphQLError('Nom du rôle requis', {
            extensions: { code: 'BAD_USER_INPUT', httpStatus: 400 }
          });
        }

        validateRolesInput({ role_name: cleanRoleName });

        // Vérifier si le rôle existe déjà dans la base de données
        const existingRole = await db.query(
          'SELECT * FROM roles WHERE LOWER(role_name) = LOWER($1)',
          [cleanRoleName]
        );

        if (existingRole.rows.length > 0) {
          throw new GraphQLError('Ce rôle existe déjà', {
            extensions: { code: 'CONFLICT', httpStatus: 409 }
          });
        }

        const id = uuidv4();
        // ========================================
        // REQUETES BASE DE DONNEES
        // ========================================         
        const result = await db.query(`
          INSERT INTO roles (id_role, role_name)
          VALUES ($1, $2)
          RETURNING id_role, role_name, created_at, updated_at
        `, [id, cleanRoleName]);
        // ========================================
        // DONNEES RECUPEREES
        // ======================================== 
        if (context?.res?.status) context.res.status(201);
        return result.rows[0];
    
      },
      {
        logAction: 'ADD_ROLE',
        requiresAuth: true,
        errorMessage: 'Erreur lors de l\'ajout du rôle'
      }
    ),
    
    /**
     * Met à jour un rôle existant
     * 🔒 Route protégée (utilisateur authentifié)
     * @param {object} input - Données du rôle
     * @param {string} input.idRole - ID du rôle à mettre à jour
     * @param {string} input.name - Nouveau nom du rôle
     * @returns {object} Rôle mis à jour
     * @throws {GraphQLError} Si l'utilisateur n'est pas authentifié (401)
     * @throws {GraphQLError} Si les données d'entrée sont invalides (400)
     * @throws {GraphQLError} Si une erreur se produit lors de la mise à jour du rôle (500)
     */
    updateRole: withSecureResolver(
      async (_, { input, validated }, context) => {
        /* exemple context JWT décodé ( à revoir):
        {
          userId: "uuid-of-user",
          email: "user@example.com",
          role: "admin"
        }
        */
        /*exemple de requête :
        mutation updateRole($input: UpdateRoleInput!) { updateRole(input: $input) {__typename }}

        */
        /* Exemple variables :
        { "input": 
        {"id_role": "95f96df5-820a-4001-be5d-89fa6921ef80",
          "role_name" :"toto au travail",
        }
        }       
        */
    
        // ========================================
        // RECUPERER LES DONNEES NESSESAIRES
        // ======================================== 

        // Sanitize inputs
        const cleanRoleName = sanitizeStrict(input.role_name || '');
        const cleanIdRole = sanitizeStrict(input.id_role || '');

        if (!cleanIdRole) {
          throw new GraphQLError('ID du rôle requis', {
            extensions: { code: 'BAD_USER_INPUT', httpStatus: 400 }
          });
        }

        if (!cleanRoleName) {
          throw new GraphQLError('Nom du rôle requis', {
            extensions: { code: 'BAD_USER_INPUT', httpStatus: 400 }
          });
        }

        // Vérifier que le rôle existe AVANT de le mettre à jour
        await findBy1ParameterOrThrow('roles', 'id_role', cleanIdRole, 'Rôle non trouvé');

        // Valider le nouveau nom
        validateRolesInput({ role_name: cleanRoleName });

        // Vérifier que le nouveau nom n'existe pas déjà (sauf s'il appartient au même rôle)
        const duplicateRole = await db.query(
          'SELECT id_role FROM roles WHERE LOWER(role_name) = LOWER($1) AND id_role != $2',
          [cleanRoleName, cleanIdRole]
        );

        if (duplicateRole.rows.length > 0) {
          throw new GraphQLError('Un rôle avec ce nom existe déjà', {
            extensions: { code: 'CONFLICT', httpStatus: 409 }
          });
        }
        // ========================================
        // REQUETES BASE DE DONNEES
        // ======================================== 
        const result = await db.query(`
          UPDATE roles
          SET role_name = $1, updated_at = CURRENT_TIMESTAMP
          WHERE id_role = $2
          RETURNING id_role, role_name, created_at, updated_at
        `, [cleanRoleName, cleanIdRole]);
        // ========================================
        // DONNEES RECUPEREES
        // ========================================         
        if (result.rows.length === 0) {
          throw new GraphQLError('Rôle non trouvé', {
            extensions: { code: 'NOT_FOUND', httpStatus: 404 }
          });
        }

        if (context?.res?.status) context.res.status(200);
        return result.rows[0];
      },
      {
        logAction: 'UPDATE_ROLE',
        requiresAuth: true,
        errorMessage: 'Erreur lors de la mise à jour du rôle'
      }
    ),
    
    /**
     * Supprime un rôle
     * 🔒 Route protégée (utilisateur authentifié)
     * @param {object} input - Données du rôle
     * @param {string} input.idRole - ID du rôle à supprimer
     * @returns {boolean} true si le rôle a été supprimé, false sinon
     * @throws {GraphQLError} Si l'utilisateur n'est pas authentifié (401)
     * @throws {GraphQLError} Si les données d'entrée sont invalides (400)
     * @throws {GraphQLError} Si une erreur se produit lors de la suppression du rôle (500)
     */
    deleteRole: withSecureResolver(
      async (_, { input, validated }, context) => {
        /* exemple context JWT décodé ( à revoir):
        {
        userId: "uuid-of-user",
        email: "user@example.com",
        role: "admin"
        }
        */
        /*exemple de requête :
          mutation deleteRole($input: DeleteRoleInput!) { deleteRole(input: $input) }
        */
        /* Exemple variables :
        {"input": {"id_role":"95f96df5-820a-4001-be5d-89fa6921ef80"} }
        */
   
        // Vérification des droits d'accès
        requireAdmin(context);

        // Sanitize input
        const cleanIdRole = sanitizeString(input.id_role || '');

        if (!cleanIdRole) {
          throw new GraphQLError('ID du rôle requis', {
            extensions: { code: 'BAD_USER_INPUT', httpStatus: 400 }
          });
        }

        // Vérifier l'existence avant suppression
        await findBy1ParameterOrThrow('roles', 'id_role', cleanIdRole, 'Rôle non trouvé');

        const result = await db.query(
          'DELETE FROM roles WHERE id_role = $1 RETURNING *',
          [cleanIdRole]
        );

        if (context?.res?.status) context.res.status(200);
        return true ;
      },
      {
        logAction: 'DELETE_ROLE',
        requiresAuth: true,
        errorMessage: 'Erreur lors de la suppression du rôle'
      }
    ),
    
  },

  Role: {},
};

