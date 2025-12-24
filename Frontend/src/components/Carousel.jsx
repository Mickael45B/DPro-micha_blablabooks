import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from '@apollo/client';
import { GET_BOOKS } from './books/queriesBooks';
import { CREATE_BOOK, UPDATE_BOOK, DELETE_BOOK } from './books/mutationsBooks';
import apolloClient from '../services/apolloClient';
import LoadingSpinner from './LoadingSpinner';

import "../css/Carousel.css";
import "../css/index.css";

// export const bookimages = [
//   { src: image1, index: 1 }, { src: image3, index: 3 }
// ];


// Helper: décoder entités HTML numériques & nommées, puis normaliser le chemin d'image
function decodeHtmlEntities(str) {
  if (!str) return str;
  let out = str
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
  return out;
}
function normalizeImagePath(raw) {
  if (!raw) return raw;
  const decoded = decodeHtmlEntities(raw).trim();
  // Si c'est une URL complète, garder seulement le pathname (sans slash initial)
  try {
    const u = new URL(decoded, window.location.origin);
    const path = u.pathname.startsWith('/') ? u.pathname.slice(1) : u.pathname;
    // si query/hash nécessaires, on peut aussi les ajouter : u.search + u.hash
    return path;
  } catch (e) {
    // pas une URL complète : supprimer éventuel host encodé et slash initiaux
    return decoded.replace(/^https?:\/\/[^/]+/, '').replace(/^\/+/, '');
  }
}







/**
 * Composant Carousel qui affiche un carrousel défilant d'images.
 *
 * @param {Object} props - L'objet des propriétés.
 * @param {boolean} [props.reverse=false] - Détermine la direction du carrousel.
 *                                           Si true, le carrousel défile en sens inverse.
 * @param {string} [props.speedClass='carousel-speed-2'] - Classe CSS pour contrôler la vitesse de l'animation du carrousel.
 * @returns {JSX.Element} Le composant Carousel rendu.
 */
const Carousel = ({ reverse = false, speedClass = "carousel-speed-2" }) => {
	// Utiliser Apollo Client pour récupérer les livres
	const { data, loading, error } = useQuery(GET_BOOKS, {
		fetchPolicy: 'network-only'
	});
	// console.log("Carousel data:", data);
	// console.log("Carousel loading:", loading);
	// console.log("Carousel error:", error);
	const [randomBooks, setRandomBooks] = useState([]);

	useEffect(() => {
		if (data?.getBooks?.books && data.getBooks.books.length > 0) {
			const books = data.getBooks.books;
			const selectedBooks = [];
			const selectedIndices = new Set();

			while (selectedBooks.length < 15 && selectedBooks.length < books.length) {
				const randomIndex = Math.floor(Math.random() * books.length);
				if (!selectedIndices.has(randomIndex)) {
					selectedIndices.add(randomIndex);
					selectedBooks.push(books[randomIndex]);
				}
			}
			setRandomBooks(selectedBooks);
		}
	}, [data]);

	if (loading) {
		return (
			<div className="carousel-loading">
				<div className="loading-spinner">Chargement des livres...</div>
			</div>
		);
	}

	if (error) {
		console.error('Erreur GraphQL:', error);
		return (
			<div className="carousel-error">
				<p>Erreur lors de la récupération des livres.</p>
				<p className="error-detail">{error.message}</p>
			</div>
		);
	}

	if (!data?.getBooks?.books || data.getBooks.books.length === 0) {
		return (
			<div className="carousel-empty">
				<p>Aucun livre disponible pour le moment.</p>
			</div>
		);
	}

	return (
		<div className={`carousel ${reverse ? "carousel-reverse" : ""} ${speedClass}`}>
			<div className="carousel-track">
				{randomBooks.map((book) => (
					<a
						key={book.id_book}
						href={`/livres/${book.id_book}`}
						className="carousel-item"
						style={{
							backgroundImage: book.cover_image 
								? `url(${book.cover_image})` 
								: 'none',
							backgroundSize: 'cover',
							backgroundPosition: 'center',
							backgroundColor: book.cover_image ? 'transparent' : '#e0e0e0'
						}}
					>
						{!book.cover_image && (
							<div className="carousel-vignette" style={{width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
								{book.vignetteimage ? (
									<img
										id={`${book.id_book}`}
										src={normalizeImagePath(book.vignetteimage)}
										alt={book.title || `vignette-${book.id_book}`}
										style={{ width: '100%', height: '100%', objectFit: 'cover' }}
									/>
								) : (
									<div style={{ fontSize: '3rem' }}>📚</div>
								)}							
							</div>						
						)}
						<span className="sr-only">{book.title || "Voir le livre"}</span>
					</a>
				))}
			</div>
		</div>
	);
};
export default Carousel;