import React, { useEffect, useState, useMemo  } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import MainLayout from '../../components/layout/MainLayout/mainLayout.jsx';
import { GET_BOOKS } from '../../../data/graphql/queries/queriesBooks.jsx';
import '../../../presentation/styles/NavBar.css';
import './LibraryPage.css';
import '../../styles/MediaQueries.css';
import SmallCard from '../../../presentation/components/features/BookCard/variants/smallCard.jsx';

const AdvancedSearch = ({ filters, onFilterChange, onReset }) => {
    return (
        <div className="advanced-search">
            <h3>🔍 Recherche avancée</h3>
            
            <div className="filter-group">
                <label htmlFor="search-title">Titre ou Auteur</label>
                <input
                    id="search-title"
                    type="text"
                    placeholder="Rechercher..."
                    value={filters.searchText}
                    onChange={(e) => onFilterChange('searchText', e.target.value)}
                />
            </div>

            <div className="filter-group">
                <label htmlFor="filter-genre">Genre</label>
                <select
                    id="filter-genre"
                    value={filters.genre}
                    onChange={(e) => onFilterChange('genre', e.target.value)}
                >
                    <option value="">Tous les genres</option>
                    <option value="Fantasy">Fantasy</option>
                    <option value="Romance">Romance</option>
                    <option value="Thriller">Thriller</option>
                    <option value="Contemporain">Contemporain</option>
                    <option value="Historique">Historique</option>
                    <option value="Science-fiction">Science-fiction</option>
                    <option value="Policier">Policier</option>
                    <option value="Philosophie">Philosophie</option>
                    <option value="Développement personnel">Développement personnel</option>
                </select>
            </div>

            <div className="filter-group">
                <label htmlFor="filter-year">Année de publication</label>
                <div className="year-range">
                    <input
                        type="number"
                        placeholder="De"
                        value={filters.yearFrom}
                        onChange={(e) => onFilterChange('yearFrom', e.target.value)}
                        min="1900"
                        max="2025"
                    />
                    <span>-</span>
                    <input
                        type="number"
                        placeholder="À"
                        value={filters.yearTo}
                        onChange={(e) => onFilterChange('yearTo', e.target.value)}
                        min="1900"
                        max="2025"
                    />
                </div>
            </div>

            <div className="filter-group">
                <label htmlFor="filter-age">Âge minimum</label>
                <select
                    id="filter-age"
                    value={filters.ageLimit}
                    onChange={(e) => onFilterChange('ageLimit', e.target.value)}
                >
                    <option value="">Tous âges</option>
                    <option value="10">10+</option>
                    <option value="12">12+</option>
                    <option value="14">14+</option>
                    <option value="16">16+</option>
                    <option value="18">18+</option>
                </select>
            </div>

            <div className="filter-group">
                <label htmlFor="filter-rating">Note minimale</label>
                <select
                    id="filter-rating"
                    value={filters.minRating}
                    onChange={(e) => onFilterChange('minRating', e.target.value)}
                >
                    <option value="">Toutes notes</option>
                    <option value="4">4+ ⭐</option>
                    <option value="3.5">3.5+ ⭐</option>
                    <option value="3">3+ ⭐</option>
                    <option value="2.5">2.5+ ⭐</option>
                </select>
            </div>

            <button className="reset-filters" onClick={onReset}>
                🔄 Réinitialiser
            </button>
        </div>
    );
};

// Composant pour afficher le résumé d'un livre
const BookSummary = ({ book }) => {
    if (!book) {
        return (
            <div className="book-summary-empty">
                <p>👈 Cliquez sur une carte pour voir le résumé</p>
            </div>
        );
    }

    const decodeHtml = (html) => {
        const txt = document.createElement('textarea');
        txt.innerHTML = html;
        return txt.value;
    };

    return (
        <div className="book-summary">
            <div className="book-summary__header">
                <img 
                    src={`/images/vignettesImages/${book.vignetteimage}`}
                    alt={decodeHtml(book.title)}
                    className="book-summary__image"
                    onError={(e) => {
                        e.target.src = '/images/booksImages/image_not_found.png';
                    }}
                />
            </div>

            <div className="book-summary__content">
                <h3 className="book-summary__title">{decodeHtml(book.title)}</h3>
                
                <div className="book-summary__meta">
                    <p><strong>Auteur:</strong> {decodeHtml(book.author)}</p>
                    <p><strong>Éditeur:</strong> {decodeHtml(book.editor)}</p>
                    <p><strong>Genre:</strong> {book.genre}</p>
                    {book.avg_rating && (
                        <p><strong>Note:</strong> ⭐ {book.avg_rating.toFixed(1)} ({book.nb_reviews} avis)</p>
                    )}
                </div>

                <div className="book-summary__description">
                    <h4>Résumé</h4>
                    <p>{decodeHtml(book.description)}</p>
                </div>

                <div className="book-summary__actions">
                    <a 
                        href={`/livres/${book.id_book}`}
                        className="book-summary__link"
                    >
                        <i className="fas fa-book-open"></i>
                        Voir tous les détails
                    </a>
                </div>
            </div>
        </div>
    );
};

const LibraryPage = () => {
    const [allBooks, setAllBooks] = useState([]);
    const [selectedBook, setSelectedBook] = useState(null);
    
    // États pour la pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [booksPerPage, setBooksPerPage] = useState(12);
    
    // États pour le tri
    const [sortBy, setSortBy] = useState('title');
    const [sortOrder, setSortOrder] = useState('asc');
    
    // États pour les filtres
    const [filters, setFilters] = useState({
        searchText: '',
        genre: '',
        yearFrom: '',
        yearTo: '',
        ageLimit: '',
        minRating: ''
    });

    // 🔧 Requête GraphQL
    const { data, loading, error } = useQuery(GET_BOOKS, {
        variables: {
            limit: 1000,
            offset: 0
        },
        fetchPolicy: 'network-only'
    });

    // 📦 Chargement des données
    useEffect(() => {
        if (data?.getBooks?.books) {
            setAllBooks(data.getBooks.books);
        }
    }, [data]);

    // 🔍 Filtrage avec useMemo pour éviter les recalculs
    const filteredBooks = useMemo(() => {
        let result = [...allBooks];

        if (filters.searchText) {
            const search = filters.searchText.toLowerCase();
            result = result.filter(book => 
                book.title.toLowerCase().includes(search) ||
                book.author.toLowerCase().includes(search)
            );
        }

        if (filters.genre) {
            result = result.filter(book => book.genre === filters.genre);
        }

        if (filters.yearFrom) {
            result = result.filter(book => {
                const year = new Date(book.publication_date).getFullYear();
                return year >= parseInt(filters.yearFrom);
            });
        }
        if (filters.yearTo) {
            result = result.filter(book => {
                const year = new Date(book.publication_date).getFullYear();
                return year <= parseInt(filters.yearTo);
            });
        }

        if (filters.ageLimit) {
            result = result.filter(book => 
                book.age_limit >= parseInt(filters.ageLimit)
            );
        }

        if (filters.minRating) {
            result = result.filter(book => 
                book.avg_rating >= parseFloat(filters.minRating)
            );
        }

        return result;
    }, [filters, allBooks]);

    // 📊 Tri avec useMemo
    const sortedBooks = useMemo(() => {
        const sorted = [...filteredBooks];

        sorted.sort((a, b) => {
            let compareA, compareB;

            switch (sortBy) {
                case 'title':
                    compareA = a.title.toLowerCase();
                    compareB = b.title.toLowerCase();
                    break;
                case 'author':
                    compareA = a.author.toLowerCase();
                    compareB = b.author.toLowerCase();
                    break;
                case 'date':
                    compareA = new Date(a.publication_date);
                    compareB = new Date(b.publication_date);
                    break;
                case 'rating':
                    compareA = a.avg_rating || 0;
                    compareB = b.avg_rating || 0;
                    break;
                default:
                    return 0;
            }

            if (compareA < compareB) return sortOrder === 'asc' ? -1 : 1;
            if (compareA > compareB) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

        return sorted;
    }, [filteredBooks, sortBy, sortOrder]);

    // 📄 Pagination avec useMemo
    const displayedBooks = useMemo(() => {
        const indexOfLastBook = currentPage * booksPerPage;
        const indexOfFirstBook = indexOfLastBook - booksPerPage;
        return sortedBooks.slice(indexOfFirstBook, indexOfLastBook);
    }, [currentPage, booksPerPage, sortedBooks]);

    // Retour à la page 1 quand les filtres changent
    useEffect(() => {
        setCurrentPage(1);
    }, [filters]);

    const totalPages = Math.ceil(sortedBooks.length / booksPerPage);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleResetFilters = () => {
        setFilters({
            searchText: '',
            genre: '',
            yearFrom: '',
            yearTo: '',
            ageLimit: '',
            minRating: ''
        });
    };

    const handleShowSummary = (book) => {
        console.log('📖 Livre sélectionné:', book.title);
        setSelectedBook(book);
    };

    // Menu contextuel avec recherche avancée ET résumé
    const contextualMenu = (
        <>
            <div className="contextualMenu__action">
                <AdvancedSearch
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    onReset={handleResetFilters}
                />
            </div>
            <div className="contextualMenu__info" style={{ marginTop: '1.5rem' }}>
                <h3>📖 Aperçu du livre</h3>
                <BookSummary book={selectedBook} />
            </div>
        </>
    );

    if (loading) {
        return (
            <MainLayout contextualMenu={contextualMenu}>
                <div className="library-page">
                    <div style={{ textAlign: 'center', padding: '3rem' }}>
                        <p>Chargement des livres...</p>
                    </div>
                </div>
            </MainLayout>
        );
    }

    if (error) {
        return (
            <MainLayout contextualMenu={contextualMenu}>
                <div className="library-page">
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'red' }}>
                        <p>❌ Erreur lors du chargement : {error.message}</p>
                    </div>
                </div>
            </MainLayout>
        );
    }

    return (
        <>
            <div className="library-page">
                {/* En-tête */}
                <div className="library-header">
                    <div className="library-stats">
                        <h1 className="library-title">📚 Catalogue</h1>
                        <p className="library-count">
                            {sortedBooks.length} livre{sortedBooks.length > 1 ? 's' : ''} trouvé{sortedBooks.length > 1 ? 's' : ''}
                            {sortedBooks.length !== allBooks.length && ` sur ${allBooks.length}`}
                        </p>
                    </div>

                    {/* Contrôles */}
                    <div className="library-controls">
                        <div className="sort-controls">
                            <label htmlFor="sort-by">Trier par:</label>
                            <select
                                id="sort-by"
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                            >
                                <option value="title">Titre</option>
                                <option value="author">Auteur</option>
                                <option value="date">Date de publication</option>
                                <option value="rating">Note</option>
                            </select>

                            <button
                                className="sort-order-btn"
                                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                                title={sortOrder === 'asc' ? 'Ordre croissant' : 'Ordre décroissant'}
                            >
                                {sortOrder === 'asc' ? '↑' : '↓'}
                            </button>
                        </div>

                        <div className="pagination-controls">
                            <label htmlFor="books-per-page">Livres par page:</label>
                            <select
                                id="books-per-page"
                                value={booksPerPage}
                                onChange={(e) => {
                                    setBooksPerPage(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
                            >
                                <option value="12">12</option>
                                <option value="24">24</option>
                                <option value="36">36</option>
                                <option value="48">48</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Grille de livres */}
                {displayedBooks.length > 0 ? (
                    <div className="book-grid">
                        {displayedBooks.map((book) => (
                            <SmallCard 
                                key={book.id_book} 
                                book={book}
                                onShowSummary={handleShowSummary}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="no-results">
                        <p>😔 Aucun livre ne correspond à vos critères de recherche.</p>
                        <button onClick={handleResetFilters}>
                            Réinitialiser les filtres
                        </button>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="pagination">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="pagination-btn"
                        >
                            ← Précédent
                        </button>

                        <div className="pagination-pages">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                                if (
                                    page === 1 ||
                                    page === totalPages ||
                                    (page >= currentPage - 2 && page <= currentPage + 2)
                                ) {
                                    return (
                                        <button
                                            key={page}
                                            onClick={() => setCurrentPage(page)}
                                            className={`pagination-page ${currentPage === page ? 'active' : ''}`}
                                        >
                                            {page}
                                        </button>
                                    );
                                } else if (page === currentPage - 3 || page === currentPage + 3) {
                                    return <span key={page} className="pagination-ellipsis">...</span>;
                                }
                                return null;
                            })}
                        </div>

                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="pagination-btn"
                        >
                            Suivant →
                        </button>
                    </div>
                )}

                {/* Info pagination */}
                {totalPages > 0 && (
                    <div className="pagination-info">
                        Page {currentPage} sur {totalPages} • 
                        Affichage de {((currentPage - 1) * booksPerPage) + 1} à {Math.min(currentPage * booksPerPage, sortedBooks.length)} livres
                    </div>
                )}
            </div>
        </>
    );
};

export default LibraryPage;