import React, { useState } from 'react';
import './ContextualMenuLibraries.css';

/**
 * Menu contextuel pour la page bibliothèques
 * - Recherche globale
 * - Filtres (statut, tags, note)
 * - Tri
 * - Statistiques globales
 */
const ContextualMenuLibraries = ({ 
  libraries = [],
  selectedLibrary,
  filters,
  onFilterChange,
  onCreateLibrary
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Calculer les stats globales
  const globalStats = libraries.reduce((acc, lib) => ({
    total_libraries: acc.total_libraries + 1,
    total_books: acc.total_books + (lib.total_books || 0),
    books_read: acc.books_read + (lib.books_read || 0),
    books_reading: acc.books_reading + (lib.books_reading || 0),
    books_to_read: acc.books_to_read + (lib.books_to_read || 0)
  }), {
    total_libraries: 0,
    total_books: 0,
    books_read: 0,
    books_reading: 0,
    books_to_read: 0
  });

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    onFilterChange({ ...filters, search: value });
  };

  const handleStatusFilter = (status) => {
    const newStatus = filters.reading_status === status ? null : status;
    onFilterChange({ ...filters, reading_status: newStatus });
  };

  const handleFavoriteFilter = () => {
    const newFavorite = filters.is_favorite === true ? null : true;
    onFilterChange({ ...filters, is_favorite: newFavorite });
  };

  const handleSortChange = (field) => {
    const newDirection = 
      filters.sort_field === field && filters.sort_direction === 'ASC' 
        ? 'DESC' 
        : 'ASC';
    
    onFilterChange({ 
      ...filters, 
      sort_field: field, 
      sort_direction: newDirection 
    });
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    onFilterChange({
      search: '',
      reading_status: null,
      is_favorite: null,
      sort_field: 'created_at',
      sort_direction: 'DESC'
    });
  };

  const hasActiveFilters = 
    searchTerm || 
    filters.reading_status || 
    filters.is_favorite !== null;

  return (
    <div className="contextual-menu-libraries">
      {/* Statistiques globales */}
      <div className="contextual-menu-libraries__stats">
        <h3 className="contextual-menu-libraries__stats-title">
          <i className="fas fa-chart-bar"></i>
          Mes statistiques
        </h3>
        
        <div className="contextual-menu-libraries__stats-grid">
          <div className="stat-card">
            <div className="stat-card__icon" style={{ backgroundColor: '#3498db' }}>
              <i className="fas fa-book"></i>
            </div>
            <div className="stat-card__content">
              <span className="stat-card__value">{globalStats.total_libraries}</span>
              <span className="stat-card__label">Bibliothèques</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card__icon" style={{ backgroundColor: '#d7355c' }}>
              <i className="fas fa-books"></i>
            </div>
            <div className="stat-card__content">
              <span className="stat-card__value">{globalStats.total_books}</span>
              <span className="stat-card__label">Livres</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card__icon" style={{ backgroundColor: '#27ae60' }}>
              <i className="fas fa-check"></i>
            </div>
            <div className="stat-card__content">
              <span className="stat-card__value">{globalStats.books_read}</span>
              <span className="stat-card__label">Lus</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card__icon" style={{ backgroundColor: '#f39c12' }}>
              <i className="fas fa-book-reader"></i>
            </div>
            <div className="stat-card__content">
              <span className="stat-card__value">{globalStats.books_reading}</span>
              <span className="stat-card__label">En cours</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recherche */}
      <div className="contextual-menu-libraries__search">
        <h3 className="contextual-menu-libraries__section-title">
          <i className="fas fa-search"></i>
          Rechercher
        </h3>
        
        <div className="search-box">
          <input
            type="text"
            placeholder="Titre, auteur..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="search-box__input"
          />
          {searchTerm && (
            <button 
              className="search-box__clear"
              onClick={() => handleSearchChange({ target: { value: '' } })}
            >
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>
      </div>

      {/* Filtres */}
      <div className="contextual-menu-libraries__filters">
        <div className="contextual-menu-libraries__section-header">
          <h3 className="contextual-menu-libraries__section-title">
            <i className="fas fa-filter"></i>
            Filtres
            {hasActiveFilters && (
              <span className="filter-badge">{
                [searchTerm, filters.reading_status, filters.is_favorite].filter(Boolean).length
              }</span>
            )}
          </h3>
          <button 
            className="toggle-filters-btn"
            onClick={() => setShowFilters(!showFilters)}
          >
            <i className={`fas fa-chevron-${showFilters ? 'up' : 'down'}`}></i>
          </button>
        </div>

        {showFilters && (
          <div className="filters-content">
            {/* Statut de lecture */}
            <div className="filter-group">
              <label className="filter-group__label">Statut de lecture</label>
              <div className="filter-buttons">
                <button
                  className={`filter-button ${filters.reading_status === 'to_read' ? 'filter-button--active' : ''}`}
                  onClick={() => handleStatusFilter('to_read')}
                >
                  📕 À lire
                </button>
                <button
                  className={`filter-button ${filters.reading_status === 'reading' ? 'filter-button--active' : ''}`}
                  onClick={() => handleStatusFilter('reading')}
                >
                  📖 En cours
                </button>
                <button
                  className={`filter-button ${filters.reading_status === 'read' ? 'filter-button--active' : ''}`}
                  onClick={() => handleStatusFilter('read')}
                >
                  📗 Lu
                </button>
                <button
                  className={`filter-button ${filters.reading_status === 'reread' ? 'filter-button--active' : ''}`}
                  onClick={() => handleStatusFilter('reread')}
                >
                  🔁 À relire
                </button>
              </div>
            </div>

            {/* Favoris */}
            <div className="filter-group">
              <label className="filter-group__label">Autres filtres</label>
              <button
                className={`filter-button ${filters.is_favorite === true ? 'filter-button--active' : ''}`}
                onClick={handleFavoriteFilter}
              >
                <i className="fas fa-heart"></i>
                Favoris uniquement
              </button>
            </div>

            {/* Reset */}
            {hasActiveFilters && (
              <button 
                className="reset-filters-btn"
                onClick={handleResetFilters}
              >
                <i className="fas fa-undo"></i>
                Réinitialiser les filtres
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tri */}
      <div className="contextual-menu-libraries__sort">
        <h3 className="contextual-menu-libraries__section-title">
          <i className="fas fa-sort"></i>
          Trier par
        </h3>
        
        <div className="sort-buttons">
          <button
            className={`sort-button ${filters.sort_field === 'title' ? 'sort-button--active' : ''}`}
            onClick={() => handleSortChange('title')}
          >
            Titre
            {filters.sort_field === 'title' && (
              <i className={`fas fa-arrow-${filters.sort_direction === 'ASC' ? 'up' : 'down'}`}></i>
            )}
          </button>

          <button
            className={`sort-button ${filters.sort_field === 'author' ? 'sort-button--active' : ''}`}
            onClick={() => handleSortChange('author')}
          >
            Auteur
            {filters.sort_field === 'author' && (
              <i className={`fas fa-arrow-${filters.sort_direction === 'ASC' ? 'up' : 'down'}`}></i>
            )}
          </button>

          <button
            className={`sort-button ${filters.sort_field === 'created_at' ? 'sort-button--active' : ''}`}
            onClick={() => handleSortChange('created_at')}
          >
            Date d'ajout
            {filters.sort_field === 'created_at' && (
              <i className={`fas fa-arrow-${filters.sort_direction === 'ASC' ? 'up' : 'down'}`}></i>
            )}
          </button>

          <button
            className={`sort-button ${filters.sort_field === 'rating' ? 'sort-button--active' : ''}`}
            onClick={() => handleSortChange('rating')}
          >
            Note
            {filters.sort_field === 'rating' && (
              <i className={`fas fa-arrow-${filters.sort_direction === 'ASC' ? 'up' : 'down'}`}></i>
            )}
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="contextual-menu-libraries__actions">
        <button 
          className="action-button action-button--primary"
          onClick={onCreateLibrary}
        >
          <i className="fas fa-plus-circle"></i>
          Nouvelle bibliothèque
        </button>
      </div>
    </div>
  );
};

export default ContextualMenuLibraries;
