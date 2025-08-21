/**
 * Composant ParentComponent qui affiche plusieurs carrousels.
 *
 * @returns {JSX.Element} Le composant ParentComponent rendu.
 */
import React from 'react';
import Carousel from './Carousel'; // Importation du composant Carousel
// Importation des fichiers CSS
import '../css/index.css';
import '../css/MainContent.css';
import '../css/MediaQueries.css';

const ParentComponent = () => {
  return (
    <div>
      {/* Premier carousel avec défilement normal */}
      <Carousel reverse={false} speedClass="carousel-speed-1" />
      {/* Deuxième carousel avec défilement inversé */}
      <Carousel reverse={true} speedClass="carousel-speed-2" />
      {/* Troisième carousel avec défilement normal */}
      <Carousel reverse={false} speedClass="carousel-speed-3" />
    </div>
  );
};

export default ParentComponent;
