import React from "react";
import { Link } from "react-router-dom";
import Header from '../../layout/Header/Header.jsx';
// import Sidebar from './Sidebar';
import Footer from '../../layout/Footer/Footer.jsx';




const Forbidden = () => {
  return (
        <div className="min-h-screen flex flex-col">
          <Header />
          <div style={{ padding: 24 }}>
            <h1>Accès refusé</h1>
            <p>Vous n'avez pas les droits pour accéder à cette page.</p>
            <p><Link to="/">Retour à l'accueil</Link></p>
          </div>
          <Footer />
        </div>
  );
};

export default Forbidden;