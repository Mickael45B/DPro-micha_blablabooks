import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from '@apollo/client';
import { getUserFromToken } from '../../../data/graphql/queries/auth.jsx';
import MainLayout from '../../components/layout/MainLayout/mainLayout.jsx';
import "../../styles/NavBar.css";
// import "../../../presentation/pages/Home/MainContents.css";
import "./BookPage.css";
import { 
	GET_BOOK_BY_ID, 
	GET_MY_LIBRARIES_WITH_BOOK,
	IS_BOOK_IN_FAVORITES,
	GET_MY_REVIEW_FOR_BOOK,
	ADD_BOOK_TO_LIBRARY,
	REMOVE_BOOK_FROM_LIBRARY,
	TOGGLE_BOOK_FAVORITE,
	CREATE_REVIEW,
	UPDATE_REVIEW,
	DELETE_REVIEW
} from "../../../data/graphql/queries/queriesBooks.jsx";
import CustomRating from "../../../presentation/components/common/ratingStar.jsx";



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

	// Récupère l'ID depuis la route paramétrée
	const { id } = useParams(); 
	console.log('BookPage mounted with id:', id);

	// États pour les filtres d'avis par note
	const [visibleRatings, setVisibleRatings] = useState({
		1: true,
		2: true,
		3: true,
		4: true,
		5: true
	});

	const navigate = useNavigate();
	const userState = getUserFromToken();
	const isAuthenticated = !!userState;

  // États pour le système de favoris et bibliothèques
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedLibraryToAdd, setSelectedLibraryToAdd] = useState('');

  // États pour les avis
  const [showEditReviewModal, setShowEditReviewModal] = useState(false);
  const [reviewForm, setReviewForm] = useState({
	title_rating: '',
	rating: 5,
	comment: '',
	id_book: id,
	id_user: userState?.id_user

  });
  console.log('Review form state:', reviewForm);

// ========================================
// QUERIES
// ========================================

	// 🔍 Requête GraphQL pour récupérer les détails du livre
	const { data, loading, error, refetch: refetchBook } = useQuery(GET_BOOK_BY_ID, {
		variables: { id_book: id }, 
		fetchPolicy: 'network-only' // Toujours récupérer les données fraîches
	});
console.log('GraphQL response for GET_BOOK_BY_ID:', data, loading, error);
// Mes bibliothèques avec statut du livre
  const { data: librariesData, refetch: refetchLibraries } = useQuery(GET_MY_LIBRARIES_WITH_BOOK, {
	skip: !isAuthenticated,
	fetchPolicy: 'network-only'
  });
	console.log('📚 Bibliothèques chargées:', librariesData?.getMyLibraries);

  // Mon avis sur ce livre
  const { data: myReviewData, refetch: refetchMyReview } = useQuery(GET_MY_REVIEW_FOR_BOOK, {
	variables: { id_book: id },
	skip: !isAuthenticated,
	fetchPolicy: 'network-only'
  });

  // Vérifier si le livre est dans les favoris
  const { data: favData, refetch: refetchFav } = useQuery(IS_BOOK_IN_FAVORITES, {
	variables: { id_book: id },
	skip: !isAuthenticated,
	fetchPolicy: 'network-only'
  });

  // ========================================
  // MUTATIONS
  // ========================================

  const [toggleFavorite] = useMutation(TOGGLE_BOOK_FAVORITE, {
	onCompleted: (data) => {
	  setIsFavorite(data.updateFavoriteStatusInBookHasLibrary.is_favorite);
	  refetchLibraries();
	  refetchBook();
	}
  });

  const [addToLibrary] = useMutation(ADD_BOOK_TO_LIBRARY, {
	onCompleted: () => {
	  refetchLibraries();
	  refetchBook();
	  setSelectedLibraryToAdd('');
	}
  });

  const [removeFromLibrary] = useMutation(REMOVE_BOOK_FROM_LIBRARY, {
	onCompleted: () => {
	  refetchLibraries();
	  refetchBook();
	  refetchFav();
	}
  });

  const [createReview] = useMutation(CREATE_REVIEW, {
	onCompleted: () => {
	  refetchMyReview();
	  refetchBook();
	  setReviewForm(prev => ({ ...prev, title_rating: '', rating: 5, comment: '', id_book: id, 	id_user: userState?.id_user }));
	}
  });

  const [updateReview] = useMutation(UPDATE_REVIEW, {
	onCompleted: () => {
	  // Fermer la modal immédiatement
	  setShowEditReviewModal(false);
	  // Recharger les données en arrière-plan (sans attendre)
	  refetchMyReview();
	  refetchBook();
	},
	refetchQueries: [
	  { query: GET_BOOK_BY_ID, variables: { id_book: id } },
	  { query: GET_MY_REVIEW_FOR_BOOK, variables: { id_book: id } }
	],
	awaitRefetchQueries: false
  });

  const [deleteReview] = useMutation(DELETE_REVIEW, {
	onCompleted: () => {
	  refetchMyReview();
	  refetchBook();
	}
  });

  // ========================================
  // EFFETS
  // ========================================

  useEffect(() => {
	if (favData?.IsBookInFavorites !== undefined) {
	  setIsFavorite(favData.IsBookInFavorites);
	}
  }, [favData]);

  // ========================================
  // DONNÉES CALCULÉES
  // ========================================

	// 📊 Extraire les données de la réponse GraphQL
	const bookDetails = data?.getBook;
	console.log('Book details fetched:', bookDetails);
	
	// ✅ Maintenant on a les reviews !
	const avgRating = bookDetails?.avg_rating || 0;
	const nbReviews = bookDetails?.nb_reviews || 0;
	const reviews = bookDetails?.reviews || [];
	//const myReview = myReviewData?.GetMyReviewForBook;
	const getBookIdFromLibraryItem = (book) => book?.id_book ?? book?.book?.id_book;
	const allLibraries = (librariesData?.getMyLibraries || []).map(lib => ({
		...lib,
		hasBook: lib.books?.some(book => String(getBookIdFromLibraryItem(book)) === String(id)) || false
	}));



  // Bibliothèques contenant le livre
  const librariesWithBook = useMemo(() => 
	allLibraries.filter(lib => lib.hasBook),
	[allLibraries]
  );

  // Bibliothèques disponibles (sans le livre)
  const availableLibraries = useMemo(() => 
	allLibraries.filter(lib => !lib.hasBook),
	[allLibraries]
  );

  // Trouver la bibliothèque "Favoris" (is_default)
  const favoritesLibrary = useMemo(() => 
	allLibraries.find(lib => lib.is_default),
	[allLibraries]
  );

	// Filtrer les avis selon la visibilité
  const filteredReviews = useMemo(() => 
	reviews.filter(review => visibleRatings[review.rating]),
	[reviews, visibleRatings]
  );

  // ========================================
  // HANDLERS
  // ========================================

  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      alert('Connectez-vous pour ajouter aux favoris');
      return;
    }
    try {
      await toggleFavorite({ variables: { input: { id_book: id } } });
    } catch (error) {
      console.error('Erreur toggle favori:', error);
      alert('Erreur lors de la mise à jour');
    }
  };

  const handleAddToLibrary = async (e) => {
    const id_library = e.target.value;
    if (!id_library) return;

    try {
      await addToLibrary({ 
        variables: { 
          input: { id_library, id_book: id, is_favorite: false }
        } 
      });
	  console.log(`Livre ajouté à la bibliothèque ${id} ${id_library}`);
    } catch (error) {
      console.error('Erreur ajout:', error);
      alert('Erreur lors de l\'ajout à la bibliothèque');
    }
  };

	const handleRemoveFromLibrary = async (id_library) => {
		console.log('Click remove library:', id_library);
		if (!confirm('Retirer ce livre de cette bibliothèque ?')) return;

		try {
			// Trouver id_bookhaslibrary depuis les données de bibliothèque
			const library = allLibraries.find(lib => lib.id_library === id_library);
			const bookInLibrary = library?.books?.find(book => String(getBookIdFromLibraryItem(book)) === String(id));
      
			console.log('Debug removeFromLibrary:', { 
				id_library, 
				id_book: id, 
				library, 
				bookInLibrary,
				allLibraries 
			});
			
			if (!bookInLibrary?.id_bookhaslibrary) {
				console.error('id_bookhaslibrary non trouvé dans bookInLibrary:', bookInLibrary);
				alert('Erreur : impossible de trouver la relation livre-bibliothèque. Rechargez la page.');
				return;
			}

			await removeFromLibrary({ 
				variables: { 
					input: { 
						id_bookhaslibrary: bookInLibrary.id_bookhaslibrary,
						id_book: getBookIdFromLibraryItem(bookInLibrary),
						id_library
					}
				} 
			});

			// Si c'est la bibliothèque Favoris
			if (library?.is_default) {
				setIsFavorite(false);
			}
		} catch (error) {
			console.error('Erreur suppression:', error);
			alert('Erreur lors de la suppression');
		}
	};

  const handleCreateReview = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      alert('Connectez-vous pour poster un avis');
      return;
    }

    try {
      await createReview({
        variables: {
          input: {
            id_book: id,
            title_rating: reviewForm.title_rating,
            rating: reviewForm.rating,
            comment: reviewForm.comment
          }
        }
      });
    } catch (error) {
      console.error('Erreur création avis:', error);
      alert('Erreur lors de la création de l\'avis');
    }
  };

  const handleOpenEditModal = () => {
    setReviewForm({
      title_rating: myReview.title_rating,
      rating: myReview.rating,
      comment: myReview.comment,
	  id_book: id
    });
    setShowEditReviewModal(true);
  };

  const handleUpdateReview = async (e) => {
    e.preventDefault();

    try {
      await updateReview({
        variables: {
          input: {
            id_review: myReview.id_review,
            title_rating: reviewForm.title_rating,
            rating: reviewForm.rating,
            comment: reviewForm.comment
          }
        }
      });
    } catch (error) {
      console.error('Erreur modification:', error);
      alert('Erreur lors de la modification');
    }
  };

  const handleDeleteReview = async () => {
    if (!confirm('Supprimer votre avis ?')) return;

    try {
      await deleteReview({ 
        variables: { id_review: myReview.id_review } 
      });
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert('Erreur lors de la suppression');
    }
  };

	// 🔄 Toggle la visibilité d'une note
	const toggleRatingVisibility = (rating) => {
		setVisibleRatings(prev => ({
			...prev,
			[rating]: !prev[rating]
		}));
	};

	// Compter les avis par note
	const reviewCounts = {
		1: reviews.filter(r => r.rating === 1).length,
		2: reviews.filter(r => r.rating === 2).length,
		3: reviews.filter(r => r.rating === 3).length,
		4: reviews.filter(r => r.rating === 4).length,
		5: reviews.filter(r => r.rating === 5).length,
	};

const myReview = myReviewData?.GetMyReviewForBook;

if (myReview) {
  console.log(myReview.rating);        // Ex: 4
  console.log(myReview.title_rating);  // Ex: "Très bon livre"
}


  // ========================================
  // MENU CONTEXTUEL
  // ========================================

	const contextualMenu = isAuthenticated ? (
		<div className="book-contextual-menu">
			{/* PARTIE 1 - BIBLIOTHÈQUES */}
			<div className="contextual-section">
				<h3>
					<i className="fas fa-bookmark"></i>
					Mes bibliothèques
				</h3>
				
				{/* Liste des bibliothèques contenant le livre */}{/*voir id de bookhasLibrary ligne364*/}
				{librariesWithBook.length > 0 && (

					<div className="libraries-with-book">
					<h4>Ce livre est dans :</h4>
					{librariesWithBook.map(lib => (
						console.log(lib),
						<div key={lib.id_library} className="library-item">
						<span>{lib.name}</span>
						<button 
						
							onClick={() => {
								console.log('Button remove clicked:', lib.id_library, id);
								handleRemoveFromLibrary(lib.id_library);
							}} 
							title="Retirer de cette bibliothèque"
						>
							<i className="fas fa-trash"></i>
						</button>
						</div>
					))}
					</div>
					
				)}

				{/* Liste déroulante pour ajouter */}
				{availableLibraries.length > 0 ? (
					<div className="add-to-library">
					<select 
						value={selectedLibraryToAdd} 
						onChange={handleAddToLibrary}
					>
						<option value="">+ Ajouter à une bibliothèque</option>
						{availableLibraries.map(lib => (
						<option key={lib.id_library} value={lib.id_library}>
							{lib.name}
						</option>
						))}
					</select>
					</div>
				) : (
					<p className="no-libraries">Ce livre est dans toutes vos bibliothèques</p>
				)}

			</div>

			{/* PARTIE 2 - AVIS */}
			<div className="contextual-section">
				<h3>
					<i className="fas fa-star"></i>
					Mon avis
				</h3>

				{myReview ? (
					/* Affichage de mon avis existant */
					<div className="my-review">
					<div className="my-review-header">
						<CustomRating
						name="my-review-rating"
						value={myReview.rating}
						readOnly
						size="small"
						/>
						<span className="my-review-date">
						{new Date(myReview.updated_at || myReview.created_at).toLocaleDateString('fr-FR')}
						</span>
					</div>
					<h4>{myReview.title_rating}</h4>
					<p>{myReview.comment}</p>
					<div className="review-actions">
						<button 
						className="btn-edit"
						onClick={handleOpenEditModal}
						>
						<i className="fas fa-edit"></i> Modifier
						</button>
						<button 
						className="btn-delete"
						onClick={handleDeleteReview}
						>
						<i className="fas fa-trash"></i> Supprimer
						</button>
					</div>
					</div>
				) : (
					/* Formulaire d'ajout d'avis */
					<form className="review-form" onSubmit={handleCreateReview}>
					<div className="form-group">
						<label>Note</label>
						<div className="rating-selector">
						{[1, 2, 3, 4, 5].map(star => (
							<button
							key={star}
							type="button"
							className={`star-btn ${star <= reviewForm.rating ? 'active' : ''}`}
							onClick={() => setReviewForm(prev => ({ ...prev, rating: star }))}
							>
							<i className="fas fa-star"></i>
							</button>
						))}
						</div>
					</div>
					<div className="form-group">
						<label>Titre</label>
						<input
						type="text"
						value={reviewForm.title_rating}
						onChange={(e) => setReviewForm(prev => ({ ...prev, title_rating: e.target.value }))}
						placeholder="Titre de votre avis"
						required
						/>
					</div>
					<div className="form-group">
						<label>Commentaire</label>
						<textarea
						value={reviewForm.comment}
						onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
						rows="4"
						placeholder="Partagez votre avis..."
						required
						></textarea>
					</div>
					<button type="submit" className="btn-submit">
						<i className="fas fa-paper-plane"></i>
						Publier mon avis
					</button>
					</form>
				)}
			</div>
		</div>
	) : null;

  // ========================================
  // LOADING & ERROR
  // ========================================

	// 🔄 Gestion de l'état de chargement
	if (loading) {
		return (
			<MainLayout contextualMenuAction={contextualMenu}>
				<div className="loading-container">
				<i className="fas fa-spinner fa-spin"></i>
				<span>Chargement des détails du livre...</span>
				</div>
			</MainLayout>
		);
	}

	// ❌ Gestion des erreurs 
	if (error || !bookDetails) {
		console.error('Erreur GraphQL:', error);
		return (
			<MainLayout contextualMenuAction={contextualMenu}>
				<div className="error-container">
					<h3>{error ? 'Erreur lors de la récupération' : 'Livre non trouvé'}</h3>
					{error && <p>{error.message}</p>}
				</div>
			</MainLayout>
		);
	}

	// ========================================
	// RENDER PRINCIPAL
	// ========================================
	
	// Déterminer si c'est un "one shot"
	const isOneShot = bookDetails.series?.toLowerCase().trim() === 'one shot';

	// Formater l'image
	const getImageSrc = () => {
		const raw = bookDetails?.bookimage || '';
		const fileName = raw.endsWith('.png') || raw.endsWith('.jpg') || raw.endsWith('.jpeg')
			? raw
			: `${raw}.png`;
		return `/images/booksImages/${fileName}`;
	};

	return (
		<MainLayout contextualMenuAction={contextualMenu}>
			<div className="book-page">

				{/* Header */}
				<div className="book-page__header">
					<h2 className="book-page__title">Détail du livre</h2>
				</div>

				{/* Contenu principal : 2 colonnes */}
				<div className="book-page__main">

					{/* Colonne gauche : Image + Infos */}
					<div className="book-page__left">

						{/* Image du livre */}
						<div className="book-cover-container">
							<img
								src={getImageSrc()}
								alt={bookDetails.title}
								className="book-cover"
								onError={(e) => {
									e.currentTarget.onerror = null;
									e.currentTarget.src = '/images/booksImages/image_not_found.png';
								}}
							/>

							{/* ICÔNE CŒUR FAVORI */}
							{isAuthenticated && (
								<button
								className={`favorite-heart ${isFavorite ? 'filled' : 'empty'}`}
								onClick={handleToggleFavorite}
								title={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
								>
								<i className={`${isFavorite ? 'fas' : 'far'} fa-heart`}></i>
								</button>
							)}
							
						</div>

						{/* Informations du livre */}
						<div className="book-info">

							<h2 className="book-info__title">{bookDetails.title}</h2>
							
							<div className="book-info__rating">
								<span className="book-info__rating-label">Note moyenne :</span>
								<CustomRating
									name="avg-rating"//size-small
									value={avgRating || 0}
									readOnly
									size="small"
								/>
							</div>

							<div className="book-info__details">

								<div className="book-info__item">
									<span className="book-info__label">Parution :</span>
									<span className="book-info__value">
										{bookDetails.publication_date 
											? new Date(bookDetails.publication_date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })
												.replace(/(\d{1,2})\sde\s([^\s]+)\s(\d{4})/, '$1 $2 $3') // "10 de janvier 2025" -> "10 janvier 2025"
											: 'Non renseigné'}
									</span>
								</div>

								<div className="book-info__item">
									<span className="book-info__label">Auteur :</span>
									<span className="book-info__value">
										{bookDetails.author || 'Non renseigné'}
									</span>
								</div>

								<div className="book-info__item">
									<span className="book-info__label">Éditeur :</span>
									<span className="book-info__value">
										{bookDetails.editor || 'Non renseigné'}
									</span>
								</div>

								<div className="book-info__item">
									<span className="book-info__label">Genre :</span>
									<span className="book-info__value">
										{bookDetails.genre || 'Non renseigné'}
									</span>
								</div>

								<div className="book-info__item">
									<span 
										className="book-info__label"
										style={{ opacity: isOneShot ? 0.5 : 1 }}
									>
										Série :
									</span>
									{!isOneShot && (
										<span className="book-info__value">
											{bookDetails.series}
										</span>
									)}
								</div>

								<div className="book-info__item">
									<span className="book-info__label">Âge limite :</span>
									<span className="book-info__value">
										{bookDetails.age_limit ? `${bookDetails.age_limit}` : 'Tous âges'}
									</span>
								</div>

							</div>

						</div>

					</div>

					{/* Colonne droite : Ce livre */}
					<div className="book-page__right">

						<div className="this-book">

							<h3 className="this-book__title">Ce livre :</h3>

							<div className="this-book__content">

								{/* date ajout */}
								<div className="this-book__item">

									<span>A été ajouté le : </span>

									<span className="this-book__value">
										{bookDetails.created_at 
											? new Date(bookDetails.created_at).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })
												.replace(/(\d{1,2})\sde\s([^\s]+)\s(\d{4})/, '$1 $2 $3') // "10 de janvier 2025" -> "10 janvier 2025"
											: '...'}
									</span>

									<span> au site.</span>

								</div>

								{/* favoris */}
								<div className="this-book__item">

									<span>Est dans les favoris de : </span>

									<span className="this-book__value">
										{bookDetails.is_in_favorite || '...'}
									</span>

									<span> personne(s).</span>
								</div>

								<div className="this-book__item">
									<span>Est dans une bibliothèque de</span>
									<span className="this-book__value">
										{bookDetails.is_in_library || '...'}
									</span>
									<span>personne(s).</span>
								</div>


							</div>

						</div>

					</div>

				</div>

				{/* Description avec hauteur adaptative */}
				<div className="book-description">
					<h2 className="book-description__title">Description</h2>
					<div className="book-description__scroll">
						<p>{bookDetails.description || 'Aucune description disponible.'}</p>
					</div>
				</div>

				{/* Section Avis avec filtres */}
				<div className="reviews-section">

					<h2 className="reviews-section__title">Avis</h2>

					{reviews.length > 0 ? (
						<>
							{/* Filtres par étoiles */}
							<div className="reviews-filters">

								<span className="reviews-filters__icon">
									<i className="fas fa-star"></i>
								</span>

								{[1, 2, 3, 4, 5].map(rating => (
									<button
										key={rating}
										className={`review-filter ${!visibleRatings[rating] ? 'review-filter--hidden' : ''}`}
										onClick={() => toggleRatingVisibility(rating)}
										title={visibleRatings[rating] ? 'Masquer ces avis' : 'Afficher ces avis'}
									>
										<span className="review-filter__label">
											{rating} étoile{rating > 1 ? 's' : ''}
										</span>
										<i className={`fas fa-eye${visibleRatings[rating] ? '' : '-slash'} review-filter__eye`}></i>
									</button>
								))}

							</div>

							{/* Grille d'avis */}
							{filteredReviews.length > 0 ? (
								<div className="reviews-grid">

									{filteredReviews.map((review) => (
										console.log('Review:', review) ||
										<div key={review.id_review} className="review-card">

											<div className="review-card__header">

												<span className="review-card__title">
													{review.title_rating || 'Titre de l\'avis'}
												</span>

												<CustomRating
													name={`review-${review.id_review}`}
													value={review.rating}
													readOnly
													size="small"
												/>

											</div>

											<div className="review-card__content">

												<p className="review-card__comment">
													{review.comment || 'Incroyable'}
												</p>

											</div>

											<div className="review-card__footer">

												<span className="review-card__author">
													avis posté par : {review.user?.pseudo || review.user?.name || 'Anonyme'}
												</span>

												<span className="review-card__date">
													le {review.updated_at 
														? new Date(review.updated_at).toLocaleDateString('fr-FR')
														: new Date(review.created_at).toLocaleDateString('fr-FR')}
												</span>

											</div>

										</div>
									))}

								</div>

							) : (
								<p className="reviews-empty">
									Aucun avis visible avec les filtres sélectionnés.
								</p>
							)}
						</>
					) : (
						<p className="reviews-empty">
							Aucun avis pour le moment. Soyez le premier à donner votre avis !
						</p>
					)}

				</div>

				{/* MODAL - Modifier avis */}
				{showEditReviewModal && myReview && (
				<div className="modal-backdrop" onClick={() => setShowEditReviewModal(false)}>
					<div className="modal" onClick={(e) => e.stopPropagation()}>
					<div className="modal-header">
						<h3>Modifier mon avis</h3>
						<button className="modal-close" onClick={() => setShowEditReviewModal(false)}>
						<i className="fas fa-times"></i>
						</button>
					</div>
					<form onSubmit={handleUpdateReview}>
						<div className="modal-body">
						<div className="form-group">
							<label>Note</label>
							<div className="rating-selector">
							{[1, 2, 3, 4, 5].map(star => (
								<button
								key={star}
								type="button"
								className={`star-btn ${star <= reviewForm.rating ? 'active' : ''}`}
								onClick={() => setReviewForm(prev => ({ ...prev, rating: star }))}
								>
								<i className="fas fa-star"></i>
								</button>
							))}
							</div>
						</div>
						<div className="form-group">
							<label>Titre</label>
							<input
							type="text"
							value={reviewForm.title_rating}
							onChange={(e) => setReviewForm(prev => ({ ...prev, title_rating: e.target.value }))}
							required
							/>
						</div>
						<div className="form-group">
							<label>Commentaire</label>
							<textarea
							value={reviewForm.comment}
							onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
							rows="4"
							required
							></textarea>
						</div>
						</div>
						<div className="modal-footer">
						<button type="button" className="btn-cancel" onClick={() => setShowEditReviewModal(false)}>
							Annuler
						</button>
						<button type="submit" className="btn-submit">
							Enregistrer
						</button>
						</div>
					</form>
					</div>
				</div>
				)}

			</div>

		</MainLayout>
	);
};
export default BookPage;









