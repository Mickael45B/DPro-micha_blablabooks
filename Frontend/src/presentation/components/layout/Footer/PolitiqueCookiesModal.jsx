/**
 * PolitiqueCookiesModal - Politique de Cookies
 */
import React from 'react';
import './LegalModal.css';

const PolitiqueCookiesModal = ({ onClose }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="legal-modal" onClick={(e) => e.stopPropagation()}>
        <div className="legal-modal__header">
          <h2>
            <i className="fas fa-cookie-bite"></i>
            Politique de Cookies
          </h2>
          <button className="legal-modal__close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="legal-modal__body">
          <div className="legal-section">
            <h3>1. Qu'est-ce qu'un cookie ?</h3>
            <p>
              Un cookie est un petit fichier texte déposé sur votre terminal (ordinateur, 
              tablette, smartphone) lors de votre visite sur notre site. Les cookies permettent 
              de reconnaître votre navigateur et de collecter des informations sur votre 
              navigation.
            </p>
            <p>
              Les cookies ne contiennent aucune donnée personnelle permettant de vous identifier 
              directement, mais ils peuvent être liés aux informations personnelles que vous nous 
              fournissez.
            </p>
          </div>

          <div className="legal-section">
            <h3>2. Pourquoi utilisons-nous des cookies ?</h3>
            <p>
              BlablaBooks utilise des cookies pour améliorer votre expérience de navigation, 
              comprendre comment vous utilisez notre site et vous proposer des contenus 
              personnalisés.
            </p>
          </div>

          <div className="legal-section">
            <h3>3. Types de cookies utilisés</h3>

            <h4>3.1 Cookies strictement nécessaires</h4>
            <p>
              Ces cookies sont essentiels au fonctionnement du site. Ils vous permettent de 
              naviguer sur le site et d'utiliser ses fonctionnalités.
            </p>
            <table className="cookies-table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Finalité</th>
                  <th>Durée</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><code>session_id</code></td>
                  <td>Maintenir votre session active</td>
                  <td>Session</td>
                </tr>
                <tr>
                  <td><code>csrf_token</code></td>
                  <td>Sécurité contre les attaques CSRF</td>
                  <td>Session</td>
                </tr>
                <tr>
                  <td><code>cookie_consent</code></td>
                  <td>Mémoriser vos choix de cookies</td>
                  <td>12 mois</td>
                </tr>
              </tbody>
            </table>
            <p className="cookie-notice">
              <i className="fas fa-info-circle"></i>
              Ces cookies ne nécessitent pas votre consentement car ils sont indispensables 
              au fonctionnement du site.
            </p>

            <h4>3.2 Cookies de fonctionnalité</h4>
            <p>
              Ces cookies permettent d'améliorer votre expérience en mémorisant vos préférences.
            </p>
            <table className="cookies-table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Finalité</th>
                  <th>Durée</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><code>user_preferences</code></td>
                  <td>Mémoriser vos préférences (langue, affichage)</td>
                  <td>6 mois</td>
                </tr>
                <tr>
                  <td><code>theme</code></td>
                  <td>Sauvegarder votre choix de thème (clair/sombre)</td>
                  <td>12 mois</td>
                </tr>
                <tr>
                  <td><code>sort_preference</code></td>
                  <td>Mémoriser vos préférences de tri</td>
                  <td>3 mois</td>
                </tr>
              </tbody>
            </table>

            <h4>3.3 Cookies analytiques</h4>
            <p>
              Ces cookies nous aident à comprendre comment les visiteurs utilisent notre site 
              en collectant des informations anonymes.
            </p>
            <table className="cookies-table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Finalité</th>
                  <th>Durée</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><code>_ga</code></td>
                  <td>Google Analytics - Distinguer les utilisateurs</td>
                  <td>13 mois</td>
                </tr>
                <tr>
                  <td><code>_gid</code></td>
                  <td>Google Analytics - Distinguer les utilisateurs</td>
                  <td>24 heures</td>
                </tr>
                <tr>
                  <td><code>_gat</code></td>
                  <td>Google Analytics - Limiter le taux de requêtes</td>
                  <td>1 minute</td>
                </tr>
              </tbody>
            </table>
            <p className="cookie-notice cookie-notice--info">
              <i className="fas fa-chart-line"></i>
              Google Analytics est configuré en mode anonyme (IP anonymisée) conformément 
              au RGPD.
            </p>

            <h4>3.4 Cookies de réseaux sociaux</h4>
            <p>
              Ces cookies sont utilisés lorsque vous partagez du contenu via les boutons de 
              réseaux sociaux.
            </p>
            <table className="cookies-table">
              <thead>
                <tr>
                  <th>Réseau</th>
                  <th>Finalité</th>
                  <th>Plus d'infos</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Facebook</td>
                  <td>Partage de contenu</td>
                  <td><a href="https://www.facebook.com/policies/cookies/" target="_blank" rel="noopener noreferrer">Politique Facebook</a></td>
                </tr>
                <tr>
                  <td>Twitter</td>
                  <td>Partage de contenu</td>
                  <td><a href="https://twitter.com/fr/privacy" target="_blank" rel="noopener noreferrer">Politique Twitter</a></td>
                </tr>
                <tr>
                  <td>LinkedIn</td>
                  <td>Partage de contenu</td>
                  <td><a href="https://www.linkedin.com/legal/cookie-policy" target="_blank" rel="noopener noreferrer">Politique LinkedIn</a></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="legal-section">
            <h3>4. Gestion de vos cookies</h3>

            <h4>4.1 Bannière de consentement</h4>
            <p>
              Lors de votre première visite, une bannière vous permet de choisir les cookies 
              que vous acceptez. Vous pouvez à tout moment modifier vos préférences en cliquant 
              sur le lien "Gérer mes cookies" dans le footer.
            </p>

            <h4>4.2 Paramètres de votre navigateur</h4>
            <p>
              Vous pouvez également configurer votre navigateur pour accepter ou refuser les 
              cookies :
            </p>
            <ul>
              <li>
                <strong>Chrome</strong> : Menu → Paramètres → Confidentialité et sécurité → Cookies
                <br />
                <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer">
                  Guide Google Chrome
                </a>
              </li>
              <li>
                <strong>Firefox</strong> : Menu → Options → Vie privée et sécurité
                <br />
                <a href="https://support.mozilla.org/fr/kb/cookies-informations-sites-enregistrent" target="_blank" rel="noopener noreferrer">
                  Guide Mozilla Firefox
                </a>
              </li>
              <li>
                <strong>Safari</strong> : Préférences → Confidentialité
                <br />
                <a href="https://support.apple.com/fr-fr/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer">
                  Guide Safari
                </a>
              </li>
              <li>
                <strong>Edge</strong> : Menu → Paramètres → Confidentialité et services
                <br />
                <a href="https://support.microsoft.com/fr-fr/microsoft-edge/supprimer-les-cookies-dans-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer">
                  Guide Microsoft Edge
                </a>
              </li>
            </ul>

            <h4>4.3 Outils de désactivation des cookies analytiques</h4>
            <ul>
              <li>
                <strong>Google Analytics</strong> : 
                <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer">
                  Module de désactivation Google Analytics
                </a>
              </li>
              <li>
                <strong>Toutes les publicités</strong> : 
                <a href="http://www.youronlinechoices.com/fr/controler-ses-cookies/" target="_blank" rel="noopener noreferrer">
                  Your Online Choices
                </a>
              </li>
            </ul>

            <div className="cookie-warning">
              <i className="fas fa-exclamation-triangle"></i>
              <p>
                <strong>Attention :</strong> La désactivation de certains cookies peut limiter 
                l'accès à certaines fonctionnalités de notre site ou affecter votre expérience 
                de navigation.
              </p>
            </div>
          </div>

          <div className="legal-section">
            <h3>5. Durée de conservation</h3>
            <p>
              Les cookies ont des durées de vie variables selon leur finalité :
            </p>
            <ul>
              <li><strong>Cookies de session</strong> : supprimés à la fermeture du navigateur</li>
              <li><strong>Cookies persistants</strong> : conservés de 24 heures à 13 mois maximum</li>
            </ul>
            <p>
              À l'expiration de leur durée de vie, les cookies sont automatiquement supprimés.
            </p>
          </div>

          <div className="legal-section">
            <h3>6. Cookies tiers</h3>
            <p>
              Certains cookies sont déposés par des services tiers (Google Analytics, réseaux 
              sociaux). Nous n'avons pas de contrôle sur ces cookies. Nous vous invitons à 
              consulter les politiques de confidentialité de ces services :
            </p>
            <ul>
              <li>
                <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
                  Politique de confidentialité Google
                </a>
              </li>
              <li>
                <a href="https://www.facebook.com/privacy/explanation" target="_blank" rel="noopener noreferrer">
                  Politique de confidentialité Facebook
                </a>
              </li>
              <li>
                <a href="https://twitter.com/fr/privacy" target="_blank" rel="noopener noreferrer">
                  Politique de confidentialité Twitter
                </a>
              </li>
            </ul>
          </div>

          <div className="legal-section">
            <h3>7. Vos droits</h3>
            <p>
              Conformément au RGPD, vous disposez de droits sur les données collectées via 
              les cookies. Pour plus d'informations, consultez notre 
              <button className="legal-link" onClick={onClose}>
                Politique de Confidentialité
              </button>.
            </p>
          </div>

          <div className="legal-section">
            <h3>8. Modifications</h3>
            <p>
              Nous pouvons être amenés à modifier cette politique de cookies pour refléter 
              les changements de nos pratiques ou pour des raisons techniques ou légales. 
              Toute modification sera publiée sur cette page.
            </p>
          </div>

          <div className="legal-section">
            <h3>9. Contact</h3>
            <p>
              Pour toute question concernant notre utilisation des cookies :
            </p>
            <ul>
              <li>Email : <a href="mailto:dpo@blablabooks.fr">dpo@blablabooks.fr</a></li>
              <li>Téléphone : +33 1 42 56 38 90</li>
              <li>Courrier : BlablaBooks SAS, 42 Avenue des Champs-Élysées, 75008 Paris</li>
            </ul>
          </div>

          <div className="legal-footer">
            <div className="cookie-actions">
              <button className="btn-cookie btn-cookie--manage">
                <i className="fas fa-cog"></i>
                Gérer mes cookies
              </button>
              <button className="btn-cookie btn-cookie--clear">
                <i className="fas fa-trash-alt"></i>
                Effacer tous les cookies
              </button>
            </div>
            <p>Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</p>
          </div>
        </div>

        <div className="legal-modal__footer">
          <button className="btn btn--primary" onClick={onClose}>
            <i className="fas fa-check"></i> J'ai lu et compris
          </button>
        </div>
      </div>
    </div>
  );
};

export default PolitiqueCookiesModal;
