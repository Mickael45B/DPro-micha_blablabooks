// Ensemble des resolvers liés à la page d'accueil (homePage) de l'application.

import db from "../db/connect_DB.js";
import { v4 as uuidv4 } from 'uuid';
import { validateOrderParams, handleDbError } from '../utils/validators.js';
import sanitizeHtml from 'sanitize-html';
import { GraphQLError } from 'graphql';
// import { isAuthenticated, requireAuth, requireAdmin, requireOwnershipOrAdmin, sanitizeInput } from './utils/helpers/helpers_general.js';
import { isAuthenticated, requireAuth, requireAdmin, requireOwnershipOrAdmin, sanitizeInput, flattenEdges, makePageInfo, makeEdgeFromBook, withErrorHandling  } from './utils/helpers/helpers_general.js';


import { validate as uuidValidate } from 'uuid';

// Importer les helpers généralistes
import { withSecureResolver } from './utils/helpers/helpers_general.js';

// Importer les schemas Joi spécifiques
import { generalBookSchema, generalOrderBookSchema} from '../schema/schemas_joi/bookSchema.js';
import { generalReviewSchema, generalOrderReviewSchema} from '../schema/schemas_joi/reviewSchema.js';
import { generalUserSchema, generalOrderUserSchema} from '../schema/schemas_joi/userSchema.js';

// Importer les wrappers et helpers de sécurité
import { sanitizeStrict} from './utils/helpers/helpers_securite.js';

import { generalSortingSchema } from './utils/helper.js';







export default {
  Query: {



    getTotalBooksCount: withSecureResolver(
        async () => {

        const countResult = await db.query('SELECT COUNT(*)::int as count FROM books');
        const totalCount = countResult.rows[0].count;
        return totalCount;

        },
        {
            structureSchema: generalBookSchema,
            sortingSchema: generalSortingSchema,
            orderSchema: generalOrderBookSchema,  
            logAction: 'getTotalBooksCount',
            requireAuth: false,
            requireAdmin: false,
            errorMessage: 'Erreur lors de la récupération du nombre total de livres'
        }
    ),

    getTotalUsersCount: withSecureResolver(
        async () => {

            const countResult = await db.query("SELECT COUNT(*)::int as count FROM users");
            const totalCount = countResult.rows[0].count;
            return totalCount;

        },
        {
            structureSchema: generalUserSchema,
            sortingSchema: generalSortingSchema,
            orderSchema: generalOrderUserSchema,  
            logAction: 'getTotalUsersCount',
            requireAuth: false,
            requireAdmin: false,
            errorMessage: 'Erreur lors de la récupération du nombre total d\'utilisateurs'
        }
    ),

    getTotalReviewsCount: withSecureResolver(
        async () => {

            const countResult = await db.query("SELECT COUNT(*)::int as count FROM reviews");
            const totalCount = countResult.rows[0].count;
            return totalCount;
        },
        {
            structureSchema: generalReviewSchema,
            sortingSchema: generalSortingSchema,
            orderSchema: generalOrderReviewSchema,  
            logAction: 'getTotalReviewsCount',
            requireAuth: false,
            requireAdmin: false,
            errorMessage: 'Erreur lors de la récupération du nombre total de commentaires'
        }
    ),
  },
  Mutation: {
  },










};