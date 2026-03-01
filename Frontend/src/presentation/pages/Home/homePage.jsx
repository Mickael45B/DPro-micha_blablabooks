import React, { useEffect, useState, useMemo  } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from '@apollo/client';
import { GET_BOOKS } from '../../../data/graphql/queries/queriesBooks.jsx';
import { GET_NUMBER_OF_USERS, GET_NUMBER_OF_REVIEWS } from '../../../data/graphql/queries/connecting.jsx';

import apolloClient from '../../../data/apollo/apolloClient.js';
import LoadingSpinner from '../../components/layout/LoadingSpinner.jsx';

import MainLayout from '../../components/layout/MainLayout/mainLayout.jsx';
import Carousel from '../../components/features/Carousel/Carousel.jsx';
import SmallCard from '../../components/features/BookCard/variants/smallCard/smallCard.jsx';
import Thumbnail from '../../components/features/BookCard/variants/thumbnail/thumbnail.jsx';
import ThumbnailContext from '../../components/features/BookCard/variants/thumbnailContext/thumbnailContext.jsx';
import { GET_USERS } from '../Admin/adminQueries.jsx';

// import "../../../index.css";
import "./homePage.css";
import { getUserFromToken } from "../../../data/graphql/queries/auth.jsx";

// Composant pour afficher le résumé dans le menu contextuel
const SelectedBookDisplay = ({ book }) => {
    if (!book) {
        return (
            <div className="home-cta">
                <h3>🚀 Commencez maintenant</h3>
                <p>Créez votre compte et organisez votre bibliothèque personnelle.</p>
                <a href="/inscription" className="cta-button">
                    Essai gratuit 30 jours
                </a>
                <p style={{fontSize: '0.8em', marginTop: '1em', opacity: 0.7}}>
                    fonctionnalités à venir
                </p>
            </div>
        );
    }

    const decodeHtml = (html) => {
        const txt = document.createElement('textarea');
        txt.innerHTML = html;
        return txt.value;
    };

    return (
        <div className="selected-book-display">
            {/* Titre du livre sélectionné */}
            <div className="selected-book-header">
                <span className="selected-book-badge">{decodeHtml(book.title)}</span>
            </div>
            
            {/* Afficher le thumbnail du livre sélectionné */}
            <div className="selected-book-thumbnail">
                <ThumbnailContext 
                    book={book}
                    onShowSummary={() => {}} // Désactiver le clic pour éviter la récursion
                />
            </div>
        </div>
    );
};

const HomePage = () => {
    const [selectedBook, setSelectedBook] = useState(null);
    
    // user courant (null si non connecté)
    const user = useMemo(() => getUserFromToken(), []);

    // Requête pour récupérer les livres
    const { data, loading, error } = useQuery(GET_BOOKS, {
        variables: {
            limit: 100,
            offset: 0
        },
        fetchPolicy: 'network-only'
    });

    const { data: usersData } = useQuery(GET_NUMBER_OF_USERS, {
        variables: {
            limit: 5,
            offset: 0
        },
        fetchPolicy: 'network-only'
    });

    const { data: reviewsData } = useQuery(GET_NUMBER_OF_REVIEWS, {
        variables: {
            limit: 5,
            offset: 0
        },
        fetchPolicy: 'network-only'
    });


    // Sélectionner 15 livres pris au hasard
    const randomBooks = useMemo(() => {
        if (!data?.getBooks?.books) return [];
        const shuffled = [...data.getBooks.books].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, 15);
    }, [data]);

    // Sélectionner 6 livres les mieux notés
    const topRatedBooks = useMemo(() => {
        if (!data?.getBooks?.books) return [];
        
        return [...data.getBooks.books]
            .sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0))
            .slice(0, 6);
    }, [data]);

    // Sélectionner 15 livres les plus récents
    const recentBooks = useMemo(() => {
        if (!data?.getBooks?.books) return [];
        
        return [...data.getBooks.books]
            .sort((a, b) => new Date(b.publication_date) - new Date(a.publication_date))
            .slice(0, 15);
    }, [data]);

    // Fonction appelée quand on clique sur un thumbnail
    const handleShowSummary = (book) => {
        //console.log('📖 Livre sélectionné:', book.title);
        setSelectedBook(book);
    };

    // Menu contextuel avec info et livre sélectionné
    const contextualMenuAction = (
        <div className="contextualMenu__action">
            <div className="selected-book-container">
            {selectedBook ? (
                <>
                    <h3>📖 Aperçu du livre</h3>
                    <SelectedBookDisplay book={selectedBook} />
                </>
            ) : (
                <SelectedBookDisplay book={null} />
            )}
            </div>
        </div>
    );

    if (loading) {
        return (
            <MainLayout contextualMenuAction={contextualMenuAction}>
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                    <p>Chargement des livres...</p>
                </div>
            </MainLayout>
        );
    }

    if (error) {
        return (
            <MainLayout contextualMenuAction={contextualMenuAction}>
                <div style={{ textAlign: 'center', padding: '3rem', color: 'red' }}>
                    <p>❌ Erreur lors du chargement : {error.message}</p>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout contextualMenuAction={contextualMenuAction}>
            {/* Hero section */}
            <section className="home-hero">
                <h1 style={{fontSize: '2em', marginBottom: '0.5em'}}>
                    Bienvenue sur BlablaBooks
                </h1>
                <p style={{fontSize: '1.2em', opacity: 0.9, marginBottom: '2em'}}>
                    Retrouvez et partagez tous vos livres en un clin d'œil
                </p>
            </section>

            {/* Grille - Sélection du moment */}
            <section className="home-section">
                <h2 className="home-section__title">📚 notre sélection du moment</h2>
                    <div className="home-books-grid">
                        {randomBooks.map((book) => (
                            <Thumbnail 
                                key={book.id_book} 
                                book={book}
                                onShowSummary={handleShowSummary}
                            />
                        ))}
                </div>
            </section>

            {/* Grille - Livres les mieux notés */}
            <section className="home-section">
                <h2 className="home-section__title">⭐ Nos coups de cœur</h2>
                <div className="home-books-grid">
                    {topRatedBooks.map((book) => (
                        <Thumbnail 
                            key={book.id_book} 
                            book={book}
                            onShowSummary={handleShowSummary}
                        />
                    ))}
                </div>
            </section>

            {/* Grille - Livres récents */}
            {recentBooks.length > 0 && (
                <section className="home-section">
                    <h2 className="home-section__title">🆕 Dernières parutions</h2>
                    <div className="home-books-grid">
                        {recentBooks.map((book) => (
                            <Thumbnail 
                                key={book.id_book} 
                                book={book}
                                onShowSummary={handleShowSummary}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* Call to action final — caché si utilisateur est connecté */}
            {!user && (
                <section style={{
                    textAlign: 'center', 
                    marginTop: '3em', 
                    padding: '2em', 
                    backgroundColor: 'rgba(215, 53, 92, 0.1)', 
                    borderRadius: '12px'
                }}>
                    <h3 style={{fontSize: '1.5em', marginBottom: '1em'}}>
                        Prêt à plonger dans l'univers de la lecture ?
                    </h3>
                    <a href="/inscription" className="button_library" style={{display: 'inline-flex'}}>
                        Créer mon compte gratuitement
                    </a>
                </section>
            )}

        </MainLayout>
    );
};

export default HomePage;