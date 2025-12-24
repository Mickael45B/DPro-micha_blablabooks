/**
 * Composant MainLayout - Structure principale de l'application
 * Gère l'affichage conditionnel des sections selon la taille d'écran
 * 
 * @param {React.ReactNode} children - Contenu principal à afficher
 * @param {React.ReactNode} contextualMenu - Contenu du menu contextuel (côté droit)
 */
import React from 'react';
import { useLocation } from 'react-router-dom';
import Header from './Header.jsx';
import Navigation from './navigation.jsx';
import { getUserFromToken } from './auth.jsx';
import '../css/mainLayout.css';

const MainLayout = ({ children, contextualMenu = null }) => {
  const location = useLocation();
  const userState = getUserFromToken();
  
  // Vérifier l'authentification et le rôle
  const isAuthenticated = !!userState;
  const userRole = userState?.groupe || null;
  
  // Générer le breadcrumb basé sur la route actuelle
  const getBreadcrumb = () => {
    const pathMap = {
      '/': 'Accueil',
      '/catalogue': 'Catalogue',
      '/mybiblilbooks': 'Ma Bibliothèque',
      '/profile': 'Mon Profil',
      '/adminDashboard': 'Administration',
      '/connexion': 'Connexion',
      '/inscription': 'Inscription'
    };
    
    // Gestion des routes dynamiques (ex: /livres/:id)
    if (location.pathname.startsWith('/livres/')) {
      return 'Catalogue > Détails du livre';
    }
    
    return pathMap[location.pathname] || 'Page';
  };

  return (
    <div className="principalContainer">
      {/* EN-TÊTE - Toujours présent */}
      <div className="headerContainer">
        <Header />
      </div>

      {/* CONTENEUR PRINCIPAL */}
      <div className="mainContainer">
        {/* MENU LATÉRAL - Desktop uniquement (≥ 900px) */}
        <div className="mainContainer__menu">
          <Navigation 
            isAuthenticated={isAuthenticated} 
            userRole={userRole} 
            isMobile={false}
          />
        </div>

        {/* CONTENU PRINCIPAL */}
        <div className="mainContainer__content">
          {/* Barre de recherche - Toujours présente */}
          <section className="mainContainer__recherche">
            <form className="search-form">
              <input 
                type="text" 
                placeholder="Rechercher un livre, un auteur..."
                className="search-input"
              />
              <button type="submit" className="search-button" aria-label="Rechercher">
                <i className="fas fa-search"></i>
              </button>
            </form>
          </section>

          {/* Breadcrumb - Toujours présent */}
          <section className="mainContainer__breadcrumb">
            <nav className="breadcrumb">
              <i className="fas fa-home"></i>
              <span className="breadcrumb__separator">/</span>
              <span className="breadcrumb__current">{getBreadcrumb()}</span>
            </nav>
          </section>

          {/* Contenu de la page (variable selon la route) */}
          <section className="mainContainer__contentParagraph">
            {children}
          </section>
        </div>

        {/* MENU CONTEXTUEL - Desktop uniquement (≥ 900px) */}
        <div className="mainContainer__contextualMenu">
          {contextualMenu || (
            <>
              <div className="contextualMenu__info">
                <h3>📚 Découvrez BlablaBooks</h3>
                <p>Gérez votre bibliothèque personnelle et partagez vos lectures favorites.</p>
              </div>
              <div className="contextualMenu__action">
                <h3>🚀 Commencez maintenant</h3>
                {!isAuthenticated ? (
                  <a href="/inscription" className="cta-button">
                    Créer un compte
                  </a>
                ) : (
                  <a href="/mybiblilbooks" className="cta-button">
                    Ma bibliothèque
                  </a>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* PIED DE PAGE - Toujours présent */}
      <div className="footerContainer">
        <h2 className="footerContainer__title">
          Rejoignez une communauté de passionnés de lecture
        </h2>
        <div className="footerContainer__stats">
          <div className="stat">
            <span className="stat__number">10K+</span>
            <span className="stat__label">Livres</span>
          </div>
          <div className="stat">
            <span className="stat__number">5K+</span>
            <span className="stat__label">Lecteurs</span>
          </div>
          <div className="stat">
            <span className="stat__number">15K+</span>
            <span className="stat__label">Avis</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainLayout;