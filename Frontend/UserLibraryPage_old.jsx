const BookCard = ({ book }) => {
    const navigate = useNavigate();

    // Fonction pour gérer le clic sur l'élément
    const handleClick = () => {
        navigate(`/livres/${book.id_book}`); // Redirige vers la page BookPage avec l'ID du livre
    };

    return (
        // biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
        <div
            className="book-card"
            onClick={handleClick}
            style={{ cursor: "pointer" }}
        >
            <img src={book.vignetteimage} alt={book.title} className="book-image" />
            <h4 className="book-title">{book.title}</h4>
            <p className="book-author">{book.author}</p>
            {/* biome-ignore lint/a11y/useButtonType: <explanation> */}
            <button
                className="remove-button"
                onClick={(e) => {
                    e.stopPropagation(); // Empêche la propagation du clic vers le parent
                    console.log("Retirer le livre");
                }}
            >
                Retirer
            </button>
        </div>
    );
};

const UserLibraryPage = () => {
    const [libraries, setLibraries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchLibrariesAndBooks = async () => {
            try {
                // Récupérer le token depuis le localStorage
                const token = localStorage.getItem("token");

                // Configurer les en-têtes avec le token
                const config = {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                };

                // Récupérer les bibliothèques de l'utilisateur
                const librariesResponse = await axios.get(
                    `${import.meta.env.VITE_BACKEND_URL}/bibliotheques/user`,
                    config,
                );

                const librariesData = librariesResponse.data.data;
                const librariesDatat = librariesResponse.data.data.id_library;
                console.log("Données des bibliothèques :", librariesDatat);
                // Récupérer les livres pour chaque bibliothèque
                const librariesWithBooks = await new Promise((resolve, reject) => {
                    Promise.all(
                        librariesData.map(async (library) => {
                            try {
                                const booksResponse = await axios.get(
                                    `${import.meta.env.VITE_BACKEND_URL}/bibliotheques/${library.id_library}/user/books`,
                                    {
                                        ...config,
                                        params: {
                                            id_library: library.id_library, // Envoi de id_library en tant que paramètre
                                        },
                                    },
                                );
                                console.log(booksResponse);
                                return {
                                    ...library,
                                    books: booksResponse.data.data || [], // Assurez-vous que "books" est un tableau
                                };
                            } catch (error) {
                                console.error(
                                    `Erreur lors de la récupération des livres pour la bibliothèque ${library.id_library}:`,
                                    error,
                                );
                                return {
                                    ...library,
                                    books: [], // En cas d'erreur, retournez une bibliothèque vide
                                };
                            }
                        }),
                    )
                        .then(resolve)
                        .catch(reject);
                });

                if (librariesWithBooks.length !== libraries.length) {
                    setLibraries(librariesWithBooks);
                }
            } catch (err) {
                if (err.response && err.response.status === 401) {
                    setError("Votre session a expiré. Veuillez vous reconnecter.");
                    // Rediriger vers la page de connexion
                    navigate("/connexion");
                }

                console.error(
                    "Erreur lors de la récupération des bibliothèques :",
                    err,
                );
                setError("Impossible de charger les bibliothèques.");
            } finally {
                setLoading(false);
            }
        };

        fetchLibrariesAndBooks();

        // Mettre en place un intervalle pour actualiser les données toutes les 30 secondes
        const interval = setInterval(() => {
            fetchLibrariesAndBooks();
        }, 300000); // 30 secondes

        // Nettoyer l'intervalle lorsque le composant est démonté
        return () => clearInterval(interval);
    }, []);

    // Gestion des états : chargement, erreur ou données
    if (loading) {
        return <div>Chargement des bibliothèques...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    return (
        <div className="user-library-page">
            <h1 className="library-title">Ma bibliothèque</h1>

            {libraries.map((library) => (
                <section key={library.id_library} className="library-category">
                    <h2 className="category-title">{library.name}</h2>
                    <div className="book-grid-static">
                        {library.books && library.books.length > 0 ? (
                            library.books.map((book) => {
                                return <BookCard key={book.id_book} book={book} />;
                            })
                        ) : (
                            <p>Aucun livre dans cette bibliothèque.</p>
                        )}
                    </div>
                </section>
            ))}
        </div>
    );
};

export default UserLibraryPage;
