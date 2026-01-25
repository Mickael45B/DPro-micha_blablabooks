/**
 * Version alternative : ajuste la taille pour tenir sur N lignes
 * 
 * @param {HTMLElement} el - L'élément DOM à redimensionner
 * @param {Object} options - Options de configuration
 * @param {number} options.maxLines - Nombre de lignes maximum (défaut: 2)
 * @param {number} options.max - Taille maximale de la police (défaut: 16px)
 * @param {number} options.min - Taille minimale de la police (défaut: 10px)
 * @param {number} options.step - Pas de réduction (défaut: 0.5px)
 * @returns {number|null} - La taille finale appliquée, ou null si erreur
 */
export function fitTextToLines(el, options = {}) {
  if (!el || !(el instanceof Element)) {
    console.warn('fitTextToLines: élément invalide', el);
    return null;
  }

  const maxLines = parseInt(options.maxLines) || 2;
  const max = parseFloat(options.max ?? el.dataset.max) || 16;
  const min = parseFloat(options.min ?? el.dataset.min) || 10;
  const step = parseFloat(options.step) || 0.5;
  const actualStep = step > 0 ? step : 0.5;

  // Configurer pour plusieurs lignes
  el.style.overflow = 'hidden';
  el.style.display = '-webkit-box';
  el.style.webkitLineClamp = maxLines;
  el.style.webkitBoxOrient = 'vertical';

  let size = max;
  el.style.fontSize = `${size}px`;

  // Calculer la hauteur maximale autorisée
  const lineHeight = parseFloat(window.getComputedStyle(el).lineHeight) || size * 1.2;
  const maxHeight = lineHeight * maxLines;

  let iterations = 0;
  const maxIterations = 100;

  // Réduire jusqu'à ce que le texte rentre
  while (el.scrollHeight > maxHeight && size > min && iterations < maxIterations) {
    size = Math.max(size - actualStep, min);
    el.style.fontSize = `${size}px`;
    iterations++;
  }

  if (iterations >= maxIterations) {
    console.warn('fitTextToLines: nombre maximal d\'itérations atteint');
  }

  return size;
}