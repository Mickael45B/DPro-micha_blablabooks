// ...existing code...
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { createClient } from 'redis';

let redisClient = null;
let useRedis = false;
let disableRedis = false; // désactive définitivement si auth/erreur critique
// cache des limiteurs pour éviter de les recréer à chaque requête
const limiterCache = new Map();

async function initRedisIfConfigured() {

  // Respecter la variable d'environnement pour désactiver Redis en dev/tests
  if (process.env.DISABLE_REDIS === 'true' || process.env.NODE_ENV === 'test') {
    //console.log('[RATE_LIMIT] Redis disabled by DISABLE_REDIS or test env');
    return;
  }

  const rawRedisUrl = process.env.REDIS_URL || (process.env.REDIS_HOST ? `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT || 6379}` : null);
  const envPassword = process.env.REDIS_PASSWORD ?? undefined;

  if (!rawRedisUrl) {
    console.info('⚠️ Redis non configuré — utilisation du MemoryStore pour rate limiting');
    return;
  }

  try {
    let sanitizedUrl = rawRedisUrl;
    let pwdFromUrl = null;
    try {
      const u = new URL(rawRedisUrl);
      if (u.username || u.password) {
        pwdFromUrl = u.password || null;
        u.username = '';
        u.password = '';
        sanitizedUrl = u.toString();
      }
    } catch (e) {}

    const passwordCandidate = typeof envPassword === 'string' && envPassword.trim() !== '' ? envPassword.trim() : (pwdFromUrl ? String(pwdFromUrl) : null);

    console.info('[RATE_LIMIT] Redis URL used:', sanitizedUrl);
    console.info('[RATE_LIMIT] Redis password provided:', passwordCandidate ? 'YES' : 'NO');

    const clientOptions = { url: sanitizedUrl };
    if (passwordCandidate) clientOptions.password = passwordCandidate;

    redisClient = createClient(clientOptions);

    // Si erreur d'authentification ou autre erreur critique → désactiver Redis définitivement
    redisClient.on('error', (err) => {
      console.error('❌ Redis error:', err?.message || err);
      const msg = String(err?.message || '').toUpperCase();
      if (msg.includes('NOAUTH') || msg.includes('ERR AUTH') || msg.includes('AUTH')) {
        console.warn('⚠️ Redis auth error détectée — désactivation définitive de Redis pour rate limiting');
        disableRedis = true;
        useRedis = false;
        try { redisClient.disconnect?.(); } catch (e) {}
        redisClient = null;
        limiterCache.clear(); // forcer recreation en MemoryStore
      }
    });

    await redisClient.connect();

    // Si on a été marqué disabled en event handler, ne pas activer l'usage
    if (disableRedis) {
      useRedis = false;
      redisClient = null;
      console.warn('⚠️ Redis désactivé après connexion en raison d\'erreur d\'auth');
      return;
    }

    useRedis = true;
    //console.log('✅ Redis connecté pour rate limiting');
  } catch (err) {
    console.warn('⚠️ Impossible de connecter Redis, fallback vers MemoryStore pour rate limiting:', err?.message || err);
    useRedis = false;
    redisClient = null;
    disableRedis = false;
  }
}

/* eslint-disable-next-line no-console */
initRedisIfConfigured().catch((e) => console.warn('⚠️ initRedisIfConfigured failed:', e?.message || e));

const makeLimiter = (opts) => {
  const key = JSON.stringify({
    windowMs: opts.windowMs,
    max: opts.max,
    standardHeaders: opts.standardHeaders ?? true,
    legacyHeaders: opts.legacyHeaders ?? false,
  });

  if (limiterCache.has(key)) return limiterCache.get(key);

  const base = {
    windowMs: opts.windowMs,
    max: opts.max,
    standardHeaders: opts.standardHeaders ?? true,
    legacyHeaders: opts.legacyHeaders ?? false,
    handler: opts.handler,
  };

  // Si Redis désactivé ou non connecté -> MemoryStore
  if (!useRedis || disableRedis || !redisClient) {
    const memLimiter = rateLimit(base);
    limiterCache.set(key, memLimiter);
    return memLimiter;
  }

  // Essayer de créer RedisStore ; si erreur -> fallback MemoryStore et désactivation
  try {
    const redisStoreLimiter = rateLimit({
      ...base,
      store: new RedisStore({
        sendCommand: (...args) => {
          if (!redisClient) throw new Error('Redis client not available');
          return redisClient.sendCommand(args);
        },
      }),
    });
    limiterCache.set(key, redisStoreLimiter);
    return redisStoreLimiter;
  } catch (e) {
    console.warn('⚠️ Création du RedisStore échouée, fallback vers MemoryStore et désactivation Redis:', e?.message || e);
    disableRedis = true;
    useRedis = false;
    try { redisClient?.disconnect?.(); } catch (er) {}
    redisClient = null;
    const memLimiter = rateLimit(base);
    limiterCache.set(key, memLimiter);
    return memLimiter;
  }
};

// Handlers communs
const defaultHandler = (req, res) => {
  res.status(429).json({
    errors: [{
      message: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.',
      extensions: { code: 'RATE_LIMIT_EXCEEDED', httpStatus: 429 }
    }]
  });
};

//  initialiser et mettre en cache les instances de limiteurs ---
export async function initRateLimiters() {
  // tenter d'initialiser Redis si besoin 
  try { await initRedisIfConfigured(); } catch (e) { /* already logged */ }

  // créer et stocker les instances une fois pour toutes
  limiterCache.set('general', makeLimiter({
    windowMs: 15 * 60 * 1000,
    max: 2000, // Augmenté pour dev
    handler: defaultHandler,
  }));

  limiterCache.set('auth', makeLimiter({
    windowMs: 15 * 60 * 1000,
    max: 80,
    handler: defaultHandler,
    skipSuccessfulRequests: true,
  }));

  limiterCache.set('mutation', makeLimiter({
    windowMs: 15 * 60 * 1000,
    max: 1000, // Augmenté de 20 à 100 pour dev
    handler: defaultHandler,
  }));

  limiterCache.set('registration', makeLimiter({
    windowMs: 60 * 60 * 1000,
    max: 50, // Augmenté de 3 à 5
    handler: defaultHandler,
  }));

  //console.log('[RATE_LIMIT] Limiters initialisés et mis en cache.');
}









// wrappers dynamiques (utilisent le cache interne)
export const generalLimiter = (req, res, next) => {
  const limiter = limiterCache.get('general');
  if (!limiter) return next(); // fallback sans rate limit si non initialisé
  return limiter(req, res, next);
};

export const authLimiter = (req, res, next) => {
  const limiter = limiterCache.get('auth');
  if (!limiter) return next();
  return limiter(req, res, next);
};

export const mutationLimiter = (req, res, next) => {
  const limiter = limiterCache.get('mutation');
  if (!limiter) return next();
  return limiter(req, res, next);
};

export const registrationLimiter = (req, res, next) => {
  const limiter = limiterCache.get('registration');
  if (!limiter) return next();
  return limiter(req, res, next);
};
