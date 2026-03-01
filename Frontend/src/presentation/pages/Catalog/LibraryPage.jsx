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
                    <option value="Dystopie">Dystopie</option>
                    <option value="Conte">Conte</option>
                    <option value="Philosophie">Philosophie</option>
                    <option value="Science-fiction">Science-fiction</option>
                    <option value="Fantastique">Fantastique</option>
                    <option value="Romance">Romance</option>
                    <option value="Policier/Thriller">Policier/Thriller</option>
                    <option value="Horreur">Horreur</option>
                    <option value="Aventure">Aventure</option>
                    <option value="Historique">Historique</option>
                    <option value="Poésie">Poésie</option>
                    <option value="Biographie">Biographie</option>
                    <option value="Classique">Classique</option>
                    <option value="Spiritualité">Spiritualité</option>
                    <option value="Essai">Essai</option>
                    <option value="Humour">Humour</option>
                    <option value="Manga/BD">Manga/BD</option>
                    <option value="Jeunesse">Jeunesse</option>
                    <option value="New Adult">New Adult</option>
                    <option value="Roman initiatique">Roman initiatique</option>
                    <option value="Young Adult">Young Adult</option>
                    <option value="Drame">Drame</option>
                    <option value="Épopée">Épopée</option>
                    <option value="Développement personnel">Développement personnel</option>
                    <option value="Contemporain">Contemporain</option>

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
                        max={new Date().getFullYear()}
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

const useIsMobile = () => {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 900);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    return isMobile;
};

const BookSummary = ({ book }) => {
    const navigate = useNavigate();

    if (!book) {
        return (
            <div className="book-summary">
                <div className="book-summary-empty">
                    <p>📖 Sélectionnez un livre pour voir son résumé</p>
                </div>
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
                    src={`/images/booksImages/${book.bookimage}`} 
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
                    <div className="book-summary__meta-item">
                        <i className="fas fa-user"></i>
                        <div>
                            <span className="book-summary__meta-label">Auteur</span>
                            <span className="book-summary__meta-value">{decodeHtml(book.author)}</span>
                        </div>
                    </div>

                    <div className="book-summary__meta-item">
                        <i className="fas fa-tag"></i>
                        <div>
                            <span className="book-summary__meta-label">Genre</span>
                            <span className="book-summary__meta-value">{decodeHtml(book.genre)}</span>
                        </div>
                    </div>

                    <div className="book-summary__meta-item">
                        <i className="fas fa-calendar"></i>
                        <div>
                            <span className="book-summary__meta-label">Publication</span>
                            <span className="book-summary__meta-value">
                                {new Date(book.publication_date).toLocaleDateString('fr-FR')}
                            </span>
                        </div>
                    </div>

                    <div className="book-summary__meta-item">
                        <i className="fas fa-users"></i>
                        <div>
                            <span className="book-summary__meta-label">Public cible</span>
                            <span className="book-summary__meta-value">
                                {book.age_limit ? `${book.age_limit}+ ans` : 'Tous publics'}
                            </span>
                        </div>
                    </div>
                    {/* par éditeur */}
                    <div className="book-summary__meta-item">
                        <i className="fas fa-building"></i>
                        <div>
                            <span className="book-summary__meta-label">Éditeur</span>
                            <span className="book-summary__meta-value">{decodeHtml(book.publisher)}</span>
                        </div>
                    </div>
                </div>

                <div className="book-summary__stats">
                    <div className="book-summary__stat">
                        <i className="fas fa-star"></i>
                        <span>{book.avg_rating ? `${book.avg_rating}/5` : 'Non noté'}</span>
                    </div>
                    <div className="book-summary__stat">
                        <i className="fas fa-book-open"></i>
                        <span>{book.pagecount} pages</span>
                    </div>
                </div>

                {book.description && (
                    <div className="book-summary__description">
                        <h4>📖 Résumé</h4>
                        <p>{decodeHtml(book.description)}</p>
                    </div>
                )}

                <div className="book-summary__actions">
                    <a 
                        href={`/livres/${book.id_book}`}
                        className="book-summary__link"
                        onClick={(e) => {
                            e.preventDefault();
                            navigate(`/livres/${book.id_book}`);
                        }}
                    >
                        <i className="fas fa-arrow-right"></i>
                        Voir les détails
                    </a>
                </div>
            </div>
        </div>
    );
};

const LibraryPage = () => {
    const navigate = useNavigate();
    const isMobile = useIsMobile();
    const [filters, setFilters] = useState({
        searchText: '',
        genre: '',
        yearFrom: '',
        yearTo: '',
        ageLimit: '',
        minRating: ''
    });

    // ✅ FIX : Tri par défaut = genre
    const [sortBy, setSortBy] = useState('genre');
    const [sortOrder, setSortOrder] = useState('asc');
    const [currentPage, setCurrentPage] = useState(1);
    const [booksPerPage, setBooksPerPage] = useState(12);
    const [allBooks, setAllBooks] = useState([]);
    const [selectedBook, setSelectedBook] = useState(null);

    // 🔧 Requête pour récupérer les livres
    const { data, loading, error } = useQuery(GET_BOOKS, {
        variables: {
            limit: 100,
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
                case 'genre':
                    compareA = a.genre || '';
                    compareB = b.genre || '';
                    break;
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

    // Regrouper les livres par genre si le tri est par genre
    const groupedBooks = useMemo(() => {
        if (sortBy !== 'genre') return null;

        const groups = {};
        sortedBooks.forEach(book => {
            const genre = book.genre || 'Sans genre';
            if (!groups[genre]) {
                groups[genre] = [];
            }
            groups[genre].push(book);
        });

        return groups;
    }, [sortedBooks, sortBy]);

    // 📄 Pagination avec useMemo
    const displayedBooks = useMemo(() => {
        if (sortBy === 'genre') {
            // Pas de pagination si tri par genre (affichage par sections)
            return sortedBooks;
        }
        const indexOfLastBook = currentPage * booksPerPage;
        const indexOfFirstBook = indexOfLastBook - booksPerPage;
        return sortedBooks.slice(indexOfFirstBook, indexOfLastBook);
    }, [currentPage, booksPerPage, sortedBooks, sortBy]);

    // Retour à la page 1 quand les filtres changent
    useEffect(() => {
        setCurrentPage(1);
    }, [filters, sortBy]);

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
        setSelectedBook(book);
    };

    //  Menu contextuel passé à MainLayout
    const contextualMenu = (
        <>
            <div className="contextualMenu__action">
                <AdvancedSearch
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    onReset={handleResetFilters}
                />
            </div>
        </>
    );

    if (loading) {
        return (
            <MainLayout contextualMenuAction={contextualMenu}>
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
            <MainLayout contextualMenuAction={contextualMenu}>
                <div className="library-page">
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'red' }}>
                        <p>❌ Erreur lors du chargement : {error.message}</p>
                    </div>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout contextualMenuAction={isMobile ? null : contextualMenu}>
            <div className="library-page">
                {/* En-tête */}
                <div className="library-header">

                    <div className="library-stats">
                        <h2 className="library-title">📚 Catalogue</h2>
                    </div>

                    {/* Menu sur mobile */}
                    {isMobile && (
                        <div className="mobile-search-container">
                            {contextualMenu }
                        </div>
                    )}


                    {/* Contrôles */}
                    <div className="library-controls">
                        <div className="sort-controls">
                            <label htmlFor="sort-by">Trier par:</label>
                            <select
                                id="sort-by"
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                            >
                                <option value="genre">Genre</option>
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

                        {/* Pagination controls - cachés si tri par genre */}
                        {sortBy !== 'genre' && (
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
                        )}
                    </div>

                    <p className="library-count">
                        {sortedBooks.length} livre{sortedBooks.length > 1 ? 's' : ''} trouvé{sortedBooks.length > 1 ? 's' : ''}
                        {sortedBooks.length !== allBooks.length && ` sur ${allBooks.length}`}
                    </p>



                </div>

                {/* Affichage conditionnel selon le tri */}
                {sortBy === 'genre' && groupedBooks ? (
                    // Affichage par sections de genre
                    Object.keys(groupedBooks).sort().map(genre => (
                        <div key={genre} className="genre-section">
                            <h2 className="genre-section__title">
                                <span className="genre-icon">📚</span>
                                {genre}
                                <span className="genre-count">
                                    ({groupedBooks[genre].length} livre{groupedBooks[genre].length > 1 ? 's' : ''})
                                </span>
                            </h2>
                            <div className="book-grid">
                                {groupedBooks[genre].map((book) => (
                                    <SmallCard 
                                        key={book.id_book} 
                                        book={book}
                                        onShowSummary={handleShowSummary}
                                    />
                                ))}
                            </div>
                        </div>
                    ))
                ) : (
                    // Affichage normal avec pagination
                    <>
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

                        {/* Pagination - seulement si pas de tri par genre */}
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
                    </>
                )}
            </div>
        </MainLayout>
    );
};

export default LibraryPage;
