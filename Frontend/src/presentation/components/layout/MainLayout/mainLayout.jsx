/**
 * Composant MainLayout - Structure principale de l'application
 * Gère l'affichage conditionnel des sections selon la taille d'écran
 * 
 * @param {React.ReactNode} children - Contenu principal à afficher
 * @param {React.ReactNode} contextualMenuAction - Contenu personnalisé du menu d'action (côté droit, optionnel)
 * @param {boolean} showSearch - Afficher/masquer la barre de recherche (défaut: true)
 * @param {boolean} showBreadcrumb - Afficher/masquer le breadcrumb (défaut: true)
 * @param {string} customBreadcrumb - Breadcrumb personnalisé (optionnel)
 */
import React from 'react';
import { useLocation } from 'react-router-dom';
import Header from '../Header/Header.jsx';
import Navigation from '../Navigation/navigation.jsx';
import { getUserFromToken } from '../../../../data/graphql/queries/auth.jsx';
import './mainLayout.css';
import { useQuery } from '@apollo/client';
import { GET_BOOKS } from '../../../../data/graphql/queries/queriesBooks.jsx';
import { GET_NUMBER_OF_USERS, GET_NUMBER_OF_REVIEWS } from '../../../../data/graphql/queries/connecting.jsx';


const MainLayout = ({ 
  children, 
  contextualMenuAction = null,
  showSearch = true,
  showBreadcrumb = true,
  customBreadcrumb = null
}) => {
  const location = useLocation();
  const userState = getUserFromToken();
  
    // Requête pour récupérer les livres
    const { data, loading, error } = useQuery(GET_BOOKS, {
        variables: {
            limit: 100,
            offset: 0
        },
        fetchPolicy: 'network-only'
    });

    const { data: usersData } = useQuery(GET_NUMBER_OF_USERS, {
        variables: {
            limit: 5,
            offset: 0
        },
        fetchPolicy: 'network-only'
    });

    const { data: reviewsData } = useQuery(GET_NUMBER_OF_REVIEWS, {
        variables: {
            limit: 5,
            offset: 0
        },
        fetchPolicy: 'network-only'
    });

  // Vérifier l'authentification et le rôle
  const isAuthenticated = !!userState;
  const userRole = userState?.groupe || null;
  
  // Générer le breadcrumb basé sur la route actuelle
  const getBreadcrumb = () => {
    // Si un breadcrumb personnalisé est fourni, l'utiliser
    if (customBreadcrumb) return customBreadcrumb;
    
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

  // Menu d'action par défaut (CTA standard)
  const defaultContextualMenuAction = (
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
  );

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
          {/* Barre de recherche - Conditionnelle */}
          {showSearch && (
            <section className="mainContainer__recherche">
              <form className="search-form">
                <input 
                  type="text" 
                  placeholder="Rechercher un livre, un auteur..."
                  className="search-input"
                />
                <button type="submit" className="search-button" aria-label="Rechercher">
                  <span>Rechercher</span>
                  <i className="fas fa-search"></i>
                </button>
              </form>
            </section>
          )}

          {/* Breadcrumb - Conditionnel */}
          {showBreadcrumb && (
            <section className="mainContainer__breadcrumb">
              <nav className="breadcrumb">

                {/* l'icone maison est un lien vers l'acceuil */}
                <a href="/" aria-label="Accueil">
                  <i className="fas fa-home"></i>
                </a>

                <span className="breadcrumb__separator">/</span>
                
                <span className="breadcrumb__current"
                onClick={() => window.location.reload()}
                style={{ cursor: 'pointer' }}
                title="Cliquer pour actualiser"
                aria-label="Breadcrumb actuel"
                >{getBreadcrumb()}</span>

              </nav>
            </section>
          )}

          {/* Contenu de la page (variable selon la route) */}
          <section className="mainContainer__contentParagraph">
            {children}
          </section>
        </div>

        {/* MENU CONTEXTUEL - Desktop uniquement (≥ 900px) */}
        <div className="mainContainer__contextualMenu">

          {/* Stats toujours affichées */}
          <div className="contextualMenu__info">
            <h2 className="footerContainer__title">
              Rejoignez une communauté de passionnés de lecture
            </h2>
            <div className="footerContainer__stats">
              <div className="stat">
                <span className="stat__number">{data?.getBooks?.totalCount || 0}</span>
                <span className="stat__label">Livres</span>
              </div>

              <div className="stat">
                <span className="stat__number">{usersData?.getTotalUsersCount || 0}</span>
                <span className="stat__label">Lecteurs</span>
              </div>

              <div className="stat">
                <span className="stat__number">{reviewsData?.getTotalReviewsCount || 0}</span>
                <span className="stat__label">Avis</span>
              </div>
            </div>
          </div>

          {/* Section d'action personnalisable ou par défaut */}
          {contextualMenuAction || defaultContextualMenuAction}

        </div>
      </div>



    </div>
  );
};

export default MainLayout;