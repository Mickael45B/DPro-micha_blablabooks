import React from 'react';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import './LibraryCard.css';

/**
 * Carte d'une bibliothèque
 * - Affiche nom, couleur, statistiques
 * - Badge 🔒 si non éditable
 * - Actions : Modifier, Supprimer
 * - Drop zone pour drag & drop
 */
const LibraryCard = ({ 
  library, 
  isSelected, 
  onSelect, 
  onEdit, 
  onDelete 
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver
  } = useSortable({ 
    id: `library-${library.id_library}`,
    data: { type: 'library', library }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  // Formater les stats depuis l'objet imbriqué stats
  const totalBooks = library.stats?.total_books || 0;
  const booksRead = library.stats?.books_read || 0;
  const avgRating = library.stats?.avg_rating ? parseFloat(library.stats.avg_rating).toFixed(1) : null;

  //console.log('Rendering LibraryCard:', library.name, { totalBooks, booksRead, avgRating });


  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`library-card ${isSelected ? 'library-card--selected' : ''} ${isOver ? 'library-card--dragover' : ''}`}
      onClick={onSelect}
    >
      {/* Barre de couleur */}
      <div 
        className="library-card__color-bar"
        style={{ backgroundColor: library.color }}
      />

      {/* Header */}
      <div className="library-card__header">
        <div className="library-card__title-row">
          <h3 className="library-card__name">
            <span 
              className="library-card__color-dot"
              style={{ backgroundColor: library.color }}
            />
            {library.name}
            {library.is_default && (
              <span className="library-card__badge" title="Bibliothèque par défaut">
                🔒
              </span>
            )}
          </h3>
          
          {/* Drag handle */}
          <button
            className="library-card__drag-handle"
            {...attributes}
            {...listeners}
            onClick={(e) => e.stopPropagation()}
            title="Réorganiser"
          >
            <i className="fas fa-grip-vertical"></i>
          </button>
        </div>

        {library.description && (
          <p className="library-card__description">
            {library.description}
          </p>
        )}
      </div>

      {/* Statistiques */}
      <div className="library-card__stats">
        <div className="library-card__stat">
          <i className="fas fa-book"></i>
          <span className="library-card__stat-value">{totalBooks}</span>
          <span className="library-card__stat-label">livres{totalBooks > 1 ? 's' : ''}</span>
        </div>

        {booksRead > 0 && (
          <div className="library-card__stat">
            <i className="fas fa-check-circle"></i>
            <span className="library-card__stat-value">{booksRead}</span>
            <span className="library-card__stat-label">livre{booksRead > 1 ? 's' : ''}</span>
          </div>
        )}

        {avgRating && (
          <div className="library-card__stat">
            <i className="fas fa-star"></i>
            <span className="library-card__stat-value">{avgRating}</span>
            <span className="library-card__stat-label">note</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="library-card__actions">
        {library.is_editable && (
          <>
            <button
              className="library-card__action library-card__action--edit"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              title="Modifier"
            >
              <i className="fas fa-edit"></i>
            </button>
            
            <button
              className="library-card__action library-card__action--delete"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              title="Supprimer"
            >
              <i className="fas fa-trash"></i>
            </button>
          </>
        )}
      </div>

      {/* Indicateur drop zone */}
      {isOver && (
        <div className="library-card__drop-indicator">
          <i className="fas fa-plus-circle"></i>
          <span>Déposer ici</span>
        </div>
      )}

      {/* Badge public */}
      {library.is_public && (
        <div className="library-card__public-badge" title="Bibliothèque publique">
          <i className="fas fa-globe"></i>
        </div>
      )}
    </div>
  );
};

export default LibraryCard;
