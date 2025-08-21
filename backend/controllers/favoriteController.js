// Importing necessary modules
import Joi from "joi"; // Used to validate input data
import sanitizeHtml from "sanitize-html"; // Used to sanitize user inputs to prevent XSS attacks
import {
	Book,
	User,
	Library,
	bookHasLibrary,
	Sequelize,
} from "../models/associations.js"; // Importing Sequelize models to interact with the database
import { favoriteBookSchema } from "../schema/favoriteSchema.js";

import dotenv from "dotenv";
import { randomUUID } from "crypto";
dotenv.config();

function generateUUID() {
	return randomUUID();
}

const favoriteController = {
	async favoriteBook(req, res) {
		try {
			const id_user = req.user.user.name.id_user;
			const id_book = req.body.id_book;

			const { error } = favoriteBookSchema.validate({ id_user, id_book });
			if (error) {
				return res.status(400).json({ error: error.details[0].message });
			}

			// Sanitize the inputs to prevent XSSfLibrary attacks
			const sanitizedIdUser = sanitizeHtml(id_user);
			const sanitizedIdBook = sanitizeHtml(id_book);

			// Check if the user exists in the database
			const users = await User.findOne({
				where: { id_user: id_user },
				attributes: ["id_user"],
			});
			if (!users) {
				return res.status(404).json({ error: "User not found" }); //VOIR : redirection vers la page de création de compte
			}
			const userBiblio = await Library.findOne({
				where: {
					id_user: users.id_user,
					name: "Bibliothèque livres favoris",
				},
				attributes: ["id_library"],
			});
			if (!userBiblio) {
				return res.status(404).json({ error: "User not found" });
			}

			// Check if the book exists in the database
			const book = await Book.findOne({ where: { id_book: sanitizedIdBook } });
			if (!book) {
				return res.status(404).json({ error: "Book not found" });
			}
			// Check if the library "Bibliothèque livres favoris" exists for the user

			//chercher dans "bookhaslibrary" les lignes qui on pour "id_library" l'id de la bibliotheque recuperé dans "userBiblio"
			const bookInLibrary = await bookHasLibrary.findOne({
				where: { id_book: sanitizedIdBook, id_library: userBiblio.id_library },
				attributes: ["id", "id_book", "is_favorite"],
			});

			//chercher si il y a une ligne "id_book" qui correspond a l'id book  recupéré
			if (bookInLibrary) {
				if (bookInLibrary.is_favorite) {
					// If the book is already a favorite, remove it from favorites
					await bookHasLibrary.update(
						{ is_favorite: false },
						{ where: { id: bookInLibrary.id } },
					);
					return res.status(200).json({
						message: "Book removed from favorites",
						is_favorite: false,
					});
				}
				// If the book is not a favorite, add it to favorites
				await bookHasLibrary.update(
					{ is_favorite: true },
					{ where: { id: bookInLibrary.id } },
				);
				return res
					.status(200)
					.json({ message: "Book added to favorites", is_favorite: true });
			}
			// If the book is not in the library, add it with is_favorite set to true
			await bookHasLibrary.create({
				id: generateUUID(),
				id_library: userBiblio.id_library,
				id_book: sanitizedIdBook,
				is_read: false,
				is_favorite: true,
			});
			return res
				.status(201)
				.json({ message: "Book added to favorites", is_favorite: true });
		} catch (error) {
			console.error("Error in favoriteBook:", error);
			return res.status(500).json({ error: "Internal server error" });
		}
	},
};
export default favoriteController;
