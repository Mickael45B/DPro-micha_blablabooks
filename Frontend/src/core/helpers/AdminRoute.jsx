/**
 * AdminRoute - Route protégée pour les administrateurs
 * Vérifie que l'utilisateur a le groupe "glossaire"
 */
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { getUserFromToken, isUserAdmin } from '../../data/graphql/queries/auth.jsx';

const AdminRoute = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const currentUser = getUserFromToken();
      //console.log('AdminRoute - Current user:', currentUser);
      setUser(currentUser);
      setLoading(false);
    };

    checkAuth();

    // Écouter les changements d'authentification
    const handleAuthChange = () => {
      checkAuth();
    };

    window.addEventListener('authChanged', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);

    return () => {
      window.removeEventListener('authChanged', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, []);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        color: '#fff'
      }}>
        <div>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: '2em' }}></i>
          <p>Vérification des permissions...</p>
        </div>
      </div>
    );
  }

  // Pas d'utilisateur connecté
  if (!user) {
    //console.log('AdminRoute - No user, redirecting to /connexion');
    return <Navigate to="/connexion" replace />;
  }

  // Vérifier si l'utilisateur est admin (groupe = "glossaire")
  const admin = isUserAdmin();
  //console.log('AdminRoute - Is admin?', admin, 'User groupe:', user.groupe);

  if (!admin) {
    //console.log('AdminRoute - Not admin, redirecting to /forbidden');
    return <Navigate to="/forbidden" replace />;
  }

  // L'utilisateur est admin, afficher le contenu
  //console.log('AdminRoute - Access granted');
  return children;
};

export default AdminRoute;






















/*

import React from "react";
import { Navigate } from "react-router-dom";
import { getUserFromToken } from "./auth.jsx";

export default function AdminRoute({ children }) {
  const user = getUserFromToken();
  if (!user) return <Navigate to="/connexion" replace />;
  const roleName = user.role?.role_name || user.role || null;
if (roleName !== "admin") return <Navigate to="/forbidden" replace />;
  // Si le rôle est admin, afficher les enfants
  return children;
}
  */