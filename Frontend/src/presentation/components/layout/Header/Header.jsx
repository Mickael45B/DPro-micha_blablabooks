/**
 * Composant Header mis à jour avec Navigation et logo responsive
 */
import React, { useState, useEffect, useRef } from "react";
import { toggleNav, closeNavOnOutsideClick, closeNavOnEscape } from "../../../../../A_Ranger/burgerMenu.js";
import { useNavigate } from "react-router-dom";
import { getUserFromToken, clearAuth } from "../../../../data/graphql/queries/auth.jsx";
import Navigation from "../Navigation/navigation.jsx";
import logoAvecTitre from '/logoAvecTitre.png';
import logoSansTitre from '/logoSansTitre.png';
import "../../../../index.css";
import "./Header.css";
import "../../../../presentation/styles/NavBar.css";
import "../../../styles/MediaQueries.css";
import { fitTextToLines } from "../../../../infrastructure/utils/helpers/multilignes.js";

const Header = () => {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 576);
  const navigate = useNavigate();
  
  // Toutes les refs doivent être déclarées en haut du composant
  const navRef = useRef(null);
  const welcomeTextRef = useRef(null);
  
  const [userState, setUserState] = useState(() => getUserFromToken());
  
  // Vérifier le rôle admin
  const isAdmin = userState?.groupe === "glossaire";
  
  // Gérer le redimensionnement pour le logo responsive
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 576);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Debug
  useEffect(() => {
    console.log('Header - User state:', userState);
    console.log('Header - Is admin?', isAdmin);
  }, [userState, isAdmin]);

  // Appliquer fitTextToLines après le rendu
  useEffect(() => {
    if (welcomeTextRef.current && userState) {
      fitTextToLines(welcomeTextRef.current, { maxLines: 2, max: 16, min: 10 });
    }
  }, [userState]);

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
      {/* Logo responsive */}
      <a href="/" className="logo_link">
        <img 
          className="logo" 
          src={isMobile ? logoSansTitre : logoAvecTitre} 
          alt="BlablaBooks Logo" 
        />
      </a>

      {/* Actions */}
      <div className="header__actions">
        
        

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
              <span ref={welcomeTextRef} className="connect">
                <span className="hello">Bonjour </span> {userState.pseudo || userState.name || 'Utilisateur'}
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
                {/* Déco */}
                <img className="logoutIcon" src="/log-out-outline.svg" alt="Logout icon" />
                </span>
            </button>
          </>
        )}

        {/* <span className="separation">|</span> */}

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