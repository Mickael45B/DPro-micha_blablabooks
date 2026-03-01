/**
 * UserProfileModal - Modal de profil utilisateur complet
 */
import React from 'react';
import './UserProfileModal.css';

const UserProfileModal = ({ user, onClose }) => {
  if (!user) return null;

  const getStatusLabel = (statusId) => {
    const id = parseInt(statusId, 10);
    const statusMap = {
      1: { label: 'Actif', class: 'success', icon: 'check-circle' },
      2: { label: 'Bloqué par admin', class: 'danger', icon: 'ban' },
      3: { label: 'Autobloqué', class: 'warning', icon: 'lock' },
      4: { label: 'Bloqué (admin + user)', class: 'danger', icon: 'shield-alt' },
      5: { label: 'Supprimé', class: 'danger', icon: 'trash' }
    };
    return statusMap[id] || { label: 'Inconnu', class: 'secondary', icon: 'question' };
  };

  const getRoleLabel = (roleId) => {
    const id = parseInt(roleId, 10);
    const roleMap = {
      1: { label: 'Utilisateur', icon: 'user', class: 'user' },
      2: { label: 'Modérateur', icon: 'user-shield', class: 'moderator' },
      3: { label: 'Administrateur', icon: 'crown', class: 'admin' }
    };
    return roleMap[id] || { label: 'Inconnu', icon: 'question', class: 'unknown' };
  };

  const statusId = user.status?.id_status;
  const statusInfo = getStatusLabel(statusId);
  const roleInfo = getRoleLabel(user.id_role);

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateAccountAge = (createdAt) => {
    if (!createdAt) return '-';
    const created = new Date(createdAt);
    const now = new Date();
    const diffTime = Math.abs(now - created);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) return `${diffDays} jour${diffDays > 1 ? 's' : ''}`;
    if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} mois`;
    }
    const years = Math.floor(diffDays / 365);
    return `${years} an${years > 1 ? 's' : ''}`;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal--profile" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal__header modal__header--profile">
          <div className="profile-header">
            <div className="profile-header__avatar">
              {user.profile_picture ? (
                <img src={user.profile_picture} alt={user.pseudo} />
              ) : (
                <div className="profile-header__avatar-placeholder">
                  <i className="fas fa-user"></i>
                </div>
              )}
            </div>
            <div className="profile-header__info">
              <h2 className="profile-header__name">{user.pseudo}</h2>
              <p className="profile-header__email">{user.email}</p>
              <div className="profile-header__badges">
                <span className={`badge badge--${roleInfo.class}`}>
                  <i className={`fas fa-${roleInfo.icon}`}></i> {roleInfo.label}
                </span>
                <span className={`badge badge--${statusInfo.class}`}>
                  <i className={`fas fa-${statusInfo.icon}`}></i> {statusInfo.label}
                </span>
              </div>
            </div>
          </div>
          <button className="modal__close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Body */}
        <div className="modal__body modal__body--profile">
          {/* Informations personnelles */}
          <div className="profile-section">
            <h3 className="profile-section__title">
              <i className="fas fa-info-circle"></i>
              Informations personnelles
            </h3>
            <div className="profile-info-grid">
              <div className="profile-info-item">
                <span className="profile-info-item__label">
                  <i className="fas fa-user"></i> Nom complet
                </span>
                <span className="profile-info-item__value">
                  {user.name || 'Non renseigné'}
                </span>
              </div>
              
              <div className="profile-info-item">
                <span className="profile-info-item__label">
                  <i className="fas fa-id-card"></i> Pseudo
                </span>
                <span className="profile-info-item__value">
                  {user.pseudo}
                </span>
              </div>
              
              <div className="profile-info-item">
                <span className="profile-info-item__label">
                  <i className="fas fa-envelope"></i> Email
                </span>
                <span className="profile-info-item__value">
                  {user.email}
                </span>
              </div>
              
              <div className="profile-info-item">
                <span className="profile-info-item__label">
                  <i className="fas fa-phone"></i> Téléphone
                </span>
                <span className="profile-info-item__value">
                  {user.phone || 'Non renseigné'}
                </span>
              </div>
            </div>
          </div>

          {/* Informations du compte */}
          <div className="profile-section">
            <h3 className="profile-section__title">
              <i className="fas fa-cog"></i>
              Informations du compte
            </h3>
            <div className="profile-info-grid">
              <div className="profile-info-item">
                <span className="profile-info-item__label">
                  <i className="fas fa-fingerprint"></i> ID Utilisateur
                </span>
                <span className="profile-info-item__value profile-info-item__value--mono">
                  {user.id_user}
                </span>
              </div>
              
              <div className="profile-info-item">
                <span className="profile-info-item__label">
                  <i className="fas fa-calendar-plus"></i> Inscrit le
                </span>
                <span className="profile-info-item__value">
                  {formatDate(user.created_at)}
                </span>
              </div>
              
              <div className="profile-info-item">
                <span className="profile-info-item__label">
                  <i className="fas fa-clock"></i> Ancienneté
                </span>
                <span className="profile-info-item__value">
                  {calculateAccountAge(user.created_at)}
                </span>
              </div>
              
              <div className="profile-info-item">
                <span className="profile-info-item__label">
                  <i className="fas fa-edit"></i> Dernière mise à jour
                </span>
                <span className="profile-info-item__value">
                  {formatDate(user.updated_at)}
                </span>
              </div>
            </div>
          </div>

          {/* Statistiques (si disponibles) */}
          {(user.stats || user.nb_reviews || user.nb_favorites) && (
            <div className="profile-section">
              <h3 className="profile-section__title">
                <i className="fas fa-chart-bar"></i>
                Statistiques
              </h3>
              <div className="profile-stats">
                <div className="profile-stat-card">
                  <div className="profile-stat-card__icon">
                    <i className="fas fa-star"></i>
                  </div>
                  <div className="profile-stat-card__content">
                    <span className="profile-stat-card__value">
                      {user.nb_reviews || 0}
                    </span>
                    <span className="profile-stat-card__label">Avis</span>
                  </div>
                </div>

                <div className="profile-stat-card">
                  <div className="profile-stat-card__icon">
                    <i className="fas fa-heart"></i>
                  </div>
                  <div className="profile-stat-card__content">
                    <span className="profile-stat-card__value">
                      {user.nb_favorites || 0}
                    </span>
                    <span className="profile-stat-card__label">Favoris</span>
                  </div>
                </div>

                <div className="profile-stat-card">
                  <div className="profile-stat-card__icon">
                    <i className="fas fa-book"></i>
                  </div>
                  <div className="profile-stat-card__content">
                    <span className="profile-stat-card__value">
                      {user.nb_library || 0}
                    </span>
                    <span className="profile-stat-card__label">Bibliothèque</span>
                  </div>
                </div>

                <div className="profile-stat-card">
                  <div className="profile-stat-card__icon">
                    <i className="fas fa-envelope"></i>
                  </div>
                  <div className="profile-stat-card__content">
                    <span className="profile-stat-card__value">
                      {user.nb_messages || 0}
                    </span>
                    <span className="profile-stat-card__label">Messages</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bio (si disponible) */}
          {user.bio && (
            <div className="profile-section">
              <h3 className="profile-section__title">
                <i className="fas fa-align-left"></i>
                À propos
              </h3>
              <div className="profile-bio">
                {user.bio}
              </div>
            </div>
          )}
        </div>

        {/* Footer avec actions */}
        <div className="modal__footer">
          <button 
            className="btn btn--secondary"
            onClick={onClose}
          >
            <i className="fas fa-times"></i> Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;
