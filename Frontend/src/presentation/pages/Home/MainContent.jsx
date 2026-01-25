/**
 * Composant MainContent qui affiche le contenu principal de la page.
 *
 * @returns {JSX.Element} Le composant MainContent rendu.
 */
import React from 'react';
// Importation des fichiers CSS
import '../../../index.css';
import './MainContent.css';
import '../../styles/MediaQueries.css';
import Carousel from '../../components/features/Carousel/Carousel.jsx'; // Importation du composant Carousel
import Header from "../../components/layout/Header/Header.jsx";


const MainContent = () => {
  return (
    //<main>
    <div className="main_content">
      {/* Section d'introduction */}
      <div className="principalContainer">
        <div className="headerContainer">
          {/* <h2 className="headerContainer__title">Pourquoi choisir BlablaBooks ?</h2> */}
          <Header />

        </div>
        <div className="mainContainer">
          <div className="mainContainer__menu">
            {/* <ul>
              <li>Catégorie 1</li>
              <li>Catégorie 2</li>
              <li>Catégorie 3</li>
            </ul> */}
          </div>
          <div className="mainContainer__content">
            <section className="mainContainer__recherche">
              <h1>Bienvenue sur BlablaBooks</h1>
            </section>
            <section className="mainContainer__breadcrumb">
              <h1>Bienvenue sur BlablaBooks</h1>
            </section>
            <section className="mainContainer__contentParagraph">
              <p>
                Découvrez une vaste sélection de livres pour tous les goûts. Que vous soyez passionné de fiction, de non-fiction, de science-fiction ou de romans classiques, BlablaBooks a quelque chose pour vous.
              </p>
              {/* Section promotionnelle */}
              <section className="paragraph_home ">
                <div className="right_content">
                <p>
                  Retrouvez et partagez tous vos livres en un clin d'œil avec <span className="colored_text">BlablaBooks</span>.
                  Essayez la version pro gratuitement pour un accès sans limite*.
                </p>
                </div>
                <div className="left_content">
                <button className="button_library">Essayer gratuitement*</button>
                </div>
              </section>

              {/* Section des livres les plus lus */}
              <section className="most_read">
                <h2>Les plus lus</h2>
              <Carousel reverse={true} speedClass="carousel-speed-2" />
              </section>

              {/* Section des nouveautés */}
              <section className="novelties">
                <h2>Les nouveautés</h2>
              <Carousel reverse={true} speedClass="carousel-speed-3" />
              </section>

              <p className="paragraph_home__small_text">
              * Essai gratuit de 30 jours, puis 9,99€ par mois ou 99,99€ à l'année
              </p>
            </section>
            
            {/* <Carousel reverse={true} speedClass="carousel-speed-2" /> */}
          </div>
          <div className="mainContainer__contextualMenu">
            <div className="contextualMenu__info">
              <h3>Rejoignez-nous aujourd'hui !</h3>
            </div>
            <div className="contextualMenu__action">
              <h3>Commencez votre aventure de lecture</h3>
            </div>
          </div>










        </div>
        <div className="footerContainer">
          <h2 className="footerContainer__title">Rejoignez une communauté de passionnés</h2>
        </div>
      </div>
    </div>
    //</main>
  );
};

export default MainContent;

