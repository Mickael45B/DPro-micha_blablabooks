import React from 'react';
import { useNavigate } from 'react-router-dom';
import './smallCard.css';

/**
 * Composant smallCard - Carte interactive pour afficher un livre
 * 
 * @param {Object} book - Les données du livre
 * @param {Function} onShowSummary - Callback pour afficher le résumé dans le menu contextuel
 */
const smallCard = ({ book, onShowSummary }) => {
    const navigate = useNavigate();

    // Fonction pour décoder les entités HTML
    const decodeHtml = (html) => {
        const txt = document.createElement('textarea');
        txt.innerHTML = html;
        return txt.value;
    };

    // Gestion du clic sur la carte (afficher le résumé)
    const handleCardClick = (e) => {
        // Éviter la propagation si on clique sur le bouton "Voir le détail"
        if (e.target.closest('.book-card__detail-link')) {
            return;
        }
        
        // Afficher le résumé dans le menu contextuel
        if (onShowSummary) {
            onShowSummary(book);
        }
    };

    // Navigation vers la page de détail
    const handleDetailClick = (e) => {
        e.stopPropagation(); // Empêcher le clic sur la carte
        navigate(`/livres/${book.id_book}`);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="book-card" onClick={handleCardClick}>
            {/* Image du livre */}
            <div className="book-card__image-container">
                <img 
                    src={`/images/vignettesImages/${book.vignetteimage}`}
                    alt={`Couverture de ${decodeHtml(book.title)}`}
                    className="book-card__image"
                    onError={(e) => {
                        e.target.src = '/images/booksImages/image_not_found.png';
                    }}
                />
                {book.series && book.series !== 'one shot' && (
                    <span className="book-card__badge">{book.series}</span>
                )}
            </div>

            {/* Informations du livre */}
            <div className="book-card__content">
                {/* Titre */}
                <h3 className="book-card__title" title={decodeHtml(book.title)}>
                    {decodeHtml(book.title)}
                </h3>

                {/* Auteur */}
                <p className="book-card__author">
                    <i className="fas fa-user"></i>
                    <span>{decodeHtml(book.author)}</span>
                </p>

                {/* Éditeur */}
                <p className="book-card__editor">
                    <i className="fas fa-building"></i>
                    <span>{decodeHtml(book.editor)}</span>
                </p>

                {/* Note moyenne et nombre d'avis */}
                <div className="book-card__rating">
                    <div className="book-card__stars">
                        {book.avg_rating ? (
                            <>
                                <span className="book-card__rating-value">
                                    ⭐ {book.avg_rating.toFixed(1)}
                                </span>
                                <span className="book-card__reviews">
                                    ({book.nb_reviews || 0} avis)
                                </span>
                            </>
                        ) : (
                            <span className="book-card__no-rating">Pas encore noté</span>
                        )}
                    </div>
                </div>

                {/* Bouton "Voir le détail" */}
                <button 
                    className="book-card__detail-link"
                    onClick={handleDetailClick}
                    aria-label={`Voir les détails de ${decodeHtml(book.title)}`}
                >
                    <i className="fas fa-book-open"></i>
                    <span>Voir le détail</span>
                    <i className="fas fa-arrow-right"></i>
                </button>

            </div>
        </div>
    );
};

export default smallCard;