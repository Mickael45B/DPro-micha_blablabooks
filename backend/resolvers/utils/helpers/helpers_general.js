import { GraphQLError } from 'graphql';
import sanitizeHtml from 'sanitize-html';


// ========================================
// HELPERS D'AUTHENTIFICATION
// ========================================

// Défaut utilitaire pour savoir si l'utilisateur est authentifié
export const isAuthenticated = (context) => {
  // Si tu utilises un user (obtenu après vérif du token), prefère context.user
  // Sinon fallback sur context.token
  return Boolean(context && (context.user || context.token || context.isAuthenticated));
};


/**
 * Vérifie que l'utilisateur est authentifié
 * @throws {GraphQLError} Si non authentifié
 */
export const requireAuth = (context) => {
  if (!context.isAuthenticated) {
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
  if (!context.pseudo) {
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
  if (resourceUserId !== context.user.id && !context.isAdmin) {
    throw new GraphQLError('Vous ne pouvez accéder qu\'à vos propres ressources', {
      extensions: { 
        code: 'FORBIDDEN',
        httpStatus: 403
      },
    });
  }
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










*/