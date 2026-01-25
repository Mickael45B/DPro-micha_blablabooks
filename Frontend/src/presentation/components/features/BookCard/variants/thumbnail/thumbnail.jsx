import React, { useEffect, useRef } from 'react';
import { useNavigate} from 'react-router-dom';
import './thumbnail.css';
import fitTextToOneLine from '../../../../../../infrastructure/utils/helpers/dynamicSizingText.js';
/**
 * Composant thumbnail - Carte interactive pour afficher un livre
 * 
 * @param {Object} book - Les données du livre
 * @param {Function} onShowSummary - Callback pour afficher le résumé dans le menu contextuel
 */
const Thumbnail = ({ book, onShowSummary }) => {
    const navigate = useNavigate();
    const titleRef = useRef(null);

    // Fonction pour décoder les entités HTML
    const decodeHtml = (html) => {
        const txt = document.createElement('textarea');
        txt.innerHTML = html;
        return txt.value;
    };
    // Gestion du clic sur la carte (afficher le résumé)
    const handleCardClick = (e) => {
        // Éviter la propagation si on clique sur le bouton "Voir le détail"
        if (e.target.closest('.thumbnail__detail-link')) {
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
    };

    // Appliquer le redimensionnement dynamique après le rendu
    useEffect(() => {
        if (titleRef.current) {
            fitTextToOneLine(titleRef.current, {
                max: 16,
                min: 10,
                step: 0.5
            });
        }
    }, [book.title]);

    return (
        <div className="thumbnail" onClick={handleCardClick}>
            {/* Image du livre */}
            <div className="thumbnail__image-container">
                <img 
                    src={`/images/vignettesImages/${book.vignetteimage}`}
                    alt={`Couverture de ${decodeHtml(book.title)}`}
                    className="thumbnail__image"
                    onError={(e) => {
                        e.target.src = '/images/booksImages/image_not_found.png';
                    }}
                />
                {book.series && book.series !== 'one shot' && (
                    <span className="thumbnail__badge">{book.series}</span>
                )}
            </div>

            {/* Informations du livre */}
            <div className="thumbnail__content">
                {/* Titre avec redimensionnement dynamique */}
                <h3 
                    ref={titleRef}
                    className="thumbnail__title" 
                    title={decodeHtml(book.title)}
                >
                    {decodeHtml(book.title)}
                </h3>

                {/* Bouton "Voir le détail" */}
                <button 
                    className="thumbnail__detail-link"
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

export default Thumbnail;