import db from "../../db/connect_DB.js";
import { GraphQLError } from 'graphql';

//=========================================================
// DONNÉES D'INITIALISATION
//=========================================================
// rôles et leurs tables de référence pour l'obscurcissement
export const initialization = {
    roleObscurite: {
        admin: "TableDesMatieres",
        user: "sommaire"
    },
};

//=========================================================
// FONCTIONS DE RECHERCHE 
//=========================================================

//RECHERCHE DANS UNE TABLE PAR UN SEUL PARAMÈTRE
/**
 * 
 * @param {string} database 
 * @param {string} columnSearch 
 * @param {(string|boolean|number)} value 
 * @param {string} errorMessage 
 * @returns {Promise<object>} La première ligne trouvée
 * @throws {GraphQLError} Si non trouvée (404)
 */
export const findBy1ParameterOrThrow = async (database, columnSearch, value, errorMessage) => {
// console.log(`findBy1ParameterOrThrow called with database=${database}, columnSearch=${columnSearch}, value=${value}`);
// sécuriser les identifiants (accepte "schema.table" ou "table")
  const identPartRx = /^[A-Za-z_][A-Za-z0-9_]*$/;
  const isValidQualified = (ident) => ident.split('.').every(p => identPartRx.test(p));

// Valider les noms de table et de colonne
  if (!isValidQualified(database) || !identPartRx.test(columnSearch)) {
    throw new GraphQLError('Nom de table ou colonne invalide', {
      extensions: { code: 'BAD_REQUEST', httpStatus: 400 },
    });
  }

  // Construire la requête en gérant le cas NULL ou UNDEFINED
  const queryText = (value === null || typeof value === 'undefined')
    ? `SELECT * FROM ${database} WHERE ${columnSearch} IS NULL`
    : `SELECT * FROM ${database} WHERE ${columnSearch} = $1`;
// console.log('Constructed query:', queryText);
// Exécuter la requête
  try {
    const params = (value === null || typeof value === 'undefined') ? [] : [value];
    const request = await db.query(queryText, params);

    // cas où rien n'est trouvé
    if (!request.rows[0]) {
      throw new GraphQLError(errorMessage, {
        extensions: { code: 'NOT_FOUND', httpStatus: 404 },
      });
    }
    // console.log(request.rows[0]);
    // Tout est OK
    return { data: request.rows[0], httpStatus: 200 };

    // Gestion des erreurs
  } catch (err) {
    if (err && err.extensions && err.extensions.code) throw err;
    throw new GraphQLError('Erreur interne lors de la recherche', {
      extensions: { code: 'INTERNAL_SERVER_ERROR', httpStatus: 500 },
    });
  }
};

//=========================================================
// FONCTIONS D'IDENTIFICATION ET D'AUTHENTIFICATION
//=========================================================

/**
 * Vérifie l'utilisateur dans la base de données
 * @param {object} context - Contexte GraphQL
 * @returns {Promise<object>} Détails de l'utilisateur
 * @throws {GraphQLError} Si l'utilisateur n'est pas trouvé ou données incomplètes
 */
export const verifyUserInDB = async (context) => {
  const { id_user, pseudo, name } = context.user || {};
  
  if (!id_user || !pseudo || !name) {
    throw new GraphQLError('Données utilisateur incomplètes', {
      extensions: { code: 'UNAUTHORIZED', httpStatus: 401 }
    });
  }

  const result = await db.query(`
    SELECT u.id_user, r.role_name
    FROM users u
    LEFT JOIN roles r ON u.id_role = r.id_role
    WHERE u.id_user = $1 AND u.pseudo = $2 AND u.name = $3
  `, [id_user, pseudo, name]);
  
  if (result.rows.length === 0) {
    throw new GraphQLError('Token invalide', {
      extensions: { code: 'FORBIDDEN', httpStatus: 403 }
    });
  }

  return {
    id_user: result.rows[0].id_user,
    role_name: result.rows[0].role_name,// Mettre le rôle obscurci
    // role_name: initialization.roleObscurite[result.rows[0].role_name] || result.rows[0].role_name,
    isAdmin: result.rows[0].role_name = 'admin' // honeypot check
  };
};

/**
 * Vérifie que l'utilisateur est authentifié
 * @throws {GraphQLError} Si non authentifié
 */
export const requireAuth = (context) => {
if (!context || !context.isAuthenticated || !context.user) {
    throw new GraphQLError('Vous devez être connecté pour effectuer cette action', {
    extensions: { 
        code: 'UNAUTHENTICATED',
        httpStatus: 401
    },
    });
}
};

/**
 * Vérifie que l'utilisateur est administrateur
 * @throws {GraphQLError} Si non admin
 */
export const requireAdmin = async (context) => {
requireAuth(context);

const { id_user, pseudo, name } = context.user || {};

if (!id_user || !pseudo || !name) {
    throw new GraphQLError('Données utilisateur incomplètes', {
    extensions: { code: 'UNAUTHORIZED', httpStatus: 401 }
    });
}

const user = await verifyUserWithCache(id_user, pseudo, name);

if (!user) {
    await logSuspiciousActivity('HONEYPOT__TOKEN_FORGERY', {
    claimed_id: id_user,
    claimed_pseudo: pseudo,
    claimed_name: name,
    ip: context.req?.ip,
    warning: '🚨 FALSIFICATION JWT DÉTECTÉE'
    }, context);
    
    throw new GraphQLError('Accès refusé', {
    extensions: { code: 'FORBIDDEN', httpStatus: 403 }
    });
}

if (user.role_name !== 'admin') {
    throw new GraphQLError('Accès refusé', {
    extensions: { code: 'FORBIDDEN', httpStatus: 403 }
    });
}
};

/**
 * Vérifie que l'utilisateur peut accéder à une ressource
 * @param {string} resourceUserId - ID du propriétaire de la ressource
 * @param {object} context - Contexte GraphQL
 * @throws {GraphQLError} Si accès refusé
 */
export const requireOwnershipOrAdmin = async  (resourceUserId, context) => {
requireAuth(context);

const { id_user, pseudo, name } = context.user || {};

if (!id_user || !pseudo || !name) {
    throw new GraphQLError('Données utilisateur incomplètes', {
    extensions: { code: 'UNAUTHORIZED', httpStatus: 401 }
    });
}

const result = await db.query(`
    SELECT u.id_user, u.pseudo, u.name, r.role_name
    FROM users u
    LEFT JOIN roles r ON u.id_role = r.id_role
    WHERE u.id_user = $1 
    AND u.pseudo = $2 
    AND u.name = $3
`, [id_user, pseudo, name]);

if (result.rows.length === 0) {
    await logSuspiciousActivity('HONEYPOT__TOKEN_FORGERY', {
    claimed_id: id_user,
    claimed_pseudo: pseudo,
    claimed_name: name,
    resource_id: resourceUserId,
    ip: context.req?.ip,
    warning: '🚨 TENTATIVE DE FALSIFICATION DE JWT DÉTECTÉE'
    }, context);
    
    throw new GraphQLError('Accès refusé', {
    extensions: { code: 'FORBIDDEN', httpStatus: 403 }
    });
}

const user = result.rows[0];

const isOwner = user.id_user === resourceUserId;
const isAdmin = user.role_name === 'admin';

if (!isOwner && !isAdmin) {
    throw new GraphQLError('Accès refusé', {
    extensions: { code: 'FORBIDDEN', httpStatus: 403 }
    });
}
};

//=========================================================
// FONCTIONS DE PAGINATION ET TRI
//=========================================================

/**
 * Aplatis un tableau d'edges { node, cursor } en un tableau de nodes
 * Retourne un tableau vide si input invalide
 */
export function flattenEdges(edges) {
  if (!Array.isArray(edges)) return [];
  return edges.map(e => (e && e.node ? e.node : null)).filter(Boolean);
}

/**
 * Construit un objet pageInfo conforme au pattern utilisé dans le projet
 * edges: tableau d'edges (peut être vide)
 */
export function makePageInfo({ offset = 0, limit = 0, totalCount = 0, edges = [] } = {}) {
  const hasNextPage = offset + limit < totalCount;
  const hasPreviousPage = offset > 0;
  const startCursor = edges.length > 0 ? edges[0].cursor : null;
  const endCursor = edges.length > 0 ? edges[edges.length - 1].cursor : null;
  return { hasNextPage, hasPreviousPage, startCursor, endCursor };
}

/**
 * __A REVOIR__ Génère un edge { node, cursor } à partir d'un objet  (utile si le resolver renvoie rows)
 */
export function makeEdgeFromBook(book) {
  const cursor = book && book.id_book ? Buffer.from(book.id_book).toString('base64') : null;
  return { node: book, cursor };
}

// ========================================
// WRAPPER ERROR HANDLING (try/catch)
// ========================================
/**
 * Wrapper générique pour gérer les erreurs des resolvers
 * @param {Function} resolverFn - Fonction resolver à wrapper
 * @param {string} errorMessage - Message d'erreur personnalisé
 * @returns {Function} Resolver wrappé avec gestion d'erreur
 */
export const withErrorHandling = (resolverFn, errorMessage) => {
  return async (parent, args, context, info) => {
    try {
      return await resolverFn(parent, args, context, info);
    } catch (error) {
      // Si c'est déjà une GraphQLError, la relancer
      if (error instanceof GraphQLError) {
        throw error;
      }
      
      // Sinon, créer une nouvelle GraphQLError avec le message personnalisé
      throw new GraphQLError(errorMessage, {
        extensions: {
          code: 'INTERNAL_SERVER_ERROR',
          httpStatus: 500,
          originalError: error.message,
        },
      });
    }
  };
};

// ========================================
// WRAPPER SECURE RESOLVER
// ========================================

/**
 * Wrapper générique pour sécuriser les resolvers
 * 
 * @param {Function} resolverFn - Fonction resolver à wrapper
 * @param {Object} config - Configuration
 * @param {Joi.Schema} config.structureSchema - Schéma Joi pour valider inputs ET outputs
 * @param {Joi.Schema} config.sortingSchema - Schéma Joi pour pagination (limit, offset, direction)
 * @param {Joi.Schema} config.orderSchema - Schéma Joi pour tri (order)
 * @param {string} config.logAction - Nom de l'action pour les logs (ex: 'CREATE_USER')
 * @param {boolean} config.requiresAuth - Nécessite authentification (default: true)
 * @param {boolean} config.requiresAdmin - Nécessite rôle admin (default: false)
 * @param {Function|string} config.getResourceUserId - Fonction ou champ pour extraire l'ID propriétaire
 * @param {string} config.errorMessage - Message d'erreur personnalisé
 * @param {boolean} config.blockOnInjection - Bloquer la requête si injection détectée (default: true)
 * @param {boolean} config.validateOutput - Valider la structure des données de sortie (default: false)
 * 
 * @returns {Function} Resolver sécurisé
 */
  export const withSecureResolver = (resolverFn, config = {}) => {
  const {
    structureSchema = null,
    specificSchema = null,
    sortingSchema = null,
    orderSchema = null,
    logAction = 'UNKNOWN_ACTION',
    requiresAuth = true,
    requiresAdmin = false,
    getResourceUserId = null,
    errorMessage = 'Erreur lors de l\'opération',
    blockOnInjection = true,
    validateOutput = false,
  } = config;


  return withErrorHandling(
    withOutputSanitization(
      async (parent, args, context, info) => {
        // =============================================
        // 0. DÉTECTION HONEYPOT (AVANT TOUT)
        // =============================================
        const honeypotTriggered = await detectHoneypotUsage(context);
        
        if (honeypotTriggered) {
          // Ne pas révéler qu'on a détecté la manipulation
          // Retourner une erreur générique pour ne pas alerter l'attaquant
          throw new GraphQLError('Accès refusé', {
            extensions: { code: 'FORBIDDEN', httpStatus: 403 }
          });
        }
      
      // =============================================
      // 1. VERIFIER DES AUTORISATIONS 
      // =============================================
        if (requiresAdmin) {
          await requireAdmin(context);
        } else if (getResourceUserId) {
          const resourceUserId = typeof getResourceUserId === 'function' 
            ? await Promise.resolve(getResourceUserId(args, context))
            : args[getResourceUserId];
          
          if (!resourceUserId) {
            throw new GraphQLError('Impossible de déterminer le propriétaire', {
              extensions: { code: 'INTERNAL_SERVER_ERROR', httpStatus: 500 }
            });
          }
          
          await requireOwnershipOrAdmin(resourceUserId, context);
        } else if (requiresAuth) {
          requireAuth(context);
        }
      // =============================================
      // 2. VALIDATION JOI DES INPUTS 
      // =============================================
        let validatedDataInput = {};
        
        if (structureSchema) {
          validatedDataInput = { 
            ...validatedDataInput, 
            ...validateWithJoi(structureSchema, args.input || args) 
          };
        }
        
        if (sortingSchema) {
          const sorting = validateWithJoi(sortingSchema, {
            limit: args.limit,
            offset: args.offset,
            direction: args.direction
          });
          validatedDataInput = { ...validatedDataInput, ...sorting };
        }
        
        if (orderSchema) {
          const order = validateWithJoi(orderSchema, { order: args.order });
          validatedDataInput = { ...validatedDataInput, ...order };
        }

        if (specificSchema) {
          const specificData = validateWithJoi(specificSchema, args || {});
          validatedDataInput = { ...validatedDataInput, ...specificData };
        }
        // =============================================
        // 3. DÉTECTION DES PATTERNS MALVEILLANTS (AVANT SANITIZATION)
        // =============================================
        const hasInjectionAttempt = detectMaliciousPatterns(validatedDataInput);
        
        if (hasInjectionAttempt) {
          // Log l'attaque avec les données brutes (non sanitizées)

        try {
          console.error('[SECURITY_DEBUG] entering suspicious-check. keys(args):', Object.keys(args || {}));
          console.error('[SECURITY_DEBUG] context keys:', Object.keys(context || {}));
          // affiche un extrait des données à tester

          try { 
            // validatedDataInput est défini juste avant le test d'injection
            const sample = typeof validatedDataInput !== 'undefined' ? validatedDataInput : args || {};
            console.error('[SECURITY_DEBUG] data sample:', JSON.stringify(sample, null, 2).slice(0, 1000)); 
          } catch(e){ 
            console.error('cant stringify data', e); 
          }
          // appel sécurisé à la fonction de logging
          try {
            await logSuspiciousActivity(`SEND__${logAction}__BLOCKED`, validatedDataInput, context);
            console.error('[SECURITY_DEBUG] logSuspiciousActivity completed successfully');
          } catch (err) {
            console.error('[SECURITY_DEBUG] logSuspiciousActivity threw:', err);
          }
        } catch (outerErr) {
          console.error('[SECURITY_DEBUG] unexpected error around suspicious-check:', outerErr);
        }

          // Bloquer la requête
          throw new GraphQLError('Contenu suspect détecté dans la requête', {
            extensions: { 
              code: 'MALICIOUS_CONTENT_DETECTED', 
              httpStatus: 400 
            }
          });
        }

        // =============================================
        // 4. SANITIZATION 
        // =============================================
        const sanitizedData = sanitizeRecursive(validatedDataInput);

        // Log les données après sanitization (pour comparaison)
          await logSuspiciousActivity(`SEND__${logAction}__SANITIZED`, {
            original: validatedDataInput,
            sanitized: sanitizedData
          }, context);

        // =============================================
        // 5. EXÉCUTION DU RESOLVER
        // =============================================
        const result = await resolverFn(parent, { ...args, validated: sanitizedData }, context, info);

        // =============================================
        // 6. VALIDATION DES OUTPUTS (contre les injections de second ordre)
        // =============================================

        if (!result) {
          return result; // null, undefined, false, etc.
        }          
        // Détecter les patterns malveillants dans les données de la BDD
        const hasInjectionInDB = detectMaliciousPatterns(result);
        
        if (hasInjectionInDB) {
          // 🚨 ALERTE CRITIQUE : Injection de second ordre détectée !

          try {
            console.error('[SECURITY_DEBUG] entering suspicious-check. keys(args):', Object.keys(args || {}));
            console.error('[SECURITY_DEBUG] context keys:', Object.keys(context || {}));
            // affiche un extrait des données à tester

          try { 
            // validatedDataInput est défini juste avant le test d'injection
            const sample = typeof validatedDataInput !== 'undefined' ? validatedDataInput : args || {};
            console.error('[SECURITY_DEBUG] data sample:', JSON.stringify(sample, null, 2).slice(0, 1000)); 
          } catch(e){ 
            console.error('cant stringify data', e); 
          }
            // appel sécurisé à la fonction de logging
            try {
                  await logSuspiciousActivity(
                    `RECOVER__${logAction}__SECOND_ORDER_INJECTION`, 
                    {
                      action: logAction,
                      user: context.user?.id_user || 'anonymous',
                      data: result,
                      warning: '🔥 DONNÉES CORROMPUES DÉTECTÉES EN BASE DE DONNÉES'
                    }, 
                    context
                  );
              console.error('[SECURITY_DEBUG] logSuspiciousActivity completed successfully');
            } catch (err) {
              console.error('[SECURITY_DEBUG] logSuspiciousActivity threw:', err);
            }
          } catch (outerErr) {
            console.error('[SECURITY_DEBUG] unexpected error around suspicious-check:', outerErr);
          }

          await logSuspiciousActivity(
            `RECOVER__${logAction}__SECOND_ORDER_INJECTION`, 
            {
              action: logAction,
              user: context.user?.id_user || 'anonymous',
              data: result,
              warning: '🔥 DONNÉES CORROMPUES DÉTECTÉES EN BASE DE DONNÉES'
            }, 
            context
          );
          
          // Bloquer la réponse (recommandé en production)
          throw new GraphQLError('Erreur de sécurité : données corrompues détectées', {
            extensions: { 
              code: 'DATA_INTEGRITY_ERROR', 
              httpStatus: 500 
            }
          });
        }

        // Validation de structure output 
        let validatedOutput = result;
        if (validateOutput && structureSchema) {
          try {
            validatedOutput = validateWithJoi(structureSchema, result);
          } catch (error) {
            // Si la validation échoue, logger mais ne pas bloquer
            console.warn(`⚠️ Output validation failed for ${logAction}:`, error.message);
            validatedOutput = result; // Garder les données originales
          }
        }          

          // Note: withOutputSanitization se charge déjà de la sanitization des données de sortie

        // Retourner le résultat final sécurisé
        return validatedOutput;
      }
    ),
    errorMessage
  );
};



























//=========================================================
// 
//=========================================================