import React, { useEffect, useRef } from 'react';
import { useNavigate} from 'react-router-dom';
import './thumbnailContext.css';
import fitTextToOneLine from '../../../../../../infrastructure/utils/helpers/dynamicSizingText.js';

import CustomRating from '../../../../common/ratingStar.jsx';

/**
 * Composant thumbnailContext - Carte interactive pour afficher un livre
 * 
 * @param {Object} book - Les données du livre
 * @param {Function} onShowSummary - Callback pour afficher le résumé dans le menu contextuel
 */
const ThumbnailContext = ({ book, onShowSummary }) => {

    const navigate = useNavigate();
    const titleRef = useRef(null);
	const avgRating = book?.avg_rating || 0;

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
        <div className="thumbnailContext" onClick={handleDetailClick}>
            {/* Image du livre */}
            <div className="thumbnailContext__image-container">
                <img 
                    src={`/images/vignettesImages/${book.vignetteimage}`}
                    alt={`Couverture de ${decodeHtml(book.title)}`}
                    className="thumbnailContext__image"
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
                    className="thumbnailContext__title" 
                    title={decodeHtml(book.title)}
                >
                    {decodeHtml(book.title)}
                </h3>

                {/* Auteur */}
                {book.editor && (
                <p className="thumbnail__author">{decodeHtml(book.author)}</p>
                )}

                {/* editeur */}
                {book.editor && (
                    <p className="thumbnailContext__editor">{decodeHtml(book.editor)}</p>
                )}

                {/* note moyenne */}
                <div className="book-info__rating">
                    <span className="book-info__rating-label">Note moyenne :</span>
                    <span>
                    <CustomRating
                        name="avg-rating"//size-small
                        defaultValue={avgRating || 0}
                        size="small"
                    />
                    </span>
                </div>
                <div className="thumbnail__stats">

                    {/* nombre de fois ou le livre est en favoris */}
                    <span>
                        <i className="fas fa-heart"></i>
                        <span>{` `}{book?.is_in_favorite || 0}</span>

                    </span>


                    {/* nombre de fois ou le livre est dans une bibliotheque */}

                    <span>
                        <i className="fas fa-book"></i>
                        <span>{` `}{book?.is_in_library || 0}</span>
                    </span>
                    
                </div>


            </div>
        </div>
    );
};


export default ThumbnailContext;