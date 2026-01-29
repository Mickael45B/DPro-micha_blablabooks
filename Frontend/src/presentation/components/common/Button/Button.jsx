/**
 * Composant NavigationButton
 * Bouton de navigation réutilisable
 */
import React from 'react';
import { Link } from 'react-router-dom';
import './Button.css';

const NavigationButton = ({ 
  to, 
  icon, 
  label, 
  isActive = false, 
  isDisabled = false,
  onClick
}) => {
  const buttonClasses = [
    'nav-button',
    isActive && 'nav-button--active',
    isDisabled && 'nav-button--disabled'
  ].filter(Boolean).join(' ');

  if (isDisabled) {
    return (
      <span 
        className={buttonClasses}
        title={`${label} - Connexion requise`}
      >
        <i className={icon}></i>
        <span className="nav-button__label">{label}</span>
        <i className="fas fa-lock nav-button__lock"></i>
      </span>
    );
  }

  return (
    <Link 
      to={to}
      className={buttonClasses}
      title={label}
      onClick={onClick}
    >
      <i className={icon}></i>
      <span className="nav-button__label">{label}</span>
    </Link>
  );
};

export default NavigationButton;
