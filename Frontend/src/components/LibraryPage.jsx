
import React, { useEffect, useState } from 'react';
import '../css/NavBar.css';
import '../css/LibraryPage.css';
import '../css/MediaQueries.css';

const BookCard = ({ book }) => {
    return (
        <div className="book-card">
            <img src={book.image} alt={book.title} className="book-image" />
            <h3 className="book-title">{book.title}</h3>
            <p className="book-author">{book.author}</p>
        </div>
    );
};

const LibraryPage = () => {
    const [books, setBooks] = useState([]);

    useEffect(() => {
        // Simulation de données locales (mock)
        const mockBooks = [
            {
                id_book: "1",
                image: "/src/assets/img/img1.png",
                title: "Le Petit Prince",
                author: "Antoine de Saint-Exupéry",
            },
            {
                id_book: "2",
                image: "/src/assets/img/img2.png",
                title: "1984",
                author: "George Orwell",
            },
            {
                id_book: "3",
                image: "/src/assets/img/img3.png",
                title: "L'Alchimiste",
                author: "Paulo Coelho",
            },
            {
                id_book: "1",
                image: "/src/assets/img/img1.png",
                title: "Le Petit Prince",
                author: "Antoine de Saint-Exupéry",
            },
            {
                id_book: "2",
                image: "/src/assets/img/img2.png",
                title: "1984",
                author: "George Orwell",
            },
            {
                id_book: "3",
                image: "/src/assets/img/img3.png",
                title: "L'Alchimiste",
                author: "Paulo Coelho",
            },
            {
                id_book: "1",
                image: "/src/assets/img/img1.png",
                title: "Le Petit Prince",
                author: "Antoine de Saint-Exupéry",
            },
            {
                id_book: "2",
                image: "/src/assets/img/img2.png",
                title: "1984",
                author: "George Orwell",
            },
            {
                id_book: "3",
                image: "/src/assets/img/img3.png",
                title: "L'Alchimiste",
                author: "Paulo Coelho",
            },
            {
                id_book: "1",
                image: "/src/assets/img/img1.png",
                title: "Le Petit Prince",
                author: "Antoine de Saint-Exupéry",
            },
            {
                id_book: "2",
                image: "/src/assets/img/img2.png",
                title: "1984",
                author: "George Orwell",
            },
            {
                id_book: "3",
                image: "/src/assets/img/img3.png",
                title: "L'Alchimiste",
                author: "Paulo Coelho",
            },
            {
                id_book: "1",
                image: "/src/assets/img/img1.png",
                title: "Le Petit Prince",
                author: "Antoine de Saint-Exupéry",
            },
            {
                id_book: "2",
                image: "/src/assets/img/img2.png",
                title: "1984",
                author: "George Orwell",
            },
            {
                id_book: "3",
                image: "/src/assets/img/img3.png",
                title: "L'Alchimiste",
                author: "Paulo Coelho",
            },
            {
                id_book: "1",
                image: "/src/assets/img/img1.png",
                title: "Le Petit Prince",
                author: "Antoine de Saint-Exupéry",
            },
            {
                id_book: "2",
                image: "/src/assets/img/img2.png",
                title: "1984",
                author: "George Orwell",
            },
            {
                id_book: "3",
                image: "/src/assets/img/img3.png",
                title: "L'Alchimiste",
                author: "Paulo Coelho",
            },
            {
                id_book: "1",
                image: "/src/assets/img/img1.png",
                title: "Le Petit Prince",
                author: "Antoine de Saint-Exupéry",
            },
        ];

        setBooks(mockBooks);
    }, []);

    return (
        <div className="library-page">
            <h1 className="library-title">Catalogue</h1>
            <div className="book-grid">
                {books.map((book) => (
                    <BookCard key={book.id_book} book={book} />
                ))}
            </div>
        </div>
    );
};

export default LibraryPage;