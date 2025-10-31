// config/rateLimiter.js
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';

// Configuration Redis avec gestion d'erreur
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
});

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