import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "../../styles/NavBar.css";
import "../../../presentation/pages/Home/MainContent.css";
import "./BookPage.css";
import { GET_BOOK_BY_ID } from "../../../data/graphql/queries/queriesBooks.jsx";
import { useQuery } from '@apollo/client';
import CustomRating from "../../../presentation/components/common/ratingStar.jsx";
import Carousel from "../../../presentation/components/features/Carousel/Carousel.jsx";



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


const BookPage = () => {
	const { id } = useParams(); // Récupère l'ID depuis la route paramétrée

	const { data, loading, error } = useQuery(GET_BOOK_BY_ID, {
		variables: { id_book: id }, // Le backend attend "id_book"
		fetchPolicy: 'network-only' // Toujours récupérer les données fraîches
	});

	// 📊 Extraire les données de la réponse GraphQL
	const bookDetails = data?.getBook;
	
	// ✅ Maintenant on a les reviews !
	const avgRating = bookDetails?.avg_rating || 0;
	const nbReviews = bookDetails?.nb_reviews || 0;
	const reviews = bookDetails?.reviews || [];

	// 🔄 Gestion de l'état de chargement
	if (loading) {
		return (
			<div style={{ 
				display: 'flex', 
				justifyContent: 'center', 
				alignItems: 'center', 
				minHeight: '50vh',
				color: '#fff'
			}}>
				<div>
					<i className="fas fa-spinner fa-spin" style={{ fontSize: '2em', marginRight: '1em' }}></i>
					Chargement des détails du livre...
				</div>
			</div>
		);
	}
	// ❌ Gestion des erreurs
	if (error) {
		console.error('Erreur GraphQL:', error);
		return (
			<div style={{ 
				padding: '2em', 
				textAlign: 'center',
				color: '#ef4444'
			}}>
				<h2>Erreur lors de la récupération du livre</h2>
				<p>{error.message}</p>
			</div>
		);
	}

	// ❌ Livre non trouvé
	if (!bookDetails) {
		return (
			<div style={{ 
				padding: '2em', 
				textAlign: 'center',
				color: '#fff'
			}}>
				<h2>Le livre demandé n'existe pas</h2>
			</div>
		);
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
						defaultValue={avgRating || 0}
						size="small"
					/>
				</div>
			</div>

			<section className="book-details">
				<div className="left_content_book">
					{console.log('Chemin de l\'image du livre:', bookDetails.bookimage)}


						{(() => {
							const raw = bookDetails?.bookimage || '';
							const fileName = raw.endsWith('.png') || raw.endsWith('.jpg') || raw.endsWith('.jpeg')
								? raw
								: `${raw}.png`;
							const src = `/images/booksImages/${fileName}`; 
							return (
								<img
									src={src}
									alt={`Livre ${bookDetails.title}`}
									className="book-cover"
									onError={(e) => {
										// fallback vers une vignette générique dans public/images/...
										e.currentTarget.onerror = null;
										e.currentTarget.src = '/images/booksImages/image_not_found.png';
									}}
								/>
							);
						})()}












					{console.log('Chemin de l\'image : ', `../../../public/images/booksImages/${bookDetails.bookimage}.png`)}
					{console.log('Chemin de l\'image après erreur:', bookDetails.bookimage)}
				</div>

				<div className="right_content_book">
					<div className="data_book">
						<h3 className="h3">Auteur :</h3>
						<span>{bookDetails.author || 'Non renseigné'}</span>
					</div>
					<div className="data_book">
						<h3 className="h3">Éditeur :</h3>
						<span>{bookDetails.editor || 'Non renseigné'}</span>
					</div>
					<div className="data_book">
						<h3 className="h3">Univers :</h3>
						<span>{bookDetails.gender || 'Non renseigné'}</span>
					</div>
					<div className="data_book">
						<h3 className="h3">Série :</h3>
						<span>{bookDetails.series || 'Non renseigné'}</span>
					</div>
					<div className="data_book">
						<h3 className="h3">Âge (à partir de) :</h3>
						<span>{bookDetails.age_limit || 'Tous âges'}</span>
					</div>
				</div>
			</section>

			<section className="description_content">
				<h2>Résumé du livre</h2>
				<div className="description_scroll">
					<p className="description">
						{bookDetails.description || 'Aucune description disponible.'}
					</p>
				</div>
			</section>

			<section className="reviews-section">
				<h2>Avis des lecteurs</h2>
				{reviews.length > 0 ? (
					<div className="reviews-grid">
						{reviews.map((review, index) => (
							<div key={review.id_review} className="review-card">
								<CustomRating
									className="review-rating"
									name={`review-${index}`}
									defaultValue={review.rating}
									size="small"
									readOnly
								/>
								<div className="review-info">
									<span className="review-reviewer">
										{review.user?.pseudo || review.user?.name || 'Anonyme'}
									</span>
									<span>{review.updated_at ? new Date(review.updated_at).toLocaleDateString('fr-FR') : ''}</span>
								</div>
								<p>{review.comment || 'Aucun commentaire'}</p>
							</div>
						))}
					</div>
				) : (
					<p style={{ textAlign: 'center', opacity: 0.7 }}>
						Aucun avis pour le moment. Soyez le premier à donner votre avis !
					</p>
				)}
			</section>

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









