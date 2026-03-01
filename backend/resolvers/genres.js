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
    generalGenresSchema, 
    generalOrderGenresSchema, 
    viewAllGenresSchema, 
    viewGenreByID, 
    viewGenreByName, 
    searchGenresSchema, 
    createGenreSchema, 
    updateGenreSchema, 
    deleteGenreSchema 
} from '../schema/schemas_joi/genresSchema.js';
// Importer les wrappers et helpers de sécurité
import { sanitizeStrict} from './utils/helpers/helpers_securite.js';
import { get } from "http";

// ========================================
// RESOLVERS POUR LES GENRES
// ======================================== 

export default {
  Query: {

    /** 
     * Récupérer tous les genres avec pagination, tri et ordre
     * @param {number} limit - Nombre maximum de genres à retourner (par défaut : 50)
     * @param {number} offset - Nombre de genres à ignorer avant de commencer à retourner les résultats (par défaut : 0)
     * @param {string} order - Champ par lequel trier les résultats (par défaut : 'created_at', options : 'name', 'created_at', 'updated_at')
     * @param {string} direction - Direction du tri (par défaut : 'DESC', options : 'ASC', 'DESC')
     * @returns {Object} - Un objet contenant la liste des genres, le nombre total de genres et le statut HTTP
     * @throws {GraphQLError} - En cas d'erreur lors de la récupération des genres
     * @requiresAuth - L'utilisateur doit être authentifié pour accéder à cette requête
     * @requiresAdmin - L'utilisateur doit être un administrateur pour accéder à cette requête
     * @logAction - 'ADMIN_GET_ALL_GENRES' sera enregistré dans les logs pour cette action
     * @structureSchema - Les données retournées seront validées contre le schéma 'generalGenresSchema'
     * @sortingSchema - Les paramètres de tri seront validés contre le schéma 'generalSortingSchema'
     * @orderSchema - Les paramètres d'ordre seront validés contre le schéma 'generalOrderGenresSchema'
     * @errorMessage - 'Erreur lors de la récupération des genres' sera utilisé comme message d'erreur en cas de problème
     */
    getAllGenres : withSecureResolver(
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
                id_genre,
                name, 
                created_at, 
                updated_at 
                FROM genres 
                ORDER BY ${safeOrder} ${safeDirection} 
                LIMIT $1 
                OFFSET $2`, 
                [limit, offset]           
            );

            // ========================================
            // DONNEES RECUPEREES
            // ========================================

            // Requête pour compter le nombre total de genres
            const counterQuery = await db.query('SELECT COUNT(*)::int as count FROM genres');
                    
            return {
                genres: query.rows,
                totalCount: counterQuery.rows[0].count,
                httpStatus: 200
            };
        },
        {
            structureSchema: generalGenresSchema,
            sortingSchema: generalSortingSchema,
            orderSchema: generalOrderGenresSchema,
            logAction: 'ADMIN_GET_ALL_GENRES',
            requiresAuth: true,
            requiresAdmin: false,
            errorMessage: 'Erreur lors de la récupération des genres'
        }
    ),

    /** 
     * Récupérer un genre par son ID
     * @param {string} genreID - L'ID du genre à récupérer (UUIDv4)
     * @returns {Object} - Un objet contenant les informations du genre et le statut HTTP
     * @throws {GraphQLError} - En cas d'erreur lors de la récupération du genre
     * @requiresAuth - L'utilisateur doit être authentifié pour accéder à cette requête
     * @logAction - 'GET_ONE_GENRE BY_ID' sera enregistré dans les logs pour cette action
     * @structureSchema - Les données retournées seront validées contre le schéma 'generalGenresSchema'
     * @sortingSchema - Les paramètres de tri seront validés contre le schéma 'generalSortingSchema'
     * @orderSchema - Les paramètres d'ordre seront validés contre le schéma 'generalOrderGenresSchema'
     * @errorMessage - 'Erreur lors de la récupération du genre' sera utilisé comme message d'erreur en cas de problème
     * @validationSchema - Les arguments d'entrée seront validés contre le schéma 'viewGenreByID'
     * @sanitization - L'ID du genre sera nettoyé avec la fonction 'sanitizeStrict' avant d'être utilisé dans la requête
     * existenceCheck - La fonction 'findBy1ParameterOrThrow' sera utilisée pour vérifier que le genre existe dans la base de données avant de retourner les données
     */
    getGenreByID : withSecureResolver(
        async (_, { genreID }, context) => {
            
            // Nettoyer et valider l'ID du genre
            const cleanId = sanitizeStrict(genreID);

            // Vérifier que le genre existe dans la base de données
            const genre = await findBy1ParameterOrThrow('genres', 'id_genre', cleanId, 'Genre non trouvé');

            if (context?.res?.status) context.res.status(200);
            return genre;
        
        },
        {
            structureSchema: generalGenresSchema, 
            sortingSchema: generalSortingSchema,
            orderSchema: generalOrderGenresSchema,
            logAction: 'GET_ONE_GENRE BY_ID',
            requiresAuth: true,
            errorMessage: 'Erreur lors de la récupération du genre'
        }
    ),

    /**
     * Récupérer un genre par son nom
     * @param {string} genreName - Le nom du genre à récupérer
     * @returns {Object} - Un objet contenant les informations du genre et le statut HTTP
     * @throws {GraphQLError} - En cas d'erreur lors de la récupération du genre
     * @requiresAuth - L'utilisateur doit être authentifié pour accéder à cette requête
     * @logAction - 'GET_ONE_GENRE BY_NAME' sera enregistré dans les logs pour cette action
     * @structureSchema - Les données retournées seront validées contre le schéma 'generalGenresSchema'
     * @sortingSchema - Les paramètres de tri seront validés contre le schéma 'generalSortingSchema'
     * @orderSchema - Les paramètres d'ordre seront validés contre le schéma 'generalOrderGenresSchema'
     * @errorMessage - 'Erreur lors de la récupération du genre' sera utilisé comme message d'erreur en cas de problème
     * @validationSchema - Les arguments d'entrée seront validés contre le schéma 'viewGenreByName'
     * @sanitization - Le nom du genre sera nettoyé avec la fonction 'sanitizeStrict' avant d'être utilisé dans la requête
     * @existenceCheck - La fonction 'findBy1ParameterOrThrow' sera utilisée pour vérifier que le genre existe dans la base de données avant de retourner les données
     * Note : Cette requête suppose que les noms de genres sont uniques dans la base de données. Si ce n'est pas le cas, il faudrait envisager de retourner une liste de genres correspondant au nom fourni ou d'ajouter des critères de recherche supplémentaires pour garantir l'unicité du résultat.
     */
    getGenreByName : withSecureResolver(
        async (_, { genreName }, context) => {

            // Nettoyer et valider le nom du genre
            const cleanName = sanitizeStrict(genreName);

            // Vérifier que le genre existe dans la base de données
            const genre = await findBy1ParameterOrThrow('genres', 'name', cleanName, 'Genre non trouvé');

            if (context?.res?.status) context.res.status(200);
            return genre;
        },
        {
            structureSchema: generalGenresSchema, 
            sortingSchema: generalSortingSchema,
            orderSchema: generalOrderGenresSchema,
            logAction: 'GET_ONE_GENRE BY_NAME',
            requiresAuth: true,
            errorMessage: 'Erreur lors de la récupération du genre'
        }
    ),

    /**
     * Rechercher des genres par un terme de recherche dans leur nom
     * @param {string} selectedGenre - Le terme de recherche à utiliser pour trouver des genres (doit contenir au moins 2 caractères)
     * @param {number} limit - Nombre maximum de genres à retourner (par défaut : 50)
     * @param {number} offset - Nombre de genres à ignorer avant de commencer à retourner les résultats (par défaut : 0)
     * @param {string} order - Champ par lequel trier les résultats (par défaut : 'created_at', options : 'name', 'created_at', 'updated_at')
     * @param {string} direction - Direction du tri (par défaut : 'DESC', options : 'ASC', 'DESC')
     * @return {Object} - Un objet contenant la liste des genres correspondant au terme de recherche, le nombre total de genres trouvés, un indicateur de pagination et le statut HTTP
     * @throws {GraphQLError} - En cas d'erreur lors de la recherche des genres ou si le terme de recherche est trop court
     * @requiresAuth - L'utilisateur doit être authentifié pour accéder à cette requête
     * @logAction - 'SEARCH_GENRES' sera enregistré dans les logs pour cette action
     * @structureSchema - Les données retournées seront validées contre le schéma 'generalGenresSchema'
     * @sortingSchema - Les paramètres de tri seront validés contre le schéma 'generalSortingSchema'
     * @orderSchema - Les paramètres d'ordre seront validés contre le schéma 'generalOrderGenresSchema'
     * @errorMessage - 'Erreur lors de la recherche des genres' sera utilisé comme message d'erreur en cas de problème
     * @validationSchema - Les arguments d'entrée seront validés contre le schéma 'searchGenresSchema'
     * @sanitization - Le terme de recherche sera nettoyé avec la fonction 'sanitizeStrict' avant d'être utilisé dans la requête
     * @existenceCheck - La fonction 'findBy1ParameterOrThrow' ne sera pas utilisée ici car il s'agit d'une recherche qui peut potentiellement retourner plusieurs résultats ou aucun résultat, ce qui est différent d'une vérification d'existence stricte. Cependant, une validation sera effectuée pour s'assurer que le terme de recherche contient au moins 2 caractères afin d'éviter des requêtes inefficaces ou des résultats trop larges.
     * Note : Cette requête utilise une recherche insensible à la casse (ILIKE) pour trouver des genres dont le nom contient le terme de recherche fourni. Les résultats sont paginés et triés selon les paramètres spécifiés. Le nombre total de genres correspondant au terme de recherche est également retourné pour permettre une pagination efficace côté client.
     */
    searchGenres : withSecureResolver(
        async (_, { validated }, context) => {
            const { name, limit = 50,  offset = 0, direction = 'DESC', order = 'created_at' } = validated || {};  
            const cleanSelectedGenre = sanitizeStrict(name);

        if (!cleanSelectedGenre || cleanSelectedGenre.length < 2) {
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
                id_genre, 
                name, 
                created_at, 
                updated_at
                FROM genres
                WHERE name ILIKE $1
                ORDER BY ${safeOrder} ${safeDirection}
                LIMIT $2
                OFFSET $3`,
                [`%${cleanSelectedGenre}%`, limit, offset]
            );
            const countQuery = await db.query(
                `SELECT COUNT(*)::int as count
                FROM genres
                WHERE name ILIKE $1`,
                [`%${cleanSelectedGenre}%`]
            );
            const totalCount = countQuery.rows[0].count;
            
            return {
            genres: query.rows,
            totalCount,
            hasNextPage: offset + limit < totalCount,
            httpStatus: 200,
            };

        },
        {
            structureSchema: generalGenresSchema,
            specificSchema: searchGenresSchema,
            sortingSchema: generalSortingSchema,
            orderSchema: generalOrderGenresSchema,
            logAction: 'SEARCH_GENRES',
            requiresAuth: true,
            errorMessage: 'Erreur lors de la recherche des genres'
        }
    ),

    },
  Mutation: {

    /**
     * Ajouter un nouveau genre
     * @param {string} selectedGenre - Le nom du genre à ajouter (doit contenir au moins 1 caractère)
     * @param {number} limit - Nombre maximum de genres à retourner après l'ajout (par défaut : 50)
     * @param {number} offset - Nombre de genres à ignorer avant de commencer à retourner les résultats après l'ajout (par défaut : 0)
     * @param {string} order - Champ par lequel trier les résultats après l'ajout (par défaut : 'created_at', options : 'name', 'created_at', 'updated_at')
     * @param {string} direction - Direction du tri après l'ajout (par défaut : 'DESC', options : 'ASC', 'DESC')
     * @return {Object} - Un objet contenant la liste des genres après l'ajout, le nombre total de genres, un indicateur de pagination et le statut HTTP
     * @throws {GraphQLError} - En cas d'erreur lors de l'ajout du genre ou si le nom du genre est trop court ou si un genre avec le même nom existe déjà
     * @requiresAuth - L'utilisateur doit être authentifié pour accéder à cette mutation
     * @requiresAdmin - L'utilisateur doit être un administrateur pour accéder à cette mutation
     * @logAction - 'ADD_GENRE' sera enregistré dans les logs pour cette action
     * @structureSchema - Les données retournées seront validées contre le schéma 'generalGenresSchema'
     * @sortingSchema - Les paramètres de tri seront validés contre le schéma 'generalSortingSchema'
     * @orderSchema - Les paramètres d'ordre seront validés contre le schéma 'generalOrderGenresSchema'
     * @errorMessage - 'Erreur lors de l'ajout d'un genre' sera utilisé comme message d'erreur en cas de problème
     * @validationSchema - Les arguments d'entrée seront validés contre le schéma 'createGenreSchema'
     * @sanitization - Le nom du genre sera nettoyé avec la fonction 'sanitizeStrict' avant d'être utilisé dans la requête
     * existenceCheck - La fonction 'findBy1Parameter' sera utilisée pour vérifier qu'aucun genre avec le même nom n'existe déjà dans la base de données avant de procéder à l'ajout
     */
    addGenre : withSecureResolver(
        async (_, { selectedArguments }, context) => {

            // Récupérer les arguments nécessaires
            const { selectedGenre, limit = 50,  offset = 0, direction = 'DESC', order = 'created_at' } = selectedArguments;
            // Nettoyer le terme de recherche
            const cleanSelectedGenre = sanitizeStrict(selectedGenre);

            // Valider le terme de recherche
            if (!cleanSelectedGenre || cleanSelectedGenre.length < 2) { 
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

            // vérifier si le genre existe  déjà dans la base de données
            const existingGenre = await findBy1Parameter('genres', 'name', cleanSelectedGenre);
                if (existingGenre) {
                throw new GraphQLError('Un genre avec ce nom existe déjà', {
                    extensions: { code: 'CONFLICT', httpStatus: 409 }
                });
            }

            const newGenreId = uuidv4();
            const createdAt = new Date();

            // Exécuter la requête de recherche dans la base de données
            const query = await db.query(       
                `INSERT INTO genres (id_genre, name, created_at)
                VALUES ($1, $2, $3)
                RETURNING id_genre, name, created_at, updated_at   
                ORDER BY ${safeOrder} ${safeDirection}
                LIMIT $4
                OFFSET $5`,
                [newGenreId, cleanSelectedGenre, createdAt, limit, offset]
            );

            const countQuery = await db.query(
                `SELECT COUNT(*)::int as count
                FROM genres
               ORDER BY ${safeOrder} ${safeDirection}
                LIMIT $1
                OFFSET $2`,
                [limit, offset]
            );

            const totalCount = countQuery.rows[0].count;
            return {
                genres: query.rows,
                totalCount,
                hasNextPage: offset + limit < totalCount,
                httpStatus: 200,
            };
        },
        {
            structureSchema: generalGenresSchema, 
            sortingSchema: generalSortingSchema,
            orderSchema: generalOrderGenresSchema,
            logAction: 'ADD_GENRE',
            requiresAuth: true,
            requiresAdmin: true,
            errorMessage: 'Erreur lors de l\'ajout d\'un genre'
        }
    ),

    /**
     * Mettre à jour un genre existant
     * @param {string} genreID - L'ID du genre à mettre à jour (UUIDv4)
     * @param {string} name - Le nouveau nom du genre (doit contenir au moins 1 caractère)
     * @return {Object} - Un objet contenant les informations du genre mis à jour et le statut HTTP
     * @throws {GraphQLError} - En cas d'erreur lors de la mise à jour du genre, si le nom du genre est trop court ou si un genre avec le même nom existe déjà
     * @requiresAuth - L'utilisateur doit être authentifié pour accéder à cette mutation
     * @requiresAdmin - L'utilisateur doit être un administrateur pour accéder à cette mutation
     * @logAction - 'UPDATE_GENRE' sera enregistré dans les logs pour cette action
     * @structureSchema - Les données retournées seront validées contre le schéma 'generalGenresSchema'
     * @sortingSchema - Les paramètres de tri seront validés contre le schéma 'generalSortingSchema'
     * @orderSchema - Les paramètres d'ordre seront validés contre le schéma 'generalOrderGenresSchema'
     * @errorMessage - 'Erreur lors de la mise à jour du genre' sera utilisé comme message d'erreur en cas de problème
     * @validationSchema - Les arguments d'entrée seront validés contre le schéma 'updateGenreSchema'
     * @sanitization - L'ID du genre et le nom du genre seront nettoyés avec la fonction 'sanitizeStrict' avant d'être utilisés dans la requête
     * existenceCheck - La fonction 'findBy1ParameterOrThrow' sera utilisée pour vérifier que le genre existe dans la base de données avant de procéder à la mise à jour, et la fonction 'findBy1Parameter' sera utilisée pour vérifier qu'aucun autre genre avec le même nom n'existe déjà dans la base de données avant de procéder à la mise à jour
     */
    updateGenre : withSecureResolver(
        async (_, { selectedArguments }, context) => {

            // Récupérer les arguments nécessaires
            const { genreID, name } = selectedArguments;
            // Nettoyer les arguments
            const cleanGenreID = sanitizeStrict(genreID);
            const cleanName = sanitizeStrict(name);

            // Vérifier que le genre existe dans la base de données
            const existingGenre = await findBy1ParameterOrThrow('genres', 'id_genre', cleanGenreID, 'Genre non trouvé');
            // Vérifier si le nouveau nom de genre existe déjà pour un autre genre
            if (cleanName && cleanName !== existingGenre.name) {
                const genreWithSameName = await findBy1Parameter('genres', 'name', cleanName);
                if (genreWithSameName) {
                    throw new GraphQLError('Un genre avec ce nom existe déjà', {
                        extensions: { code: 'CONFLICT', httpStatus: 409 }
                    });
                }
            }

            //Vérifier que l'id du genre existe dans la base de données
            await findBy1ParameterOrThrow('genres', 'id_genre', cleanGenreID, 'Genre non trouvé');

            // Construire la requête de mise à jour
            const query = await db.query(
                `UPDATE genres
                SET name = COALESCE($1, name), 
                    updated_at = NOW()
                WHERE id_genre = $2
                RETURNING id_genre, name, created_at, updated_at`,
                [cleanName, cleanGenreID]
            );

            if (context?.res?.status) context.res.status(200);
            return query.rows[0];

        },
        {
            structureSchema: generalGenresSchema, 
            sortingSchema: generalSortingSchema,
            orderSchema: generalOrderGenresSchema,
            logAction: 'UPDATE_GENRE',
            requiresAuth: true,
            requiresAdmin: true,
            errorMessage: 'Erreur lors de la mise à jour du genre',
            validationSchema: updateGenreSchema
        }
    ),

    /**
     * Supprimer un genre existant
     * @param {string} genreID - L'ID du genre à supprimer (UUIDv4)
     * @return {Object} - Un objet contenant un message de succès et le statut HTTP
     * @throws {GraphQLError} - En cas d'erreur lors de la suppression du genre ou si le genre n'existe pas
     * @requiresAuth - L'utilisateur doit être authentifié pour accéder à cette mutation
     * @requiresAdmin - L'utilisateur doit être un administrateur pour accéder à cette mutation
     * @logAction - 'DELETE_GENRE' sera enregistré dans les logs pour cette action
     * @structureSchema - Les données retournées seront validées contre le schéma 'generalGenresSchema'
     * @sortingSchema - Les paramètres de tri seront validés contre le schéma 'generalSortingSchema'
     * @orderSchema - Les paramètres d'ordre seront validés contre le schéma 'generalOrderGenresSchema'
     * @errorMessage - 'Erreur lors de la suppression du genre' sera utilisé comme message d'erreur en cas de problème
     * @validationSchema - Les arguments d'entrée seront validés contre le schéma 'deleteGenreSchema'
     * @sanitization - L'ID du genre sera nettoyé avec la fonction 'sanitizeStrict' avant d'être utilisé dans la requête
     * existenceCheck - La fonction 'findBy1ParameterOrThrow' sera utilisée pour vérifier que le genre existe dans la base de données avant de procéder à la suppression
     */
    deleteGenre : withSecureResolver(
        async (_, { selectedArguments }, context) => {
                // Récupérer les arguments nécessaires
                const { genreID } = selectedArguments;

                // Nettoyer les arguments
                const cleanGenreID = sanitizeStrict(genreID);

                // Vérifier que le genre existe dans la base de données
                await findBy1ParameterOrThrow('genres', 'id_genre', cleanGenreID, 'Genre non trouvé');

                // Supprimer le genre de la table genres
                await db.query(
                    `DELETE FROM genres
                    WHERE id_genre = $1`,
                    [cleanGenreID]
                );
                if (context?.res?.status) context.res.status(200);
                return {
                    message: 'Genre supprimé avec succès',
                    httpStatus: 200
                };
        },
        {
            structureSchema: generalGenresSchema, 
            sortingSchema: generalSortingSchema,
            orderSchema: generalOrderGenresSchema,
            logAction: 'DELETE_GENRE',
            requiresAuth: true,
            requiresAdmin: true,
            errorMessage: 'Erreur lors de la suppression du genre',
            validationSchema: deleteGenreSchema
        }
    ),

    /**
     * Ajouter plusieurs genres à un livre
     * @param {string[]} genreNames - Un tableau de noms de genres à ajouter (chaque nom doit contenir au moins 1 caractère)
     * @return {Object} - Un objet contenant la liste des genres ajoutés et le statut HTTP
     * @throws {GraphQLError} - En cas d'erreur lors de l'ajout des genres, si un nom de genre est trop court ou si un genre avec le même nom existe déjà
     * @requiresAuth - L'utilisateur doit être authentifié pour accéder à cette mutation
     * @requiresAdmin - L'utilisateur doit être un administrateur pour accéder à cette mutation
     * @logAction - 'ADD_GENRES_TO_BOOK' sera enregistré dans les logs pour cette action
     * @structureSchema - Les données retournées seront validées contre le schéma 'generalGenresSchema'
     * @sortingSchema - Les paramètres de tri seront validés contre le schéma 'generalSortingSchema'
     * @orderSchema - Les paramètres d'ordre seront validés contre le schéma 'generalOrderGenresSchema'
     * @errorMessage - 'Erreur lors de l'ajout des genres' sera utilisé comme message d'erreur en cas de problème
     * @validationSchema - Les arguments d'entrée seront validés contre le schéma 'createGenreSchema'
     * @sanitization - Les noms des genres seront nettoyés avec la fonction 'sanitizeStrict' avant d'être utilisés dans la requête
     * existenceCheck - La fonction 'findBy1Parameter' sera utilisée pour vérifier qu'aucun genre avec le même nom n'existe déjà dans la base de données avant de procéder à l'ajout de chaque genre
     */
    addGenresToBook : withSecureResolver(
        async (_, { selectedArguments }, context) => {
            // Récupérer les arguments nécessaires
            const { genreNames } = selectedArguments;

            // Nettoyer les arguments
            const cleanGenreNames = Array.isArray(genreNames) 
                ? genreNames.map(name => sanitizeStrict(name)) 
                : [];

            // Vérifier que les genres n'existent pas déjà dans la base de données
            let addedGenres = [];
            for (const genreName of cleanGenreNames) {
                try {
                    await findBy1ParameterOrThrow('genres', 'name', genreName, `Le genre avec le nom : ${genreName}, existe déjà`);
                } catch (error) {
                    // Le genre n'existe pas, on peut le créer
                    const genreId = uuidv4();
                    await db.query(
                        `INSERT INTO genres (id_genre, name, created_at)
                        VALUES ($1, $2, NOW())`,
                        [genreId, genreName]
                    );
                    addedGenres.push({ id: genreId, name: genreName });
                }
            }

            if (context?.res?.status) context.res.status(200);
            return {
                genres: addedGenres,
                httpStatus: 200
            };

        },
        {
            structureSchema: generalGenresSchema, 
            sortingSchema: generalSortingSchema,
            orderSchema: generalOrderGenresSchema,
            logAction: 'ADD_GENRES_TO_BOOK',
            requiresAuth: true,
            requiresAdmin: true,
            errorMessage: 'Erreur lors de l\'ajout des genres',
            validationSchema: createGenreSchema
        }
    ),

    /**
     * Supprimer plusieurs genres d'un livre
     * @param {string[]} genreIDs - Un tableau d'IDs de genres à supprimer (chaque ID doit être un UUIDv4)
     * @return {Object} - Un objet contenant la liste des genres supprimés et le statut HTTP
     * @throws {GraphQLError} - En cas d'erreur lors de la suppression des genres ou si un genre n'existe pas
     * @requiresAuth - L'utilisateur doit être authentifié pour accéder à cette mutation
     * @requiresAdmin - L'utilisateur doit être un administrateur pour accéder à cette mutation
     * @logAction - 'REMOVE_GENRES_FROM_BOOK' sera enregistré dans les logs pour cette action
     * @structureSchema - Les données retournées seront validées contre le schéma 'generalGenresSchema'
     *  @sortingSchema - Les paramètres de tri seront validés contre le schéma 'generalSortingSchema'
     * @orderSchema - Les paramètres d'ordre seront validés contre le schéma 'generalOrderGenresSchema'
     * @errorMessage - 'Erreur lors de la suppression des genres' sera utilisé comme message d'erreur en cas de problème
     * @validationSchema - Les arguments d'entrée seront validés contre le schéma 'deleteGenreSchema'
     * @sanitization - Les IDs des genres seront nettoyés avec la fonction 'sanitizeStrict' avant d'être utilisés dans la requête
     * existenceCheck - La fonction 'findBy1ParameterOrThrow' sera utilisée pour vérifier que chaque genre existe dans la base de données avant de procéder à la suppression
     */
    removeGenresFromBook : withSecureResolver(
        async (_, { selectedArguments }, context) => {

            // Récupérer les arguments nécessaires
            const { genreIDs } = selectedArguments;
            // Nettoyer les arguments
            const cleanGenreIDs = Array.isArray(genreIDs)
                ? genreIDs.map(id => sanitizeStrict(id))
                : [];

            // Vérifier que les genres existent dans la base de données
            for (const genreID of cleanGenreIDs) {
                await findBy1ParameterOrThrow('genres', 'id_genre', genreID, `Le genre avec l'ID : ${genreID}, n'existe pas`);
            }

            // Supprimer les genres de la table genres
            const removedGenres = [];
            for (const genreID of cleanGenreIDs) {
                await db.query(
                    `DELETE FROM genres WHERE id_genre = $1`, 
                    [genreID] 
                );
                removedGenres.push({ id: genreID}); 
            }

            if (context?.res?.status) context.res.status(200);
            return {
                genres: removedGenres,
                httpStatus: 200
            };

        },
        {
            structureSchema: generalGenresSchema,
            sortingSchema: generalSortingSchema,
            orderSchema: generalOrderGenresSchema,
            logAction: 'REMOVE_GENRES_FROM_BOOK',
            requiresAuth: true,
            requiresAdmin: true,
            errorMessage: 'Erreur lors de la suppression des genres',
            validationSchema: deleteGenreSchema
        }
    ),

  },

  Genres: {


  },
};
