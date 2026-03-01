/**
 * PolitiqueConfidentialiteModal - Politique de Confidentialité (RGPD)
 */
import React from 'react';
import './LegalModal.css';

const PolitiqueConfidentialiteModal = ({ onClose }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="legal-modal" onClick={(e) => e.stopPropagation()}>
        <div className="legal-modal__header">
          <h2>
            <i className="fas fa-user-shield"></i>
            Politique de Confidentialité
          </h2>
          <button className="legal-modal__close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="legal-modal__body">
          <div className="legal-section">
            <h3>1. Introduction</h3>
            <p>
              BlablaBooks SAS (ci-après "BlablaBooks", "nous", "notre") attache une grande 
              importance à la protection de vos données personnelles et au respect de votre 
              vie privée. La présente politique de confidentialité vous informe sur la manière 
              dont nous collectons, utilisons, partageons et protégeons vos données personnelles 
              conformément au Règlement Général sur la Protection des Données (RGPD - UE 2016/679).
            </p>
          </div>

          <div className="legal-section">
            <h3>2. Responsable du traitement</h3>
            <p>
              Le responsable du traitement de vos données personnelles est :
            </p>
            <p>
              <strong>BlablaBooks SAS</strong><br />
              42 Avenue des Champs-Élysées<br />
              75008 Paris, France<br />
              Email : dpo@blablabooks.fr<br />
              Téléphone : +33 1 42 56 38 90
            </p>
          </div>

          <div className="legal-section">
            <h3>3. Données collectées</h3>
            <p>Nous collectons les catégories de données suivantes :</p>
            
            <h4>3.1 Données d'identification</h4>
            <ul>
              <li>Nom et prénom</li>
              <li>Pseudo</li>
              <li>Adresse email</li>
              <li>Numéro de téléphone (optionnel)</li>
              <li>Photo de profil (optionnel)</li>
            </ul>

            <h4>3.2 Données de connexion</h4>
            <ul>
              <li>Adresse IP</li>
              <li>Type et version du navigateur</li>
              <li>Système d'exploitation</li>
              <li>Pages visitées et durée des visites</li>
              <li>Date et heure de connexion</li>
            </ul>

            <h4>3.3 Données d'utilisation</h4>
            <ul>
              <li>Avis et commentaires publiés</li>
              <li>Livres favoris et bibliothèque personnelle</li>
              <li>Messages échangés via la plateforme</li>
              <li>Historique de navigation</li>
            </ul>

            <h4>3.4 Cookies et technologies similaires</h4>
            <p>
              Nous utilisons des cookies pour améliorer votre expérience. Pour plus d'informations, 
              consultez notre <button className="legal-link" onClick={onClose}>
              Politique de Cookies</button>.
            </p>
          </div>

          <div className="legal-section">
            <h3>4. Finalités et bases légales du traitement</h3>
            
            <h4>4.1 Gestion de votre compte (Base légale : Exécution du contrat)</h4>
            <ul>
              <li>Création et gestion de votre compte utilisateur</li>
              <li>Authentification et sécurisation de l'accès</li>
              <li>Communication liée à votre compte</li>
            </ul>

            <h4>4.2 Fourniture des services (Base légale : Exécution du contrat)</h4>
            <ul>
              <li>Permettre la publication d'avis et de commentaires</li>
              <li>Gérer votre bibliothèque et vos favoris</li>
              <li>Faciliter les échanges entre utilisateurs</li>
            </ul>

            <h4>4.3 Amélioration de nos services (Base légale : Intérêt légitime)</h4>
            <ul>
              <li>Analyse statistique de l'utilisation de la plateforme</li>
              <li>Optimisation de l'expérience utilisateur</li>
              <li>Développement de nouvelles fonctionnalités</li>
            </ul>

            <h4>4.4 Communication marketing (Base légale : Consentement)</h4>
            <ul>
              <li>Envoi de newsletters (avec votre accord)</li>
              <li>Recommandations personnalisées</li>
              <li>Informations sur nos actualités</li>
            </ul>

            <h4>4.5 Obligations légales (Base légale : Obligation légale)</h4>
            <ul>
              <li>Respect des obligations fiscales et comptables</li>
              <li>Réponse aux demandes des autorités</li>
              <li>Prévention de la fraude</li>
            </ul>
          </div>

          <div className="legal-section">
            <h3>5. Destinataires des données</h3>
            <p>Vos données personnelles peuvent être transmises aux destinataires suivants :</p>
            <ul>
              <li><strong>Personnel autorisé de BlablaBooks</strong> : strictement limité aux personnes ayant besoin d'y accéder</li>
              <li><strong>Prestataires techniques</strong> : hébergement (OVH), emails (Mailjet), analytics (Google Analytics anonymisé)</li>
              <li><strong>Autorités compétentes</strong> : sur réquisition judiciaire ou obligation légale</li>
            </ul>
            <p>
              Aucune donnée n'est vendue à des tiers. Tous nos prestataires sont soumis à des 
              obligations de confidentialité et de sécurité.
            </p>
          </div>

          <div className="legal-section">
            <h3>6. Transferts de données hors UE</h3>
            <p>
              Vos données sont hébergées au sein de l'Union Européenne (France). En cas de 
              transfert hors UE, nous nous assurons que des garanties appropriées sont mises 
              en place (clauses contractuelles types de la Commission européenne).
            </p>
          </div>

          <div className="legal-section">
            <h3>7. Durée de conservation</h3>
            <ul>
              <li><strong>Données de compte actif</strong> : conservées tant que votre compte est actif</li>
              <li><strong>Compte inactif</strong> : supprimé après 3 ans d'inactivité (après notification)</li>
              <li><strong>Données de navigation</strong> : 13 mois maximum</li>
              <li><strong>Données comptables</strong> : 10 ans (obligation légale)</li>
              <li><strong>Cookies analytiques</strong> : 13 mois maximum</li>
            </ul>
            <p>
              À l'issue de ces durées, vos données sont supprimées ou anonymisées de manière 
              irréversible.
            </p>
          </div>

          <div className="legal-section">
            <h3>8. Vos droits</h3>
            <p>Conformément au RGPD, vous disposez des droits suivants :</p>

            <h4>8.1 Droit d'accès</h4>
            <p>Obtenir la confirmation que des données vous concernant sont traitées et en recevoir une copie.</p>

            <h4>8.2 Droit de rectification</h4>
            <p>Corriger vos données inexactes ou incomplètes.</p>

            <h4>8.3 Droit à l'effacement ("droit à l'oubli")</h4>
            <p>Demander la suppression de vos données dans certains cas.</p>

            <h4>8.4 Droit à la limitation du traitement</h4>
            <p>Obtenir la limitation du traitement de vos données dans certaines situations.</p>

            <h4>8.5 Droit à la portabilité</h4>
            <p>Recevoir vos données dans un format structuré et lisible par machine.</p>

            <h4>8.6 Droit d'opposition</h4>
            <p>Vous opposer au traitement de vos données pour des motifs légitimes.</p>

            <h4>8.7 Droit de retirer votre consentement</h4>
            <p>Retirer votre consentement à tout moment pour les traitements basés sur celui-ci.</p>

            <h4>8.8 Directives post-mortem</h4>
            <p>Définir des directives relatives au sort de vos données après votre décès.</p>

            <p>
              Pour exercer vos droits, contactez notre Délégué à la Protection des Données (DPO) :
            </p>
            <ul>
              <li>Email : <a href="mailto:dpo@blablabooks.fr">dpo@blablabooks.fr</a></li>
              <li>Courrier : DPO BlablaBooks, 42 Avenue des Champs-Élysées, 75008 Paris</li>
            </ul>
            <p>
              Nous nous engageons à répondre dans un délai d'un mois. Une pièce d'identité 
              pourra être demandée pour vérifier votre identité.
            </p>
          </div>

          <div className="legal-section">
            <h3>9. Droit de réclamation</h3>
            <p>
              Si vous estimez que vos droits ne sont pas respectés, vous pouvez introduire 
              une réclamation auprès de la Commission Nationale de l'Informatique et des 
              Libertés (CNIL) :
            </p>
            <p>
              <strong>CNIL</strong><br />
              3 Place de Fontenoy<br />
              TSA 80715<br />
              75334 Paris Cedex 07<br />
              Téléphone : 01 53 73 22 22<br />
              Site web : <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer">www.cnil.fr</a>
            </p>
          </div>

          <div className="legal-section">
            <h3>10. Sécurité des données</h3>
            <p>
              Nous mettons en œuvre des mesures techniques et organisationnelles appropriées 
              pour protéger vos données contre :
            </p>
            <ul>
              <li>La destruction accidentelle ou illicite</li>
              <li>La perte accidentelle</li>
              <li>L'altération, la diffusion ou l'accès non autorisé</li>
            </ul>
            <p>Nos mesures de sécurité incluent :</p>
            <ul>
              <li>Chiffrement des données sensibles (SSL/TLS)</li>
              <li>Authentification sécurisée (mots de passe hashés)</li>
              <li>Pare-feu et protection contre les intrusions</li>
              <li>Sauvegardes régulières</li>
              <li>Accès restreint aux données personnelles</li>
              <li>Formation du personnel à la protection des données</li>
            </ul>
          </div>

          <div className="legal-section">
            <h3>11. Mineurs</h3>
            <p>
              Notre service est destiné aux personnes âgées de 13 ans et plus. Si vous avez 
              moins de 18 ans, nous vous encourageons à utiliser notre plateforme avec 
              l'accord de vos parents ou tuteurs légaux.
            </p>
            <p>
              Si nous découvrons que nous avons collecté des données d'un enfant de moins de 
              13 ans sans consentement parental, nous supprimerons ces informations immédiatement.
            </p>
          </div>

          <div className="legal-section">
            <h3>12. Modifications de la politique</h3>
            <p>
              Nous pouvons modifier cette politique de confidentialité pour refléter les 
              changements de nos pratiques ou pour d'autres raisons légales. Toute modification 
              sera publiée sur cette page avec une date de mise à jour.
            </p>
            <p>
              Les modifications importantes vous seront notifiées par email ou via une 
              notification sur la plateforme.
            </p>
          </div>

          <div className="legal-section">
            <h3>13. Contact</h3>
            <p>Pour toute question concernant cette politique de confidentialité :</p>
            <ul>
              <li>Email DPO : <a href="mailto:dpo@blablabooks.fr">dpo@blablabooks.fr</a></li>
              <li>Email général : <a href="mailto:contact@blablabooks.fr">contact@blablabooks.fr</a></li>
              <li>Téléphone : +33 1 42 56 38 90</li>
              <li>Courrier : BlablaBooks SAS, 42 Avenue des Champs-Élysées, 75008 Paris</li>
            </ul>
          </div>

          <div className="legal-footer">
            <p>
              <i className="fas fa-shield-alt"></i> 
              Certifié conforme RGPD
            </p>
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

export default PolitiqueConfidentialiteModal;
