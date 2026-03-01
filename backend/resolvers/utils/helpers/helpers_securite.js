import { GraphQLError } from 'graphql';
import sanitizeHtml from 'sanitize-html';
import fs from 'fs/promises';
import path from 'path';
import e from "express";
import Joi from "joi";

// ========================================
// CONFIGURATION
// ========================================
const SECURITY_LOG_DIR = process.env.SECURITY_LOG_DIR || './logs/security';
const MAX_LOG_SIZE = 10 * 1024 * 1024; // 10 MB

// Créer le répertoire de logs au démarrage
(async () => {
  try {
    await fs.mkdir(SECURITY_LOG_DIR, { recursive: true });
  } catch (err) {
    console.error('❌ Impossible de créer le dossier de logs de sécurité:', err);
  }
})();













// ========================================
// VALIDATION JOI
// ========================================

/**
 * Valide les données avec un schéma Joi
 */
export const validateWithJoi = (schema, data) => {
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
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

export const generalSortingSchema = Joi.object({
    limit: Joi.number().integer().min(1).max(100).default(50),
    offset: Joi.number().integer().min(0).default(0),
    direction: Joi.string().valid('ASC', 'DESC').default('DESC'),
});


// ========================================
// HELPERS DE SANITIZATION
// ========================================

/**
 * Sanitize strict : Supprime TOUT le HTML
 */
export const sanitizeStrict = (input) => {
  if (!input || typeof input !== 'string') return input;
  
  const cleaned = sanitizeHtml(input.trim(), {
    allowedTags: [],
    allowedAttributes: {},
    disallowedTagsMode: 'discard',
  });
  
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
 * Sanitize récursif pour objets et tableaux
 * Nettoie toutes les strings en profondeur
 * 
 * @param {*} data - Données à nettoyer
 * @returns {*} Données nettoyées
 */
export const sanitizeRecursive = (data) => {
  if (data === null || data === undefined) return data;
  
  // Tableaux
  if (Array.isArray(data)) {
    return data.map(item => sanitizeRecursive(item));
  }
  
  // Objets
  if (typeof data === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        sanitized[key] = sanitizeStrict(value);
      } else if (typeof value === 'number') {
        sanitized[key] = sanitizeNumber(value);
      } else if (typeof value === 'boolean') {
        sanitized[key] = Boolean(value);
      } else if (value !== null && typeof value === 'object') {
        sanitized[key] = sanitizeRecursive(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }
  
  // Strings
  if (typeof data === 'string') {
    return sanitizeStrict(data);
  }
  
  // Nombres
  if (typeof data === 'number') {
    return sanitizeNumber(data);
  }
  
  // Autres types (boolean, Date, etc.)
  return data;
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
 * Sanitize pour le contenu riche (reviews, descriptions)
 */
export const sanitizeRichText = (input) => {
  if (!input || typeof input !== 'string') return input;
  
  return sanitizeHtml(input, {
    allowedTags: ['b', 'i', 'em', 'strong', 'p', 'br'],
    allowedAttributes: {},
    disallowedTagsMode: 'discard',
  });
};


/**
 * Sanitize strict pour les nombres
 * Empêche NaN, Infinity, valeurs trop grandes
 */
export const sanitizeNumber = (input) => {
  if (input === null || input === undefined) return input;
  
  const num = Number(input);
  
  if (isNaN(num)) {
    throw new GraphQLError('Valeur numérique invalide', {
      extensions: { code: 'BAD_REQUEST', httpStatus: 400 }
    });
  }
  
  if (!isFinite(num)) {
    throw new GraphQLError('Nombre infini non autorisé', {
      extensions: { code: 'BAD_REQUEST', httpStatus: 400 }
    });
  }
  
  // Vérifier les limites raisonnables (ajustez selon vos besoins)
  const MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER;
  if (Math.abs(num) > MAX_SAFE_INTEGER) {
    throw new GraphQLError('Nombre trop grand', {
      extensions: { code: 'BAD_REQUEST', httpStatus: 400 }
    });
  }
  
  return num;
};


/**
 * Encoder les entités HTML (dernier rempart)
 */
const encodeHtmlEntities = (str) => {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Sanitize récursif des objets (pour output)
 */
const sanitizeOutput = (obj) => {
  if (obj === null || obj === undefined) return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeOutput(item));
  }
  
  if (typeof obj === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key] = encodeHtmlEntities(value);
      } else {
        sanitized[key] = sanitizeOutput(value);
      }
    }
    return sanitized;
  }
  
  if (typeof obj === 'string') {
    return encodeHtmlEntities(obj);
  }
  
  return obj;
};

// ========================================
// VALIDATION ANTI-INJECTION
// ========================================

/**
 * Détecte les tentatives de SQLi dans le texte
 */
export const detectSQLInjection = (input) => {
  if (!input || typeof input !== 'string') return false;
  
  const sqlPatterns = [
    /union\s+select/gi,
    /drop\s+table/gi,
    /delete\s+from/gi,
    /insert\s+into/gi,
    /exec\s*\(/gi,
    /execute\s*\(/gi,
    /--/g,
    /;.*drop/gi,
  ];
  
  return sqlPatterns.some(pattern => pattern.test(input));
};

          /**
           * Validation custom anti-injection
           */
          export const validateAgainstInjection = (data) => {
            const checkValue = (value, fieldName = 'field') => {
              if (!value || typeof value !== 'string') return;
              
              // Détecter XSS
              if (/<script|javascript:|onerror=|onload=/gi.test(value)) {
                throw new GraphQLError(`Contenu suspect dans ${fieldName}`, {
                  extensions: { code: 'XSS_DETECTED', httpStatus: 400 }
                });
              }
              
              // Détecter SQLi
              if (detectSQLInjection(value)) {
                throw new GraphQLError(`Pattern SQL suspect dans ${fieldName}`, {
                  extensions: { code: 'SQL_INJECTION_DETECTED', httpStatus: 400 }
                });
              }
            };

            // Si c'est un tableau
            if (Array.isArray(data)) {
              data.forEach((item, index) => {
                if (typeof item === 'object') {
                  validateAgainstInjection(item);
                } else {
                  checkValue(item, `index[${index}]`);
                }
              });
              return;
            }

            // Si c'est un objet
            if (typeof data === 'object' && data !== null) {
              for (const [key, value] of Object.entries(data)) {
                if (typeof value === 'object') {
                  validateAgainstInjection(value);
                } else {
                  checkValue(value, key);
                }
              }
              return;
            }

            // Si c'est une valeur simple
            checkValue(data);
          };

/**
 * Détecte les patterns malveillants SANS throw d'erreur
 * Retourne true si malice détectée, false sinon
 * 
 * @param {*} data - Données à analyser (string, object, array)
 * @returns {boolean} true si patterns suspects détectés
 */
export const detectMaliciousPatterns = (data) => {
  if (!data) return false;
  
  const checkValue = (value) => {
    if (typeof value !== 'string') return false;
    
    // Patterns XSS
    const xssPatterns = [
      /<script/gi,
      /javascript:/gi,
      /onerror=/gi,
      /onload=/gi,
      /<iframe/gi,
      /eval\(/gi,
      /expression\(/gi,
      /<object/gi,
      /<embed/gi,
      /vbscript:/gi,
    ];
    
    // Patterns SQL Injection
    const sqlPatterns = [
      /union\s+select/gi,
      /drop\s+table/gi,
      /delete\s+from/gi,
      /insert\s+into/gi,
      /exec\s*\(/gi,
      /execute\s*\(/gi,
      /--\s*$/gm,
      /;\s*drop/gi,
      /'\s*or\s*'1'\s*=\s*'1/gi,
      /'\s*or\s+1\s*=\s*1/gi,
      /admin'\s*--/gi,
      /'\s*;\s*shutdown/gi,
    ];
    
    // Patterns Path Traversal
    const traversalPatterns = [
      /\.\.\//g,
      /\.\.\\\\/g,
      /%2e%2e%2f/gi,
      /%252e%252e%252f/gi,
    ];
    
    return [
      ...xssPatterns, 
      ...sqlPatterns, 
      ...traversalPatterns
    ].some(pattern => pattern.test(value));
  };
  
  // Vérification récursive
  if (Array.isArray(data)) {
    return data.some(item => detectMaliciousPatterns(item));
  }
  
  if (typeof data === 'object' && data !== null) {
    return Object.values(data).some(value => detectMaliciousPatterns(value));
  }
  
  return checkValue(data);
};

// ========================================
// LOGGING DE SÉCURITÉ (FICHIER)
// ========================================

/**
 * Rotation des logs si trop gros
 */
const rotateLogIfNeeded = async (filePath) => {
  try {
    const stats = await fs.stat(filePath);
    if (stats.size > MAX_LOG_SIZE) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const archivePath = filePath.replace('.log', `-${timestamp}.log`);
      await fs.rename(filePath, archivePath);
      //console.log(`📦 Log rotaté: ${archivePath}`);
    }
  } catch (err) {
    // Fichier n'existe pas encore, c'est normal
  }
};

/**
 * Logger les activités suspectes dans un fichier
 */
export const logSuspiciousActivity = async (action, data, context) => {
  const suspiciousPatterns = [
    /<script/gi,
    /javascript:/gi,
    /onerror=/gi,
    /union\s+select/gi,
    /drop\s+table/gi,
  ];
  
  const isSuspicious = Object.values(data).some(value => {
    if (typeof value === 'string') {
      return suspiciousPatterns.some(pattern => pattern.test(value));
    }
    return false;
  });
  
  // debug: affichage du répertoire de logs résolu
  try {
    const resolved = path.resolve(SECURITY_LOG_DIR);
    //console.log('[SECURITY_LOG] SECURITY_LOG_DIR resolved to:', resolved);
  } catch (e) {
    console.error('[SECURITY_LOG] cannot resolve SECURITY_LOG_DIR', e);
  }  
  if (isSuspicious) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      action,
      user: context?.user?.id_user || 'anonymous',
      ip: context?.req?.ip || context?.req?.connection?.remoteAddress || 'unknown',
      userAgent: context?.req?.headers?.['user-agent'] || 'unknown',
      data: JSON.stringify(data, null, 2),
    };
    
    const logLine = `
========================================
⚠️  ACTIVITÉ SUSPECTE DÉTECTÉE
========================================
Date/Heure: ${logEntry.timestamp}
Action: ${logEntry.action}
Utilisateur: ${logEntry.user}
IP: ${logEntry.ip}
User-Agent: ${logEntry.userAgent}
Données:
${logEntry.data}
========================================

`;
    
    // Écrire dans le fichier
    const logFile = path.join(SECURITY_LOG_DIR, `suspicious-${new Date().toISOString().split('T')[0]}.log`);
    
    // debug: afficher le chemin du fichier avant écriture
    //console.log('[SECURITY_LOG] will append to', logFile);    
    try {
      await rotateLogIfNeeded(logFile);
      await fs.appendFile(logFile, logLine, 'utf8');
      //console.log('[SECURITY_LOG] write successful:', logFile);
      
       // Vérification immédiate : lister le répertoire et afficher les infos du fichier
       try {
         const listing = await fs.readdir(SECURITY_LOG_DIR);
         //console.log('[SECURITY_LOG] directory listing:', listing);
         const stats = await fs.stat(logFile);
         //console.log('[SECURITY_LOG] file stats:', { size: stats.size, mtime: stats.mtime });
       } catch (errInner) {
         console.error('[SECURITY_LOG] cannot read dir or stat file:', errInner);
       }      
      // Log également dans la console en développement
      if (process.env.NODE_ENV !== 'production') {
        console.error('⚠️ SUSPICIOUS ACTIVITY:', logEntry);
      }
    } catch (err) {
      console.error('❌ Impossible d\'écrire le log de sécurité:', err);
    }
  }
};


export const logSecurityIncident = async (incident) => {
  const logDir = path.join(process.cwd(), 'logs', 'security');
  const logFile = path.join(logDir, 'honeypot-incidents.log');
  
  try {
    await fs.mkdir(logDir, { recursive: true });
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${JSON.stringify(incident, null, 2)}\n`;
    await fs.appendFile(logFile, logEntry, 'utf8');
    console.error('🚨 SECURITY INCIDENT LOGGED:', incident);
  } catch (error) {
    console.error('Erreur lors du logging de sécurité:', error);
  }
};

export const blockUserAccount = async (userId, reason) => {
  try {
    // Mettre le statut à "blocked_by_admin" (id_status = 2)
    await db.query(`
      UPDATE users 
      SET id_status = (SELECT id_status FROM status WHERE status_name = 'blocked_by_admin' LIMIT 1),
          updated_at = NOW()
      WHERE id_user = $1
    `, [userId]);
    
    // Invalider le refresh token
    await db.query(`
      UPDATE users SET refresh_token = NULL WHERE id_user = $1
    `, [userId]);
    
    await logSecurityIncident({
      type: 'USER_BLOCKED',
      userId,
      reason,
      timestamp: new Date().toISOString()
    });
    
    return true;
  } catch (error) {
    console.error('Erreur lors du blocage utilisateur:', error);
    return false;
  }
};
// ========================================
// WRAPPER OUTPUT SANITIZATION
// ========================================

/**
 * Wrapper pour sanitizer automatiquement les résultats
 */
export const withOutputSanitization = (resolverFn) => {
  return async (parent, args, context, info) => {
    const result = await resolverFn(parent, args, context, info);
    return sanitizeOutput(result);
  };
};





/**
 * Détecte si quelqu'un tente d'utiliser le honeypot isAdmin
 */
export const detectHoneypotUsage = async (context) => {
  if (context.isAdmin === true) {
    context._honeypotTriggered = true;
    
    await logSuspiciousActivity('HONEYPOT__ADMIN_FLAG_MANIPULATION', {
      user: context.user?.id_user || 'anonymous',
      email: context.user?.email || 'unknown',
      pseudo: context.user?.pseudo || 'unknown',
      ip: context.req?.ip || context.req?.connection?.remoteAddress, 
      userAgent: context.req?.headers?.['user-agent'],
      method: context.req?.method,
      operationName: context.req?.body?.operationName,
      query: context.req?.body?.query?.substring(0, 500),
      variables: JSON.stringify(context.req?.body?.variables),
      warning: '🚨 TENTATIVE DE MANIPULATION DU FLAG isAdmin DÉTECTÉE',
      timestamp: new Date().toISOString(),
    }, context);    
    
    return true;
  }
  
  return false;
};
