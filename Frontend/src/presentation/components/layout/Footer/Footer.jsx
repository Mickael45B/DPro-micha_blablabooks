/**
 * Footer - Pied de page professionnel
 * Contient : coordonnées, liens légaux, réseaux sociaux
 */
import React, { useState } from 'react';
import CGUModal from './CGUModal';
import PolitiqueCookiesModal from './PolitiqueCookiesModal';
import PolitiqueConfidentialiteModal from './PolitiqueConfidentialiteModal';
import './Footer.css';

const Footer = () => {
  const [showCGU, setShowCGU] = useState(false);
  const [showCookies, setShowCookies] = useState(false);
  const [showConfidentialite, setShowConfidentialite] = useState(false);

  const currentYear = new Date().getFullYear();

  return (
    <>
      <footer className="footer">
        <div className="footer__container">
          {/* Section 1 : À propos */}
          <div className="footer__section footer__section--about">
            <h3 className="footer__title">
              <i className="fas fa-book-reader"></i>
              BlablaBooks
            </h3>
            <p className="footer__description">
              Votre plateforme de partage et de découverte de livres. 
              Partagez vos lectures, découvrez de nouveaux auteurs et 
              échangez avec une communauté passionnée.
            </p>
            <div className="footer__social">
              <a 
                href="/" 
                className="footer__social-link footer__social-link--linkedin"
                aria-label="LinkedIn"
                title="Suivez-nous sur LinkedIn"
              >
                <i className="fab fa-linkedin-in"></i>
              </a>
              <a 
                href="/" 
                className="footer__social-link footer__social-link--facebook"
                aria-label="Facebook"
                title="Suivez-nous sur Facebook"
              >
                <i className="fab fa-facebook-f"></i>
              </a>
              <a 
                href="/" 
                className="footer__social-link footer__social-link--instagram"
                aria-label="Instagram"
                title="Suivez-nous sur Instagram"
              >
                <i className="fab fa-instagram"></i>
              </a>
              <a 
                href="/" 
                className="footer__social-link footer__social-link--twitter"
                aria-label="Twitter"
                title="Suivez-nous sur Twitter"
              >
                <i className="fab fa-twitter"></i>
              </a>
              <a 
                href="/" 
                className="footer__social-link footer__social-link--youtube"
                aria-label="YouTube"
                title="Suivez-nous sur YouTube"
              >
                <i className="fab fa-youtube"></i>
              </a>
            </div>
          </div>

          {/* Section 2 : Coordonnées */}
          <div className="footer__section footer__section--contact">
            <h3 className="footer__title">
              <i className="fas fa-map-marker-alt"></i>
              Coordonnées
            </h3>
            <div className="footer__contact-item">
              <i className="fas fa-building"></i>
              <div>
                <strong>BlablaBooks SAS</strong>
                <span>999 Avenue des Champs-Élysées</span>
                <span>75008 Paris, France</span>
              </div>
            </div>
            <div className="footer__contact-item">
              <i className="fas fa-phone"></i>
              <div>
                <a href="tel:+33142563890">+33 1 42 56 38 90</a>
              </div>
            </div>
            <div className="footer__contact-item">
              <i className="fas fa-envelope"></i>
              <div>
                <a href="mailto:contact@blablabooks.fr">contact@blablabooks.fr</a>
              </div>
            </div>
            <div className="footer__contact-item">
              <i className="fas fa-clock"></i>
              <div>
                <span>Lun - Ven : 9h - 18h</span>
              </div>
            </div>
          </div>

          {/* Section 3 : Liens légaux */}
          <div className="footer__section footer__section--legal">
            <h3 className="footer__title">
              <i className="fas fa-shield-alt"></i>
              Informations légales
            </h3>
            <ul className="footer__legal-list">
              <li>
                <button 
                  onClick={() => setShowCGU(true)}
                  className="footer__legal-link"
                >
                  <i className="fas fa-file-contract"></i>
                  Conditions Générales d'Utilisation
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setShowConfidentialite(true)}
                  className="footer__legal-link"
                >
                  <i className="fas fa-user-shield"></i>
                  Politique de Confidentialité
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setShowCookies(true)}
                  className="footer__legal-link"
                >
                  <i className="fas fa-cookie-bite"></i>
                  Politique de Cookies
                </button>
              </li>
              <li>
                <a href="/" className="footer__legal-link">
                  <i className="fas fa-balance-scale"></i>
                  Mentions Légales
                </a>
              </li>
            </ul>
          </div>

          {/* Section 4 : Newsletter */}
          <div className="footer__section footer__section--newsletter">
            <h3 className="footer__title">
              <i className="fas fa-envelope-open-text"></i>
              Newsletter
            </h3>
            <p className="footer__newsletter-text">
              Restez informé de nos dernières actualités et nouveautés !
            </p>
            <form className="footer__newsletter-form" onSubmit={(e) => e.preventDefault()}>
              <input 
                type="email" 
                placeholder="Votre email" 
                className="footer__newsletter-input"
                required
              />
              <button type="submit" className="footer__newsletter-btn">
                <i className="fas fa-paper-plane"></i>
              </button>
            </form>
            <p className="footer__newsletter-info">
              <i className="fas fa-lock"></i>
              Vos données sont protégées
            </p>
          </div>
        </div>

        {/* Copyright */}
        <div className="footer__bottom">
          <div className="footer__container">
            <div className="footer__copyright">
              <p>
                © {currentYear} BlablaBooks SAS - Tous droits réservés
              </p>
              <p className="footer__dev">
                Développé avec <i className="fas fa-heart"></i> par l'équipe BlablaBooks
              </p>
            </div>
            <div className="footer__badges">
              <span className="footer__badge">
                <i className="fas fa-shield-alt"></i> Paiement sécurisé
              </span>
              <span className="footer__badge">
                <i className="fas fa-check-circle"></i> RGPD Conforme
              </span>
              <span className="footer__badge">
                <i className="fas fa-leaf"></i> Éco-responsable
              </span>
            </div>
          </div>
        </div>
      </footer>

      {/* Modals légaux */}
      {showCGU && <CGUModal onClose={() => setShowCGU(false)} />}
      {showCookies && <PolitiqueCookiesModal onClose={() => setShowCookies(false)} />}
      {showConfidentialite && <PolitiqueConfidentialiteModal onClose={() => setShowConfidentialite(false)} />}
    </>
  );
};

export default Footer;
