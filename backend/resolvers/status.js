import db from "../db/connect_DB.js";
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import { validateOrderParams, handleDbError } from '../utils/validators.js';
import  fetchRoleById  from './utils/utils_roles.js';
import { fetchUserById } from './utils/utils_users.js';
import sanitizeHtml from 'sanitize-html';
import { GraphQLError } from 'graphql';
import fetchBookById from './utils/utils_books.js';
import fetchLibraryById from './utils/utils_librairies.js';

import { isAuthenticated, requireAuth, requireAdmin, requireOwnershipOrAdmin, sanitizeString, sanitizeInput, flattenEdges, makePageInfo, makeEdgeFromBook, withErrorHandling } from './utils/helpers/helpers_general.js';

import { findStatusOrThrow, validateStatusInput, existingStatusInput} from './utils/helpers/helpers_status.js';
import { clean } from "semver";

import {getStatusesSchema, getStatusSchema, searchStatusesSchema, createStatusSchema, updateStatusSchema, deleteStatusSchema } from '../schema/schemas_joi/statusSchema.js';
import { validateWithJoi } from './utils/helpers/helpers_books.js';



export default {
    Query: {
        /**     
         * Récupère les statuts avec pagination et tri
         * 🔒 Route protégée (administrateur uniquement)
         * @param {number} limit - Limite de résultats (max 100)
         * @param {number} offset - Décalage pour pagination
         * @param {string} order - Champ de tri
         * @param {string} direction - Direction du tri (ASC/DESC)
         * @returns {object} { statuses, totalCount, hasNextPage, httpStatus }
         * @throws {GraphQLError} Si l'utilisateur n'a pas les droits (401 ou 403)  
         * @throws {GraphQLError} Si une erreur se produit lors de la récupération des utilisateurs (500)
         */
        getStatuses: withErrorHandling(
        async (_, args, context) => {
            
            /* exemple context JWT décodé ( à revoir):
            {
            userId: "uuid-of-user",
            email: "user@example.com",
            role: "admin"
            }
            */
            /*exemple de requête :
            query {getStatuses{status{id_status, status_name, created_at, updated_at}}}
            */
            /* Exemple variables :
            {
            }
            */
            
            // Vérification des droits d'accès
            requireAdmin(context);

            const { limit = 50, offset = 0, order = 'created_at', direction = 'ASC' } = args;
            
            // Validation avec Joi => 1ere couche - défense en profondeur
            const validatedArgs = validateWithJoi(getStatusesSchema, {
            limit : args.limit,
            offset : args.offset,
            order : args.order,
            direction : args.direction  
            });
            
            // Sanitize inputs => 2ème couche - défense en profondeur
            const cleanLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 100);
            const cleanOffset = Math.max(parseInt(offset) || 0, 0);
            const validOrders = ['status_name', 'created_at', 'updated_at'];
            const { order: safeOrder, direction: safeDirection } = validateOrderParams(
            sanitizeString(order), 
            sanitizeString(direction), 
            validOrders
            );
            

            const result = await db.query(`
            SELECT *
            FROM status
            ORDER BY ${safeOrder} ${safeDirection}
            LIMIT $1 OFFSET $2
            `, [cleanLimit, cleanOffset]);
                
            const countResult = await db.query('SELECT COUNT(*)::int as count FROM status');
            const totalCount = countResult.rows[0].count;

            return {
            status: result.rows,
            totalCount,
            hasNextPage: cleanOffset + cleanLimit < totalCount,
            httpStatus: 200
            };
        },
        'Erreur lors de la récupération des statuts'
        ),
        
        /**
         * Récupère les utilisateurs avec pagination et tri
         * 🔒 Route protégée (administrateur uniquement)
            * @param {string} id_status - ID du statut  
            * @returns {object} status
            * @throws {GraphQLError} Si le statut n'existe pas (404)
            * @throws {GraphQLError} Si une erreur se produit lors de la récupération du statut (500)
        */
        getStatus: withErrorHandling(
        async (_, args, context) => {
            /* exemple context JWT décodé ( à revoir):
            {
            userId: "uuid-of-user",
            email: "user@example.com",
            role: "admin"
            }
            */
            /*exemple de requête :
            query  getStatus($id_status: ID!) {getStatus(id_status: $id_status) {id_status,status_name,created_at,updated_at }}

            */
            /* Exemple variables :
            {"id_status": 1}
            */
            
            // Vérification des droits d'accès
            requireAdmin(context);

            const { id_status } = args;
            
            // Validation avec Joi => 1ere couche - défense en profondeur
            const validatedArgs = validateWithJoi(getStatusSchema, {
            id_status: id_status
            });

            // Sanitize input => 2ème couche - défense en profondeur
            const cleanIdStatus = sanitizeString(validatedArgs.id_status);

            if (!cleanIdStatus) {
            throw new GraphQLError('ID statut manquant', {
                extensions: { code: 'BAD_USER_INPUT', httpStatus: 400 }
            });
            }

            const status = await findStatusOrThrow(cleanIdStatus);
            
            if (context?.res?.status) context.res.status(200);
            return status;
        },
        "Erreur lors de la récupération de l'utilisateur"
        ),
        
        /**
     * Recherche des statuts par nom avec pagination et tri
     * 🔒 Route protégée (administrateur uniquement)
     * @param {string} status_name - Terme de recherche dans le nom du statut
     * @param {number} limit - Limite de résultats (max 100)
     * @param {number} offset - Décalage pour pagination
     * @param {string} order - Champ de tri
     * @param {string} direction - Direction du tri (ASC/DESC)
     * @returns {object} { statuses, totalCount, hasNextPage, httpStatus }
     * @throws {GraphQLError} Si l'utilisateur n'a pas les droits (401 ou 403)
     * @throws {GraphQLError} Si une erreur se produit lors de la récupération des statuts (500)
     */
        searchStatuses: withErrorHandling(
        async (_, args, context) => {   
            /* exemple context JWT décodé ( à revoir):
            {
            userId: "uuid-of-user",
            email: "user@example.com",
            role: "admin"
            }
            */
            /*exemple de requête :
            query  searchStatuses($status_name: String!) {searchStatuses(status_name: $status_name) {id_status,status_name,created_at,updated_at }}

            */
            /* Exemple variables :
            {"status_name": "et"}
            */

            // Vérification des droits d'accès
            requireAdmin(context);

            // Extraction et validation des paramètres de pagination et de tri
            const { limit = 50, offset = 0, order = 'created_at', direction = 'DESC', status_name } = args;

            // Validation avec Joi => 1ere couche - défense en profondeur
            const validatedArgs = validateWithJoi(searchStatusesSchema, {
            status_name,
            limit,
            offset,
            order,
            direction
            });

            // Sanitize inputs
            const cleanLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 100);
            const cleanOffset = Math.max(parseInt(offset) || 0, 0);
            const validOrders = ['created_at', 'name', 'email', 'pseudo', 'id_role', 'id_user'];
            const { order: safeOrder, direction: safeDirection } = validateOrderParams(
            sanitizeString(order), 
            sanitizeString(direction), 
            validOrders
            );
            const cleanStatusName = sanitizeString(status_name || '');

            // Validation du terme de recherche
            if (!cleanStatusName || typeof cleanStatusName !== 'string' || cleanStatusName.trim().length === 0) {
            throw new GraphQLError('Terme de recherche invalide', {
                extensions: { code: 'BAD_USER_INPUT', httpStatus: 400 }
            });
            }

            // Création du motif de recherche
            const searchPattern = `%${cleanStatusName}%`;

            const result = await db.query(`
            SELECT *
            FROM status
            WHERE LOWER(status_name) LIKE LOWER($1) 
            ORDER BY ${safeOrder} ${safeDirection}
            LIMIT $2 OFFSET $3
            `, [searchPattern, cleanLimit, cleanOffset]);

            const countResult = await db.query(`
            SELECT COUNT(*)::int as count FROM status
            WHERE LOWER(status_name) LIKE LOWER($1)
            `, [searchPattern]);

            return {
            status: result.rows,
            totalCount: countResult.rows[0].count,
            hasNextPage: cleanOffset + cleanLimit < countResult.rows[0].count,
            httpStatus: 200
            };
        },
        'Erreur lors de la recherche des statut'
        ),

    },

    Mutation: {
        /**
         * Crée un nouvel utilisateur
         * 🔒 Route protégée (administrateur uniquement)
         * @param {object} input - Données du statut
         * @param {string} input.status_name - Nom du statut
         * @returns {object} Statut créé
         * @throws {GraphQLError} Si l'utilisateur n'a pas les droits (401 ou 403)
         * @throws {GraphQLError} Si une erreur se produit lors de la création de l'utilisateur (500)
         */
        createStatus: withErrorHandling(
        async (_, { input }, context) => {
            /* exemple context JWT décodé ( à revoir):
            {
            userId: "uuid-of-user",
            email: "user@example.com",
            role: "admin"
            }
            */
            /*exemple de requête :
            mutation createStatus($input: CreateStatusInput!) { createStatus(input: $input) {id_status,status_name} }}

            */
            /* Exemple variables : 
            { "input": {
            "status_name": "En attente"
            }
            }        
            */
            
            if (!input || !input.status_name) {
            throw new GraphQLError('Tous les champs sont requis', {
                extensions: { code: 'BAD_USER_INPUT', httpStatus: 400 }
            });
            }
            console.log("Input reçu pour la création du statut :", input.status_name);
            // Validation avec Joi => 1ere couche - défense en profondeur
            const validatedInput = validateWithJoi(createStatusSchema, { status_name: input.status_name });

            // Sanitize inputs => 2ème couche - défense en profondeur
            const cleanInput = validateStatusInput(validatedInput);

            // Vérifier qu'un statut avec le même nom n'existe pas (insensible à la casse)
            await existingStatusInput(cleanInput);


            const result = await db.query(`
            INSERT INTO status ( status_name, created_at, updated_at)
            VALUES ($1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING id_status, status_name, created_at, updated_at
            `, [cleanInput.status_name]);

            if (context?.res?.status) context.res.status(201);
            return result.rows[0];
        },
        'Erreur lors de la création du statut'
        ),

        /**
         * Met à jour un utilisateur existant
         * 🔒 Route protégée (propriétaire ou administrateur)
         * @param {object} input - Données de l'utilisateur à mettre à jour
         * @param {string} input.id_status - ID du statut
         * @param {string} [input.status_name] - Nouveau nom du statut
         * @return {object} Statut mis à jour
         * @throws {GraphQLError} Si l'utilisateur n'a pas les droits (401 ou 403)
         * @throws {GraphQLError} Si une erreur se produit lors de la mise à jour de l'utilisateur (500)
         */
        updateStatus: withErrorHandling(
        async (_,  { input}, context) => {
            /* exemple context JWT décodé ( à revoir):
            {
            userId: "uuid-of-user",
            email: "user@example.com",
            role: "admin"
            }
            */
            /*exemple de requête :
            mutation updateStatus($input: UpdateStatusInput!) { updateStatus(input: $input) {id_status,status_name }}

            */
            /* Exemple variables :
            { "input": 
            {
            "id_status": "6",
            "status_name" :"test update statut"
            }
            }       
            */
            
            const { id_status, status_name } = input;

            // Validation avec Joi => 1ere couche - défense en profondeur
            const validatedInput = validateWithJoi(updateStatusSchema, { 
                id_status: id_status, 
                status_name: status_name
            });

            // Sanitize inputs => 2ème couche - défense en profondeur
            const cleanIdStatus = sanitizeHtml(validatedInput.id_status);
            const cleanName = sanitizeHtml(validatedInput.status_name);

            const result = await db.query(`
            UPDATE status
            SET status_name = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id_status = $2
            RETURNING id_status, status_name, created_at, updated_at
            `, [cleanName, cleanIdStatus]);

            if (context?.res?.status) context.res.status(200);
            return result.rows[0];
        },
        "Erreur lors de la mise à jour du statut"
        ),
        
        /**
         * Supprime un statut par son ID
         * 🔒 Route protégée (administrateur uniquement)
         * @param {string} id_status - ID du statut à supprimer
         * @returns {object} Statut supprimé
         * @throws {GraphQLError} Si l'utilisateur n'a pas les droits (401 ou 403)
         * @throws {GraphQLError} Si une erreur se produit lors de la suppression du statut (500)
         */
        deleteStatus: withErrorHandling(
        async (_, args, context) => {
            /* exemple context JWT décodé ( à revoir):
            {
            userId: "uuid-of-user",
            email: "user@example.com",
            role: "admin"
            }
            */
            /*exemple de requête :
            mutation deleteStatus($input: DeleteStatusInput!) { deleteStatus(input: $input) {id_status,status_name }}

            */
            /* Exemple variables :
            { "input": 
            {
            "id_status": "6"
            }
            }       
            */
            
                    // Vérification des droits d'accès
                    requireAdmin(context);

                    // Extraction des paramètres  
                    const { id_status } = input;

                    if (!id_status) {
                    throw new GraphQLError('ID statut manquant', {
                        extensions: { code: 'BAD_USER_INPUT', httpStatus: 400 }
                    });
                    }


                    // Validation avec Joi => 1ere couche - défense en profondeur
                    const validatedInput = validateWithJoi(deleteStatusSchema, {
                    id_status
                    });

                    // Sanitize inputs => 2ème couche - défense en profondeur
                    const cleanIdStatus = sanitizeString(validatedInput.id_status);

                    // Vérification de l'existence du statut
                    await findStatusOrThrow(cleanIdStatus);

                    const result = await db.query(`
                    DELETE FROM status
                    WHERE id_status = $1
                    RETURNING id_status, status_name, created_at, updated_at
                    `, [cleanIdStatus]);

                if (context && context.res && typeof context.res.status === 'function') {
                context.res.status(200);
                }
                return true;
        },
        "Erreur lors de la suppression du statut"
        ),
        
    },

    Status: {}

};