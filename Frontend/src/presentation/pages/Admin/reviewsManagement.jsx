/**
 * Gestion des avis - Section Admin
 */
import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { GET_REVIEWS, GET_REVIEW, SEARCH_REVIEWS, UPDATE_REVIEW, DELETE_REVIEW } from './adminQueries.jsx';
import ReviewDetailModal from './ReviewDetailModal';
import BookDetailModal from './BookDetailModal';
import UserProfileModal from './UserProfileModal.jsx';
import UserProfileModalWrapper from './UserProfileModalWrapper';


const ReviewsManagement = () => {

    // Hook de navigation pour rediriger vers d'autres pages si nécessaire
    const navigate = useNavigate();

    // États locaux pour la gestion des avis
  const [searchTerm, setSearchTerm] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showReviewDetailModal, setShowReviewDetailModal] = useState(false);
  const [showBookDetailModal, setShowBookDetailModal] = useState(false);
  const [showUserProfileModal, setShowUserProfileModal] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [selectedBookId, setSelectedBookId] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);
    // Formulaire de modification d'avis
    const [formData, setFormData] = useState({
        title_rating: '',
        comment: '',
        rating: 5
    });
    // requete pour récupérer la liste de tous les avis
    const { data, loading, error, refetch } = useQuery(GET_REVIEWS, {
        variables: { limit: 100, offset: 0, order: 'created_at', direction: 'DESC' }
    });

    const [updateReview] = useMutation(UPDATE_REVIEW, {
        onCompleted: () => {
        refetch();
        setShowEditModal(false);
        setSelectedReview(null);
        alert('✅ Avis modifié avec succès !');
        },
        onError: (error) => {
        console.error('Erreur UPDATE_REVIEW:', error);
        alert('❌ Erreur : ' + error.message);
        }
    });

    const [deleteReview] = useMutation(DELETE_REVIEW, {
        onCompleted: () => {
        refetch();
        alert('✅ Avis supprimé avec succès !');
        },
        onError: (error) => {
        console.error('Erreur DELETE_REVIEW:', error);
        alert('❌ Erreur : ' + error.message);
        }
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleEdit = async (e) => {
        e.preventDefault();
        await updateReview({
        variables: {
            input: {
                id_review: selectedReview.id_review,
                title_rating: formData.title_rating,
                comment: formData.comment,
                rating: parseInt(formData.rating, 10)
            }        
        }
        });
    };

    const handleDelete = async (id_review) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cet avis ?')) {
        await deleteReview({ variables: { input: { id_review } } });
        }
    };

    const openEditModal = (review) => {
        setSelectedReview(review);
        setFormData({
        title_rating: review.title_rating || '',
        comment: review.comment || '',
        rating: review.rating || 5
        });
        setShowEditModal(true);
    };

    const openReviewDetailModal = (review) => {
        setSelectedReview(review);
        setShowReviewDetailModal(true);
    };

    const openUserProfile = (userId) => {
        console.log('🔵 Ouverture profil utilisateur:', userId);
        setSelectedUserId(userId);
        setShowUserProfileModal(true);

        // Fermer le modal d'avis si ouvert
        //setShowReviewDetailModal(false);
        
        // Ouvrir le modal de profil utilisateur
        //setSelectedUserId(userId);
        //setShowUserProfileModal(true);
    };

    const openBookDetail = (bookId) => {
        if (!bookId) {
            console.warn('⚠️ Impossible d’ouvrir le détail livre: id_book manquant');
            return;
        }

        console.log('🟣 Ouverture détail livre:', bookId);

        // Ouvrir le modal de détail livre
        setSelectedBookId(bookId);
        setShowBookDetailModal(true);
    };

    const handleEditFromDetailModal = (review) => {
        setShowReviewDetailModal(false);
        openEditModal(review);
    };

    const openViewModal = (review) => {
        setSelectedReview(review);
        setShowViewModal(true);
    };

    const getRatingStars = (rating) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
        stars.push(
            <i 
            key={i} 
            className={i <= rating ? 'fas fa-star' : 'far fa-star'}
            style={{ color: i <= rating ? '#ffc107' : '#ddd' }}
            ></i>
        );
        }
        return stars;
    };

  if (loading) return <div className="loading">Chargement...</div>;
  if (error) return <div className="error">Erreur : {error.message}</div>;

  const reviews = data?.getReviews?.reviews || [];

    return (
        <div className="reviews-management">
            <div className="section-header">
                <h2 className="section-title">
                <i className="fas fa-star"></i> Gestion des avis
                </h2>
            </div>

            <div className="search-bar">
                <input
                type="text"
                placeholder="Rechercher dans les avis..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
                />
                <i className="fas fa-search search-icon"></i>
            </div>

            <div className="table-container">
                <table className="admin-table">
                <thead>
                    <tr>
                    <th>Titre</th>
                    <th>Note</th>
                    <th>Utilisateur</th>
                    <th>Livre</th>
                    <th>Date</th>
                    <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {reviews
                    .filter(review =>
                        !searchTerm ||
                        review.title_rating?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        review.comment?.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map(review => (
                        <tr key={review.id_review}>
                        <td>
                            <button
                            className="review-title-link"
                            onClick={() => openReviewDetailModal(review)}
                            >
                                <strong>{review.title_rating || 'Sans titre'}</strong>
                            </button>
                        </td>
                        <td>
                            <div className="rating-stars">
                            {getRatingStars(review.rating)}
                            <span className="rating-value">({review.rating}/5)</span>
                            </div>
                        </td>
                        <td>
                            {console.log('🔵 Rendu de l’avis:', review.user.id_user)}
                            <button
                            className="user-link-badge"
                            onClick={() => openUserProfile(review.user.id_user)}
                            title="Voir le profil utilisateur"
                            >
                                <i className="fas fa-user"></i>
                                {review.user.pseudo}
                                <i className="fas fa-external-link-alt"></i>
                            </button>
                        </td>
                                                <td>
                                                        {(() => {
                                                            const currentBookId = review.book?.id_book || review.id_book;
                                                            const currentBookTitle = review.book?.title || 'Livre inconnu';
                                                            return (
                            <button
                            className="book-link-badge"
                                                        onClick={() => openBookDetail(currentBookId)}
                            title="Voir les détails du livre"
                                                        disabled={!currentBookId}
                            >
                                <i className="fas fa-book"></i>
                                                                {currentBookTitle}
                                <i className="fas fa-external-link-alt"></i>
                            </button>
                                                            );
                                                        })()}
                        </td>
                        <td>{new Date(review.created_at).toLocaleDateString()}</td>
                        <td className="actions-cell">
                            <button
                            className="btn-icon btn-icon--view"
                            onClick={() => openReviewDetailModal(review)}
                            title="Voir l'avis"
                            >
                            <i className="fas fa-eye"></i>
                            </button>
                            <button
                            className="btn-icon btn-icon--edit"
                            onClick={() => openEditModal(review)}
                            title="Modifier"
                            >
                            <i className="fas fa-edit"></i>
                            </button>
                            <button
                            className="btn-icon btn-icon--delete"
                            onClick={() => handleDelete(review.id_review)}
                            title="Supprimer"
                            >
                            <i className="fas fa-trash"></i>
                            </button>
                        </td>
                        </tr>
                    ))}
                </tbody>
                </table>
            </div>

            {/* Modal Visualisation */}
            {showReviewDetailModal && selectedReview && (
                <div style={{ zIndex: 1000 }}>
                    <ReviewDetailModal
                        review={selectedReview}
                        onClose={() => setShowReviewDetailModal(false)}
                        onOpenUserProfile={openUserProfile}
                        onOpenBookDetail={openBookDetail}
                        onEdit={handleEditFromDetailModal}
                    />
                </div>
            )}

            {/* Modal Profil Utilisateur */}
            {showUserProfileModal && selectedUserId && (
                <div style={{ zIndex: 1100 }}>
                    <UserProfileModalWrapper
                        userId={selectedUserId}
                        onClose={() => {
                            setShowUserProfileModal(false);
                            setSelectedUserId(null);
                            // ✅ Remettre le focus sur le modal d'avis si besoin
                        }}
                    />
                </div>
            )}

            {/* Modal Détail Livre */}
            {showBookDetailModal && selectedBookId && (
                <div style={{ zIndex: 1100 }}>
                    <BookDetailModal
                        bookId={selectedBookId}
                        onClose={() => {
                            setShowBookDetailModal(false);
                            setSelectedBookId(null);
                        }}
                        onEdit={(book) => {
                            setShowBookDetailModal(false);
                            // Rediriger vers l'édition du livre si nécessaire
                            console.log('Éditer le livre:', book);
                        }}
                    />
                </div>
            )}

            {/* Modal Édition */}
            {showEditModal && selectedReview && (
                <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
                <div className="modal" onClick={(e) => e.stopPropagation()}>
                    <div className="modal__header">
                    <h2>Modifier l'avis</h2>
                    <button className="modal__close" onClick={() => setShowEditModal(false)}>
                        <i className="fas fa-times"></i>
                    </button>
                    </div>

                    <form onSubmit={handleEdit} className="modal__body">
                    <div className="form-group">
                        <label>Titre de l'avis</label>
                        <input
                        type="text"
                        name="title_rating"
                        value={formData.title_rating}
                        onChange={handleChange}
                        placeholder="Titre de l'avis"
                        />
                    </div>

                    <div className="form-group">
                        <label>Note (1-5)</label>
                        <select
                        name="rating"
                        value={formData.rating}
                        onChange={handleChange}
                        required
                        >
                        <option value="1">⭐ 1 - Très mauvais</option>
                        <option value="2">⭐⭐ 2 - Mauvais</option>
                        <option value="3">⭐⭐⭐ 3 - Moyen</option>
                        <option value="4">⭐⭐⭐⭐ 4 - Bon</option>
                        <option value="5">⭐⭐⭐⭐⭐ 5 - Excellent</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Commentaire</label>
                        <textarea
                        name="comment"
                        value={formData.comment}
                        onChange={handleChange}
                        rows="6"
                        placeholder="Commentaire de l'avis"
                        />
                    </div>

                    <div className="modal__actions">
                        <button type="submit" className="btn btn--primary">
                        <i className="fas fa-save"></i> Enregistrer
                        </button>
                        <button
                        type="button"
                        className="btn btn--secondary"
                        onClick={() => setShowEditModal(false)}
                        >
                        Annuler
                        </button>
                    </div>
                    </form>
                </div>
                </div>
            )}
        </div>
    );
}

export default ReviewsManagement;