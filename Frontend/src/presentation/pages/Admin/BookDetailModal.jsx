/**
 * BookDetailModal - Modal de visualisation détaillée d'un livre
 */
import React from 'react';
import { useQuery } from '@apollo/client';
import { GET_BOOK_BY_ID } from './adminQueries.jsx';
import './BookDetailModal.css';

const BookDetailModal = ({ bookId, onClose, onEdit }) => {
  const { data, loading, error } = useQuery(GET_BOOK_BY_ID, {
    variables: { id_book: bookId },
    skip: !bookId
  });

  if (!bookId) return null;
  
  if (loading) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="book-modal" onClick={(e) => e.stopPropagation()}>
          <div className="loading">
            <i className="fas fa-spinner fa-spin"></i> Chargement...
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="book-modal" onClick={(e) => e.stopPropagation()}>
          <div className="error">Erreur : {error.message}</div>
        </div>
      </div>
    );
  }

  const book = data?.getBook;
  if (!book) return null;

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="book-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header avec image */}
        <div className="book-modal__header">
          <div className="book-modal__cover">
            {book.bookimage ? (
              <img src={book.bookimage} alt={book.title} />
            ) : (
              <div className="book-modal__cover-placeholder">
                <i className="fas fa-book"></i>
              </div>
            )}
          </div>
          <div className="book-modal__header-info">
            <h2 className="book-modal__title">{book.title}</h2>
            <p className="book-modal__author">
              <i className="fas fa-user-edit"></i> {book.author || 'Auteur inconnu'}
            </p>
            {book.avg_rating && (
              <div className="book-modal__rating">
                <i className="fas fa-star"></i>
                <span className="rating-score">{book.avg_rating}</span>
                <span className="rating-count">({book.nb_reviews} avis)</span>
              </div>
            )}
          </div>
          <button className="book-modal__close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Body */}
        <div className="book-modal__body">
          {/* Informations principales */}
          <div className="book-info-grid">
            <div className="book-info-item">
              <i className="fas fa-barcode"></i>
              <div>
                <strong>ISBN</strong>
                <span>{book.isbn || 'Non renseigné'}</span>
              </div>
            </div>

            <div className="book-info-item">
              <i className="fas fa-calendar-alt"></i>
              <div>
                <strong>Publication</strong>
                <span>{formatDate(book.publication_date)}</span>
              </div>
            </div>

            <div className="book-info-item">
              <i className="fas fa-tag"></i>
              <div>
                <strong>Genre</strong>
                <span>{book.genre || 'Non renseigné'}</span>
              </div>
            </div>

            <div className="book-info-item">
              <i className="fas fa-building"></i>
              <div>
                <strong>Éditeur</strong>
                <span>{book.editor || 'Non renseigné'}</span>
              </div>
            </div>

            <div className="book-info-item">
              <i className="fas fa-child"></i>
              <div>
                <strong>Âge minimum</strong>
                <span>{book.age_limit ? `${book.age_limit} ans` : 'Tout public'}</span>
              </div>
            </div>

            <div className="book-info-item">
              <i className="fas fa-layer-group"></i>
              <div>
                <strong>Série</strong>
                <span>{book.series || 'Livre unique'}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          {book.description && (
            <div className="book-description">
              <h3>
                <i className="fas fa-align-left"></i>
                Description
              </h3>
              <p>{book.description}</p>
            </div>
          )}

          {/* Statistiques */}
          <div className="book-stats">
            <div className="stat-box">
              <i className="fas fa-heart"></i>
              <span className="stat-value">{book.is_in_favorite ? 'Oui' : 'Non'}</span>
              <span className="stat-label">Favori</span>
            </div>
            <div className="stat-box">
              <i className="fas fa-book-reader"></i>
              <span className="stat-value">{book.is_in_library ? 'Oui' : 'Non'}</span>
              <span className="stat-label">Bibliothèque</span>
            </div>
            <div className="stat-box">
              <i className="fas fa-star"></i>
              <span className="stat-value">{book.nb_reviews || 0}</span>
              <span className="stat-label">Avis</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="book-modal__footer">
          <button 
            className="btn btn--primary"
            onClick={() => onEdit(book)}
          >
            <i className="fas fa-edit"></i>
            Modifier ce livre
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

export default BookDetailModal;
