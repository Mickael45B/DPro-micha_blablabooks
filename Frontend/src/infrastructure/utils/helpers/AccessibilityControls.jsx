/**
 * Composant AccessibilityControls
 * Gère le mode clair/sombre et les options d'accessibilité (dyslexie, malvoyants)
 */
import React, { useState, useEffect } from 'react';
import './AccessibilityControls.css';

const AccessibilityControls = () => {
  // États pour les préférences
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  const [fontMode, setFontMode] = useState(() => {
    return localStorage.getItem('fontMode') || 'default';
  });

  // Appliquer le mode sombre
  useEffect(() => {
    if (darkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  // Appliquer le mode de police
  useEffect(() => {
    if (fontMode && fontMode !== 'default') {
      document.documentElement.setAttribute('data-font', fontMode);
    } else {
      document.documentElement.removeAttribute('data-font');
    }
    localStorage.setItem('fontMode', fontMode);
    
    // Debug
    //console.log('Font mode appliqué:', fontMode);
    //console.log('data-font attribute:', document.documentElement.getAttribute('data-font'));
  }, [fontMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const toggleFontMode = (mode) => {
    // Si on clique sur le mode déjà actif, on revient au défaut
    setFontMode(currentMode => currentMode === mode ? 'default' : mode);
  };

return (
    <div className="accessibility-controls">
        {/* Switch Mode Clair/Sombre - Shadow Effect Toggle */}
        <div className="accessibility-controls__theme">
            <span className="theme-slider__icon theme-slider__icon--sun">
                <i className="fas fa-sun"></i>
            </span>      
            <label className="theme-switch">
            <input 
                type="checkbox" 
                checked={darkMode}
                onChange={toggleDarkMode}
                aria-label={darkMode ? 'Passer en mode clair' : 'Passer en mode sombre'}
            />
            <span className="theme-slider">
            </span>
            </label>
            <span className="theme-slider__icon theme-slider__icon--moon">
                <i className="fas fa-moon"></i>
            </span>       
        </div>

        {/* Switches d'accessibilité - Physical Toggle */}
        <div className="physicalsToggle">

            {/* Switch Dyslexie */}            
            <div className="accessibility-controls__fonts">
            <label className="physical-switch">
                <span className="physical-switch__label physical-switch__label--left">
                    <i className="fas fa-font"></i>
                    <span className="physical-switch__text">Dyslexie</span>
                </span>
                <input  
                type="checkbox"
                checked={fontMode === 'dyslexic'}
                onChange={() => toggleFontMode('dyslexic')}
                aria-label="Police dyslexie"
                />
                <span className="physical-switch__slider"></span>
                
            </label>
            </div>

            {/* Switch Malvoyants */}
            <div className="accessibility-controls__fonts">
                <label className="physical-switch">
                    <span className="physical-switch__label physical-switch__label--left">
                        <i className="fas fa-eye"></i>
                        <span className="physical-switch__text">Malvoyant</span>
                    </span>
                    <input 
                    type="checkbox"
                    checked={fontMode === 'visuallyImpaired'}
                    onChange={() => toggleFontMode('visuallyImpaired')}
                    aria-label="Police pour malvoyants"
                    />
                    <span className="physical-switch__slider"></span>
                </label>
            </div>
            
        </div>
    </div>
  );
};
export default AccessibilityControls;