import db from "../db/connect_DB.js";
import { v4 as uuidv4 } from "uuid";
import { GraphQLError } from 'graphql';
import { validateOrderParams, handleDbError } from '../utils/validators.js';

// Importer les fonctions de vérification de l'existence ou non
import { findBy1ParameterOrThrow, generalSortingSchema } from './utils/helper.js';

// Importer les helpers généralistes
import { withSecureResolver, verifyUserInDB } from './utils/helpers/helpers_general.js';

// Importer les schemas Joi spécifiques
import { 
    generalAuthorsSchema, 
    generalOrderAuthorsSchema, 
    viewAllAuthorsSchema, 
    viewAuthorByID, 
    viewAuthorByName, 
    searchAuthorsSchema, 
    createAuthorSchema, 
    updateAuthorSchema, 
    deleteAuthorSchema 
} from '../schema/schemas_joi/authorsSchema.js';

// Importer les wrappers et helpers de sécurité
import { sanitizeStrict} from './utils/helpers/helpers_securite.js';
import { get } from "http";

// ========================================
// RESOLVERS POUR LES AUTEURS
// ======================================== 

export default {
  Query: {

    /** 
     * Récupérer tous les auteurs avec pagination, tri et ordre
     * @param {number} limit - Nombre maximum d'auteurs à retourner (par défaut : 50)
     * @param {number} offset - Nombre d'auteurs à ignorer avant de commencer à retourner les résultats (par défaut : 0)
     * @param {string} order - Champ par lequel trier les résultats (par défaut : 'created_at', options : 'name', 'created_at', 'updated_at')
     * @param {string} direction - Direction du tri (par défaut : 'DESC', options : 'ASC', 'DESC')
     * @returns {Object} - Un objet contenant la liste des auteurs, le nombre total d'auteurs et le statut HTTP
     * @throws {GraphQLError} - En cas d'erreur lors de la récupération des auteurs
     * @requiresAuth - L'utilisateur doit être authentifié pour accéder à cette requête
     * @requiresAdmin - L'utilisateur doit être un administrateur pour accéder à cette requête
     * @logAction - 'ADMIN_GET_ALL_AUTHORS' sera enregistré dans les logs pour cette action
     * @structureSchema - Les données retournées seront validées contre le schéma 'generalAuthorsSchema'
     * @sortingSchema - Les paramètres de tri seront validés contre le schéma 'generalSortingSchema'
     * @orderSchema - Les paramètres d'ordre seront validés contre le schéma 'generalOrderAuthorsSchema'
     * @errorMessage - 'Erreur lors de la récupération des auteurs' sera utilisé comme message d'erreur en cas de problème
     */
    getAllAuthors : withSecureResolver(
        async (_, { validated }, context) => {

            // ========================================
            // RECUPERER LES DONNEES NESSESAIRES
            // ======================================== 

            const { limit = 50, offset = 0, direction = 'DESC', order = 'created_at' } = validated;

            const validOrders = ['name', 'created_at', 'updated_at'];
            const { order: safeOrder, direction: safeDirection } = validateOrderParams(
            order,
            direction,
            validOrders
            );

            // ========================================
            // REQUETES BASE DE DONNEES
            // ======================================== 

            // Construire la requête SQL avec le tri validé
            const query = await db.query(
                `SELECT 
                a.id_author, 
                a.name, 
                a.created_at, 
                a.updated_at
                FROM authors a
                ORDER BY ${safeOrder} ${safeDirection} 
                LIMIT $1 
                OFFSET $2`,
                [limit, offset]            
            );

            // Requête pour compter le nombre total d'auteurs
            const counterQuery = await db.query('SELECT COUNT(*)::int as count FROM authors');

            // ========================================
            // DONNEES RECUPEREES
            // ========================================
                    
            return {
                authors: query.rows,
                totalCount: counterQuery.rows[0].count,
                httpStatus: 200
            };
        },
        {
            structureSchema: generalAuthorsSchema,
            sortingSchema: generalSortingSchema,
            orderSchema: generalOrderAuthorsSchema,
            logAction: 'ADMIN_GET_ALL_AUTHORS',
            requiresAuth: true,
            requiresAdmin: false,
            errorMessage: 'Erreur lors de la récupération des auteurs'
        }
    ),

    /** 
     * Récupérer un auteur par son ID
     * @param {string} authorID - L'ID de l'auteur à récupérer (UUIDv4)
     * @returns {Object} - Un objet contenant les informations de l'auteur et le statut HTTP
     * @throws {GraphQLError} - En cas d'erreur lors de la récupération de l'auteur
     * @requiresAuth - L'utilisateur doit être authentifié pour accéder à cette requête
     * @logAction - 'GET_ONE_AUTHOR BY_ID' sera enregistré dans les logs pour cette action
     * @structureSchema - Les données retournées seront validées contre le schéma 'generalAuthorsSchema'
     * @sortingSchema - Les paramètres de tri seront validés contre le schéma 'generalSortingSchema'
     * @orderSchema - Les paramètres d'ordre seront validés contre le schéma 'generalOrderAuthorsSchema'
     * @errorMessage - 'Erreur lors de la récupération de l'auteur' sera utilisé comme message d'erreur en cas de problème
     * @validationSchema - Les arguments d'entrée seront validés contre le schéma 'viewAuthorByID'
     * @sanitization - L'ID de l'auteur sera nettoyé avec la fonction 'sanitizeStrict' avant d'être utilisé dans la requête
     * existenceCheck - La fonction 'findBy1ParameterOrThrow' sera utilisée pour vérifier que l'auteur existe dans la base de données avant de retourner les données
     */
    getAuthorByID : withSecureResolver(
        async (_, { authorID }, context) => {
            
            // Nettoyer et valider l'ID de l'auteur
            const cleanId = sanitizeStrict(authorID);

            // Vérifier que l'auteur existe dans la base de données
            const author = await findBy1ParameterOrThrow('authors', 'id_author', cleanId, 'Auteur non trouvé');

            if (context?.res?.status) context.res.status(200);
            return author;
        
        },
        {
            structureSchema: generalAuthorsSchema, 
            sortingSchema: generalSortingSchema,
            orderSchema: generalOrderAuthorsSchema,
            logAction: 'GET_ONE_AUTHOR BY_ID',
            requiresAuth: true,
            errorMessage: 'Erreur lors de la récupération de l\'auteur'
        }
    ),

    /**
     * Récupérer un auteur par son nom
     * @param {string} authorName - Le nom de l'auteur à récupérer
     * @returns {Object} - Un objet contenant les informations de l'auteur et le statut HTTP
     * @throws {GraphQLError} - En cas d'erreur lors de la récupération de l'auteur
     * @requiresAuth - L'utilisateur doit être authentifié pour accéder à cette requête
     * @logAction - 'GET_ONE_AUTHOR BY_NAME' sera enregistré dans les logs pour cette action
     * @structureSchema - Les données retournées seront validées contre le schéma 'generalAuthorsSchema'
     * @sortingSchema - Les paramètres de tri seront validés contre le schéma 'generalSortingSchema'
     * @orderSchema - Les paramètres d'ordre seront validés contre le schéma 'generalOrderAuthorsSchema'
     * @errorMessage - 'Erreur lors de la récupération de l'auteur' sera utilisé comme message d'erreur en cas de problème
     * @validationSchema - Les arguments d'entrée seront validés contre le schéma 'viewAuthorByName'
     * @sanitization - Le nom de l'auteur sera nettoyé avec la fonction 'sanitizeStrict' avant d'être utilisé dans la requête
     * @existenceCheck - La fonction 'findBy1ParameterOrThrow' sera utilisée pour vérifier que l'auteur existe dans la base de données avant de retourner les données
     * Note : Cette requête suppose que les noms d'auteurs sont uniques dans la base de données. Si ce n'est pas le cas, il faudrait envisager de retourner une liste d'auteurs correspondant au nom fourni ou d'ajouter des critères de recherche supplémentaires pour garantir l'unicité du résultat.
     */
    getAuthorByName : withSecureResolver(
        async (_, { authorName }, context) => {

            // Nettoyer et valider le nom de l'auteur
            const cleanName = sanitizeStrict(authorName);

            // Vérifier que l'auteur existe dans la base de données
            const author = await findBy1ParameterOrThrow('authors', 'name', cleanName, 'Auteur non trouvé');

            if (context?.res?.status) context.res.status(200);
            return author;
        },
        {
            structureSchema: generalAuthorsSchema, 
            sortingSchema: generalSortingSchema,
            orderSchema: generalOrderAuthorsSchema,
            logAction: 'GET_ONE_AUTHOR BY_NAME',
            requiresAuth: true,
            errorMessage: 'Erreur lors de la récupération de l\'auteur'
        }
    ),

    /**
     * Rechercher des auteurs par un terme de recherche dans leur nom
     * @param {string} selectedAuthor - Le terme de recherche à utiliser pour trouver des auteurs (doit contenir au moins 2 caractères)
     * @param {number} limit - Nombre maximum d'auteurs à retourner (par défaut : 50)
     * @param {number} offset - Nombre d'auteurs à ignorer avant de commencer à retourner les résultats (par défaut : 0)
     * @param {string} order - Champ par lequel trier les résultats (par défaut : 'created_at', options : 'name', 'created_at', 'updated_at')
     * @param {string} direction - Direction du tri (par défaut : 'DESC', options : 'ASC', 'DESC')
     * @return {Object} - Un objet contenant la liste des auteurs correspondant au terme de recherche, le nombre total d'auteurs trouvés, un indicateur de pagination et le statut HTTP
     * @throws {GraphQLError} - En cas d'erreur lors de la recherche des auteurs ou si le terme de recherche est trop court
     * @requiresAuth - L'utilisateur doit être authentifié pour accéder à cette requête
     * @logAction - 'SEARCH_AUTHORS' sera enregistré dans les logs pour cette action
     * @structureSchema - Les données retournées seront validées contre le schéma 'generalAuthorsSchema'
     * @sortingSchema - Les paramètres de tri seront validés contre le schéma 'generalSortingSchema'
     * @orderSchema - Les paramètres d'ordre seront validés contre le schéma 'generalOrderAuthorsSchema'
     * @errorMessage - 'Erreur lors de la recherche des auteurs' sera utilisé comme message d'erreur en cas de problème
     * @validationSchema - Les arguments d'entrée seront validés contre le schéma 'searchAuthorsSchema'
     * @sanitization - Le terme de recherche sera nettoyé avec la fonction 'sanitizeStrict' avant d'être utilisé dans la requête
     * @existenceCheck - La fonction 'findBy1ParameterOrThrow' ne sera pas utilisée ici car il s'agit d'une recherche qui peut potentiellement retourner plusieurs résultats ou aucun résultat, ce qui est différent d'une vérification d'existence stricte. Cependant, une validation sera effectuée pour s'assurer que le terme de recherche contient au moins 2 caractères afin d'éviter des requêtes inefficaces ou des résultats trop larges.
     * Note : Cette requête utilise une recherche insensible à la casse (ILIKE) pour trouver des auteurs dont le nom contient le terme de recherche fourni. Les résultats sont paginés et triés selon les paramètres spécifiés. Le nombre total d'auteurs correspondant au terme de recherche est également retourné pour permettre une pagination efficace côté client.
     */
    searchAuthors : withSecureResolver(
        async (_, { validated }, context) => {
            const { name, limit = 50,  offset = 0, direction = 'DESC', order = 'created_at' } = validated || {};  
            const cleanSelectedAuthor = sanitizeStrict(name);

        if (!cleanSelectedAuthor || cleanSelectedAuthor.length < 2) {
          throw new GraphQLError('Le terme de recherche doit contenir au moins 2 caractères', {
            extensions: { code: 'BAD_REQUEST', httpStatus: 400 }
          });
        }
            
            const validOrders = ['name', 'created_at', 'updated_at'];
            const { order: safeOrder, direction: safeDirection } = validateOrderParams(
                order,
                direction,
                validOrders
            );
            const query = await db.query(
                `SELECT 
                id_author, 
                name, 
                created_at, 
                updated_at
                FROM authors
                WHERE name ILIKE $1
                ORDER BY ${safeOrder} ${safeDirection}
                LIMIT $2
                OFFSET $3`,
                [`%${cleanSelectedAuthor}%`, limit, offset]
            );
            const countQuery = await db.query(
                `SELECT COUNT(*)::int as count
                FROM authors
                WHERE name ILIKE $1`,
                [`%${cleanSelectedAuthor}%`]
            );
            const totalCount = countQuery.rows[0].count;
            
            return {
            authors: query.rows,
            totalCount,
            hasNextPage: offset + limit < totalCount,
            httpStatus: 200,
            };

        },
        {
            structureSchema: generalAuthorsSchema,
            specificSchema: searchAuthorsSchema,
            sortingSchema: generalSortingSchema,
            orderSchema: generalOrderAuthorsSchema,
            logAction: 'SEARCH_AUTHORS',
            requiresAuth: true,
            errorMessage: 'Erreur lors de la recherche des auteurs'
        }
    ),

    },
  Mutation: {

    addAuthor : withSecureResolver(
        async (_, { selectedArguments }, context) => {

            // Récupérer les arguments nécessaires
            const { selectedAuthor, limit = 50,  offset = 0, direction = 'DESC', order = 'created_at' } = selectedArguments;

            // Nettoyer le terme de recherche
            const cleanSelectedAuthor = sanitizeStrict(selectedAuthor);

            // Valider le terme de recherche
            if (!cleanSelectedAuthor || cleanSelectedAuthor.length < 2) {
                throw new GraphQLError('Le terme de recherche doit contenir au moins 2 caractères', {
                    extensions: { code: 'BAD_REQUEST', httpStatus: 400 }
                });
            }

            // Valider les paramètres de tri et d'ordre
            const validOrders = ['name', 'created_at', 'updated_at'];
            const { order: safeOrder, direction: safeDirection } = validateOrderParams(
                order,
                direction,
                validOrders
            );

            // vérifier si l'auteur existe  déjà dans la base de données
            const existingAuthor = await findBy1Parameter('authors', 'name', cleanSelectedAuthor);
                if (existingAuthor) {
                throw new GraphQLError('Un auteur avec ce nom existe déjà', {
                    extensions: { code: 'CONFLICT', httpStatus: 409 }
                });
            }

            const newAuthorId = uuidv4();
            const createdAt = new Date();

            // Exécuter la requête de recherche dans la base de données
            const query = await db.query(       
                `INSERT INTO authors (id_author, name, created_at)
                VALUES ($1, $2, $3)
                RETURNING id_author, name, created_at, updated_at   
                ORDER BY ${safeOrder} ${safeDirection}
                LIMIT $4
                OFFSET $5`,
                [newAuthorId, cleanSelectedAuthor, createdAt, limit, offset]
            );

            const countQuery = await db.query(
                `SELECT COUNT(*)::int as count
                FROM authors
               ORDER BY ${safeOrder} ${safeDirection}
                LIMIT $1
                OFFSET $2`,
                [limit, offset]
            );

            const totalCount = countQuery.rows[0].count;
            return {
                authors: query.rows,
                totalCount,
                hasNextPage: offset + limit < totalCount,
                httpStatus: 200,
            };
        },
        {
            structureSchema: generalAuthorsSchema, 
            sortingSchema: generalSortingSchema,
            orderSchema: generalOrderAuthorsSchema,
            logAction: 'ADD_AUTHOR',
            requiresAuth: true,
            requiresAdmin: true,
            errorMessage: 'Erreur lors de l\'ajout d\'un auteur'
        }
    ),

    updateAuthor : withSecureResolver(
        async (_, { selectedArguments }, context) => {

            // Récupérer les arguments nécessaires
            const { authorID, name } = selectedArguments;

            // Nettoyer les arguments
            const cleanAuthorID = sanitizeStrict(authorID);
            const cleanName = sanitizeStrict(name);

            // Vérifier que l'auteur existe dans la base de données
            const existingAuthor = await findBy1ParameterOrThrow('authors', 'id_author', cleanAuthorID, 'Auteur non trouvé');
            // Vérifier si le nouveau nom d'auteur existe déjà pour un autre auteur
            if (cleanName && cleanName !== existingAuthor.name) {
                const authorWithSameName = await findBy1Parameter('authors', 'name', cleanName);
                if (authorWithSameName) {
                    throw new GraphQLError('Un auteur avec ce nom existe déjà', {
                        extensions: { code: 'CONFLICT', httpStatus: 409 }
                    });
                }
            }

            //Vérifier que l'id de l'auteur existe dans la base de données
            await findBy1ParameterOrThrow('authors', 'id_author', cleanAuthorID, 'Auteur non trouvé');

            // Construire la requête de mise à jour
            const query = await db.query(
                `UPDATE authors
                SET name = COALESCE($1, name), 
                    updated_at = NOW()
                WHERE id_author = $2
                RETURNING id_author, name, created_at, updated_at`,
                [cleanName, cleanAuthorID]
            );

            if (context?.res?.status) context.res.status(200);
            return query.rows[0];

        },
        {
            structureSchema: generalAuthorsSchema, 
            sortingSchema: generalSortingSchema,
            orderSchema: generalOrderAuthorsSchema,
            logAction: 'UPDATE_AUTHOR',
            requiresAuth: true,
            requiresAdmin: true,
            errorMessage: 'Erreur lors de la mise à jour de l\'auteur',
            validationSchema: updateAuthorSchema
        }
    ),

    deleteAuthor : withSecureResolver(
        async (_, { selectedArguments }, context) => {
                // Récupérer les arguments nécessaires
                const { authorID } = selectedArguments;

                // Nettoyer les arguments
                const cleanAuthorID = sanitizeStrict(authorID);

                // Vérifier que l'auteur existe dans la base de données
                await findBy1ParameterOrThrow('authors', 'id_author', cleanAuthorID, 'Auteur non trouvé');

                // Supprimer l'auteur de la table authors
                await db.query(
                    `DELETE FROM authors
                    WHERE id_author = $1`,
                    [cleanAuthorID]
                );
                if (context?.res?.status) context.res.status(200);
                return {
                    message: 'Auteur supprimé avec succès',
                    httpStatus: 200
                };
        },
        {
            structureSchema: generalAuthorsSchema, 
            sortingSchema: generalSortingSchema,
            orderSchema: generalOrderAuthorsSchema,
            logAction: 'DELETE_AUTHOR',
            requiresAuth: true,
            requiresAdmin: true,
            errorMessage: 'Erreur lors de la suppression de l\'auteur',
            validationSchema: deleteAuthorSchema
        }
    ),

    addAuthorsToBook : withSecureResolver(
        async (_, { selectedArguments }, context) => {
            // Récupérer les arguments nécessaires
            const { authorNames } = selectedArguments;

            // Nettoyer les arguments
            const cleanAuthorNames = Array.isArray(authorNames) 
                ? authorNames.map(name => sanitizeStrict(name)) 
                : [];

            // Vérifier que les auteurs n'existent pas déjà dans la base de données
            let addedAuthors = [];
            for (const authorName of cleanAuthorNames) {
                try {
                    await findBy1ParameterOrThrow('authors', 'name', authorName, `L'auteur avec le nom : ${authorName}, existe déjà`);
                } catch (error) {
                    // L'auteur n'existe pas, on peut le créer
                    const authorId = uuidv4();
                    await db.query(
                        `INSERT INTO authors (id_author, name, created_at)
                        VALUES ($1, $2, NOW())`,
                        [authorId, authorName]
                    );
                    addedAuthors.push({ id: authorId, name: authorName });
                }
            }

            if (context?.res?.status) context.res.status(200);
            return {
                authors: addedAuthors,
                httpStatus: 200
            };

        },
        {
            structureSchema: generalAuthorsSchema, 
            sortingSchema: generalSortingSchema,
            orderSchema: generalOrderAuthorsSchema,
            logAction: 'ADD_AUTHORS_TO_BOOK',
            requiresAuth: true,
            requiresAdmin: true,
            errorMessage: 'Erreur lors de l\'ajout des auteurs',
            validationSchema: createAuthorSchema
        }
    ),

    removeAuthorsFromBook : withSecureResolver(
        async (_, { selectedArguments }, context) => {

            // Récupérer les arguments nécessaires
            const { authorIDs } = selectedArguments;

            // Nettoyer les arguments
            const cleanAuthorIDs = Array.isArray(authorIDs)
                ? authorIDs.map(id => sanitizeStrict(id))
                : [];

            // Vérifier que les auteurs existent dans la base de données
            for (const authorID of cleanAuthorIDs) {
                await findBy1ParameterOrThrow('authors', 'id_author', authorID, `L'auteur avec l'ID : ${authorID}, n'existe pas`);
            }

            // Supprimer les auteurs de la table authors
            const removedAuthors = [];
            for (const authorID of cleanAuthorIDs) {
                await db.query(
                    `DELETE FROM authors WHERE id_author = $1`, 
                    [authorID] 
                );
                removedAuthors.push({ id: authorID });
            }

            if (context?.res?.status) context.res.status(200);
            return {
                authors: removedAuthors,
                httpStatus: 200
            };

        },
        {
            structureSchema: generalAuthorsSchema,
            sortingSchema: generalSortingSchema,
            orderSchema: generalOrderAuthorsSchema,
            logAction: 'REMOVE_AUTHORS_FROM_BOOK',
            requiresAuth: true,
            requiresAdmin: true,
            errorMessage: 'Erreur lors de la suppression des auteurs',
            validationSchema: deleteAuthorSchema
        }
    ),



  },

  Authors: {


  },
};
