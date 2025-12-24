import React from "react";
import { Link } from "react-router-dom";

const Forbidden = () => (
  <div style={{ padding: 24 }}>
    <h1>Accès refusé</h1>
    <p>Vous n'avez pas les droits pour accéder à cette page.</p>
    <p><Link to="/">Retour à l'accueil</Link></p>
  </div>
);

export default Forbidden;