import jwt from 'jsonwebtoken';

/**
 * Génère un access token JWT
 * @param {object} payload - Données utilisateur
 * @param {boolean} rememberMe - Si true, token valide 30 jours, sinon 24h
 * @returns {string} Token JWT
 */
export const generateAccessToken = (payload, rememberMe = false) => {
  // Durée du token
  const expiresIn = rememberMe ? '30d' : '24h';
  
  return jwt.sign(
    {
      id_user: payload.id_user,
      pseudo: payload.pseudo,
      name: payload.name,
    },
    process.env.JWT_SECRET,
    { expiresIn }
  );
};

/**
 * Génère un refresh token (longue durée)
 * @param {object} payload - Données utilisateur minimales
 * @returns {string} Refresh token
 */
export const generateRefreshToken = (payload) => {
  return jwt.sign(
    {
      id_user: payload.id_user,
      type: 'refresh', // Identifier le type de token
    },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: '90d' } // 3 mois
  );
};

/**
 * Vérifie un token JWT
 * @param {string} token - Token à vérifier
 * @param {boolean} isRefreshToken - Si true, utilise JWT_REFRESH_SECRET
 * @returns {object|null} Payload décodé ou null si invalide
 */
export const verifyToken = (token, isRefreshToken = false) => {
  try {
    const secret = isRefreshToken 
      ? (process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET)
      : process.env.JWT_SECRET;
    
    return jwt.verify(token, secret);
  } catch (error) {
    console.error('Token verification failed:', error.message);
    return null;
  }
};

/**
 * Décode un token sans le vérifier (pour debug)
 * @param {string} token - Token à décoder
 * @returns {object|null} Payload décodé
 */
export const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    return null;
  }
};
