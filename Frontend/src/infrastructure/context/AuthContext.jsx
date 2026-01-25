import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getUserFromToken } from "../../data/graphql/queries/auth.jsx";

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

// Fournisseur de contexte d'authentification
  // Gère l'état de l'utilisateur et les fonctions de connexion/déconnexion
  // Fournit ces valeurs aux composants enfants via le contexte
  // Utilise le token stocké dans le localStorage pour initialiser l'utilisateur
  // Écoute les changements de stockage pour mettre à jour l'utilisateur en conséquence
  
function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getUserFromToken());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "token") {
        setUser(getUserFromToken());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const login = (token) => {
    try {
      localStorage.setItem("token", token);
    } catch (e) {}
    setUser(getUserFromToken());
  };

  const logout = () => {
    try {
      localStorage.removeItem("token");
    } catch (e) {}
    setUser(null);
  };

  const isAdmin = useCallback(() => {
  //   return !!(user && (user.role?.role_name === "admin" || user.role === "admin" || user.role_name === "admin"));
  // }, [user]);

    // Utilise "groupe" au lieu de "role"
    // "glossaire" = vrai admin, "admin" = honeypot
    return !!(user && user.groupe === "glossaire");
  }, [user]);
  

  const updateUser = useCallback((updatedData) => {
    const updatedUser = { ...user, ...updatedData };
    setUser(updatedUser);
    try {
      localStorage.setItem("user", JSON.stringify(updatedUser));
    } catch (e) {}
  }, [user]);

  const value = {
    user,
    loading,
    login,
    logout,
    isAdmin,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;
