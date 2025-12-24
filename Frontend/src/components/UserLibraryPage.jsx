import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../css/NavBar.css";
import "../css/UserLibraryPage.css";
import "../css/MediaQueries.css";
			<h1 className="text-4xl font-bold mb-4">Mes bibliothèques</h1>

const userFavoriteBooks = {
	Romans: [
		{
			id: 1,
			title: "Le Comte de Monte-Cristo",
			author: "Alexandre Dumas",
			image: "/src/assets/img/img1.png",
		},
		{
			id: 2,
			title: "Les Misérables",
			author: "Victor Hugo",
			image: "/src/assets/img/img1.png",
		},
		{
			id: 2,
			title: "Les Misérables",
			author: "Victor Hugo",
			image: "/src/assets/img/img1.png",
		},
		{
			id: 2,
			title: "Les Misérables",
			author: "Victor Hugo",
			image: "/src/assets/img/img1.png",
		},
	],
	"Science-Fiction": [
		{
			id: 3,
			title: "Dune",
			author: "Frank Herbert",
			image: "/src/assets/img/img1.png",
		},
		{
			id: 4,
			title: "Fondation",
			author: "Isaac Asimov",
			image: "/src/assets/img/img1.png",
		},
	],
	Jeunesse: [
		{
			id: 5,
			title: "Harry Potter",
			author: "J.K. Rowling",
			image: "/src/assets/img/img1.png",
		},
		{
			id: 6,
			title: "Le Petit Prince",
			author: "Antoine de Saint-Exupéry",
			image: "/src/assets/img/img1.png",
		},
	],
};




const UserLibraryPage = () => {
	return (
		<div className="user-library-page">
			<h1 className="library-title">Ma bibliothèque</h1>

			{Object.entries(userFavoriteBooks).map(([category, books]) => (
				<section key={category} className="library-category">
					<h2 className="category-title">{category}</h2>
					<div className="book-grid-static">
						{books.map((book) => (


							<div className="carousel-vignette" style={{width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
								{book.vignetteimage ? (
									<img
										id={`${book.id_book}`}
										src={normalizeImagePath(book.vignetteimage)}
										alt={book.title || `vignette-${book.id_book}`}
										style={{ width: '100%', height: '100%', objectFit: 'cover' }}
									/>
								) : (
									<div style={{ fontSize: '3rem' }}>📚</div>
								)}							
							</div>						







						))}
					</div>
				</section>
			))}
		</div>
	);
};

export default UserLibraryPage;
