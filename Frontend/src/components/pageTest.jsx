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
  console.log('🎨 MainContent is rendering!');
  
  return (
    <div style={{
      padding: '40px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '80vh',
      color: 'white',
      textAlign: 'center'
    }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '20px' }}>
        ✅ MainContent fonctionne !
      </h1>
      <p style={{ fontSize: '1.5rem', marginBottom: '20px' }}>
        Si vous voyez ce message, votre routing React fonctionne correctement.
      </p>
      <div style={{ 
        background: 'rgba(255,255,255,0.1)', 
        padding: '20px', 
        borderRadius: '10px',
        maxWidth: '600px',
        margin: '0 auto'
      }}>
        <h2>État de l'application :</h2>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li>✅ React Router : OK</li>
          <li>✅ Apollo Client : OK</li>
          <li>✅ Composant MainContent : OK</li>
        </ul>
      </div>
      <p style={{ marginTop: '40px', opacity: 0.8 }}>
        Une fois ce test validé, restaurez votre MainContent.jsx original avec Carousel, etc.
      </p>
    </div>
  );
};

export default MainContent;

