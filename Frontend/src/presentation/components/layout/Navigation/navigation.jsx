/**
 * Composant Navigation - Menu de navigation avec authentification
 */
import React from 'react';
import { useLocation } from 'react-router-dom';
import AccessibilityControls from '../../../../infrastructure/utils/helpers/AccessibilityControls.jsx';
import NavigationButton from '../../common/Button/Button.jsx';
import './navigation.css';

const Navigation = ({ 
  isAuthenticated = false, 
  userRole = null, 
  isMobile = false,
  onNavigate = () => {} 
}) => {
  const location = useLocation();
  
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
      roles: ['glossaire'],
      adminOnly: true
    }
  ];

  const isLinkVisible = (link) => {
    if (link.adminOnly) {
      return isAuthenticated && userRole === 'glossaire';
    }
    return true;
  };

  const isLinkClickable = (link) => {
    if (link.path === '/') return true;
    if (link.requiredAuth && !isAuthenticated) return false;
    if (link.roles.length > 0 && !link.roles.includes('all')) {
      return link.roles.includes(userRole);
    }
    return isAuthenticated;
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Contrôles d'accessibilité en haut du menu */}
      <AccessibilityControls />
      
      <nav className={`navigation ${isMobile ? 'navigation--mobile' : 'navigation--desktop'}`}>
        <ul className="navigation__list">
          {navigationLinks
            .filter(isLinkVisible)
            .map((link) => {
              const clickable = isLinkClickable(link);
              const active = isActive(link.path);
              
              return (
                <li 
                  key={link.path}
                  className={`
                    navigation__item 
                    ${!clickable ? 'navigation__item--disabled' : ''} 
                    ${active ? 'navigation__item--active' : ''}
                  `}
                >
                  <NavigationButton
                    to={link.path}
                    icon={link.icon}
                    label={link.label}
                    isActive={active}
                    isDisabled={!clickable}
                    onClick={clickable ? onNavigate : undefined}
                  />
                </li>
              );
            })}
        </ul>
      </nav>
    </>
  );
};

export default Navigation;
