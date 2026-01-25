/**
 * Composant Navigation - Gère le menu de navigation avec authentification
 * 
 * @param {boolean} isAuthenticated - Indique si l'utilisateur est connecté
 * @param {string} userRole - Rôle de l'utilisateur (user, admin, glossaire)
 * @param {boolean} isMobile - Indique si le menu est en mode burger (mobile)
 */
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import AccessibilityControls from '../../../../infrastructure/utils/helpers/AccessibilityControls.jsx';
import './navigation.css';

const Navigation = ({ isAuthenticated = false, userRole = null, isMobile = false }) => {
  const location = useLocation();
  
  // Configuration des liens de navigation avec permissions
  const navigationLinks = [
    {
      path: '/',
      label: 'Accueil',
      icon: 'fas fa-home',
      requiredAuth: false,
      roles: ['all']
    },
    {
      path: '/catalogue',
      label: 'Catalogue',
      icon: 'fas fa-book',
      requiredAuth: true,
      roles: ['all']
    },
    {
      path: '/mybiblilbooks',
      label: 'Ma Bibliothèque',
      icon: 'fas fa-bookmark',
      requiredAuth: true,
      roles: ['all']
    },
    {
      path: '/profile',
      label: 'Mon Profil',
      icon: 'fas fa-user-circle',
      requiredAuth: true,
      roles: ['all']
    },
    {
      path: '/adminDashboard',
      label: 'Administration',
      icon: 'fas fa-cog',
      requiredAuth: true,
      roles: ['glossaire'], // Seulement pour les admins
      adminOnly: true // Flag pour masquer complètement si non admin
    }
  ];

  // Fonction pour vérifier si un lien doit être visible
  const isLinkVisible = (link) => {
    // Si c'est un lien admin uniquement, vérifier le rôle
    if (link.adminOnly) {
      return isAuthenticated && userRole === 'glossaire';
    }
    // Tous les autres liens sont toujours visibles
    return true;
  };

  // Fonction pour vérifier si un lien est cliquable
  const isLinkClickable = (link) => {
    // L'accueil est toujours cliquable
    if (link.path === '/') return true;
    
    // Si le lien nécessite une authentification
    if (link.requiredAuth && !isAuthenticated) return false;
    
    // Si le lien a des restrictions de rôle
    if (link.roles.length > 0 && !link.roles.includes('all')) {
      return link.roles.includes(userRole);
    }
    
    return isAuthenticated;
  };

  // Fonction pour vérifier si c'est la page active
  const isActive = (path) => {
    return location.pathname === path;
  };

return (
<>
      {/* Contrôles d'accessibilité en haut du menu */}
      <AccessibilityControls />

  
    <nav className={`navigation ${isMobile ? 'navigation--mobile' : 'navigation--desktop'}`}>
      <ul className="navigation__list">
        {navigationLinks
          .filter(link => isLinkVisible(link)) // Filtrer les liens non visibles
          .map((link) => {
            const clickable = isLinkClickable(link);
            const active = isActive(link.path);
            
            return (
              <li 
                key={link.path}
                className={`navigation__item ${!clickable ? 'navigation__item--disabled' : ''} ${active ? 'navigation__item--active' : ''}`}
              >
                {clickable ? (
                  <Link 
                    to={link.path}
                    className="navigation__link"
                    title={link.label}
                  >
                    <i className={link.icon}></i>
                    <span>{link.label}</span>
                  </Link>
                ) : (
                  <span 
                    className="navigation__link navigation__link--disabled"
                    title={`${link.label} - Connexion requise`}
                  >
                    <i className={link.icon}></i>
                    <span>{link.label}</span>
                    <i className="fas fa-lock navigation__lock"></i>
                  </span>
                )}
              </li>
            );
          })}
      </ul>
    </nav>
  </>

  );
};

export default Navigation;