import db from "./db/connect_DB.js";
import Redis from 'ioredis';


export const initializeRedis = () => {
let redis = null;

    if (!process.env.DISABLE_REDIS && process.env.NODE_ENV !== 'test') {
    redis = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        retryStrategy: (times) => Math.min(times * 50, 2000),
        maxRetriesPerRequest: 3,
    });

    // ✅ Event listeners SEULEMENT si Redis est activé
    redis.on('error', (err) => {
        console.error('❌ Redis error:', err.message);
    });

    redis.on('connect', () => {
        console.log('✅ Redis connected');
    });

    redis.on('ready', () => {
        console.log('✅ Redis ready');
    });
    } else {
    console.log('[REDIS] disabled in this environment (DISABLE_REDIS=true or NODE_ENV=test)');
    }

  /**
 * Vérifie l'utilisateur avec cache Redis (30 secondes)
 */
  const verifyUserWithCache = async (id_user, pseudo, name) => {
    // Clé de cache unique
    const cacheKey = `user_verify:${id_user}:${pseudo}:${name}`;
    
    // Tenter de récupérer depuis le cache
    let cached = null;
    if (redis && typeof redis.get === 'function') {
      try {
        cached = await redis.get(cacheKey);
      } catch (e) {
        console.warn('[REDIS] get failed, continuing without cache', e && e.message);
      }
    }
    if (cached) {
      try { return JSON.parse(cached); } catch(e){ /* ignore parse error */ }
    }    
    // Sinon, vérifier en BDD
    const result = await db.query(`
      SELECT u.id_user, u.pseudo, u.name, r.role_name
      FROM users u
      LEFT JOIN roles r ON u.id_role = r.id_role
      WHERE u.id_user = $1 
        AND u.pseudo = $2 
        AND u.name = $3
    `, [id_user, pseudo, name]);
    
    if (result.rows.length === 0) {
      return null; // Utilisateur invalide
    }
    
    const user = result.rows[0];
    
    // Mettre en cache pour 30 secondes
    await redis.setex(cacheKey, 30, JSON.stringify(user));
    
    return user;
  };  

};