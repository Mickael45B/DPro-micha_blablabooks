import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "../css/NavBar.css";
import "../css/MainContent.css";
import "../css/MediaQueries.css";
import "../css/BookPage.css";
import CustomRating from "./ratingStar.jsx";
import Carousel from "./Carousel.jsx";
import axios from "axios";

const BookPage = () => {
	const { id } = useParams(); // Récupère l'ID depuis la route paramétrée
	const [bookDetails, setBookDetails] = useState(null);
	const [rating, setRating] = useState(null);
	const [avgRating, setAvgRating] = useState(null);
	const [error, setError] = useState(null);
	const [loading, setLoading] = useState(true); // Ajout d'un état de chargement

	useEffect(() => {
		// Fonction pour récupérer les détails du livre
		const fetchBookDetails = async () => {
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
				const response = await axios.post(
					`${import.meta.env.VITE_BACKEND_URL}/livres/${id}`,
					null, // Pas de corps pour une requête POST sans données
					config,
				);

				// Met à jour les détails du livre
				// biome-ignore lint/complexity/useOptionalChain: <explanation>
				if (response.data && response.data.data && response.data.data[0]) {
					setBookDetails(response.data.data[0].book);
					setAvgRating(response.data.data[0].reviews.averageRating);
					setRating(response.data.data[0].reviews.reviews);
					console.log(response.data.data[0].reviews.reviews);
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

		fetchBookDetails();
	}, [id]);

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
		<div className="main_bookpage">
			{/* Section principale */}
			<div className="titleAndrating_book">
				<div className="title_book">
					<h1>{bookDetails.title}</h1>
				</div>
				<div className="rating_book">
					<CustomRating
						name="size-small"
						defaultValue={avgRating}
						size="small"
					/>
				</div>
			</div>
			<section className="book-details">
				<div className="left_content_book">
					<img
						src={`../../${bookDetails.bookimage}`}
						alt={`Livre ${bookDetails.title}`}
						className="book-cover"
					/>
				</div>

				<div className="right_content_book">
					<div className="data_book">
						<h3 className="h3">Auteur :</h3>
						<span>{bookDetails.author}</span>
					</div>
					<div className="data_book">
						<h3 className="h3">Éditeur :</h3>
						<span>{bookDetails.editor}</span>
					</div>
					<div className="data_book">
						<h3 className="h3">Univers :</h3>
						<span>{bookDetails.gender}</span>
					</div>
					<div className="data_book">
						<h3 className="h3">Série :</h3>
						<span>{bookDetails.series}</span>
					</div>
					<div className="data_book">
						<h3 className="h3">Âge (à partir de) :</h3>
						<span>{bookDetails.age_limit}</span>
					</div>
				</div>
			</section>
			<section className="description_content">
				<h2>Résumé du livre</h2>
				<div className="description_scroll">
					<p className="description">{bookDetails.description}</p>
				</div>
			</section>
			<section className="reviews-section">
				<h2>Avis des lecteurs</h2>
				<div className="reviews-grid">
					{rating.map((review, index) => (
						<div key={review.id_review} className="review-card">
							<CustomRating
								className="review-rating"
								name={`review-${index}`}
								defaultValue={review.rating}
								size="small"
							/>
							<div className="review-info">
								<span className="review-reviewer">{review.userName}</span>
								<span>{review.updated_at}</span>
							</div>
							<span>{review.comment}</span>
						</div>
					))}
				</div>
			</section>{" "}
			{/* Section des carrousels */}
			<section className="related-books">
				<h2>Livres similaires</h2>
				<Carousel reverse={false} speedClass="carousel-speed-1" />
			</section>
			<section className="recommended-books">
				<h2>Recommandations</h2>
				<Carousel reverse={true} speedClass="carousel-speed-2" />
			</section>
		</div>
	);
};
export default BookPage;
