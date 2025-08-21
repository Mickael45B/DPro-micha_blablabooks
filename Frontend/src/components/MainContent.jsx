/**
 * Composant MainContent qui affiche le contenu principal de la page.
 *
 * @returns {JSX.Element} Le composant MainContent rendu.
 */
import React from 'react';
// Importation des fichiers CSS
import '../css/index.css';
import '../css/MainContent.css';
import '../css/MediaQueries.css';
import Carousel from './Carousel.jsx'; // Importation du composant Carousel

const MainContent = () => {
  return (
    //<main>
      <div className="main_content">
      {/* Section d'introduction */}
      <section className="paragraph_home">
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
        <div className="book-list scroll-horizontal">
          <Carousel reverse={false} speedClass="carousel-speed-1" isFirstCarousel={true} />
        </div>
      </section>

      {/* Section des nouveautés */}
      <section className="novelties">
        <h2>Les nouveautés</h2>
        <div className="book-grid">
          <Carousel reverse={true} speedClass="carousel-speed-2" />
          <Carousel reverse={false} speedClass="carousel-speed-3" />
        </div>
      </section>
      <p className="paragraph_home__small_text">
      * Essai gratuit de 30 jours, puis 9,99€ par mois ou 99,99€ à l'année
       </p>
    </div>
    //</main>
  );
};

export default MainContent;

