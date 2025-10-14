// Helpers réutilisables pour les résolveurs de livres
// Fonctions pures : elles reçoivent des données en paramètres et retournent des résultats

/**
 * Aplatis un tableau d'edges { node, cursor } en un tableau de nodes (Book)
 * Retourne un tableau vide si input invalide
 */
export function flattenEdges(edges) {
  if (!Array.isArray(edges)) return [];
  return edges.map(e => (e && e.node ? e.node : null)).filter(Boolean);
}

/**
 * Construit un objet pageInfo conforme au pattern utilisé dans le projet
 * edges: tableau d'edges (peut être vide)
 */
export function makePageInfo({ offset = 0, limit = 0, totalCount = 0, edges = [] } = {}) {
  const hasNextPage = offset + limit < totalCount;
  const hasPreviousPage = offset > 0;
  const startCursor = edges.length > 0 ? edges[0].cursor : null;
  const endCursor = edges.length > 0 ? edges[edges.length - 1].cursor : null;
  return { hasNextPage, hasPreviousPage, startCursor, endCursor };
}

/**
 * Génère un edge { node, cursor } à partir d'un objet book (utile si le resolver renvoie rows)
 */
export function makeEdgeFromBook(book) {
  const cursor = book && book.id_book ? Buffer.from(book.id_book).toString('base64') : null;
  return { node: book, cursor };
}
