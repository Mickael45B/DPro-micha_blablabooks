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
    generalEditorsSchema, 
    generalOrderEditorsSchema, 
    viewAllEditorsSchema, 
    viewEditorByID, 
    viewEditorByName, 
    searchEditorsSchema, 
    createEditorSchema, 
    updateEditorSchema, 
    deleteEditorSchema 
} from '../schema/schemas_joi/editorsSchema.js';
// Importer les wrappers et helpers de sécurité
import { sanitizeStrict} from './utils/helpers/helpers_securite.js';
import { get } from "http";

// ========================================
// RESOLVERS POUR LES EDITORS
// ======================================== 

export default {
  Query: {

    /** 
     * Récupérer tous les editors avec pagination, tri et ordre
     * @param {number} limit - Nombre maximum d'editors à retourner (par défaut : 50)
     * @param {number} offset - Nombre d'editors à ignorer avant de commencer à retourner les résultats (par défaut : 0)
     * @param {string} order - Champ par lequel trier les résultats (par défaut : 'created_at', options : 'name', 'created_at', 'updated_at')
     * @param {string} direction - Direction du tri (par défaut : 'DESC', options : 'ASC', 'DESC')
     * @returns {Object} - Un objet contenant la liste des editors, le nombre total d'editors et le statut HTTP
     * @throws {GraphQLError} - En cas d'erreur lors de la récupération des editors
     * @requiresAuth - L'utilisateur doit être authentifié pour accéder à cette requête
     * @requiresAdmin - L'utilisateur doit être un administrateur pour accéder à cette requête
     * @logAction - 'ADMIN_GET_ALL_EDITORS' sera enregistré dans les logs pour cette action
     * @structureSchema - Les données retournées seront validées contre le schéma 'generalEditorsSchema'
     * @sortingSchema - Les paramètres de tri seront validés contre le schéma 'generalSortingSchema'
     * @orderSchema - Les paramètres d'ordre seront validés contre le schéma 'generalOrderEditorsSchema'
     * @errorMessage - 'Erreur lors de la récupération des editors' sera utilisé comme message d'erreur en cas de problème
     */
    getAllEditors : withSecureResolver(
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
                id_editor,
                name, 
                created_at, 
                updated_at 
                FROM editors 
                ORDER BY ${safeOrder} ${safeDirection} 
                LIMIT $1 
                OFFSET $2`, 
                [limit, offset]           
            );

            // ========================================
            // DONNEES RECUPEREES
            // ========================================

            // Requête pour compter le nombre total d'editors
            const counterQuery = await db.query('SELECT COUNT(*)::int as count FROM editors');
                    
            return {
                editors: query.rows,
                totalCount: counterQuery.rows[0].count,
                httpStatus: 200
            };
        },
        {
            structureSchema: generalEditorsSchema,
            sortingSchema: generalSortingSchema,
            orderSchema: generalOrderEditorsSchema,
            logAction: 'ADMIN_GET_ALL_EDITORS',
            requiresAuth: true,
            requiresAdmin: false,
            errorMessage: 'Erreur lors de la récupération des editors'
        }
    ),

    /** 
     * Récupérer un editor par son ID
     * @param {string} editorID - L'ID de l'editor à récupérer (UUIDv4)
     * @returns {Object} - Un objet contenant les informations de l'editor et le statut HTTP
     * @throws {GraphQLError} - En cas d'erreur lors de la récupération de l'editor
     * @requiresAuth - L'utilisateur doit être authentifié pour accéder à cette requête
     * @logAction - 'GET_ONE_EDITOR BY_ID' sera enregistré dans les logs pour cette action
     * @structureSchema - Les données retournées seront validées contre le schéma 'generalEditorsSchema'
     * @sortingSchema - Les paramètres de tri seront validés contre le schéma 'generalSortingSchema'
     * @orderSchema - Les paramètres d'ordre seront validés contre le schéma 'generalOrderEditorsSchema'
     * @errorMessage - 'Erreur lors de la récupération de l\'editor' sera utilisé comme message d'erreur en cas de problème
     * @validationSchema - Les arguments d'entrée seront validés contre le schéma 'viewEditorByID'
     * @sanitization - L'ID de l'editor sera nettoyé avec la fonction 'sanitizeStrict' avant d'être utilisé dans la requête
     * existenceCheck - La fonction 'findBy1ParameterOrThrow' sera utilisée pour vérifier que l'editor existe dans la base de données avant de retourner les données
     */
    getEditorByID : withSecureResolver(
        async (_, { editorID }, context) => {
            
            // Nettoyer et valider l'ID de l'editor
            const cleanId = sanitizeStrict(editorID);

            // Vérifier que l'editor existe dans la base de données
            const editor = await findBy1ParameterOrThrow('editors', 'id_editor', cleanId, 'Editor non trouvé');

            if (context?.res?.status) context.res.status(200);
            return editor;
        
        },
        {
            structureSchema: generalEditorsSchema, 
            sortingSchema: generalSortingSchema,
            orderSchema: generalOrderEditorsSchema,
            logAction: 'GET_ONE_EDITOR BY_ID',
            requiresAuth: true,
            errorMessage: 'Erreur lors de la récupération de l\'editor'
        }
    ),

    /**
     * Récupérer un editor par son nom
     * @param {string} editorName - Le nom de l'editor à récupérer
     * @returns {Object} - Un objet contenant les informations de l'editor et le statut HTTP
     * @throws {GraphQLError} - En cas d'erreur lors de la récupération de l'editor
     * @requiresAuth - L'utilisateur doit être authentifié pour accéder à cette requête
     * @logAction - 'GET_ONE_EDITOR BY_NAME' sera enregistré dans les logs pour cette action
     * @structureSchema - Les données retournées seront validées contre le schéma 'generalEditorsSchema'
     * @sortingSchema - Les paramètres de tri seront validés contre le schéma 'generalSortingSchema'
     * @orderSchema - Les paramètres d'ordre seront validés contre le schéma 'generalOrderEditorsSchema'
     * @errorMessage - 'Erreur lors de la récupération de l\'editor' sera utilisé comme message d'erreur en cas de problème
     * @validationSchema - Les arguments d'entrée seront validés contre le schéma 'viewEditorByName'
     * @sanitization - Le nom de l'editor sera nettoyé avec la fonction 'sanitizeStrict' avant d'être utilisé dans la requête
     * @existenceCheck - La fonction 'findBy1ParameterOrThrow' sera utilisée pour vérifier que l'editor existe dans la base de données avant de retourner les données
     * Note : Cette requête suppose que les noms d'editors sont uniques dans la base de données. Si ce n'est pas le cas, il faudrait envisager de retourner une liste d'editors correspondant au nom fourni ou d'ajouter des critères de recherche supplémentaires pour garantir l'unicité du résultat.
     */
    getEditorByName : withSecureResolver(
        async (_, { editorName }, context) => {

            // Nettoyer et valider le nom de l'editor
            const cleanName = sanitizeStrict(editorName);

            // Vérifier que l'editor existe dans la base de données
            const editor = await findBy1ParameterOrThrow('editors', 'name', cleanName, 'Editor non trouvé');

            if (context?.res?.status) context.res.status(200);
            return editor;
        },
        {
            structureSchema: generalEditorsSchema, 
            sortingSchema: generalSortingSchema,
            orderSchema: generalOrderEditorsSchema,
            logAction: 'GET_ONE_EDITOR BY_NAME',
            requiresAuth: true,
            errorMessage: 'Erreur lors de la récupération de l\'editor'
        }
    ),

    /**
     * Rechercher des editors par un terme de recherche dans leur nom
     * @param {string} selectedEditor - Le terme de recherche à utiliser pour trouver des editors (doit contenir au moins 2 caractères)
     * @param {number} limit - Nombre maximum d'editors à retourner (par défaut : 50)
     * @param {number} offset - Nombre d'editors à ignorer avant de commencer à retourner les résultats (par défaut : 0)
     * @param {string} order - Champ par lequel trier les résultats (par défaut : 'created_at', options : 'name', 'created_at', 'updated_at')
     * @param {string} direction - Direction du tri (par défaut : 'DESC', options : 'ASC', 'DESC')
     * @return {Object} - Un objet contenant la liste des editors correspondant au terme de recherche, le nombre total d'editors trouvés, un indicateur de pagination et le statut HTTP
     * @throws {GraphQLError} - En cas d'erreur lors de la recherche des editors ou si le terme de recherche est trop court
     * @requiresAuth - L'utilisateur doit être authentifié pour accéder à cette requête
     * @logAction - 'SEARCH_EDITORS' sera enregistré dans les logs pour cette action
     * @structureSchema - Les données retournées seront validées contre le schéma 'generalEditorsSchema'
     * @sortingSchema - Les paramètres de tri seront validés contre le schéma 'generalSortingSchema'
     * @orderSchema - Les paramètres d'ordre seront validés contre le schéma 'generalOrderEditorsSchema'
     * @errorMessage - 'Erreur lors de la recherche des editors' sera utilisé comme message d'erreur en cas de problème
     * @validationSchema - Les arguments d'entrée seront validés contre le schéma 'searchEditorsSchema'
     * @sanitization - Le terme de recherche sera nettoyé avec la fonction 'sanitizeStrict' avant d'être utilisé dans la requête
     * @existenceCheck - La fonction 'findBy1ParameterOrThrow' ne sera pas utilisée ici car il s'agit d'une recherche qui peut potentiellement retourner plusieurs résultats ou aucun résultat, ce qui est différent d'une vérification d'existence stricte. Cependant, une validation sera effectuée pour s'assurer que le terme de recherche contient au moins 2 caractères afin d'éviter des requêtes inefficaces ou des résultats trop larges.
     * Note : Cette requête utilise une recherche insensible à la casse (ILIKE) pour trouver des editors dont le nom contient le terme de recherche fourni. Les résultats sont paginés et triés selon les paramètres spécifiés. Le nombre total d'editors correspondant au terme de recherche est également retourné pour permettre une pagination efficace côté client.
     */
    searchEditors : withSecureResolver(
        async (_, { validated }, context) => {
            const { name, limit = 50,  offset = 0, direction = 'DESC', order = 'created_at' } = validated || {};  
            const cleanSelectedEditor = sanitizeStrict(name);

        if (!cleanSelectedEditor || cleanSelectedEditor.length < 2) {
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
                id_editor, 
                name, 
                created_at, 
                updated_at
                FROM editors
                WHERE name ILIKE $1
                ORDER BY ${safeOrder} ${safeDirection}
                LIMIT $2
                OFFSET $3`,
                [`%${cleanSelectedEditor}%`, limit, offset]
            );
            const countQuery = await db.query(
                `SELECT COUNT(*)::int as count
                FROM editors
                WHERE name ILIKE $1`,
                [`%${cleanSelectedEditor}%`]
            );
            const totalCount = countQuery.rows[0].count;
            
            return {
            editors: query.rows,
            totalCount,
            hasNextPage: offset + limit < totalCount,
            httpStatus: 200,
            };
        },
        {
            structureSchema: generalEditorsSchema,
            specificSchema: searchEditorsSchema,
            sortingSchema: generalSortingSchema,
            orderSchema: generalOrderEditorsSchema,
            logAction: 'SEARCH_EDITORS',
            requiresAuth: true,
            errorMessage: 'Erreur lors de la recherche des editors'
        }
    ),

    },
  Mutation: {

    /**
     * Ajouter un nouveau editor
     * @param {string} selectedEditor - Le nom de l'editor à ajouter (doit contenir au moins 1 caractère)
     * @param {number} limit - Nombre maximum d'editors à retourner après l'ajout (par défaut : 50)
     * @param {number} offset - Nombre d'editors à ignorer avant de commencer à retourner les résultats après l'ajout (par défaut : 0)
     * @param {string} order - Champ par lequel trier les résultats après l'ajout (par défaut : 'created_at', options : 'name', 'created_at', 'updated_at')
     * @param {string} direction - Direction du tri après l'ajout (par défaut : 'DESC', options : 'ASC', 'DESC')
     * @return {Object} - Un objet contenant la liste des editors après l'ajout, le nombre total d'editors, un indicateur de pagination et le statut HTTP
     * @throws {GraphQLError} - En cas d'erreur lors de l'ajout de l'editor ou si le nom de l'editor est trop court ou si un editor avec le même nom existe déjà
     * @requiresAuth - L'utilisateur doit être authentifié pour accéder à cette mutation
     * @requiresAdmin - L'utilisateur doit être un administrateur pour accéder à cette mutation
     * @logAction - 'ADD_EDITOR' sera enregistré dans les logs pour cette action
     * @structureSchema - Les données retournées seront validées contre le schéma 'generalEditorsSchema'
     * @sortingSchema - Les paramètres de tri seront validés contre le schéma 'generalSortingSchema'
     * @orderSchema - Les paramètres d'ordre seront validés contre le schéma 'generalOrderEditorsSchema'
     * @errorMessage - 'Erreur lors de l'ajout d'un editor' sera utilisé comme message d'erreur en cas de problème
     * @validationSchema - Les arguments d'entrée seront validés contre le schéma 'createEditorSchema'
     * @sanitization - Le nom de l'editor sera nettoyé avec la fonction 'sanitizeStrict' avant d'être utilisé dans la requête
     * existenceCheck - La fonction 'findBy1Parameter' sera utilisée pour vérifier qu'aucun editor avec le même nom n'existe déjà dans la base de données avant de procéder à l'ajout
     */
    addEditor : withSecureResolver(
        async (_, { selectedArguments }, context) => {

            // Récupérer les arguments nécessaires 
            const { selectedEditor, limit = 50,  offset = 0, direction = 'DESC', order = 'created_at' } = selectedArguments;
            // Nettoyer le terme de recherche
            const cleanSelectedEditor = sanitizeStrict(selectedEditor);

            // Valider le terme de recherche
            if (!cleanSelectedEditor || cleanSelectedEditor.length < 2) { 
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

            // vérifier si l'editor existe  déjà dans la base de données
            const existingEditor = await findBy1Parameter('editors', 'name', cleanSelectedEditor);
                if (existingEditor) {
                throw new GraphQLError('Un editor avec ce nom existe déjà', {
                    extensions: { code: 'CONFLICT', httpStatus: 409 }
                });
            }

            const newEditorId = uuidv4();
            const createdAt = new Date();

            // Exécuter la requête de recherche dans la base de données
            const query = await db.query(       
                `INSERT INTO editors (id_editor, name, created_at)
                VALUES ($1, $2, $3)
                RETURNING id_editor, name, created_at, updated_at   
                ORDER BY ${safeOrder} ${safeDirection}
                LIMIT $4
                OFFSET $5`,
                [newEditorId, cleanSelectedEditor, createdAt, limit, offset]
            );

            const countQuery = await db.query(
                `SELECT COUNT(*)::int as count
                FROM editors
               ORDER BY ${safeOrder} ${safeDirection}
                LIMIT $1
                OFFSET $2`,
                [limit, offset]
            );

            const totalCount = countQuery.rows[0].count;
            return {
                editors: query.rows,
                totalCount,
                hasNextPage: offset + limit < totalCount,
                httpStatus: 200,
            };
        },
        {
            structureSchema: generalEditorsSchema, 
            sortingSchema: generalSortingSchema,
            orderSchema: generalOrderEditorsSchema,
            logAction: 'ADD_EDITOR',
            requiresAuth: true,
            requiresAdmin: true,
            errorMessage: 'Erreur lors de l\'ajout d\'un editor'
        }
    ),

    /**
     * Mettre à jour un editor existant
     * @param {string} editorID - L'ID de l'editor à mettre à jour (UUIDv4)
     * @param {string} name - Le nouveau nom de l'editor (doit contenir au moins 1 caractère)
     * @return {Object} - Un objet contenant les informations de l'editor mis à jour et le statut HTTP
     * @throws {GraphQLError} - En cas d'erreur lors de la mise à jour de l'editor, si le nom de l'editor est trop court ou si un editor avec le même nom existe déjà
     * @requiresAuth - L'utilisateur doit être authentifié pour accéder à cette mutation
     * @requiresAdmin - L'utilisateur doit être un administrateur pour accéder à cette mutation
     * @logAction - 'UPDATE_EDITOR' sera enregistré dans les logs pour cette action
     * @structureSchema - Les données retournées seront validées contre le schéma 'generalEditorsSchema'
     * @sortingSchema - Les paramètres de tri seront validés contre le schéma 'generalSortingSchema'
     * @orderSchema - Les paramètres d'ordre seront validés contre le schéma 'generalOrderEditorsSchema'
     * @errorMessage - 'Erreur lors de la mise à jour de l\'editor' sera utilisé comme message d'erreur en cas de problème
     * @validationSchema - Les arguments d'entrée seront validés contre le schéma 'updateEditorSchema'
     * @sanitization - L'ID de l'editor et le nom de l'editor seront nettoyés avec la fonction 'sanitizeStrict' avant d'être utilisés dans la requête
     * existenceCheck - La fonction 'findBy1ParameterOrThrow' sera utilisée pour vérifier que l'editor existe dans la base de données avant de procéder à la mise à jour, et la fonction 'findBy1Parameter' sera utilisée pour vérifier qu'aucun autre editor avec le même nom n'existe déjà dans la base de données avant de procéder à la mise à jour
     */
    updateEditor : withSecureResolver(
        async (_, { selectedArguments }, context) => {

            // Récupérer les arguments nécessaires
            const { editorID, name } = selectedArguments;
            // Nettoyer les arguments
            const cleanEditorID = sanitizeStrict(editorID);
            const cleanName = sanitizeStrict(name);

            // Vérifier que l'editor existe dans la base de données
            const existingEditor = await findBy1ParameterOrThrow('editors', 'id_editor', cleanEditorID, 'Editor non trouvé');
            // Vérifier si le nouveau nom de editor existe déjà pour un autre editor
            if (cleanName && cleanName !== existingEditor.name) {
                const editorWithSameName = await findBy1Parameter('editors', 'name', cleanName);
                if (editorWithSameName) {
                    throw new GraphQLError('Un editor avec ce nom existe déjà', {
                        extensions: { code: 'CONFLICT', httpStatus: 409 }
                    });
                }
            }

            //Vérifier que l'id du editor existe dans la base de données
            await findBy1ParameterOrThrow('editors', 'id_editor', cleanEditorID, 'Editor non trouvé');

            // Construire la requête de mise à jour
            const query = await db.query(
                `UPDATE editors
                SET name = COALESCE($1, name), 
                    updated_at = NOW()
                WHERE id_editor = $2
                RETURNING id_editor, name, created_at, updated_at`,
                [cleanName, cleanEditorID]
            );

            if (context?.res?.status) context.res.status(200);
            return query.rows[0];

        },
        {
            structureSchema: generalEditorsSchema, 
            sortingSchema: generalSortingSchema,
            orderSchema: generalOrderEditorsSchema,
            logAction: 'UPDATE_EDITOR',
            requiresAuth: true,
            requiresAdmin: true,
            errorMessage: 'Erreur lors de la mise à jour de l\'editor',
            validationSchema: updateEditorSchema
        }
    ),

    /**
     * Supprimer un editor existant
     * @param {string} editorID - L'ID de l'editor à supprimer (UUIDv4)
     * @return {Object} - Un objet contenant un message de succès et le statut HTTP
     * @throws {GraphQLError} - En cas d'erreur lors de la suppression de l'editor ou si l'editor n'existe pas
     * @requiresAuth - L'utilisateur doit être authentifié pour accéder à cette mutation
     * @requiresAdmin - L'utilisateur doit être un administrateur pour accéder à cette mutation
     * @logAction - 'DELETE_EDITOR' sera enregistré dans les logs pour cette action
     * @structureSchema - Les données retournées seront validées contre le schéma 'generalEditorsSchema'
     * @sortingSchema - Les paramètres de tri seront validés contre le schéma 'generalSortingSchema'
     * @orderSchema - Les paramètres d'ordre seront validés contre le schéma 'generalOrderEditorsSchema'
     * @errorMessage - 'Erreur lors de la suppression de l\'editor' sera utilisé comme message d'erreur en cas de problème
     * @validationSchema - Les arguments d'entrée seront validés contre le schéma 'deleteEditorSchema'
     * @sanitization - L'ID de l'editor sera nettoyé avec la fonction 'sanitizeStrict' avant d'être utilisé dans la requête
     * existenceCheck - La fonction 'findBy1ParameterOrThrow' sera utilisée pour vérifier que l'editor existe dans la base de données avant de procéder à la suppression
     */
    deleteEditor : withSecureResolver(
        async (_, { selectedArguments }, context) => {
                // Récupérer les arguments nécessaires
                const { editorID } = selectedArguments;

                // Nettoyer les arguments
                const cleanEditorID = sanitizeStrict(editorID);

                // Vérifier que l'editor existe dans la base de données
                await findBy1ParameterOrThrow('editors', 'id_editor', cleanEditorID, 'Editor non trouvé');

                // Supprimer l'editor de la table editors
                await db.query(
                    `DELETE FROM editors
                    WHERE id_editor = $1`,
                    [cleanEditorID]
                );
                if (context?.res?.status) context.res.status(200);
                return {
                    message: 'Editor supprimé avec succès',
                    httpStatus: 200
                };
        },
        {
            structureSchema: generalEditorsSchema, 
            sortingSchema: generalSortingSchema,
            orderSchema: generalOrderEditorsSchema,
            logAction: 'DELETE_EDITOR',
            requiresAuth: true,
            requiresAdmin: true,
            errorMessage: 'Erreur lors de la suppression de l\'editor',
            validationSchema: deleteEditorSchema
        }
    ),

    /**
     * Ajouter plusieurs editeurs à un livre
     * @param {string[]} editorNames - Un tableau de noms d'éditeurs à ajouter (chaque nom doit contenir au moins 1 caractère)
     * @return {Object} - Un objet contenant la liste des éditeurs ajoutés et le statut HTTP
     * @throws {GraphQLError} - En cas d'erreur lors de l'ajout des éditeurs, si un nom d'éditeur est trop court ou si un éditeur avec le même nom existe déjà
     * @requiresAuth - L'utilisateur doit être authentifié pour accéder à cette mutation
     * @requiresAdmin - L'utilisateur doit être un administrateur pour accéder à cette mutation
     * @logAction - 'ADD_EDITORS_TO_BOOK' sera enregistré dans les logs pour cette action
     * @structureSchema - Les données retournées seront validées contre le schéma 'generalEditorsSchema'
     * @sortingSchema - Les paramètres de tri seront validés contre le schéma 'generalSortingSchema'
     * @orderSchema - Les paramètres d'ordre seront validés contre le schéma 'generalOrderEditorsSchema'
     * @errorMessage - 'Erreur lors de l'ajout des éditeurs' sera utilisé comme message d'erreur en cas de problème
     * @validationSchema - Les arguments d'entrée seront validés contre le schéma 'createEditorSchema'
     * @sanitization - Les noms des éditeurs seront nettoyés avec la fonction 'sanitizeStrict' avant d'être utilisés dans la requête
     * existenceCheck - La fonction 'findBy1Parameter' sera utilisée pour vérifier qu'aucun éditeur avec le même nom n'existe déjà dans la base de données avant de procéder à l'ajout de chaque éditeur
     */
    addEditorsToBook : withSecureResolver(
        async (_, { selectedArguments }, context) => {
            // Récupérer les arguments nécessaires
            const { editorNames } = selectedArguments;

            // Nettoyer les arguments
            const cleanEditorNames = Array.isArray(editorNames) 
                ? editorNames.map(name => sanitizeStrict(name)) 
                : [];

            // Vérifier que les éditeurs n'existent pas déjà dans la base de données
            let addedEditors = [];
            for (const editorName of cleanEditorNames) {
                try {
                    await findBy1ParameterOrThrow('editors', 'name', editorName, `L'éditeur avec le nom : ${editorName}, existe déjà`);
                } catch (error) {
                    // L'éditeur n'existe pas, on peut le créer
                    const editorId = uuidv4();
                    await db.query(
                        `INSERT INTO editors (id_editor, name, created_at)
                        VALUES ($1, $2, NOW())`,
                        [editorId, editorName]
                    );
                    addedEditors.push({ id: editorId, name: editorName });
                }
            }

            if (context?.res?.status) context.res.status(200);
            return {
                editors: addedEditors,
                httpStatus: 200
            };

        },
        {
            structureSchema: generalEditorsSchema, 
            sortingSchema: generalSortingSchema,
            orderSchema: generalOrderEditorsSchema,
            logAction: 'ADD_EDITORS_TO_BOOK',
            requiresAuth: true,
            requiresAdmin: true,
            errorMessage: 'Erreur lors de l\'ajout des éditeurs',
            validationSchema: createEditorSchema
        }
    ),

    /**
     * Supprimer plusieurs éditeurs d'un livre
     * @param {string[]} editorIDs - Un tableau d'IDs d'éditeurs à supprimer (chaque ID doit être un UUIDv4)
     * @return {Object} - Un objet contenant la liste des éditeurs supprimés et le statut HTTP
     * @throws {GraphQLError} - En cas d'erreur lors de la suppression des éditeurs ou si un éditeur n'existe pas
     * @requiresAuth - L'utilisateur doit être authentifié pour accéder à cette mutation
     * @requiresAdmin - L'utilisateur doit être un administrateur pour accéder à cette mutation
     * @logAction - 'REMOVE_EDITORS_FROM_BOOK' sera enregistré dans les logs pour cette action
     * @structureSchema - Les données retournées seront validées contre le schéma 'generalEditorsSchema'
     *  @sortingSchema - Les paramètres de tri seront validés contre le schéma 'generalSortingSchema'
     * @orderSchema - Les paramètres d'ordre seront validés contre le schéma 'generalOrderEditorsSchema'
     * @errorMessage - 'Erreur lors de la suppression des éditeurs' sera utilisé comme message d'erreur en cas de problème
     * @validationSchema - Les arguments d'entrée seront validés contre le schéma 'deleteEditorSchema'
     * @sanitization - Les IDs des éditeurs seront nettoyés avec la fonction 'sanitizeStrict' avant d'être utilisés dans la requête
     * existenceCheck - La fonction 'findBy1ParameterOrThrow' sera utilisée pour vérifier que chaque éditeur existe dans la base de données avant de procéder à la suppression
     */
    removeEditorsFromBook : withSecureResolver(
        async (_, { selectedArguments }, context) => {

            // Récupérer les arguments nécessaires
            const { editorIDs } = selectedArguments;
            // Nettoyer les arguments
            const cleanEditorIDs = Array.isArray(editorIDs)
                ? editorIDs.map(id => sanitizeStrict(id))
                : [];

            // Vérifier que les éditeurs existent dans la base de données
            for (const editorID of cleanEditorIDs) {
                await findBy1ParameterOrThrow('editors', 'id_editor', editorID, `L'éditeur avec l'ID : ${editorID}, n'existe pas`);
            }

            // Supprimer les éditeurs de la table editors
            const removedEditors = [];
            for (const editorID of cleanEditorIDs) {
                await db.query(
                    `DELETE FROM editors WHERE id_editor = $1`, 
                    [editorID] 
                );
                removedEditors.push({ id: editorID}); 
            }

            if (context?.res?.status) context.res.status(200);
            return {
                editors: removedEditors,
                httpStatus: 200
            };

        },
        {
            structureSchema: generalEditorsSchema,
            sortingSchema: generalSortingSchema,
            orderSchema: generalOrderEditorsSchema,
            logAction: 'REMOVE_EDITORS_FROM_BOOK',
            requiresAuth: true,
            requiresAdmin: true,
            errorMessage: 'Erreur lors de la suppression des éditeurs',
            validationSchema: deleteEditorSchema
        }
    ),

  },

    Editors: {


  },
};
