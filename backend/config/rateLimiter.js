// config/rateLimiter.js
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';

// Configuration Redis avec gestion d'erreur
// Eviter la connexion Redis en CI/tests si demandé
let redis;
if (!process.env.DISABLE_REDIS && process.env.NODE_ENV !== 'test') {
 redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    retryStrategy: (times) => {100},
    maxRetriesPerRequest: 3,
  });
} else {
  console.log('[REDIS] disabled in this environment (DISABLE_REDIS=true or NODE_ENV=test)');
}

// Essayer d'instancier Redis avec la config fournie.
// Si la résolution DNS échoue immédiatement (ex: host 'redis' en local),
// retomber sur 127.0.0.1 pour permettre un démarrage en local sans Docker.
try {
  redis = new Redis(redisConfig);
} catch (err) {
  console.error('❌ Redis initialisation failed with host', redisConfig.host, err && err.message ? err.message : err);
  // Fallback to localhost loopback
  try {
    redis = new Redis({ ...redisConfig, host: '127.0.0.1' });
    console.warn('⚠️ Redis fallback to 127.0.0.1');
  } catch (err2) {
    console.error('❌ Redis fallback also failed', err2 && err2.message ? err2.message : err2);
    // As last resort, create a Redis instance with default options to keep the app running
    redis = new Redis();
  }
}

// Gestion des erreurs Redis
redis.on('error', (err) => {
  console.error('❌ Redis connection error:', err);
});

redis.on('connect', () => {
  console.log('✅ Redis connected successfully');
});

redis.on('ready', () => {
  console.log('✅ Redis ready to accept commands');
});

// Fallback si Redis n'est pas disponible
const createLimiter = (options) => {
  // extraire prefix pour l'utiliser uniquement avec RedisStore
  const { prefix, ...rateLimitOptions } = options || {};

  const baseConfig = {
    standardHeaders: true,
    legacyHeaders: false,
    ...rateLimitOptions,
  };

  // Utiliser Redis Store si disponible, sinon fallback sur memory store
  if (redis.status === 'ready' || redis.status === 'connect') {
    return rateLimit({
      ...baseConfig,
      store: new RedisStore({
        client: redis,
        prefix: prefix || 'rl:',
      }),
    });
  } else {
    console.warn('⚠️ Redis unavailable, using in-memory rate limiting');
    return rateLimit(baseConfig);
  }
};

export const generalLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Trop de requêtes, veuillez réessayer plus tard',
  prefix: 'rl:general:',
});

export const authLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  message: 'Trop de tentatives de connexion, veuillez réessayer dans 15 minutes',
  prefix: 'rl:auth:',
});

export const mutationLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  max: 50,
  message: 'Quota de modifications atteint, veuillez réessayer plus tard',
  prefix: 'rl:mutation:',
});

export const registrationLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: 'Trop de créations de compte, veuillez réessayer plus tard',
  prefix: 'rl:registration:',
});

export { redis };