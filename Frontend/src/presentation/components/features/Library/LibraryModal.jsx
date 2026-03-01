import React, { useState, useEffect } from 'react';
import './LibraryModal.css';

/**
 * Modal création/édition de bibliothèque
 * - Input nom (requis, unique)
 * - Textarea description (optionnel)
 * - Color picker
 * - Toggle public/privé
 * - Validation
 */
const LibraryModal = ({ mode = 'create', library, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#d7355c',
    is_public: false
  });

  const [errors, setErrors] = useState({});

  // Pré-remplir en mode édition
  useEffect(() => {
    if (mode === 'edit' && library) {
      setFormData({
        name: library.name || '',
        description: library.description || '',
        color: library.color || '#d7355c',
        is_public: library.is_public || false
      });
    }
  }, [mode, library]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error quand l'utilisateur modifie
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Le nom est requis';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Le nom doit contenir au moins 2 caractères';
    } else if (formData.name.trim().length > 50) {
      newErrors.name = 'Le nom ne peut pas dépasser 50 caractères';
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'La description ne peut pas dépasser 500 caractères';
    }

    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit({
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      color: formData.color,
      is_public: formData.is_public
    });
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Couleurs prédéfinies
  const presetColors = [
    '#d7355c', // Rose
    '#FFD700', // Or (Favoris)
    '#27AE60', // Vert (Lus)
    '#3498DB', // Bleu
    '#9B59B6', // Violet
    '#E74C3C', // Rouge
    '#F39C12', // Orange
    '#1ABC9C', // Turquoise
    '#34495E', // Gris foncé
    '#E91E63'  // Rose vif
  ];

  return (
    <div className="library-modal-backdrop" onClick={handleBackdropClick}>
      <div className="library-modal">
        {/* Header */}
        <div className="library-modal__header">
          <h2 className="library-modal__title">
            <i className={`fas fa-${mode === 'create' ? 'plus-circle' : 'edit'}`}></i>
            {mode === 'create' ? 'Nouvelle bibliothèque' : 'Modifier la bibliothèque'}
          </h2>
          <button 
            className="library-modal__close"
            onClick={onClose}
            type="button"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Form */}
        <form className="library-modal__form" onSubmit={handleSubmit}>
          {/* Nom */}
          <div className="library-modal__field">
            <label htmlFor="library-name" className="library-modal__label">
              Nom de la bibliothèque *
            </label>
            <input
              type="text"
              id="library-name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`library-modal__input ${errors.name ? 'library-modal__input--error' : ''}`}
              placeholder="Ex: Science-Fiction, Romans policiers..."
              maxLength={50}
              autoFocus
            />
            {errors.name && (
              <span className="library-modal__error">
                <i className="fas fa-exclamation-circle"></i>
                {errors.name}
              </span>
            )}
            <span className="library-modal__hint">
              {formData.name.length}/50 caractères
            </span>
          </div>

          {/* Description */}
          <div className="library-modal__field">
            <label htmlFor="library-description" className="library-modal__label">
              Description (optionnel)
            </label>
            <textarea
              id="library-description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className={`library-modal__textarea ${errors.description ? 'library-modal__input--error' : ''}`}
              placeholder="Décrivez votre bibliothèque..."
              rows={3}
              maxLength={500}
            />
            {errors.description && (
              <span className="library-modal__error">
                <i className="fas fa-exclamation-circle"></i>
                {errors.description}
              </span>
            )}
            <span className="library-modal__hint">
              {formData.description.length}/500 caractères
            </span>
          </div>

          {/* Couleur */}
          <div className="library-modal__field">
            <label className="library-modal__label">
              Couleur
            </label>
            <div className="library-modal__color-picker">
              {/* Aperçu couleur sélectionnée */}
              <div className="library-modal__color-preview">
                <div 
                  className="library-modal__color-circle"
                  style={{ backgroundColor: formData.color }}
                />
                <input
                  type="color"
                  name="color"
                  value={formData.color}
                  onChange={handleChange}
                  className="library-modal__color-input"
                />
                <span className="library-modal__color-value">{formData.color}</span>
              </div>

              {/* Couleurs prédéfinies */}
              <div className="library-modal__color-presets">
                {presetColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`library-modal__color-preset ${formData.color === color ? 'library-modal__color-preset--active' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormData(prev => ({ ...prev, color }))}
                    title={color}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Public/Privé */}
          <div className="library-modal__field">
            <label className="library-modal__checkbox-label">
              <input
                type="checkbox"
                name="is_public"
                checked={formData.is_public}
                onChange={handleChange}
                className="library-modal__checkbox"
              />
              <span className="library-modal__checkbox-text">
                <i className="fas fa-globe"></i>
                Rendre cette bibliothèque publique
              </span>
            </label>
            <p className="library-modal__hint">
              Les bibliothèques publiques sont visibles par tous les utilisateurs
            </p>
          </div>

          {/* Actions */}
          <div className="library-modal__actions">
            <button
              type="button"
              className="library-modal__button library-modal__button--cancel"
              onClick={onClose}
            >
              <i className="fas fa-times"></i>
              Annuler
            </button>
            
            <button
              type="submit"
              className="library-modal__button library-modal__button--submit"
            >
              <i className={`fas fa-${mode === 'create' ? 'plus' : 'check'}`}></i>
              {mode === 'create' ? 'Créer' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LibraryModal;
