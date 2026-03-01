// Il faut actualiser la page pour que les changements soient pris en compte. Voici le code de la carte de livre draggable, qui permet d'afficher les livres dans une bibliothèque avec des actions rapides et une progression modifiable.

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from "react-router-dom";

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useMutation } from '@apollo/client';
import { getUserFromToken } from '../../../../data/graphql/queries/auth.jsx';

import { 
  TOGGLE_BOOK_READ, 
  UPDATE_PROGRESS
} from '../../../../data/graphql/queries/libraryQueries.jsx';

import { 
	GET_BOOK_BY_ID, 
	GET_MY_LIBRARIES_WITH_BOOK,
	IS_BOOK_IN_FAVORITES,
	GET_MY_REVIEW_FOR_BOOK,
	ADD_BOOK_TO_LIBRARY,
	REMOVE_BOOK_FROM_LIBRARY,
	TOGGLE_BOOK_FAVORITE,
	CREATE_REVIEW,
	UPDATE_REVIEW,
	DELETE_REVIEW
} from "../../../../data/graphql/queries/queriesBooks.jsx";


import './BookCardDraggable.css';

import Box from '@mui/material/Box';
import Slider from '@mui/material/Slider';

/**
 * Carte de livre draggable
 * - Vue grille ou liste
 * - Statut de lecture (badge)
 * - Progression (barre)
 * - Actions rapides (Lu, Favori, Supprimer)
 */
const BookCardDraggable = ({ BookHasLibrary, viewMode = 'grid', onRefresh }) => {
  // Hooks DOIVENT être à l'intérieur du composant
  const navigate = useNavigate();
  const { id } = useParams();
  const userState = getUserFromToken();
  const isAuthenticated = !!userState;

  const [isFavorite, setIsFavorite] = useState(BookHasLibrary.is_favorite);



  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ 
    id: BookHasLibrary.id_book,
    data: { type: 'book', BookHasLibrary }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  // Mutations
  const [toggleRead] = useMutation(TOGGLE_BOOK_READ, {
    onCompleted: onRefresh
  });




  const [removeBook] = useMutation(REMOVE_BOOK_FROM_LIBRARY, {
    onCompleted: () => {
      if (onRefresh) onRefresh();
    }
  });



  const [updateProgress] = useMutation(UPDATE_PROGRESS, {
    onCompleted: onRefresh
  });

  const [toggleFavorite] = useMutation(TOGGLE_BOOK_FAVORITE, {
    onCompleted: (data) => {
      console.log('Toggle favorite response:', data);
      const newFavStatus = data.updateFavoriteStatusInBookHasLibrary.is_favorite;
      console.log('New favorite status:', newFavStatus);
      setIsFavorite(newFavStatus);
      if (onRefresh) onRefresh();
    }
  });







  const handleToggleRead = (e) => {
    e.stopPropagation();
    toggleRead({
      variables: { id_bookhaslibrary: BookHasLibrary.id_bookhaslibrary }
    });
  };



  const handleToggleFavorite = async (e) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      alert('Connectez-vous pour ajouter aux favoris');
      return;
    }
    try {
      await toggleFavorite({ 
        variables: { 
          input: { id_book: BookHasLibrary.id_book } 
        } 
      });
    } catch (error) {
      console.error('Erreur toggle favori:', error);
      alert('Erreur lors de la mise à jour');
    }
  };



  





  const handleRemove = async (e) => {
    e.stopPropagation();
    if (!confirm('Retirer ce livre de cette bibliothèque ?')) return;

    try {
      await removeBook({ 
        variables: { 
          input: { 
            id_bookhaslibrary: BookHasLibrary.id_bookhaslibrary,
            id_book: BookHasLibrary.id_book,
            id_library: BookHasLibrary.id_library
          }
        } 
      });
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert('Erreur lors de la suppression');
    }
  };










  const handleNavigate = () => {
    window.location.href = `/livres/${BookHasLibrary.id_book}`;
  };

  // Data - DOIT être défini AVANT les états
  const book = BookHasLibrary.book || {};
  const title = book.title || 'Sans titre';
  const author = book.author && book.author !== null ? book.author : 'Auteur inconnu';
  const rating = book.avg_rating ? parseFloat(book.avg_rating).toFixed(1) : null;
  const progress = BookHasLibrary.progress_percentage || 0;

  // États - APRÈS les données
  const [localProgress, setLocalProgress] = useState(progress);

  // Synchroniser quand la progression change (après mutation)
  useEffect(() => {
    setLocalProgress(progress);
  }, [progress]);

  const handleProgressChange = (e, newValue) => {
    e.stopPropagation();
    //console.log('Progression en cours:', newValue);
    // Juste pour l'affichage visuel, pas de requête ici
  };

  const handleProgressCommit = (e, newValue) => {
    //console.log('Progression finalisée:', newValue);
    setLocalProgress(newValue);
    updateProgress({
      variables: { 
        id_bookhaslibrary: BookHasLibrary.id_bookhaslibrary,
        progress_percentage: newValue
      }
    });
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    // Autoriser vide temporairement pour la saisie
    if (value === '') {
      setLocalProgress('');
      return;
    }
    
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
      setLocalProgress(numValue);
    }
  };

  const handleInputCommit = (newValue = localProgress) => {
    const numValue = parseInt(newValue);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
      //console.log('Progression saisie:', numValue);
      setLocalProgress(numValue);
      updateProgress({
        variables: { 
          id_bookhaslibrary: BookHasLibrary.id_bookhaslibrary,
          progress_percentage: numValue
        }
      });
    } else {
      // Réinitialiser à la valeur précédente si invalide
      setLocalProgress(progress);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleInputCommit(e.target.value);
    }
  };

  const handleInputBlur = (e) => {
    handleInputCommit(e.target.value);
  };

  // Debugging
  //console.log('📖 BookCardDraggable - book data:', { book, author, book_author_raw: book.author });
  
  // Badges
  const statusConfig = {
    to_read: { icon: '📕', label: 'À lire', color: '#e74c3c' },
    reading: { icon: '📖', label: 'En cours', color: '#f39c12' },
    read: { icon: '📗', label: 'Lu', color: '#27ae60' },
    reread: { icon: '🔁', label: 'À relire', color: '#3498db' }
  };

  const status = statusConfig[BookHasLibrary.reading_status] || statusConfig.to_read;

  if (viewMode === 'list') {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`book-card-list ${isDragging ? 'book-card-list--dragging' : ''}`}
        onClick={handleNavigate}
      >
        {/* Drag handle */}
        <div 
          className="book-card-list__drag"
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
        >
          <i className="fas fa-grip-vertical"></i>
        </div>

        {/* Image */}
        <img
          src={`/images/vignettesImages/${book.vignetteimage}`}
          alt={title}
          className="book-card-list__image"
          onError={(e) => {
            e.target.src = '/images/booksImages/image_not_found.png';
          }}
        />

        {/* Infos */}
        <div className="book-card-list__info">
          <h4 className="book-card-list__title">{title}</h4>
          <p className="book-card-list__author">{author}</p>
          
          {/* Tags */}
          {BookHasLibrary.tags && BookHasLibrary.tags.length > 0 && (
            <div className="book-card-list__tags">
              {BookHasLibrary.tags.map((tag, idx) => (
                <span key={idx} className="book-card-list__tag">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Statut */}
        <div className="book-card-list__status">
          <span 
            className="book-card-list__status-badge"
            style={{ backgroundColor: status.color }}
          >
            {status.icon} {status.label}
          </span>
        </div>

        {/* Progression */}
          <div
            className="book-card-list__progress-container"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
          >
            <div className="book-card-list__progress-bar">

              <span>
                📖 Progression
              </span>
              <span className="book-card-grid__progress" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                {/* Zone de saisie */}
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={localProgress}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  onBlur={handleInputBlur}
                  style={{
                    width: '50px',
                    padding: '6px 8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    textAlign: 'center',
                    fontWeight: 'bold'
                  }}
                  placeholder="%"
                />
              </span>

              <span className="book-card-list__progress-text">
                <Box sx={{ flex: 1 }}>
                  <Slider
                    value={localProgress === '' ? 0 : localProgress}
                    onChange={(e, newValue) => {
                      setLocalProgress(newValue);
                      handleProgressChange(e, newValue);
                    }}
                    onChangeCommitted={handleProgressCommit}
                    min={0}
                    max={100}
                    step={5}
                    marks={[
                      { value: 0, label: '0%' },
                      { value: 50, label: '50%' },
                      { value: 100, label: '100%' }
                    ]}
                    valueLabelDisplay="auto"
                    sx={{
                      '& .MuiSlider-track': {
                        backgroundColor: '#27ae60'
                      },
                      '& .MuiSlider-thumb': {
                        backgroundColor: '#2ecc71'
                      },
                      '& .MuiSlider-mark': {
                        fontSize: '10px'
                      }
                    }}
                  />
                </Box>
              </span>
            </div>

          </div>























        {/* Note */}
        {rating && (
          <div className="book-card-list__rating">
            <i className="fas fa-star"></i>
            <span>{rating}</span>
          </div>
        )}

        {/* Actions */}
        <div className="book-card-list__actions">
          <button
            className={`book-card-list__action ${BookHasLibrary.is_read ? 'book-card-list__action--active' : ''}`}
            onClick={handleToggleRead}
            title={BookHasLibrary.is_read ? 'Marquer non lu' : 'Marquer lu'}
          >
            <i className="fas fa-check"></i>
          </button>
          
          <button
            className={`book-card-list__action ${isFavorite ? 'book-card-list__action--favorite' : ''}`}
            onClick={handleToggleFavorite}
            title={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          >
            <i className="fas fa-heart"></i>
          </button>
          
          <button
            className="book-card-list__action book-card-list__action--delete"
            onClick={handleRemove}
            title="Retirer de la bibliothèque"
          >
            <i className="fas fa-trash"></i>
          </button>
        </div>
      </div>
    );
  }

  // Vue grille
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`book-card-grid ${isDragging ? 'book-card-grid--dragging' : ''}`}
    >
      {/* Image container */}
      <div className="book-card-grid__image-container">
        <img
          src={`/images/vignettesImages/${book.vignetteimage}`}
          alt={title}
          className="book-card-grid__image"
          onError={(e) => {
            e.target.src = '/images/booksImages/image_not_found.png';
          }}
        />
        
        {/* Statut badge */}
        <div 
          className="book-card-grid__status-badge"
          style={{ backgroundColor: status.color }}
        >
          {status.icon}
        </div>

        {/* Favori badge */}
        {isFavorite && (
          <div className="book-card-grid__favorite-badge">
            <i className="fas fa-heart"></i>
          </div>
        )}

        {/* Drag handle */}
        <div 
          className="book-card-grid__drag"
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
        >
          <i className="fas fa-grip-vertical"></i>
        </div>
      </div>

      {/* Contenu */}
      <div className="book-card-grid__content">
        <h4 className="book-card-grid__title">{title}</h4>
        <p className="book-card-grid__author">{author}</p>

        {/* Progression */}
        <div className="book-card-grid__progressLabel">
          <span>
            📖 Progression de lecture
          </span>
          <span className="book-card-grid__progress" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {/* Zone de saisie */}
            <input
              type="number"
              min="0"
              max="100"
              value={localProgress}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              onBlur={handleInputBlur}
              style={{
                width: '50px',
                padding: '6px 8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                textAlign: 'center',
                fontWeight: 'bold'
              }}
              placeholder="%"
            />
          </span>
        </div>
        <div>
          {/* Slider */}
          <Box sx={{ flex: 1 }}>
            <Slider
              value={localProgress === '' ? 0 : localProgress}
              onChange={(e, newValue) => {
                setLocalProgress(newValue);
                handleProgressChange(e, newValue);
              }}
              onChangeCommitted={handleProgressCommit}
              min={0}
              max={100}
              step={5}
              marks={[
                { value: 0, label: '0%' },
                { value: 50, label: '50%' },
                { value: 100, label: '100%' }
              ]}
              valueLabelDisplay="auto"
              sx={{
                '& .MuiSlider-track': {
                  backgroundColor: '#27ae60'
                },
                '& .MuiSlider-thumb': {
                  backgroundColor: '#2ecc71'
                },
                '& .MuiSlider-mark': {
                  fontSize: '10px'
                }
              }}
            />
          </Box>
        </div>

        {/* Note */}
        {rating && (
          <div className="book-card-grid__rating">
            <i className="fas fa-star"></i>
            <span>{rating}</span>
          </div>
        )}

        {/* Tags */}
        {BookHasLibrary.tags && BookHasLibrary.tags.length > 0 && (
          <div className="book-card-grid__tags">
            {BookHasLibrary.tags.slice(0, 2).map((tag, idx) => (
              <span key={idx} className="book-card-grid__tag">
                {tag}
              </span>
            ))}
            {BookHasLibrary.tags.length > 2 && (
              <span className="book-card-grid__tag">
                +{BookHasLibrary.tags.length - 2}
              </span>
            )}
          </div>
        )}

        {/* Actions rapides */}
        <div className="book-card-grid__actions">
          <button
            className={`book-card-grid__action ${BookHasLibrary.is_read ? 'book-card-grid__action--active' : ''}`}
            onClick={handleToggleRead}
            title={BookHasLibrary.is_read ? 'Non lu' : 'Lu'}
          >
            <i className="fas fa-check"></i>
          </button>
          
          <button
            className={`book-card-grid__action ${isFavorite ? 'book-card-grid__action--favorite' : ''}`}
            onClick={handleToggleFavorite}
            title={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          >
            <i className="fas fa-heart"></i>
          </button>
          
          <button
            className="book-card-grid__action book-card-grid__action--delete"
            onClick={handleRemove}
            title="Retirer"
          >
            <i className="fas fa-times"></i>
          </button>

          <button
            className="book-card-grid__action book-card-grid__action--view"
            onClick={(e) => {
              e.stopPropagation();
              handleNavigate();
            }}
            title="Voir le détail du livre"
            style={{
              backgroundColor: '#3498db',
              color: 'white',
              padding: '8px 12px',
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '12px',
              flex: 1
            }}
          >
            <i className="fas fa-book"></i> Détail
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookCardDraggable;
