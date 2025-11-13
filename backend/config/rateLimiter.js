// config/rateLimiter.js
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';

// Configuration Redis avec gestion d'erreur
let redis = null;

if (!process.env.DISABLE_REDIS && process.env.NODE_ENV !== 'test') {
  const redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    retryStrategy: (times) => {
      const MAX_RETRIES = 10;
      if (times > MAX_RETRIES) return null; // Stop après 10 tentatives
      return Math.min(times * 50, 2000);
    },
    maxRetriesPerRequest: 3,
  };

  try {
    redis = new Redis(redisConfig);
    
    // ✅ Event listeners SEULEMENT si Redis est créé
    redis.on('error', (err) => {
      console.error('❌ Redis connection error:', err.message);
    });

    redis.on('connect', () => {
      console.log('✅ Redis connected successfully');
    });

    redis.on('ready', () => {
      console.log('✅ Redis ready to accept commands');
    });
    
  } catch (err) {
    console.error('❌ Redis initialisation failed:', err.message);
    redis = null; // Fallback
  }
} else {
  console.log('[REDIS] disabled in this environment (DISABLE_REDIS=true or NODE_ENV=test)');
}

// Fallback si Redis n'est pas disponible
const createLimiter = (options) => {
  const { prefix, ...rateLimitOptions } = options || {};

  const baseConfig = {
    standardHeaders: true,
    legacyHeaders: false,
    ...rateLimitOptions,
  };

  // ✅ Vérifier que redis existe ET est connecté
  if (redis && (redis.status === 'ready' || redis.status === 'connect')) {
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