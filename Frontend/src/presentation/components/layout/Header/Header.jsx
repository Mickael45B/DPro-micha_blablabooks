/**
 * Composant Header avec menu burger fonctionnel
 */
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getUserFromToken, clearAuth } from "../../../../data/graphql/queries/auth.jsx";
import Navigation from "../Navigation/navigation.jsx";
import logoAvecTitre from '/logoAvecTitre.png';
import logoSansTitre from '/logoSansTitre.png';
import "./Header.css";

const Header = () => {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 576);
  const navigate = useNavigate();
  const navRef = useRef(null);
  const welcomeTextRef = useRef(null);
  
  const [userState, setUserState] = useState(() => getUserFromToken());
  
  // Gérer le redimensionnement
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 576);
      if (window.innerWidth >= 900) {
        setIsNavOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Gérer l'authentification
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "token" || e.key === "auth") {
        setUserState(getUserFromToken());
      }
    };

    const onAuthChanged = () => {
      setUserState(getUserFromToken());
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("authChanged", onAuthChanged);
    
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("authChanged", onAuthChanged);
    };
  }, []);

  // Bloquer le scroll quand le menu est ouvert
  useEffect(() => {
    if (isNavOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isNavOpen]);

  // Fermer avec Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isNavOpen) {
        setIsNavOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isNavOpen]);

  const toggleNav = () => {
    setIsNavOpen(prev => !prev);
  };

  const closeNav = () => {
    setIsNavOpen(false);
  };

  const handleLogout = () => {
    try { 
      localStorage.removeItem("token"); 
    } catch (e) {}
    clearAuth();
    setUserState(null);
    closeNav();
    navigate('/');
  };

  return (
    <>
      <header className="header">
        <a href="/" className="logo_link">
          <img 
            className="logo" 
            src={isMobile ? logoSansTitre : logoAvecTitre} 
            alt="BlablaBooks Logo" 
          />
        </a>

        <div className="header__actions">
          {!userState ? (
            <button 
              className="header__auth" 
              type="button" 
              onClick={() => navigate('/connexion')}
            >
              <span className="connect">Se connecter</span>
              <i className="fas fa-user" />
            </button>
          ) : (
            <>
              <button
                className="header__auth"
                type="button"
                onClick={() => navigate('/profile')}
                aria-label="Aller au profil"
              >
                <span ref={welcomeTextRef} className="connect">
                  <span className="hello">Bonjour </span>
                  {userState.pseudo || userState.name || 'Utilisateur'}
                </span>
                <i className="fas fa-user" />
              </button>
              
              <button
                className="header__logout"
                type="button"
                onClick={handleLogout}
                aria-label="Se déconnecter"
              >
                <span className="separation">|</span>
                <span className="logoutsection">
                  <img className="logoutIcon" src="/log-out-outline.svg" alt="Logout" />
                </span>
              </button>
            </>
          )}

          <button
            className="menu-toggle"
            type="button"
            onClick={toggleNav}
            aria-label={isNavOpen ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={isNavOpen}
          >
            <i className="fas fa-bars" />
          </button>
        </div>
      </header>

      <div 
        className={`header__nav-overlay ${isNavOpen ? 'header__nav-overlay--open' : ''}`}
        onClick={closeNav}
        aria-hidden="true"
      />

      <nav
        ref={navRef}
        className={`header__nav ${isNavOpen ? "header__nav--open" : ""}`}
        aria-label="Menu principal"
      >
        <button
          className="header__nav-close"
          type="button"
          onClick={closeNav}
          aria-label="Fermer le menu"
        >
          <i className="fas fa-times" />
        </button>
        
        <div className="header__nav-content">
          <Navigation 
            isAuthenticated={!!userState} 
            userRole={userState?.groupe || null} 
            isMobile={true}
            onNavigate={closeNav}
          />
        </div>
      </nav>
    </>
  );
};

export default Header;
