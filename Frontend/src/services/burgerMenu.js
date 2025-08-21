// Fonction pour basculer l'état d'ouverture de la barre de navigation
const toggleNav = (setIsNavOpen) => {
  setIsNavOpen((prevState) => !prevState);
};

// Fonction pour fermer la barre de navigation lorsqu'un clic est effectué à l'extérieur
const closeNavOnOutsideClick = (setIsNavOpen, navRef) => {
  const handleClickOutside = (event) => {
    // Vérifie si le clic est en dehors de la barre de navigation
    if (navRef?.current && !navRef.current.contains(event.target)) {
      setIsNavOpen(false);
    }
  };

  // Ajoute un écouteur d'événement pour détecter les clics
  document.addEventListener('mousedown', handleClickOutside);

  // Retourne une fonction pour nettoyer l'écouteur
  return () => {
    document.removeEventListener('mousedown', handleClickOutside);
  };
};

// Fonction pour fermer la barre de navigation lorsqu'on appuie sur la touche Échap
const closeNavOnEscape = (setIsNavOpen) => {
  const handleKeyDown = (event) => {
    // Vérifie si la touche Échap est pressée
    if (event.key === 'Escape') {
      setIsNavOpen(false);
    }
  };

  // Ajoute un écouteur d'événement pour détecter les pressions de touches
  document.addEventListener('keydown', handleKeyDown);

  // Retourne une fonction pour nettoyer l'écouteur
  return () => {
    document.removeEventListener('keydown', handleKeyDown);
  };
};

export { toggleNav, closeNavOnOutsideClick, closeNavOnEscape };