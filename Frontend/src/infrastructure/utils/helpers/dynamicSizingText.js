/**
 * Ajuste dynamiquement la taille de police d'un élément pour qu'il tienne sur une seule ligne
 * 
 * @param {HTMLElement} el - L'élément DOM à redimensionner
 * @param {Object} options - Options de configuration
 * @param {number} options.max - Taille maximale de la police (défaut: 16px)
 * @param {number} options.min - Taille minimale de la police (défaut: 10px)
 * @param {number} options.step - Pas de réduction (défaut: 0.5px)
 * @returns {number|null} - La taille finale appliquée, ou null si erreur
 */
export default function fitTextToOneLine(el, options = {}) {
  // Vérifications
  if (!el || !(el instanceof Element)) {
    console.warn('fitTextToOneLine: élément invalide', el);
    return null;
  }

  // Configuration avec valeurs par défaut
  const max = parseFloat(options.max ?? el.dataset.max) || 16;
  const min = parseFloat(options.min ?? el.dataset.min) || 10;
  const step = parseFloat(options.step) || 0.5;

  // Protection contre step invalide
  const actualStep = step > 0 ? step : 0.5;

  // Sauvegarder les styles originaux
  const originalStyles = {
    whiteSpace: el.style.whiteSpace,
    overflow: el.style.overflow,
    textOverflow: el.style.textOverflow,
    fontSize: el.style.fontSize
  };

  // Forcer comportement sur une seule ligne
  el.style.whiteSpace = 'nowrap';
  el.style.overflow = 'hidden';
  el.style.textOverflow = 'ellipsis';

  // Commencer avec la taille maximale
  let size = max;
  el.style.fontSize = `${size}px`;

  // Protection contre boucle infinie
  let iterations = 0;
  const maxIterations = 100;

  // Réduire jusqu'à ce que le texte rentre ou qu'on atteigne la taille minimale
  while (el.scrollWidth > el.clientWidth && size > min && iterations < maxIterations) {
    size = Math.max(size - actualStep, min);
    el.style.fontSize = `${size}px`;
    iterations++;
  }

  // Log si on atteint la limite d'itérations (debug)
  if (iterations >= maxIterations) {
    console.warn('fitTextToOneLine: nombre maximal d\'itérations atteint');
  }

  // Si le texte ne rentre toujours pas même à la taille minimale,
  // on garde l'ellipsis pour tronquer
  if (el.scrollWidth > el.clientWidth) {
    //console.log(`fitTextToOneLine: texte trop long même à ${min}px, ellipsis appliqué`);
  }

  return size;
}