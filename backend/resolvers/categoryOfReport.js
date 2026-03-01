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
    generalCategoryOfReportSchema, 
    generalOrderCategoryOfReportSchema, 
    viewAllCategoryOfReportsSchema, 
    viewCategoryOfReportByID, 
    searchCategoryOfReportSchema, 
    createCategoryOfReportSchema, 
    updateCategoryOfReportSchema, 
    deleteCategoryOfReportSchema 
} from '../schema/schemas_joi/categoryOfReportSchema.js';
// Importer les wrappers et helpers de sécurité
import { sanitizeStrict} from './utils/helpers/helpers_securite.js';
import { get } from "http";

// ========================================
// RESOLVERS POUR LES CATEGORIES DE RAPPORT
// ======================================== 
export default {
    Query: {

        getAllCategoryOfReport : withSecureResolver(
            async (_, { selectedArguments }, context) => {

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

                // Vérifier que la catégorie correspond à une des catégories autorisées (dans les ENUMS)
                const validCategories = ['USER', 'REVIEW', 'MESSAGE', 'OTHER'];
                if (!validCategories.includes(selectedArguments?.category)) {
                    throw new GraphQLError('Catégorie invalide. Les catégories autorisées sont: ' + validCategories.join(', '), {
                        extensions: { code: 'BAD_REQUEST', httpStatus: 400 }
                    });
                }

                // ========================================
                // REQUETES BASE DE DONNEES
                // ======================================== 

                // Construire la requête SQL avec le tri validé
                const query = await db.query(
                    `SELECT 
                    c.id_report_category,
                    c.name,
                    c.created_at,
                    c.updated_at
                    FROM categoryOfReport c
                    ORDER BY ${safeOrder} ${safeDirection} 
                    LIMIT $1 
                    OFFSET $2`,
                    [limit, offset]            
                );

                // ========================================
                // DONNEES RECUPEREES
                // ========================================

                // Requête pour compter le nombre total de catégories de rapport
                const counterQuery = await db.query('SELECT COUNT(*)::int as count FROM categoryOfReport');
                        
                return {
                    categories: query.rows,
                    totalCount: counterQuery.rows[0].count,
                    httpStatus: 200
                };
                
            },
            {
                structureSchema: generalCategoryOfReportSchema,
                sortingSchema: generalSortingSchema,
                orderSchema: generalOrderCategoryOfReportSchema,
                logAction: 'REMOVE_CATEGORIES_OF_REPORT_FROM_BOOK',
                requiresAuth: true,
                requiresAdmin: false,
                errorMessage: 'Erreur lors de la suppression des catégories de rapport',
            }
        ),

        getCategoryOfReportByID : withSecureResolver(
            async (_, { selectedArguments }, context) => {

                // ========================================
                // RECUPERER LES DONNEES NESSESAIRES
                // ========================================

                // Nettoyer et valider l'ID de l'auteur
                const { id_categoryOfReport } = selectedArguments;
                const cleanId = sanitizeStrict(id_categoryOfReport);

                // Vérifier que la catégorie correspond à une des catégories autorisées (dans les ENUMS)
                const validCategories = ['USER', 'REVIEW', 'MESSAGE', 'OTHER'];
                if (!validCategories.includes(selectedArguments?.category)) {
                    throw new GraphQLError('Catégorie invalide. Les catégories autorisées sont: ' + validCategories.join(', '), {
                        extensions: { code: 'BAD_REQUEST', httpStatus: 400 }
                    });
                }

                // ========================================
                // REQUETES BASE DE DONNEES
                // ========================================

                // Vérifier que la catégorie de rapport existe
                const categoryOfReport = await findBy1ParameterOrThrow('categoryOfReport', 'id_report_category', cleanId, 'Catégorie de rapport non trouvée' ); 

                // ========================================
                // DONNEES RECUPEREES
                // ========================================
                
                return { 
                    category: categoryOfReport, 
                    httpStatus: 200
                }; 



            },
            {
                structureSchema: generalCategoryOfReportSchema,
                sortingSchema: generalSortingSchema,
                orderSchema: generalOrderCategoryOfReportSchema,
                logAction: 'GET_CATEGORY_OF_REPORT_BY_ID',
                requiresAuth: true,
                requiresAdmin: false,
                errorMessage: 'Erreur lors de la récupération de la catégorie de rapport',
            }
        ),

        getCategoryOfReportByName : withSecureResolver(
            async (_, { selectedArguments }, context) => {
                // ========================================
                // RECUPERER LES DONNEES NESSESAIRES
                // ========================================

                // Nettoyer et valider l'ID de l'auteur
                const { nameCategory } = selectedArguments;
                const cleanName = sanitizeStrict(nameCategory);
                // Vérifier que la catégorie correspond à une des catégories autorisées (dans les ENUMS)
                const validCategories = ['USER', 'REVIEW', 'MESSAGE', 'OTHER'];
                if (!validCategories.includes(selectedArguments?.category)) {
                    throw new GraphQLError('Catégorie invalide. Les catégories autorisées sont: ' + validCategories.join(', '), {
                        extensions: { code: 'BAD_REQUEST', httpStatus: 400 }
                    });
                }


                // ========================================
                // REQUETES BASE DE DONNEES
                // ========================================

                // Vérifier que la catégorie de rapport existe
                const categoryOfReport = await findBy1ParameterOrThrow('categoryOfReport', 'name', cleanName, 'Catégorie de rapport non trouvée' ); 

                // ========================================
                // DONNEES RECUPEREES
                // ========================================
                
                return { 
                    category: categoryOfReport, 
                    httpStatus: 200
                }; 

            },
            {
                structureSchema: generalCategoryOfReportSchema,
                sortingSchema: generalSortingSchema,
                orderSchema: generalOrderCategoryOfReportSchema,
                logAction: 'GET_CATEGORY_OF_REPORT_BY_NAME',
                requiresAuth: true,
                requiresAdmin: false,
                errorMessage: 'Erreur lors de la récupération de la catégorie de rapport',
            }
        ),

        searchCategoryOfReportByName : withSecureResolver(
            async (_, { selectedArguments }, context) => {
            // ========================================
            // RECUPERER LES DONNEES NESSESAIRES
            // ========================================
            const { name } = selectedArguments;
            const cleanName = sanitizeStrict(name);
                // Vérifier que la catégorie correspond à une des catégories autorisées (dans les ENUMS)
                const validCategories = ['USER', 'REVIEW', 'MESSAGE', 'OTHER'];
                if (!validCategories.includes(selectedArguments?.category)) {
                    throw new GraphQLError('Catégorie invalide. Les catégories autorisées sont: ' + validCategories.join(', '), {
                        extensions: { code: 'BAD_REQUEST', httpStatus: 400 }
                    });
                }

            // ========================================
            // REQUETES BASE DE DONNEES
            // ======================================== 

            // Requête pour rechercher les catégories de rapport par nom (recherche partielle)
            const query = await db.query(
            `SELECT 
            c.id_report_category, 
            c.name, 
            c.created_at, 
            c.updated_at 
            FROM categoryOfReport c
            WHERE 
            c.name ILIKE $1 
            ORDER BY c.created_at DESC`, 
            [`%${cleanName}%`] 
            ); 

            // Requête pour compter le nombre total de catégories de rapport
            const counterQuery = await db.query('SELECT COUNT(*)::int as count FROM authors');

            // ======================================== 
            // // DONNEES RECUPEREES 
            // ======================================== 

            return { 
                categories: query.rows, 
                totalCount: counterQuery.rows[0].count,
                httpStatus: 200 
            };

            },
            {
                structureSchema: generalCategoryOfReportSchema,
                sortingSchema: generalSortingSchema,
                orderSchema: generalOrderCategoryOfReportSchema, 
                specificSchema: searchCategoryOfReportSchema,
                logAction: 'SEARCH_CATEGORY_OF_REPORTS',
                requiresAuth: true,
                requiresAdmin: false,
                errorMessage: 'Erreur lors de la recherche des catégories de rapports',
            }
        ),

    },
    Mutation: {

        addCategoryOfReport : withSecureResolver(
        async (_, { selectedArguments }, context) => {

            // ========================================
            // RECUPERER LES DONNEES NESSESAIRES
            // ========================================
            const { name } = selectedArguments;
                // Vérifier que la catégorie correspond à une des catégories autorisées (dans les ENUMS)
                const validCategories = ['USER', 'REVIEW', 'MESSAGE', 'OTHER'];
                if (!validCategories.includes(selectedArguments?.category)) {
                    throw new GraphQLError('Catégorie invalide. Les catégories autorisées sont: ' + validCategories.join(', '), {
                        extensions: { code: 'BAD_REQUEST', httpStatus: 400 }
                    });
                }
            // ========================================
            // REQUETES BASE DE DONNEES
            // ========================================
            // Vérifier que le nom de la catégorie de rapport n'existe pas déjà
            const existingCategory = await db.query('SELECT id_report_category FROM categoryOfReport WHERE name = $1', [name] );

            if (existingCategory.rows.length > 0) {
            throw new GraphQLError('Une catégorie de rapport avec ce nom existe déjà', {
            extensions: { code: 'CATEGORY_ALREADY_EXISTS' }
            });
            }


        },
        {
                structureSchema: generalCategoryOfReportSchema,
                sortingSchema: generalSortingSchema,
                orderSchema: generalOrderCategoryOfReportSchema, 
                logAction: 'ADD_CATEGORY_OF_REPORT',
                requiresAuth: true,
                requiresAdmin: true,
                errorMessage: 'Erreur lors de l\'ajout d\'une catégorie de rapport',
        }
        ),

        updateCategoryOfReport : withSecureResolver(
        async (_, { selectedArguments }, context) => {
            // ========================================
            // RECUPERER LES DONNEES NESSESAIRES
            // ========================================

            const { id_categoryOfReport, name } = selectedArguments;

            // Vérifier que la catégorie correspond à une des catégories autorisées (dans les ENUMS)
            const validCategories = ['USER', 'REVIEW', 'MESSAGE', 'OTHER'];

            if (!validCategories.includes(selectedArguments?.category)) {
                throw new GraphQLError('Catégorie invalide. Les catégories autorisées sont: ' + validCategories.join(', '), {
                    extensions: { code: 'BAD_REQUEST', httpStatus: 400 }
                }); 
            }
            // ========================================
            // REQUETES BASE DE DONNEES
            // ========================================
            // Vérifier que la catégorie de rapport existe
            const categoryOfReport = await findBy1ParameterOrThrow('categoryOfReport', 'id_report_category', id_categoryOfReport, 'Catégorie de rapport non trouvée' );

            // Vérifier que le nouveau nom de la catégorie de rapport n'existe pas déjà (s'il est différent)
            if (name && name !== categoryOfReport.name) {
                const existingCategory = await db.query('SELECT id_report_category FROM categoryOfReport WHERE name = $1', [name] );
                if (existingCategory.rows.length > 0) {
                    throw new GraphQLError('Une catégorie de rapport avec ce nom existe déjà', {
                        extensions: { code: 'CATEGORY_ALREADY_EXISTS' }
                    });
                }
            }   
            // ========================================
            // DONNEES RECUPEREES
            // ========================================
            return {
                category: {id_report_category: categoryOfReport.id_report_category, 
                    name: name || categoryOfReport.name, 
                    created_at: categoryOfReport.created_at, 
                    updated_at: new Date() // Mettre à jour la date de mise à jour
                    },
                httpStatus: 200 
            };

        },
        {
                structureSchema: generalCategoryOfReportSchema,
                sortingSchema: generalSortingSchema,
                orderSchema: generalOrderCategoryOfReportSchema, 
                logAction: 'UPDATE_CATEGORY_OF_REPORT',
                requiresAuth: true,
                requiresAdmin: true,
                errorMessage: 'Erreur lors de la mise à jour d\'une catégorie de rapport',
        }
        ),

        deleteCategoryOfReport : withSecureResolver(
        async (_, { selectedArguments }, context) => {
            // ========================================
            // RECUPERER LES DONNEES NESSESAIRES
            // ========================================

            // Nettoyer et valider l'ID de l'auteur
            const { id_categoryOfReport } = selectedArguments;
            const cleanId = sanitizeStrict(id_categoryOfReport);

            // Vérifier que la catégorie correspond à une des catégories autorisées (dans les ENUMS)
            const validCategories = ['USER', 'REVIEW', 'MESSAGE', 'OTHER'];
            if (!validCategories.includes(selectedArguments?.category)) {
            throw new GraphQLError('Catégorie invalide. Les catégories autorisées sont: ' + validCategories.join(', '), {
            extensions: { code: 'BAD_REQUEST', httpStatus: 400 }}); }

            // ========================================
            // REQUETES BASE DE DONNEES
            // ========================================

            // Vérifier que la catégorie de rapport existe
            const categoryOfReport = await findBy1ParameterOrThrow('categoryOfReport', 'id_report_category', cleanId, 'Catégorie de rapport non trouvée' );

            // Supprimer la catégorie de rapport
            await db.query('DELETE FROM categoryOfReport WHERE id_report_category = $1', [cleanId]);

            // ========================================
            // DONNEES RECUPEREES
            // ========================================

            return {deleted: true, httpStatus: 200 }; 

        },
        {
                structureSchema: generalCategoryOfReportSchema,
                sortingSchema: generalSortingSchema,
                orderSchema: generalOrderCategoryOfReportSchema, 
                logAction: 'DELETE_CATEGORY_OF_REPORT',
                requiresAuth: true,
                requiresAdmin: true,
                errorMessage: 'Erreur lors de la suppression d\'une catégorie de rapport',
        }
        ),

    },
    CategoryOfReport: {


    },

};


