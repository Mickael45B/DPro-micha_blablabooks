/**
 * CGUModal - Conditions Générales d'Utilisation
 */
import React from 'react';
import './LegalModal.css';

const CGUModal = ({ onClose }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="legal-modal" onClick={(e) => e.stopPropagation()}>
        <div className="legal-modal__header">
          <h2>
            <i className="fas fa-file-contract"></i>
            Conditions Générales d'Utilisation
          </h2>
          <button className="legal-modal__close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="legal-modal__body">
          <div className="legal-section">
            <h3>1. Objet</h3>
            <p>
              Les présentes Conditions Générales d'Utilisation (CGU) régissent l'utilisation 
              de la plateforme BlablaBooks accessible à l'adresse www.blablabooks.fr. 
              En accédant et en utilisant notre plateforme, vous acceptez sans réserve les 
              présentes CGU.
            </p>
          </div>

          <div className="legal-section">
            <h3>2. Mentions légales</h3>
            <p><strong>Éditeur du site :</strong></p>
            <p>
              BlablaBooks SAS<br />
              Capital social : 50 000 €<br />
              RCS Paris 123 456 789<br />
              Siège social : 42 Avenue des Champs-Élysées, 75008 Paris<br />
              Téléphone : +33 1 42 56 38 90<br />
              Email : contact@blablabooks.fr
            </p>
            <p><strong>Directeur de la publication :</strong> Jean Dupont</p>
            <p><strong>Hébergeur :</strong></p>
            <p>
              OVH SAS<br />
              2 rue Kellermann, 59100 Roubaix, France<br />
              Téléphone : 1007
            </p>
          </div>

          <div className="legal-section">
            <h3>3. Accès au service</h3>
            <p>
              La plateforme BlablaBooks est accessible gratuitement à tout utilisateur 
              disposant d'un accès à internet. Les frais de connexion et d'équipement 
              nécessaires restent à la charge de l'utilisateur.
            </p>
            <p>
              BlablaBooks se réserve le droit de suspendre, modifier ou interrompre 
              l'accès à tout ou partie de la plateforme, temporairement ou définitivement, 
              sans préavis ni indemnité.
            </p>
          </div>

          <div className="legal-section">
            <h3>4. Inscription et compte utilisateur</h3>
            <p>
              L'utilisation de certaines fonctionnalités de la plateforme nécessite 
              la création d'un compte utilisateur. Lors de votre inscription, vous vous 
              engagez à fournir des informations exactes, complètes et à jour.
            </p>
            <p>
              Vous êtes responsable de la confidentialité de vos identifiants et de toute 
              activité effectuée depuis votre compte. Toute utilisation frauduleuse doit 
              être immédiatement signalée à BlablaBooks.
            </p>
          </div>

          <div className="legal-section">
            <h3>5. Utilisation de la plateforme</h3>
            <p>L'utilisateur s'engage à :</p>
            <ul>
              <li>Respecter les lois et règlements en vigueur</li>
              <li>Ne pas porter atteinte aux droits de tiers</li>
              <li>Ne pas diffuser de contenu illicite, offensant ou diffamatoire</li>
              <li>Ne pas utiliser la plateforme à des fins commerciales sans autorisation</li>
              <li>Ne pas tenter d'accéder aux systèmes informatiques de manière frauduleuse</li>
              <li>Respecter la propriété intellectuelle de BlablaBooks et des autres utilisateurs</li>
            </ul>
          </div>

          <div className="legal-section">
            <h3>6. Contenu utilisateur</h3>
            <p>
              En publiant du contenu sur BlablaBooks (avis, commentaires, etc.), vous accordez 
              à BlablaBooks une licence mondiale, non exclusive, gratuite et transférable pour 
              utiliser, reproduire, distribuer et afficher ce contenu dans le cadre de l'exploitation 
              de la plateforme.
            </p>
            <p>
              Vous garantissez être titulaire des droits sur le contenu publié et que celui-ci 
              ne porte pas atteinte aux droits de tiers.
            </p>
            <p>
              BlablaBooks se réserve le droit de supprimer tout contenu qui contreviendrait 
              aux présentes CGU ou à la législation en vigueur.
            </p>
          </div>

          <div className="legal-section">
            <h3>7. Propriété intellectuelle</h3>
            <p>
              Tous les éléments de la plateforme BlablaBooks (textes, images, graphismes, logo, 
              icônes, sons, logiciels, etc.) sont la propriété exclusive de BlablaBooks SAS ou 
              de ses partenaires, sauf mention contraire.
            </p>
            <p>
              Toute reproduction, représentation, modification, publication ou adaptation, 
              totale ou partielle, est strictement interdite sans l'autorisation écrite 
              préalable de BlablaBooks.
            </p>
          </div>

          <div className="legal-section">
            <h3>8. Données personnelles</h3>
            <p>
              BlablaBooks collecte et traite vos données personnelles dans le respect du 
              Règlement Général sur la Protection des Données (RGPD). Pour plus d'informations, 
              consultez notre <button className="legal-link" onClick={onClose}>
              Politique de Confidentialité</button>.
            </p>
          </div>

          <div className="legal-section">
            <h3>9. Responsabilité</h3>
            <p>
              BlablaBooks met tout en œuvre pour assurer la disponibilité et la sécurité de 
              la plateforme, mais ne peut garantir un accès ininterrompu et exempt d'erreurs.
            </p>
            <p>
              BlablaBooks ne saurait être tenue responsable des dommages directs ou indirects 
              résultant de l'utilisation ou de l'impossibilité d'utiliser la plateforme.
            </p>
            <p>
              Les avis et contenus publiés par les utilisateurs n'engagent que leurs auteurs. 
              BlablaBooks ne garantit pas l'exactitude, la qualité ou la fiabilité de ces contenus.
            </p>
          </div>

          <div className="legal-section">
            <h3>10. Liens hypertextes</h3>
            <p>
              La plateforme peut contenir des liens vers des sites tiers. BlablaBooks n'exerce 
              aucun contrôle sur ces sites et décline toute responsabilité quant à leur contenu 
              ou leur politique de confidentialité.
            </p>
          </div>

          <div className="legal-section">
            <h3>11. Modification des CGU</h3>
            <p>
              BlablaBooks se réserve le droit de modifier les présentes CGU à tout moment. 
              Les nouvelles conditions prendront effet dès leur publication sur la plateforme. 
              Il est conseillé de consulter régulièrement cette page.
            </p>
          </div>

          <div className="legal-section">
            <h3>12. Résiliation</h3>
            <p>
              BlablaBooks peut résilier ou suspendre votre accès à la plateforme à tout moment, 
              notamment en cas de violation des présentes CGU, sans préavis ni indemnité.
            </p>
            <p>
              Vous pouvez à tout moment supprimer votre compte depuis votre espace personnel 
              ou en contactant notre service client.
            </p>
          </div>

          <div className="legal-section">
            <h3>13. Droit applicable et juridiction</h3>
            <p>
              Les présentes CGU sont régies par le droit français. En cas de litige, 
              et à défaut de résolution amiable, les tribunaux de Paris seront seuls compétents.
            </p>
          </div>

          <div className="legal-section">
            <h3>14. Contact</h3>
            <p>
              Pour toute question concernant les présentes CGU, vous pouvez nous contacter :
            </p>
            <ul>
              <li>Par email : <a href="mailto:legal@blablabooks.fr">legal@blablabooks.fr</a></li>
              <li>Par téléphone : +33 1 42 56 38 90</li>
              <li>Par courrier : BlablaBooks SAS, 42 Avenue des Champs-Élysées, 75008 Paris</li>
            </ul>
          </div>

          <div className="legal-footer">
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

export default CGUModal;
