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
    generalReasonOfReportSchema, 
    generalOrderReasonOfReportSchema, 
    viewAllReasonsOfReportSchema, 
    viewReasonOfReportByID, 
    searchReasonOfReportSchema, 
    createReasonOfReportSchema, 
    updateReasonOfReportSchema, 
    deleteReasonOfReportSchema 
} from '../schema/schemas_joi/reaseonOfReportSchema.js';
// Importer les wrappers et helpers de sécurité
import { sanitizeStrict} from './utils/helpers/helpers_securite.js';
import { get } from "http";

// ========================================
// RESOLVERS POUR LES RAISONS DE RAPPORT
// ======================================== 
export default {
    Query: {

        getAllReasonsOfReport : withSecureResolver(
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
                const validReasons = [
                    'HARASSMENT_INSULTING_LANGUAGE',
                    'HATEFUL_DISCRIMINATORY_CONTENT',
                    'SPAM_UNSOLICITED_ADVERTISING',
                    'IMPERSONATION',
                    'SPREAD_OF_FALSE_INFORMATION',
                    'SHARING_OF_PERSONAL_INFORMATION_DOXING',
                    'THREATS_CALLS_FOR_VIOLENCE',
                    'PORNOGRAPHY_EXPLICIT_SEXUAL_CONTENT',
                    'INAPPROPRIATE_CONTENT_FOR_MINORS',
                    'COPYRIGHT_INFRINGEMENT',
                    'SCAM_ATTEMPTED_FRAUD', 
                    'AGGRESSIVE_BEHAVIOR_IN_PRIVATE_MESSAGES',
                    'DEFAMATORY_COMMENT',
                    'REPEATED_TARGETED_HARASSMENT',
                    'POSTING_OF_BANKING_SENSITIVE_INFORMATION',
                    'OFFENSIVE_CONTENT_RELATED_TO_RELIGION',
                    'VIOLATION_OF_COMMUNITY_RULES',
                    'NON_COMPLIANCE_WITH_TERMS_OF_SERVICE',
                    'MISLEADING_CONTENT',
                    'OTHER_SPECIFY_IN_DETAILS'
                ];

                if (!validReasons.includes(selectedArguments?.reason)) {
                    throw new GraphQLError('Raison invalide. Les raisons autorisées sont: ' + validReasons.join(', '), {
                        extensions: { code: 'BAD_REQUEST', httpStatus: 400 }
                    });
                }

                // ========================================
                // REQUETES BASE DE DONNEES
                // ======================================== 

                // Construire la requête SQL avec le tri validé
                const query = await db.query(
                    `SELECT 
                    r.id_report_reason,
                    r.name,
                    r.created_at,
                    r.updated_at
                    FROM reasonOfReport r
                    ORDER BY ${safeOrder} ${safeDirection} 
                    LIMIT $1 
                    OFFSET $2`,
                    [limit, offset]            
                );

                // ========================================
                // DONNEES RECUPEREES
                // ========================================

                // Requête pour compter le nombre total de catégories de rapport
                const counterQuery = await db.query('SELECT COUNT(*)::int as count FROM reasonOfReport');
                        
                return {
                    reasons: query.rows,
                    totalCount: counterQuery.rows[0].count,
                    httpStatus: 200
                };
                
            },
            {
                structureSchema: generalReasonOfReportSchema,
                sortingSchema: generalSortingSchema,
                orderSchema: generalOrderReasonOfReportSchema,
                logAction: 'REMOVE_REASONS_OF_REPORT_FROM_BOOK',
                requiresAuth: true,
                requiresAdmin: false,
                errorMessage: 'Erreur lors de la suppression des raisons de rapport',
            }
        ),

        getReasonOfReportByID : withSecureResolver(
            async (_, { selectedArguments }, context) => {

                // ========================================
                // RECUPERER LES DONNEES NESSESAIRES
                // ========================================

                // Nettoyer et valider l'ID de la raison de rapport
                const { id_reasonOfReport } = selectedArguments;
                const cleanId = sanitizeStrict(id_reasonOfReport);

                // Vérifier que la raisons correspond à une des raisons autorisées (dans les ENUMS)
                const validReasons = [
                    'HARASSMENT_INSULTING_LANGUAGE',
                    'HATEFUL_DISCRIMINATORY_CONTENT',
                    'SPAM_UNSOLICITED_ADVERTISING',
                    'IMPERSONATION',
                    'SPREAD_OF_FALSE_INFORMATION',
                    'SHARING_OF_PERSONAL_INFORMATION_DOXING',
                    'THREATS_CALLS_FOR_VIOLENCE',
                    'PORNOGRAPHY_EXPLICIT_SEXUAL_CONTENT',
                    'INAPPROPRIATE_CONTENT_FOR_MINORS',
                    'COPYRIGHT_INFRINGEMENT',
                    'SCAM_ATTEMPTED_FRAUD', 
                    'AGGRESSIVE_BEHAVIOR_IN_PRIVATE_MESSAGES',
                    'DEFAMATORY_COMMENT',
                    'REPEATED_TARGETED_HARASSMENT',
                    'POSTING_OF_BANKING_SENSITIVE_INFORMATION',
                    'OFFENSIVE_CONTENT_RELATED_TO_RELIGION',
                    'VIOLATION_OF_COMMUNITY_RULES',
                    'NON_COMPLIANCE_WITH_TERMS_OF_SERVICE',
                    'MISLEADING_CONTENT',
                    'OTHER_SPECIFY_IN_DETAILS'
                ];

                if (!validReasons.includes(selectedArguments?.reason)) {
                    throw new GraphQLError('Raison invalide. Les raisons autorisées sont: ' + validReasons.join(', '), {
                        extensions: { code: 'BAD_REQUEST', httpStatus: 400 }
                    });
                }

                // ========================================
                // REQUETES BASE DE DONNEES
                // ========================================

                // Vérifier que la raison de rapport existe
                const reasonOfReport = await findBy1ParameterOrThrow('reasonOfReport', 'id_report_reason', cleanId, 'Raison de rapport non trouvée' ); 

                // ========================================
                // DONNEES RECUPEREES
                // ========================================
                
                return { 
                    reason: reasonOfReport, 
                    httpStatus: 200
                }; 

            },
            {
                structureSchema: generalReasonOfReportSchema,
                sortingSchema: generalSortingSchema,
                orderSchema: generalOrderReasonOfReportSchema,
                logAction: 'GET_REASON_OF_REPORT_BY_ID',
                requiresAuth: true,
                requiresAdmin: false,
                errorMessage: 'Erreur lors de la récupération de la raison de rapport',
            }
        ),

        getReasonOfReportByName : withSecureResolver(
            async (_, { selectedArguments }, context) => {
                // ========================================
                // RECUPERER LES DONNEES NESSESAIRES
                // ========================================

                // Nettoyer et valider l'ID de l'auteur
                const { nameReason } = selectedArguments;
                const cleanName = sanitizeStrict(nameReason);
                // Vérifier que la catégorie correspond à une des catégories autorisées (dans les ENUMS)
                const validReasons = [
                    'HARASSMENT_INSULTING_LANGUAGE',
                    'HATEFUL_DISCRIMINATORY_CONTENT',
                    'SPAM_UNSOLICITED_ADVERTISING',
                    'IMPERSONATION',
                    'SPREAD_OF_FALSE_INFORMATION',
                    'SHARING_OF_PERSONAL_INFORMATION_DOXING',
                    'THREATS_CALLS_FOR_VIOLENCE',
                    'PORNOGRAPHY_EXPLICIT_SEXUAL_CONTENT',
                    'INAPPROPRIATE_CONTENT_FOR_MINORS',
                    'COPYRIGHT_INFRINGEMENT',
                    'SCAM_ATTEMPTED_FRAUD', 
                    'AGGRESSIVE_BEHAVIOR_IN_PRIVATE_MESSAGES',
                    'DEFAMATORY_COMMENT',
                    'REPEATED_TARGETED_HARASSMENT',
                    'POSTING_OF_BANKING_SENSITIVE_INFORMATION',
                    'OFFENSIVE_CONTENT_RELATED_TO_RELIGION',
                    'VIOLATION_OF_COMMUNITY_RULES',
                    'NON_COMPLIANCE_WITH_TERMS_OF_SERVICE',
                    'MISLEADING_CONTENT',
                    'OTHER_SPECIFY_IN_DETAILS'
                ];
                if (!validReasons.includes(selectedArguments?.nameReason)) {
                    throw new GraphQLError('Raison invalide. Les raisons autorisées sont: ' + validReasons.join(', '), {
                        extensions: { code: 'BAD_REQUEST', httpStatus: 400 }
                    });
                }


                // ========================================
                // REQUETES BASE DE DONNEES
                // ========================================

                // Vérifier que la catégorie de rapport existe
                const reasonOfReport = await findBy1ParameterOrThrow('reasonOfReport', 'name', cleanName, 'Raison de rapport non trouvée' ); 

                // ========================================
                // DONNEES RECUPEREES
                // ========================================
                
                return { 
                    reason: reasonOfReport, 
                    httpStatus: 200
                }; 

            },
            {
                structureSchema: generalReasonOfReportSchema,
                sortingSchema: generalSortingSchema,
                orderSchema: generalOrderReasonOfReportSchema,
                logAction: 'GET_REASON_OF_REPORT_BY_NAME',
                requiresAuth: true,
                requiresAdmin: false,
                errorMessage: 'Erreur lors de la récupération de la raison de rapport',
            }
        ),

        searchReasonOfReportByName : withSecureResolver(
            async (_, { selectedArguments }, context) => {
            // ========================================
            // RECUPERER LES DONNEES NESSESAIRES
            // ========================================
            const { name } = selectedArguments;
            const cleanName = sanitizeStrict(name);

            // ========================================
            // REQUETES BASE DE DONNEES
            // ======================================== 

            // Requête pour rechercher les raisons de rapport par nom (recherche partielle)
            const query = await db.query(
            `SELECT 
            r.id_reason_of_report , 
            r.name, 
            r.created_at, 
            r.updated_at 
            FROM reasonOfReport r
            WHERE 
            r.name ILIKE $1 
            ORDER BY r.created_at DESC`, 
            [`%${cleanName}%`] 
            ); 

            // Requête pour compter le nombre total de catégories de rapport
            const counterQuery = await db.query('SELECT COUNT(*)::int as count FROM reasonOfReport WHERE name ILIKE $1', [`%${cleanName}%`]);

            // ======================================== 
            // // DONNEES RECUPEREES 
            // ======================================== 

            return { 
                reason: query.rows, 
                totalCount: counterQuery.rows[0].count,
                httpStatus: 200 
            };

            }, 
            {
                structureSchema: generalReasonOfReportSchema,
                sortingSchema: generalSortingSchema,
                orderSchema: generalOrderReasonOfReportSchema, 
                specificSchema: searchReasonOfReportSchema,
                logAction: 'SEARCH_REASON_OF_REPORTS',
                requiresAuth: true,
                requiresAdmin: false,
                errorMessage: 'Erreur lors de la recherche des raisons de rapports',
            }
        ),

    },
    Mutation: {

        addReasonOfReport : withSecureResolver(
        async (_, { selectedArguments }, context) => {

            // ========================================
            // RECUPERER LES DONNEES NESSESAIRES
            // ========================================
            const { name } = selectedArguments;
                // Vérifier que la catégorie correspond à une des catégories autorisées (dans les ENUMS)
                const validReasons = [
                    'HARASSMENT_INSULTING_LANGUAGE',
                    'HATEFUL_DISCRIMINATORY_CONTENT',
                    'SPAM_UNSOLICITED_ADVERTISING',
                    'IMPERSONATION',
                    'SPREAD_OF_FALSE_INFORMATION',
                    'SHARING_OF_PERSONAL_INFORMATION_DOXING',
                    'THREATS_CALLS_FOR_VIOLENCE',
                    'PORNOGRAPHY_EXPLICIT_SEXUAL_CONTENT',
                    'INAPPROPRIATE_CONTENT_FOR_MINORS',
                    'COPYRIGHT_INFRINGEMENT',
                    'SCAM_ATTEMPTED_FRAUD', 
                    'AGGRESSIVE_BEHAVIOR_IN_PRIVATE_MESSAGES',
                    'DEFAMATORY_COMMENT',
                    'REPEATED_TARGETED_HARASSMENT',
                    'POSTING_OF_BANKING_SENSITIVE_INFORMATION',
                    'OFFENSIVE_CONTENT_RELATED_TO_RELIGION',
                    'VIOLATION_OF_COMMUNITY_RULES',
                    'NON_COMPLIANCE_WITH_TERMS_OF_SERVICE',
                    'MISLEADING_CONTENT',
                    'OTHER_SPECIFY_IN_DETAILS'
                ];
                if (!validReasons.includes(selectedArguments?.reason)) {
                    throw new GraphQLError('Raison invalide. Les raisons autorisées sont: ' + validReasons.join(', '), {
                        extensions: { code: 'BAD_REQUEST', httpStatus: 400 }
                    });
                }
            // ========================================
            // REQUETES BASE DE DONNEES
            // ========================================
            // Vérifier que le nom de la raison de rapport n'existe pas déjà
            const existingReason = await db.query('SELECT id_reason FROM reasonOfReport WHERE name = $1', [name] );

            let insertQuery;

            if (existingReason.rows.length > 0) {
            throw new GraphQLError('Une raison de rapport avec ce nom existe déjà', {
            extensions: { code: 'REASON_ALREADY_EXISTS' }
            });
            }else {
                // Insérer la nouvelle raison de rapport dans la base de données
                const newReasonId = uuidv4();
                let insertQuery = await db.query(
                    `INSERT INTO reasonOfReport (id_reason_of_report, name, created_at) 
                    VALUES ($1, $2, $3) 
                    RETURNING id_reason_of_report, name, created_at, updated_at`, 
                    [newReasonId, name, new Date()]
                );
            }

            return {
                reason: insertQuery.rows[0], 
                httpStatus: 201
            };

        },
        {
                structureSchema: generalReasonOfReportSchema,
                sortingSchema: generalSortingSchema,
                orderSchema: generalOrderReasonOfReportSchema, 
                logAction: 'ADD_REASON_OF_REPORT',
                requiresAuth: true,
                requiresAdmin: true,
                errorMessage: 'Erreur lors de l\'ajout d\'une raison de rapport',
        }
        ),

        updateReasonOfReport : withSecureResolver(
        async (_, { selectedArguments }, context) => {
            // ========================================
            // RECUPERER LES DONNEES NESSESAIRES
            // ========================================

            const { id_reasonOfReport, name } = selectedArguments;

            // Vérifier que la raison correspond à une des raisons autorisées (dans les ENUMS)
                const validReasons = [
                    'HARASSMENT_INSULTING_LANGUAGE',
                    'HATEFUL_DISCRIMINATORY_CONTENT',
                    'SPAM_UNSOLICITED_ADVERTISING',
                    'IMPERSONATION',
                    'SPREAD_OF_FALSE_INFORMATION',
                    'SHARING_OF_PERSONAL_INFORMATION_DOXING',
                    'THREATS_CALLS_FOR_VIOLENCE',
                    'PORNOGRAPHY_EXPLICIT_SEXUAL_CONTENT',
                    'INAPPROPRIATE_CONTENT_FOR_MINORS',
                    'COPYRIGHT_INFRINGEMENT',
                    'SCAM_ATTEMPTED_FRAUD', 
                    'AGGRESSIVE_BEHAVIOR_IN_PRIVATE_MESSAGES',
                    'DEFAMATORY_COMMENT',
                    'REPEATED_TARGETED_HARASSMENT',
                    'POSTING_OF_BANKING_SENSITIVE_INFORMATION',
                    'OFFENSIVE_CONTENT_RELATED_TO_RELIGION',
                    'VIOLATION_OF_COMMUNITY_RULES',
                    'NON_COMPLIANCE_WITH_TERMS_OF_SERVICE',
                    'MISLEADING_CONTENT',
                    'OTHER_SPECIFY_IN_DETAILS'
                ];
                
            if (!validReasons.includes(selectedArguments?.reason)) {
                throw new GraphQLError('Raison invalide. Les raisons autorisées sont: ' + validReasons.join(', '), {
                    extensions: { code: 'BAD_REQUEST', httpStatus: 400 }
                }); 
            }
            // ========================================
            // REQUETES BASE DE DONNEES
            // ========================================
            // Vérifier que la raison de rapport existe
            const reasonOfReport = await findBy1ParameterOrThrow('reasonOfReport', 'id_reason_of_report', id_reasonOfReport, 'Raison de rapport non trouvée' );
            let updateQuery;
            // Vérifier que le nouveau nom de la raison de rapport n'existe pas déjà (s'il est différent)
            if (name && name !== reasonOfReport.name) {
                const existingReason = await db.query('SELECT id_reason_of_report FROM reasonOfReport WHERE name = $1', [name] );
                if (existingReason.rows.length > 0) {
                    throw new GraphQLError('Une raison de rapport avec ce nom existe déjà', {
                        extensions: { code: 'REASON_ALREADY_EXISTS' }
                    });
                }else {
                    // Mettre à jour le nom de la raison de rapport dans la base de données
                    updateQuery = await db.query(
                        `UPDATE reasonOfReport 
                        SET name = $1, updated_at = $2 
                        WHERE id_reason_of_report = $3`, 
                        [name, new Date(), id_reasonOfReport]
                    );
                }
            }   
            // ========================================
            // DONNEES RECUPEREES
            // ========================================
            return {
                reason: {id_reason_of_report: reasonOfReport.id_reason_of_report, 
                    name: name || reasonOfReport.name, 
                    created_at: reasonOfReport.created_at, 
                    updated_at: updateQuery ? new Date() : reasonOfReport.updated_at // Mettre à jour la date de mise à jour si une mise à jour a été effectuée
                    },
                httpStatus: 200 
            };

        },
        {
                structureSchema: generalReasonOfReportSchema,
                sortingSchema: generalSortingSchema,
                orderSchema: generalOrderReasonOfReportSchema, 
                logAction: 'UPDATE_REASON_OF_REPORT',
                requiresAuth: true,
                requiresAdmin: true,
                errorMessage: 'Erreur lors de la mise à jour d\'une raison de rapport',
        }
        ),

        deleteReasonOfReport : withSecureResolver(
        async (_, { selectedArguments }, context) => {
            // ========================================
            // RECUPERER LES DONNEES NESSESAIRES
            // ========================================

            // Nettoyer et valider l'ID de l'auteur
            const { id_categoryOfReport } = selectedArguments;
            const cleanId = sanitizeStrict(id_categoryOfReport);

            // Vérifier que la catégorie correspond à une des catégories autorisées (dans les ENUMS)
                const validReasons = [
                    'HARASSMENT_INSULTING_LANGUAGE',
                    'HATEFUL_DISCRIMINATORY_CONTENT',
                    'SPAM_UNSOLICITED_ADVERTISING',
                    'IMPERSONATION',
                    'SPREAD_OF_FALSE_INFORMATION',
                    'SHARING_OF_PERSONAL_INFORMATION_DOXING',
                    'THREATS_CALLS_FOR_VIOLENCE',
                    'PORNOGRAPHY_EXPLICIT_SEXUAL_CONTENT',
                    'INAPPROPRIATE_CONTENT_FOR_MINORS',
                    'COPYRIGHT_INFRINGEMENT',
                    'SCAM_ATTEMPTED_FRAUD', 
                    'AGGRESSIVE_BEHAVIOR_IN_PRIVATE_MESSAGES',
                    'DEFAMATORY_COMMENT',
                    'REPEATED_TARGETED_HARASSMENT',
                    'POSTING_OF_BANKING_SENSITIVE_INFORMATION',
                    'OFFENSIVE_CONTENT_RELATED_TO_RELIGION',
                    'VIOLATION_OF_COMMUNITY_RULES',
                    'NON_COMPLIANCE_WITH_TERMS_OF_SERVICE',
                    'MISLEADING_CONTENT',
                    'OTHER_SPECIFY_IN_DETAILS'
                ];
            if (!validReasons.includes(selectedArguments?.reason)) {
            throw new GraphQLError('Raison invalide. Les raisons autorisées sont: ' + validReasons.join(', '), {
            extensions: { code: 'BAD_REQUEST', httpStatus: 400 }}); }

            // ========================================
            // REQUETES BASE DE DONNEES
            // ========================================

            // Vérifier que la raison de rapport existe
            const reasonOfReport = await findBy1ParameterOrThrow('reasonOfReport', 'id_reason_of_report', cleanId, 'Raison de rapport non trouvée' );
            
            if (!reasonOfReport) {
                throw new GraphQLError('Raison de rapport non trouvée', {
                    extensions: { code: 'REASON_NOT_FOUND', httpStatus: 404 }
                });
            } else {
                // Supprimer la raison de rapport
                await db.query('DELETE FROM reasonOfReport WHERE id_reason_of_report = $1', [cleanId]);
            }
            // ========================================
            // DONNEES RECUPEREES
            // ========================================

            return {deleted: true, httpStatus: 200 }; 

        },
        {
                structureSchema: generalReasonOfReportSchema,
                sortingSchema: generalSortingSchema,
                orderSchema: generalOrderReasonOfReportSchema, 
                logAction: 'DELETE_REASON_OF_REPORT',
                requiresAuth: true,
                requiresAdmin: true,
                errorMessage: 'Erreur lors de la suppression d\'une raison de rapport',
        }
        ),

    },
    ReasonOfReport: {


    },

};


