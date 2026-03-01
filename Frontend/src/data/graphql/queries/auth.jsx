import { gql } from '@apollo/client';

// ========================================
// MUTATIONS EXISTANTES (à garder)
// ========================================

export const LOGIN_MUTATION = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      accessToken
      refresh_token
      user {
        id_user
        pseudo
        name
        email
        role {
          id_role
          role_name
        }
        status {
          id_status
          status_name
        }
      }
    }
  }
`;

export const REGISTER_MUTATION = gql`
  mutation createUser($input: CreateUserInput!) {
    createUser(input: $input) {
      accessToken
      refreshToken
      user {
        id_user
        pseudo
        name
        email
      }
    }
  }
`;

// ========================================
// NOUVELLES MUTATIONS
// ========================================

/**
 * Mutation pour débloquer son propre compte (status 3 -> 1)
 */
export const UNBLOCK_ACCOUNT_MUTATION = gql`
  mutation UnblockAccount($input: UnblockAccountInput!) {
    unblockAccount(input: $input)
  }
`;

/**
 * Mutation pour demander le déblocage à un admin (status 2 ou 4)
 * Crée un message automatique pour les admins
 */
export const REQUEST_ADMIN_UNBLOCK_MUTATION = gql`
  mutation RequestAdminUnblock($input: RequestAdminUnblockInput!) {
    requestAdminUnblock(input: $input)  }
`;

/**
 * Mutation pour générer un code de réinitialisation de mot de passe
 */
export const REQUEST_PASSWORD_RESET_MUTATION = gql`
  mutation RequestPasswordReset($input: RequestPasswordResetInput!) {
    requestPasswordReset(input: $input)
  }
`;

/**
 * Mutation pour réinitialiser le mot de passe avec le code
 */
export const RESET_PASSWORD_MUTATION = gql`
  mutation ChangePassword($input: ChangePasswordInput!) {
    changePassword(input: $input)
  }
`;

//deleteUser
export const DELETE_USER_MUTATION = gql`
  mutation DeleteUser($input: DeleteUserInput!) {
    deleteUser(input: $input)
  }
`;

// ========================================
// FONCTIONS UTILITAIRES
// ========================================

/**
 * Sauvegarde les données d'authentification dans le localStorage
 * @param {object} authPayload - Données retournées par login/register
 * @returns {boolean} - true si succès
 */
export const saveAuthPayload = (authPayload) => {
  try {
    if (!authPayload) {
      console.error('Aucune donnée d\'authentification à sauvegarder');
      return false;
    }

    // Sauvegarder les tokens
    if (authPayload.accessToken) {
      localStorage.setItem('token', authPayload.accessToken);
    }
    
    if (authPayload.refresh_token) {
      localStorage.setItem('refresh_token', authPayload.refresh_token);
    }

    // Sauvegarder les informations utilisateur
    if (authPayload.user) {

      const userToSave = {
        id_user: authPayload.user.id_user,
        email: authPayload.user.email,
        pseudo: authPayload.user.pseudo,
        name: authPayload.user.name,
        id_role: authPayload.user.id_role,
        // IMPORTANT: Récupérer le role_name depuis user.role.role_name
        groupe: authPayload.user.role?.role_name || null
      };
      
      localStorage.setItem('auth', JSON.stringify(userToSave));
      
      // Dispatch custom event pour notifier les autres composants
      window.dispatchEvent(new Event('authChanged'));
      
      //console.log('User saved:', userToSave);
    }

    //console.log('✅ Données d\'authentification sauvegardées');
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde:', error);
    return false;
  }
};

/**
 * Récupère les données d'authentification du localStorage
 * @returns {object|null} - Les données ou null
 */
export const getAuthData = () => {
  try {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;

    if (!accessToken) {
      return null;
    }

    return {
      accessToken,
      refreshToken,
      user
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des données:', error);
    return null;
  }
};

/**
 * Supprime les données d'authentification du localStorage
 */
export const clearAuthData = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  //console.log('Données d\'authentification supprimées');
};

/**
 * Vérifie si l'utilisateur est authentifié
 * @returns {boolean}
 */
export const isAuthenticated = () => {
  const authData = getAuthData();
  return authData !== null && authData.accessToken !== null;
};

/**
 * Récupère le statut du compte utilisateur
 * @returns {object|null} - { id_status, status_name } ou null
 */
export const getUserStatus = () => {
  const authData = getAuthData();
  return authData?.user?.status || null;
};

/**
 * Vérifie si le compte est bloqué
 * @returns {boolean}
 */
export const isAccountBlocked = () => {
  const status = getUserStatus();
  if (!status) return false;
  
  // Statuts bloqués : 2 (admin), 3 (self), 4 (both)
  return [2, 3, 4].includes(status.id_status);
};

// Récupère le token depuis localStorage
export const getToken = () => {
  try {
    return localStorage.getItem('token');
  } catch (e) {
    console.error('Error getting token:', e);
    return null;
  }
};

// Parse le payload JWT (attention: ne contient pas toutes les infos user)
export const parseJwtPayload = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Error parsing JWT:', e);
    return null;
  }
};


// Récupère les données complètes de l'utilisateur
export const getUserFromToken = () => {
  try {
    // D'abord, essayer de récupérer depuis localStorage 'auth'
    const authData = localStorage.getItem('auth');
    if (authData) {
      const user = JSON.parse(authData);
      //console.log('User from auth storage:', user);
      return user;
    }
    
    // Si pas de données auth, essayer de parser le token
    const token = getToken();
    if (token) {
      const payload = parseJwtPayload(token);
      //console.log('User from JWT payload:', payload);
      
      // Le JWT ne contient que des infos basiques
      // Il faudra faire un appel API pour récupérer le rôle complet
      return {
        id_user: payload.id_user,
        pseudo: payload.pseudo,
        name: payload.name,
        groupe: null // Le JWT ne contient pas le groupe
      };
    }
    
    return null;
  } catch (e) {
    console.error('Error getting user from token:', e);
    return null;
  }
};

// Vérifie si l'utilisateur est admin (groupe = "glossaire")
export const isUserAdmin = () => {
  const user = getUserFromToken();
  //console.log('Checking admin status for user:', user);
  
  if (!user) {
    //console.log('No user found');
    return false;
  }
  
  const isAdmin = user.groupe === 'glossaire';
  //console.log(`User groupe: ${user.groupe}, isAdmin: ${isAdmin}`);
  
  return isAdmin;
};


// Nettoie toutes les données d'authentification
export const clearAuth = () => {
  try {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('auth');
    
    // Dispatch custom event
    window.dispatchEvent(new Event('authChanged'));
    
    //console.log('Auth cleared');
  } catch (e) {
    console.error('Error clearing auth:', e);
  }
};

// Vérifie si le token est expiré
export const isTokenExpired = (token) => {
  try {
    const payload = parseJwtPayload(token);
    if (!payload || !payload.exp) return true;
    
    const now = Math.floor(Date.now() / 1000);
    return payload.exp < now;
  } catch (e) {
    return true;
  }
};

// Récupère le token valide (refresh si nécessaire)
export const getValidToken = async () => {
  const token = getToken();
  
  if (!token) return null;
  
  if (isTokenExpired(token)) {
    // TODO: Implémenter le refresh token
    console.warn('Token expired, should refresh');
    return null;
  }
  
  return token;
};

/*export default {
  getToken,
  parseJwtPayload,
  saveAuthPayload,
  getUserFromToken,
  isUserAdmin,
  clearAuth,
  isTokenExpired,
  getValidToken
};*/