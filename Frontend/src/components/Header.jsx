/**
 * Composant Header mis à jour avec Navigation
 */
import React, { useState, useEffect, useRef } from "react";
import { toggleNav, closeNavOnOutsideClick, closeNavOnEscape } from "../services/burgerMenu.js";
import { useNavigate } from "react-router-dom";
import { getUserFromToken, clearAuth } from "./auth.jsx";
import Navigation from "./navigation.jsx";
import logoTitre from '../assets/logoTitre.png';
import "../css/index.css";
import "../css/Header.css";
import "../css/NavBar.css";
import "../css/MediaQueries.css";

const Header = () => {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const navigate = useNavigate();
  const navRef = useRef(null);
  
  const [userState, setUserState] = useState(() => getUserFromToken());
  
  // Vérifier le rôle admin
  const isAdmin = userState?.groupe === "glossaire";
  
  // Debug
  useEffect(() => {
    console.log('Header - User state:', userState);
    console.log('Header - Is admin?', isAdmin);
  }, [userState, isAdmin]);

  useEffect(() => {
    const cleanupOutsideClick = closeNavOnOutsideClick(setIsNavOpen, navRef);
    const cleanupEscape = closeNavOnEscape(setIsNavOpen);

    const onStorage = (e) => {
      if (e.key === "token" || e.key === "auth") {
        setUserState(getUserFromToken());
      }
    };
    
    const onAuthChanged = (e) => {
      setUserState(getUserFromToken());
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("authChanged", onAuthChanged);
    
    return () => {
      cleanupOutsideClick();
      cleanupEscape();
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("authChanged", onAuthChanged);
    };
  }, []);

  const handleLogout = () => {
    try { localStorage.removeItem("token"); } catch (e) {}
    clearAuth();
    setUserState(null);
    navigate('/');
  };

  return (
    <header className="header">
      {/* Logo */}
      <a href="/" className="logo_link">
        <img className="logo" src={logoTitre} alt="BlablaBooks Logo" />
      </a>

      {/* Actions */}
      <div className="header__actions">
        
        <span className="separation">|</span>

        {/* Authentification */}
        {!userState ? (
          <button className="header__auth" type="button" onClick={() => navigate('/connexion')}>
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
              <span className="connect">
                Bonjour {userState.pseudo || userState.name || 'Utilisateur'}
              </span>
              <i className="fas fa-user" />
            </button>
            <button
              className="header__logout"
              type="button"
              onClick={handleLogout}
              aria-label="Se déconnecter"
              style={{ marginLeft: 8 }}
            >
              <span>Déco</span>
            </button>
          </>
        )}

        <span className="separation">|</span>

        {/* Bouton burger - Mobile seulement */}
        <button
          className="menu-toggle"
          type="button"
          onClick={() => toggleNav(setIsNavOpen)}
          aria-label="Open navigation menu"
        >
          <i className="fas fa-bars" />
        </button>
      </div>

      {/* Menu burger avec Navigation */}
      <nav
        ref={navRef}
        className={`header__nav ${isNavOpen ? "header__nav--open" : ""}`}
      >
        <button
          className="header__nav-close"
          type="button"
          onClick={() => toggleNav(setIsNavOpen)}
          aria-label="Close navigation menu"
        >
          <i className="fas fa-times" />
        </button>
        
        {/* Utilisation du composant Navigation en mode mobile */}
        <Navigation 
          isAuthenticated={!!userState} 
          userRole={userState?.groupe || null} 
          isMobile={true}
        />
      </nav>
    </header>
  );
};

export default Header;