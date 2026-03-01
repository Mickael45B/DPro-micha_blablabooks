import db from "../db/connect_DB.js";
import { v4 as uuidv4 } from "uuid";
import { validateOrderParams } from '../utils/validators.js';

import { GraphQLError } from 'graphql';

import { withSecureResolver, generalSortingSchema} from './utils/helper.js';

// Importer les schemas Joi spécifiques
import {
  generalDiscussionsSchema,
  generalOrderDiscussionsSchema,
  searchDiscussionsSchema,
  createDiscussionSchema,
  updateDiscussionSchema,
  deleteDiscussionSchema
} from '../schema/schemas_joi/discussionsSchema.js';
import { sanitizeStrict } from "./utils/helpers/helpers_general.js";

const toDateString = (date) => {
    if (!date) return null;
    if (typeof date === 'string') return date;
    if (date instanceof Date) return date.toISOString().split('T')[0];
    return null;
};

// Validation des ordres valides pour les discussions
const generalValidationOrder = ['created_at', 'id_conversation', 'subject', 'updated_at', 'last_message_at'];

// Validation des ordres valides pour les discussions
const VALID_ORDER_COLUMNS = ['created_at', 'id_conversation', 'subject', 'updated_at', 'last_message_at'];

// ✅ Vérifier qu'un user fait partie d'une discussion
const userIsInDiscussion = async (id_conversation, id_user) => {
  const result = await db.query(`
    SELECT 1 FROM messages
    WHERE subject = $1
      AND (id_sender = $2 OR id_receiver = $2)
    LIMIT 1
  `, [id_conversation, id_user]);
  return result.rows.length > 0;
};

export default {
    Query: {

        getAllDiscussions: withSecureResolver(
        async (_, { validated }, context) => {
            const { limit = 50, offset = 0, direction = 'DESC', order = 'created_at' } = validated || {};
            const { order: safeOrder, direction: safeDirection } = validateOrderParams(order, direction, VALID_ORDER_COLUMNS);

            const [discussions, countResult] = await Promise.all([
            db.query(`
                SELECT 
                    d.id_conversation, 
                    d.subject, 
                    d.created_at, 
                    d.updated_at, 
                    d.last_message_at, 
                    d.is_archived,
                    d.created_by
                FROM discussions d
                ORDER BY ${safeOrder} ${safeDirection}
                LIMIT $1 OFFSET $2
            `, [limit, offset]),

            db.query(`SELECT COUNT(*)::int AS total FROM discussions`)
            ]);

            const totalCount = countResult.rows[0]?.total || 0;

            return {
            discussions: discussions.rows.map(d => ({
                ...d,
                created_at: toDateString(d.created_at),
                updated_at: toDateString(d.updated_at),
                last_message_at: toDateString(d.last_message_at)
            })),
            totalCount,
            hasNextPage: offset + limit < totalCount,
            httpStatus: 200
            };

        },
        {
            structureSchema: generalDiscussionsSchema,
            sortingSchema:   generalSortingSchema,
            orderSchema:     generalOrderDiscussionsSchema,
            logAction:       'GET_ALL_DISCUSSIONS',
            requiresAuth:    true,
            requiresAdmin:   true,
            errorMessage:    'Erreur lors de la récupération des discussions'
        }
        ),

        getUserDiscussions: withSecureResolver(
        async (_, { validated }, context) => {
            //console.log('[getUserDiscussions] Starting...');
            //console.log('[getUserDiscussions] context.user:', context.user);
            //console.log('[getUserDiscussions] validated:', validated);
            
            const { id_user } = context.user; // || {};

            if (!id_user) {
                //console.log('[getUserDiscussions] No id_user, returning empty results');
                return {
                    discussions: [],
                    totalCount: 0,
                    hasNextPage: false,
                    httpStatus: 200
                };
            }

            const { limit = 50, offset = 0, direction = 'DESC', order = 'last_message_at' } = validated || {};
            //console.log('[getUserDiscussions] Parsed params:', { limit, offset, direction, order });
            const { order: safeOrder, direction: safeDirection } = validateOrderParams(order, direction, VALID_ORDER_COLUMNS);

            // ✅ Récupérer les discussions
            const filDiscussions = await db.query(`
                SELECT 
                d.id_conversation,
                d.subject,
                d.created_at,
                d.updated_at,
                d.last_message_at,
                d.is_archived,
                d.created_by
                FROM discussions d
                WHERE EXISTS (
                    SELECT 1 FROM messages m
                    WHERE m.subject = d.id_conversation
                    AND (m.id_sender = $1 OR m.id_receiver = $1)
                )
                ORDER BY d.${safeOrder} ${safeDirection} NULLS LAST
                LIMIT $2 OFFSET $3
            `, [id_user, limit, offset]);

            const countResult = await db.query(`
                SELECT COUNT(DISTINCT d.id_conversation)::int AS total
                FROM discussions d
                WHERE EXISTS (
                    SELECT 1 FROM messages m
                    WHERE m.subject = d.id_conversation
                    AND (m.id_sender = $1 OR m.id_receiver = $1)
                )
            `, [id_user])

            const totalCount = countResult.rows[0]?.total || 0;

            const discussions = (filDiscussions.rows || []).map((row) => ({
                ...row,
                created_at: toDateString(row.created_at),
                updated_at: toDateString(row.updated_at),
                last_message_at: toDateString(row.last_message_at)
            }));
            
            const result = {
                discussions,
                totalCount,
                hasNextPage: offset + limit < totalCount,
                httpStatus: 200
            };
            
            //console.log('[getUserDiscussions] Returning result:', {
                //discussionsCount: result.discussions.length,
                //totalCount: result.totalCount
            //});
            
            return result;

        },
        {
            structureSchema: generalDiscussionsSchema,
            sortingSchema:   generalSortingSchema,
            orderSchema:     generalOrderDiscussionsSchema,
            logAction:       'GET_USER_DISCUSSIONS',
            requiresAuth:    true,
            errorMessage:    "Erreur lors de la récupération des discussions de l'utilisateur"
        }
        ),

        getDiscussionByID: withSecureResolver(
        async (_, { validated }, context) => {


            const { id_conversation } = validated;
            const { id_user } = context.user;

            if (!id_conversation) {
            throw new GraphQLError('id_conversation requis', {
                extensions: { code: 'BAD_REQUEST', httpStatus: 400 }
            });
            }

            // Vérifier accès
            const hasAccess = await userIsInDiscussion(id_conversation, id_user);
            if (!hasAccess) {
            throw new GraphQLError('Discussion non trouvée ou accès refusé', {
                extensions: { code: 'NOT_FOUND', httpStatus: 404 }
            });
            }

            const result = await db.query(`
            SELECT 
                d.id_conversation,
                d.subject,
                d.created_at,
                d.updated_at,
                d.last_message_at,
                d.is_archived,
                d.created_by
            FROM discussions d
            WHERE d.id_conversation = $1
            LIMIT 1
            `, [id_conversation]);

            if (result.rows.length === 0) {
            throw new GraphQLError('Discussion non trouvée', {
                extensions: { code: 'NOT_FOUND', httpStatus: 404 }
            });
            }

            const discussion = result.rows[0];
            return {
                ...discussion,
                created_at: toDateString(discussion.created_at),
                updated_at: toDateString(discussion.updated_at),
                last_message_at: toDateString(discussion.last_message_at)
            };

        },
        {
            structureSchema: generalDiscussionsSchema,
            sortingSchema:   generalSortingSchema,
            orderSchema:     generalOrderDiscussionsSchema,
            logAction:       'GET_USER_DISCUSSIONS',
            requiresAuth:    true,
            errorMessage:    "Erreur lors de la récupération des discussions de l'utilisateur"
        }
        ),

        searchDiscussionsBySubject: withSecureResolver(
            async (_, { validated }, context) => {
                const { subject, limit = 50, offset = 0, direction = 'DESC', order = 'created_at' } = validated || {};
                const { order: safeOrder, direction: safeDirection } = validateOrderParams(order, direction, generalValidationOrder);
                const { id_user } = context.user;

                const [discussions, countResult] = await Promise.all([
                    db.query(`
                        SELECT 
                        d.id_conversation, 
                        d.subject, 
                        d.created_at, 
                        d.updated_at, 
                        d.last_message_at, 
                        d.is_archived,
                        d.created_by
                        FROM discussions d
                        WHERE d.subject ILIKE $1
                        AND EXISTS (
                            SELECT 1 FROM messages m
                            WHERE m.subject = d.id_conversation
                            AND (m.id_sender = $2 OR m.id_receiver = $2)
                        )
                        ORDER BY d.${safeOrder} ${safeDirection}
                        LIMIT $3 OFFSET $4
                    `, [`%${subject}%`, id_user, limit, offset]),

                    db.query(`
                        SELECT COUNT(*)::int AS total
                        FROM discussions d
                        WHERE d.subject ILIKE $1
                        AND EXISTS (
                            SELECT 1 FROM messages m
                            WHERE m.subject = d.id_conversation
                            AND (m.id_sender = $2 OR m.id_receiver = $2)
                        )
                    `, [`%${subject}%`, id_user])
                ]);

                const totalCount = countResult.rows[0]?.total || 0;

                return {
                discussions: discussions.rows,
                totalCount,
                hasNextPage: offset + limit < totalCount,
                httpStatus: 200
                };
            },
            {
                structureSchema: generalDiscussionsSchema,
                specificSchema: searchDiscussionsSchema,
                sortingSchema:   generalSortingSchema,
                orderSchema:     generalOrderDiscussionsSchema,
                logAction:       'SEARCH_DISCUSSIONS',
                requiresAuth:    true,
                errorMessage:    'Erreur lors de la recherche des discussions'
            }
        ),

    },

    Mutation: {

        addDiscussion: withSecureResolver(
            async (_, { validated }, context) => {
                const { subject, recipient_pseudo, content } = validated;
                const { id_user } = context.user;

                //sanitier le sujet pour éviter les injections SQL dans l'ORDER BY
                const sanitizedSubject = sanitizeStrict(subject);

                // Chercher l'utilisateur par pseudo
                const userResults = await db.query(`SELECT id_user FROM users WHERE pseudo = $1`, [recipient_pseudo]);
                if (userResults.rows.length === 0) {
                    throw new GraphQLError(`Utilisateur "${recipient_pseudo}" introuvable`, {
                        extensions: { code: 'NOT_FOUND', httpStatus: 404 }
                    });
                }
                
                const other_user_id = userResults.rows[0].id_user;

                // Empêcher de s'envoyer un message à soi-même
                if (other_user_id === id_user) {
                throw new GraphQLError('Vous ne pouvez pas vous envoyer un message à vous-même', {
                    extensions: { code: 'BAD_REQUEST', httpStatus: 400 }
                });
                }

                // ✅ Vérifier si une discussion avec ce sujet existe déjà entre ces 2 users
                const existing = await db.query(`
                SELECT d.id_conversation
                FROM discussions d
                WHERE d.subject = $1
                    AND EXISTS (
                    SELECT 1 FROM messages m
                    WHERE m.subject = d.id_conversation
                        AND (
                            (m.id_sender = $2 AND m.id_receiver = $3) OR
                            (m.id_sender = $3 AND m.id_receiver = $2)
                        )
                    )
                    LIMIT 1
                `, [sanitizedSubject, id_user, other_user_id]);

                if (existing.rows.length > 0) {
                    throw new GraphQLError('Une discussion avec ce sujet existe déjà avec cet utilisateur', {
                        extensions: { code: 'DUPLICATE', httpStatus: 409 }
                    });
                }

                // ✅ Générer les IDs
                const id_conversation = uuidv4();
                const id_message = uuidv4();

                const now = new Date();

                // ✅ Transaction : créer la discussion ET le premier message
                await db.query('BEGIN');
                try {
                // 1. Créer la discussion
                await db.query(`
                    INSERT INTO discussions (id_conversation, subject, created_by, created_at, updated_at, last_message_at)
                    VALUES ($1, $2, $3, $4, $4, $4)
                `, [id_conversation, subject, id_user, now]);

                // 2. Insérer le premier message
                await db.query(`
                    INSERT INTO messages (id_message, id_sender, id_receiver, subject, content, created_at)
                    VALUES ($1, $2, $3, $4, $5, $6)
                `, [id_message, id_user, other_user_id, id_conversation, content, now]);

                await db.query('COMMIT');
                } catch (err) {
                await db.query('ROLLBACK');
                throw err;
                }

                // Récupérer les infos de l'utilisateur créateur
                const userResult = await db.query(`
                SELECT id_user, pseudo, name FROM users WHERE id_user = $1
                `, [id_user]);

                const createdByUser = userResult.rows[0] || { id_user, pseudo: 'Unknown' };

                return {
                id_conversation,
                subject,
                created_by: createdByUser,
                created_at: toDateString(now),
                updated_at: toDateString(now),
                last_message_at: toDateString(now),
                is_archived: false,
                httpStatus: 201
                };

            },
            {
                structureSchema: createDiscussionSchema,
                sortingSchema:   generalSortingSchema,
                orderSchema:     generalOrderDiscussionsSchema,
                logAction:       'ADD_DISCUSSION',
                requiresAuth:    true,
                errorMessage:    'Erreur lors de la création de la discussion'
            }
        ),

        updateDiscussion: withSecureResolver(
            async (_, { validated }, context) => {

                const { id_conversation, subject, is_archived } = validated;
                const { id_user } = context.user;

                //sanitier le sujet pour éviter les injections SQL dans l'ORDER BY
                const sanitizedSubject = subject ? sanitizeStrict(subject) : null;

                // Vérifier que l'utilisateur fait partie de la discussion
                const hasAccess = await userIsInDiscussion(id_conversation, id_user);
                if (!hasAccess) {
                    throw new GraphQLError('Discussion non trouvée ou accès refusé', {
                        extensions: { code: 'NOT_FOUND', httpStatus: 404 }
                    });
                }

                // vérifier si la discussion existe avant de tenter la mise à jour
                const existing = await db.query(`
                SELECT 1 FROM discussions WHERE id_conversation = $1
                `, [id_conversation]);

                if (existing.rows.length === 0) {
                    throw new GraphQLError('Discussion non trouvée', {
                        extensions: { code: 'NOT_FOUND', httpStatus: 404 }
                    });
                }

                // vérifier que l'utilisateur est le créateur du sujet, seul lui peut modifier le sujet ou archiver la discussion
                const creatorCheck = await db.query(`
                SELECT created_by FROM discussions WHERE id_conversation = $1
                `, [id_conversation]);

                if (creatorCheck.rows.length === 0 || creatorCheck.rows[0].created_by !== id_user) {
                    throw new GraphQLError('Accès refusé : vous n\'êtes pas le créateur de cette discussion', {
                        extensions: { code: 'FORBIDDEN', httpStatus: 403 }
                    });
                }

                const result = await db.query(`
                UPDATE discussions
                SET
                    subject     = COALESCE($2, subject),
                    is_archived = COALESCE($3, is_archived),
                    updated_at  = NOW()
                WHERE id_conversation = $1
                RETURNING *
                `, [id_conversation, sanitizedSubject ?? null, is_archived ?? null]);

                const discussion = result.rows[0];
                return {
                    ...discussion,
                    created_at: toDateString(discussion.created_at),
                    updated_at: toDateString(discussion.updated_at),
                    last_message_at: toDateString(discussion.last_message_at)
                };

            },
            {
                structureSchema: generalDiscussionsSchema,
                sortingSchema:   generalSortingSchema,
                orderSchema:     generalOrderDiscussionsSchema,
                logAction:       'UPDATE_DISCUSSION',
                requiresAuth:    true,
                errorMessage:    'Erreur lors de la mise à jour de la discussion'
            }
        ),

        deleteDiscussion: withSecureResolver(
            async (_, { validated }, context) => {
                const { id_conversation } = validated;
                const { id_user } = context.user;

                // Vérifier que l'utilisateur fait partie de la discussion
                const hasAccess = await userIsInDiscussion(id_conversation, id_user);
                if (!hasAccess) {
                    throw new GraphQLError('Discussion non trouvée ou accès refusé', {
                        extensions: { code: 'NOT_FOUND', httpStatus: 404 }
                    });
                }

                // Suppression de la discussion (les messages ont subject = NULL via ON DELETE SET NULL)
                await db.query(`
                DELETE FROM discussions WHERE id_conversation = $1
                `, [id_conversation]);

                return true; // ✅ Mutation retourne Boolean! dans le schéma
                
            },
            {
                    structureSchema: generalDiscussionsSchema,
                    sortingSchema:   generalSortingSchema,
                    orderSchema:     generalOrderDiscussionsSchema,
                    logAction:       'DELETE_DISCUSSION',
                    requiresAuth:    true,
                    errorMessage:    'Erreur lors de la suppression de la discussion'
            }
        ),

    },

    Discussion: {

        // ✅ Récupère les messages de la discussion
        //    via la FK messages.subject = discussions.id_conversation
        messages: async (parent) => {
            const result = await db.query(`
                SELECT
                m.id_message,
                m.id_sender,
                m.id_receiver,
                m.subject,
                m.content,
                m.is_read,
                m.created_at,
                m.updated_at
                FROM messages m
                WHERE m.subject = $1
                ORDER BY m.created_at ASC
                `, [parent.id_conversation]
            );

            return result.rows.map(m => ({
                ...m,
                created_at: toDateString(m.created_at),
                updated_at: toDateString(m.updated_at)
            }));

        },

        created_by: async (parent) => {
        if (!parent.created_by) return null;
        
        const result = await db.query(`
            SELECT id_user, pseudo, name, email
            FROM users
            WHERE id_user = $1
        `, [parent.created_by]);

        return result.rows[0] || null;
        }
    }

}
