import { GraphQLError } from 'graphql';
import sanitizeHtml from 'sanitize-html';

import {withOutputSanitization, logSuspiciousActivity, validateAgainstInjection} from '../helpers/helpers_securite.js';

// ========================================
// HELPERS D'AUTHENTIFICATION
// ========================================
  // Défaut utilitaire pour savoir si l'utilisateur est authentifié
  export const isAuthenticated = (context) => {
    // Si utilisation d'un user (obtenu après vérif du token), prefère context.user
    // Sinon fallback sur context.token
    return Boolean(context && (context.user || context.token || context.isAuthenticated));
  };

  /**
   * Vérifie que l'utilisateur est authentifié
   * @throws {GraphQLError} Si non authentifié
   */
  export const requireAuth = (context) => {
    // Utiliser la fonction utilitaire isAuthenticated pour accepter
    // context.token ou context.user (createContext fournit context.token)
    if (!isAuthenticated(context)) {
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
  export const requireAdmin = (context) => {
    requireAuth(context);
    const isAdminFlag =
      Boolean(context && (context.isAdmin || context.user?.isAdmin || context.user?.role === 'admin'));
    if (!isAdminFlag) {
      throw new GraphQLError('Accès refusé : droits administrateur requis', {
        extensions: { 
          code: 'FORBIDDEN',
          httpStatus: 403
        },
      });
    }
  };

  /**
   * Vérifie que l'utilisateur peut accéder à une ressource
   * @param {string} resourceUserId - ID du propriétaire de la ressource
   * @param {object} context - Contexte GraphQL
   * @throws {GraphQLError} Si accès refusé
   */
  export const requireOwnershipOrAdmin = (resourceUserId, context) => {
    requireAuth(context);
    const currentUserId = context?.user?.id ?? context?.user?.id_user ?? null;
    const isAdminFlag =
      Boolean(context && (context.isAdmin || context.user?.isAdmin || context.user?.role === 'admin'));

    if (resourceUserId !== currentUserId && !isAdminFlag) {
      throw new GraphQLError('Vous ne pouvez accéder qu\'à vos propres ressources', {
        extensions: {
          code: 'FORBIDDEN',
          httpStatus: 403
        }
      });
    }
  };

// ========================================
// HELPERS DE JOI
// ========================================
/** * Valide les données avec un schéma Joi
 * @param {Joi.Schema} schema - Schéma de validation Joi
 * @param {object} data - Données à valider
 */
export const validateWithJoi = (schema, data) => {
  const { error, value } = schema.validate(data, {
    abortEarly: false, // Récupère toutes les erreurs
    stripUnknown: true, // Supprime les champs non définis dans le schéma
  });

  if (error) {
    const messages = error.details.map(detail => detail.message).join(', ');
    throw new GraphQLError(messages, {
      extensions: { 
        code: 'BAD_REQUEST',
        httpStatus: 400,
        originalError: error.message
      },
    });
  }

  return value;
};

// ========================================
// HELPERS DE SANITIZATION
// ========================================

/**
 * Nettoie une chaîne de caractères pour éviter les attaques XSS
 * @param {string} input - Chaîne à nettoyer
 * @returns {string} Chaîne nettoyée
 */
export const sanitizeString = (input) => {
  if (!input || typeof input !== 'string') return input;
  return sanitizeHtml(input.trim(), {
    allowedTags: [],
    allowedAttributes: {},
  });
};

/**
 * Nettoie un objet d'input
 * @param {object} input - Objet à nettoyer
 * @returns {object} Objet nettoyé
 */
export const sanitizeInput = (input) => {
  if (!input || typeof input !== 'object') return input;
  
  const sanitized = {};
  for (const [key, value] of Object.entries(input)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};

/**
 * Sanitize strict : Supprime TOUT le HTML
 * @param {string} input - Texte à nettoyer
 * @returns {string} Texte sans HTML
 */
export const sanitizeStrict = (input) => {
  if (!input || typeof input !== 'string') return input;
  
  // Supprimer TOUT le HTML (pas de balises autorisées)
  const cleaned = sanitizeHtml(input.trim(), {
    allowedTags: [],        // ✅ AUCUNE balise HTML autorisée
    allowedAttributes: {},  // ✅ AUCUN attribut autorisé
    disallowedTagsMode: 'discard', // Supprimer le contenu des balises interdites
  });
  
  // Vérifier les patterns dangereux supplémentaires
  const dangerousPatterns = [
    /<script/gi,
    /javascript:/gi,
    /onerror=/gi,
    /onload=/gi,
    /<iframe/gi,
    /eval\(/gi,
    /expression\(/gi,
  ];
  
  for (const pattern of dangerousPatterns) {
    if (pattern.test(cleaned)) {
      throw new GraphQLError('Contenu suspect détecté', {
        extensions: { code: 'MALICIOUS_CONTENT', httpStatus: 400 }
      });
    }
  }
  
  return cleaned;
};

/**
 * Sanitize pour le contenu riche (reviews, descriptions)
 * Autorise quelques balises sûres
 */
export const sanitizeRichText = (input) => {
  if (!input || typeof input !== 'string') return input;
  
  return sanitizeHtml(input, {
    allowedTags: ['b', 'i', 'em', 'strong', 'p', 'br'],
    allowedAttributes: {},
    disallowedTagsMode: 'discard',
  });
};


// ========================================
// HELPERS GÉNÉRAUX
// ========================================

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

// Rate limiting simple en mémoire pour les resolvers GraphQL
const rateLimitMap = new Map();

export const withRateLimit = (fn, options = {}) => {
  const { 
    maxRequests = 10, 
    windowMs = 60000, // 1 minute
    keyFn = (context) => context.user?.id_user || context.ip 
  } = options;
  
  return async (parent, args, context, info) => {
    const key = keyFn(context);
    
    if (!key) {
      throw new GraphQLError('Impossible de déterminer l\'identifiant pour le rate limiting', {
        extensions: { code: 'INTERNAL_SERVER_ERROR', httpStatus: 500 }
      });
    }
    
    const now = Date.now();
    const userLimits = rateLimitMap.get(key) || { requests: [], resetAt: now + windowMs };
    
    // Nettoyer les anciennes requêtes
    userLimits.requests = userLimits.requests.filter(time => time > now - windowMs);
    
    if (userLimits.requests.length >= maxRequests) {
      const resetIn = Math.ceil((userLimits.resetAt - now) / 1000);
      throw new GraphQLError(`Trop de requêtes. Réessayez dans ${resetIn} secondes`, {
        extensions: { 
          code: 'RATE_LIMIT_EXCEEDED', 
          httpStatus: 429,
          retryAfter: resetIn 
        }
      });
    }
    
    userLimits.requests.push(now);
    rateLimitMap.set(key, userLimits);
    
    return fn(parent, args, context, info);
  };
};

// ========================================
// STRUCTURE DES RESOLVERS
// ========================================

/**
 * Wrapper générique pour sécuriser les resolvers
 * - Valide les inputs avec Joi
 * - Sanitize les données
 * - Valide contre les injections
 * - Log les activités suspectes
 */
export const withSecureResolver = (resolverFn, config = {}) => {
  const {
    inputSchema = null,
    sortingSchema = null,
    orderSchema = null,
    logAction = 'UNKNOWN_ACTION',
    requiresAuth = true,
    requiresAdmin = false,
  } = config;

  return withErrorHandling(
    withOutputSanitization(
      async (parent, args, context, info) => {
        // Vérification d'authentification
        // if (requiresAdmin) {
        // requireAdmin(context);
        // } else if (requiresAuth) {
        //   requireAuth(context);
        // }

        // Validation Joi des inputs
        let validatedData = {};
        
        if (inputSchema) {
          validatedData = { ...validatedData, ...validateWithJoi(inputSchema, args) };
        }
        
        if (sortingSchema) {
          const sorting = validateWithJoi(sortingSchema, {
            limit: args.limit,
            offset: args.offset,
            direction: args.direction
          });
          validatedData = { ...validatedData, ...sorting };
        }
        
        if (orderSchema) {
          const order = validateWithJoi(orderSchema, { order: args.order });
          validatedData = { ...validatedData, ...order };
        }

        // Sanitization stricte
        const sanitizedData = {};
        for (const [key, value] of Object.entries(validatedData)) {
          if (typeof value === 'string') {
            sanitizedData[key] = sanitizeStrict(value);
          } else {
            sanitizedData[key] = value;
          }
        }

        // Log des activités suspectes (INPUT)
        await logSuspiciousActivity(`SEND__${logAction}`, sanitizedData, context);

        // Exécuter le resolver avec les données validées
        const result = await resolverFn(parent, { ...args, validated: sanitizedData }, context, info);

        // Validation anti-injection des résultats
        if (result && typeof result === 'object') {
          validateAgainstInjection(result);
        }

        // Log des activités suspectes (OUTPUT)
        await logSuspiciousActivity(`RECOVER__${logAction}`, result, context);

        return result;
      }
    ),
    config.errorMessage || 'Erreur lors de l\'opération'
  );
};







// ========================================
// NOTES
// ========================================
/*
le fichier est globalement correct (syntaxe valide, imports ok, fonctions utiles), mais j’ai repéré quelques points d’amélioration et des risques potentiels à connaître. Je te décris ce qui va, ce qui peut poser problème, et je propose des versions plus robustes des helpers (à copier-coller si tu veux).

Ce qui est bon
La syntaxe est valide : importations, exports nommés, fonctions, tout est OK.
Utilisation correcte de GraphQLError pour renvoyer des erreurs GraphQL avec extensions.
sanitize-html est utilisé de façon appropriée pour sanitizeString / sanitizeInput.
Helpers sont bien isolés (faciles à tester).
Ce qui peut poser problème / incohérences
Propriétés du context attendues :

Les helpers utilisent context.isAuthenticated, context.pseudo, context.user.id et context.isAdmin.
Dans ton createContext actuel (server.ts/server.js) tu n’as pas forcément défini isAuthenticated / isAdmin / pseudo. Tu as token et user (souvent null par défaut).
Risque : appel à context.user.id lèvera une exception si context.user est null/undefined.
Incohérence logique :

requireAdmin vérifie context.pseudo pour l’admin, alors que requireOwnershipOrAdmin vérifie context.isAdmin. Ce n’est pas cohérent : l’un teste un pseudo, l’autre un booléen admin.
Robustesse / defensive coding :

Il vaut mieux utiliser optional chaining (context?.user?.id) et contrôler l’existence de context/context.user.
Rendre les messages et codes d’erreur consistants.
sanitizeInput : si une valeur est un objet imbriqué, tu la laisses telle quelle. OK, mais si tu veux nettoyer profondément les chaînes imbriquées il faudrait itérer récursivement.

Recommandations
Standardiser le shape du context (par exemple : { req, res, token, user, isAuthenticated, isAdmin }), et le documenter / initialiser dans createContext.
Modifier les helpers pour utiliser context.user / context.user.role ou context.user.isAdmin plutôt que pseudo ou isAdmin isolés.
Rendre les helpers plus défensifs (optional chaining, messages clairs).
Versions proposées (plus robustes)
Voici des versions alternatives sûres de tes fonctions. Elles préservent les comportements mais évitent les erreurs si context manque de champs :

import { GraphQLError } from 'graphql';
import sanitizeHtml from 'sanitize-html';

// Défaut utilitaire pour savoir si l'utilisateur est authentifié
const isAuthenticated = (context) => {
  // Si tu utilises un user (obtenu après vérif du token), prefère context.user
  // Sinon fallback sur context.token
  return Boolean(context && (context.user || context.token || context.isAuthenticated));
};

export const requireAuth = (context) => {
  if (!isAuthenticated(context)) {
    throw new GraphQLError('Vous devez être connecté pour effectuer cette action', {
      extensions: {
        code: 'UNAUTHENTICATED',
        httpStatus: 401
      }
    });
  }
};

export const requireAdmin = (context) => {
  requireAuth(context);
  // Préférence : utiliser context.user.isAdmin ou context.user.role
  const isAdminFlag =
    Boolean(context && (context.isAdmin || context.user?.isAdmin || context.user?.role === 'admin'));
  if (!isAdminFlag) {
    throw new GraphQLError('Accès refusé : droits administrateur requis', {
      extensions: {
        code: 'FORBIDDEN',
        httpStatus: 403
      }
    });
  }
};

export const requireOwnershipOrAdmin = (resourceUserId, context) => {
  requireAuth(context);
  const currentUserId = context?.user?.id ?? context?.user?.id_user ?? null;
  const isAdminFlag =
    Boolean(context && (context.isAdmin || context.user?.isAdmin || context.user?.role === 'admin'));

  if (resourceUserId !== currentUserId && !isAdminFlag) {
    throw new GraphQLError('Vous ne pouvez accéder qu\'à vos propres ressources', {
      extensions: {
        code: 'FORBIDDEN',
        httpStatus: 403
      }
    });
  }
};

// sanitize helpers (inchangés, mais on peut proposer recursion si besoin)
export const sanitizeString = (input) => {
  if (!input || typeof input !== 'string') return input;
  return sanitizeHtml(input.trim(), {
    allowedTags: [],
    allowedAttributes: {},
  });
};

export const sanitizeInput = (input) => {
  if (!input || typeof input !== 'object') return input;

  const sanitized = {};
  for (const [key, value] of Object.entries(input)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      // nettoyage superficiel récursif (évite modifier les tableaux)
      sanitized[key] = sanitizeInput(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};



Ces modifications :

évitent les erreurs quand context.user est null,
uniformisent la détection d’admin (context.user.isAdmin ou context.user.role === 'admin'),
ajoutent une petite récursion pour sanitizeInput (facultatif).
Comment tester rapidement
Temporarily log keys of context in un resolver :
Écrire un test unitaire simple pour requireAuth en appelant requireAuth({ user: null }) (doit throw) et requireAuth({ user: { id: 'x' } }) (doit ne pas throw).
Vérifier les cas d’admin : requireAdmin({ user: { isAdmin: true }}) passe ; requireAdmin({ user: { role: 'admin' }}) passe.
Conclusion rapide
Ton fichier est correct au sens syntaxe et logique générale.
Pour la robustesse et l’interop avec ton createContext, je recommande de rendre les helpers plus défensifs et de standardiser/initialiser context (notamment user, isAdmin, isAuthenticated) dans createContext.
Si tu veux, je peux :
te proposer une PR (patch) avec les modifications ci‑dessus appliquées,
ou t’afficher juste les modifications minimales à coller (tu as dit non au code modifié en discussion, mais je peux préparer le patch si tu veux).
Tu veux que j’applique ces améliorations maintenant (édition des fichiers), ou tu veux garder le fichier tel quel et juste documenter comment remplir le context ?






"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZF91c2VyIjoiMWUyZDNjNGItNWE2Zi03ZThkLTljMGItMWEyZjNlNGQ1YzZiIiwibmFtZSI6IkFsaWNlIER1cG9udCIsInBzZXVkbyI6InBldGl0IHBvaXNzb24ifQ.c8A_mkFWejX_6GDls2GbqCykqsvCISe6soTAHzHbQCM"

{
  "alg": "HS256",
  "typ": "JWT"
}


{"id_user":"1e2d3c4b-5a6f-7e8d-9c0b-1a2f3e4d5c6b",
"name":"Alice Dupont",
"pseudo":"petit poisson"}

si_tu_arrive_a_lire_ca_tu_es_un_genie


*/