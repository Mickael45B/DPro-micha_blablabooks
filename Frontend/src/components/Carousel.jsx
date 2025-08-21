import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

import "../css/Carousel.css";
import "../css/index.css";

// export const bookimages = [
//   { src: image1, index: 1 }, { src: image3, index: 3 }
// ];

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
	const [bookDetails, setBookDetails] = useState(null);
	const [error, setError] = useState(null);
	const [loading, setLoading] = useState(true); // Ajout d'un état de chargement
	useEffect(() => {
		// Fonction pour récupérer les détails du livre
		const fetchCaroussel = async () => {
			try {
				// Récupérer le token depuis le localStorage
				const token = localStorage.getItem("token");

				// Configurer les en-têtes avec le token
				const config = {
					headers: {
						Authorization: `Bearer ${token}`, // Ajouter le token dans l'en-tête Authorization
					},
				};

				// Faire la requête avec les en-têtes
				const response = await axios.get(
					`${import.meta.env.VITE_BACKEND_URL}/livres`,//`${import.meta.env.VITE_BACKEND_URL}/livres`,
					null, // Pas de corps pour une requête POST sans données
					config,
				);

				// Met à jour les détails du livre
				// biome-ignore lint/complexity/useOptionalChain: <explanation>
				if (response.data && response.data.data && response.data.data[0]) {
					setBookDetails(response.data.data);
				} else {
					setError("Le livre demandé n'existe pas.");
				}
			} catch (err) {
				console.error("Erreur Axios :", err);
				setError("Erreur lors de la récupération des détails du livre.");
			} finally {
				setLoading(false); // Fin du chargement
			}
		};

		fetchCaroussel();
	}, []);

	// Récupérer le "bookDetails" et en choisir 15 au hasard sans doublons
	const randomBooks = [];
	const selectedIndices = new Set(); // Utiliser un Set pour suivre les indices déjà choisis

	if (bookDetails) {
		while (randomBooks.length < 15 && randomBooks.length < bookDetails.length) {
			const randomIndex = Math.floor(Math.random() * bookDetails.length);

			// Vérifiez si l'indice a déjà été choisi
			if (!selectedIndices.has(randomIndex)) {
				selectedIndices.add(randomIndex); // Marquer l'indice comme choisi
				randomBooks.push(bookDetails[randomIndex]); // Ajouter le livre à la liste
			}
		}
	}
	// Gestion des états : chargement, erreur ou données
	if (loading) {
		return <div>Chargement des détails du livre...</div>;
	}
	if (error) {
		return <div>{error}</div>;
	}
	if (!bookDetails) {
		return <div>Le livre demandé n'existe pas.</div>;
	}

	return (
		<div
			className={`carousel ${reverse ? "carousel-reverse" : ""} ${speedClass}`}
		>
			<div className="carousel-track">
				{randomBooks.map((image) => (
					// biome-ignore lint/a11y/useAnchorContent: <explanation>
					<a
						key={image.id_book}
						href={`/livres/${image.id_book}`} // Utiliser l'index réel de l'image ${image.index}
						className="carousel-item"
						style={{
							backgroundImage: `url(../../${image.vignetteimage})`,
						}}
					>
						<span className="sr-only">{image.title || "Voir le livre"}</span>
					</a>
				))}
			</div>
		</div>
	);
};

export default Carousel;
