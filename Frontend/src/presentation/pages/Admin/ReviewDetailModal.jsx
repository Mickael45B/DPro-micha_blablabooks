/**
 * ReviewDetailModal - Modal de visualisation d'avis avec design amélioré
 */
import React from 'react';
import './ReviewDetailModal.css';

const ReviewDetailModal = ({ review, onClose, onOpenUserProfile, onOpenBookDetail, onEdit }) => {
  if (!review) return null;

  const getRatingStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <i 
          key={i} 
          className={i <= rating ? 'fas fa-star' : 'far fa-star'}
        ></i>
      );
    }
    return stars;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // ✅ Extraire les données utilisateur et livre
  const userPseudo = review.user?.pseudo || 'Utilisateur inconnu';
  const userId = review.user?.id_user || review.id_user || 'N/A';
  const bookTitle = review.book?.title || 'Livre inconnu';
  const resolvedBookId = review.book?.id_book || review.id_book || null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="review-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header avec gradient */}
        <div className="review-modal__header">
          <div className="review-modal__header-content">
            <div className="review-modal__stars">
              {getRatingStars(review.rating)}
            </div>
            <h2 className="review-modal__title">
              {review.title_rating || 'Avis sans titre'}
            </h2>
            <div className="review-modal__subtitle">
              Publié le {formatDate(review.created_at)}
            </div>
          </div>
          <button className="review-modal__close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Body */}
        <div className="review-modal__body">
          {/* Cards d'information */}
          <div className="review-info-cards">
            {/* Card Utilisateur */}
            <div className="info-card info-card--user">
              <div className="info-card__icon">
                <i className="fas fa-user-circle"></i>
              </div>
              <div className="info-card__content">
                <span className="info-card__label">Auteur de l'avis</span>
                <button 
                  className="info-card__link"
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('🔵 Ouverture profil utilisateur:', userId);
                    onOpenUserProfile(userId);
                  }}
                  type="button"                  
                >
                  <i className="fas fa-user"></i>
                  {userPseudo} ({userId})
                  <i className="fas fa-external-link-alt"></i>
                </button>
                <span className="info-card__hint">Cliquez pour voir le profil</span>
              </div>
            </div>

            {/* Card Livre */}
            <div className="info-card info-card--book">
              <div className="info-card__icon">
                <i className="fas fa-book"></i>
              </div>
              <div className="info-card__content">
                <span className="info-card__label">Livre concerné</span>
                <button 
                  className="info-card__link"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!resolvedBookId) return;
                    console.log('🟣 Ouverture détail livre:', resolvedBookId);
                    onOpenBookDetail(resolvedBookId);
                  }}
                  type="button"
                  disabled={!resolvedBookId}
                >
                  <i className="fas fa-book-open"></i>
                  {bookTitle}{resolvedBookId ? ` (${resolvedBookId})` : ''}
                  <i className="fas fa-external-link-alt"></i>
                </button>
                <span className="info-card__hint">Cliquez pour voir les détails</span>
              </div>
            </div>
          </div>

          {/* Note détaillée */}
          <div className="review-rating-section">
            <h3 className="section-title">
              <i className="fas fa-star"></i>
              Évaluation
            </h3>
            <div className="rating-display">
              <div className="rating-display__stars">
                {getRatingStars(review.rating)}
              </div>
              <div className="rating-display__score">
                <span className="rating-score">{review.rating}</span>
                <span className="rating-max">/5</span>
              </div>
              <div className="rating-display__text">
                {review.rating === 5 && '⭐ Excellent'}
                {review.rating === 4 && '👍 Très bien'}
                {review.rating === 3 && '😊 Bien'}
                {review.rating === 2 && '😐 Moyen'}
                {review.rating === 1 && '👎 Décevant'}
              </div>
            </div>
          </div>

          {/* Commentaire */}
          <div className="review-comment-section">
            <h3 className="section-title">
              <i className="fas fa-comment-dots"></i>
              Commentaire
            </h3>
            <div className="comment-box">
              {review.comment ? (
                <p className="comment-text">{review.comment}</p>
              ) : (
                <p className="comment-empty">
                  <i className="fas fa-info-circle"></i>
                  Aucun commentaire laissé par l'utilisateur
                </p>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="review-timeline">
            <h3 className="section-title">
              <i className="fas fa-clock"></i>
              Historique
            </h3>
            <div className="timeline">
              <div className="timeline-item">
                <div className="timeline-marker timeline-marker--create">
                  <i className="fas fa-plus-circle"></i>
                </div>
                <div className="timeline-content">
                  <strong>Création de l'avis</strong>
                  <span>{formatDate(review.created_at)}</span>
                </div>
              </div>
              {review.updated_at && review.updated_at !== review.created_at && (
                <div className="timeline-item">
                  <div className="timeline-marker timeline-marker--update">
                    <i className="fas fa-edit"></i>
                  </div>
                  <div className="timeline-content">
                    <strong>Dernière modification</strong>
                    <span>{formatDate(review.updated_at)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer avec actions */}
        <div className="review-modal__footer">
          <button 
            className="btn btn--primary"
            onClick={() => onEdit(review)}
          >
            <i className="fas fa-edit"></i>
            Modifier cet avis
          </button>
          <button 
            className="btn btn--secondary"
            onClick={onClose}
          >
            <i className="fas fa-times"></i>
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewDetailModal;
