/**
 * Composant Footer qui affiche le pied de page de l'application.
 *
 * @returns {JSX.Element} Le composant Footer rendu.
 */
import React from "react";
import "./Footer.css";
// import '../../../../index.css';
import '../../../styles/MediaQueries.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="">

        {/* Liens vers les réseaux sociaux */}
        <div className="social-media">
          <a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer" className="social-icon" aria-label="Facebook">
            <i className="fab fa-facebook-f" />
          </a>
          <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer" className="social-icon" aria-label="Instagram">
            <i className="fab fa-instagram" />
          </a>
          <a href="https://www.twitter.com" target="_blank" rel="noopener noreferrer" className="social-icon" aria-label="Twitter">
            <i className="fab fa-twitter" />
          </a>
        </div>

        {/* Mentions légales */}
        <p className="copyright">&copy; 2025 BlablaBooks. Tous droits réservés.</p>
        <p className="general-policy">
          <a href="/about" className="">À propos</a> ·{" "} 
          <a href="/contact" className="">Contact</a> ·{" "}
          <a href="/cgu" className="">Conditions générales</a> ·{" "}
          <a href="/cookies" className="">Politique de cookies</a> ·{" "}
          <a href="/confidentialite" className="">Politique de confidentialité</a> ·{" "}
          <a href="/faq" className="">FAQ</a>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
