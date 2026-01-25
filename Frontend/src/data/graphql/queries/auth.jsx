/**
 * Fichier auth.jsx corrigé pour gérer correctement le rôle admin
 */

import { gql } from '@apollo/client';

export const LOGIN_MUTATION = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      accessToken
      refresh_token
      user {
        id_user
        email
        pseudo
        name
        id_role
        role {
          role_name
        }
      }
    }
  }
`;

export const LOGOUT_MUTATION = gql`
  mutation Logout {
    logout
  }
`;

export const REGISTER_MUTATION = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      
      user {
        id_user
        email
        pseudo
        name
      }
    }
  }
`;


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

// Sauvegarde les données complètes de l'utilisateur (incluant le rôle)
export const saveAuthPayload = (authPayload) => {
  try {
    // Sauvegarder le token
    if (authPayload.accessToken) {
      localStorage.setItem('token', authPayload.accessToken);
    }
    
    // Sauvegarder le refresh token
    if (authPayload.refresh_token) {
      localStorage.setItem('refresh_token', authPayload.refresh_token);
    }
    
    // Sauvegarder les données complètes de l'utilisateur
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
      
      console.log('User saved:', userToSave);
    }
    
    return true;
  } catch (e) {
    console.error('Error saving auth payload:', e);
    return false;
  }
};

// Récupère les données complètes de l'utilisateur
export const getUserFromToken = () => {
  try {
    // D'abord, essayer de récupérer depuis localStorage 'auth'
    const authData = localStorage.getItem('auth');
    if (authData) {
      const user = JSON.parse(authData);
      console.log('User from auth storage:', user);
      return user;
    }
    
    // Si pas de données auth, essayer de parser le token
    const token = getToken();
    if (token) {
      const payload = parseJwtPayload(token);
      console.log('User from JWT payload:', payload);
      
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
  console.log('Checking admin status for user:', user);
  
  if (!user) {
    console.log('No user found');
    return false;
  }
  
  const isAdmin = user.groupe === 'glossaire';
  console.log(`User groupe: ${user.groupe}, isAdmin: ${isAdmin}`);
  
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
    
    console.log('Auth cleared');
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

export default {
  getToken,
  parseJwtPayload,
  saveAuthPayload,
  getUserFromToken,
  isUserAdmin,
  clearAuth,
  isTokenExpired,
  getValidToken
};