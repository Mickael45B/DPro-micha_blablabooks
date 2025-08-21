// Importing necessary modules
import Joi from "joi"; // Used to validate input data
import sanitizeHtml from "sanitize-html"; // Used to sanitize user inputs to prevent XSS attacks
import {
	Book,
	Review,
	User,
	Library,
	bookHasLibrary,
	Sequelize,
} from "../models/associations.js"; // Importing Sequelize models to interact with the database
import dotenv from "dotenv";
import {
	createBookSchema,
	readBookByIdSchema,
	updateBookShema,
	deleteBookSchema,
} from "../schema/bookSchema.js";

import { randomUUID } from "crypto";
dotenv.config();

function generateUUID() {
	return randomUUID();
}

async function getAllReviews(cleanId) {
	try {
		// Vérifier si l'id_book est valide
		if (!cleanId) {
			throw new Error("Book ID is required");
		}

		// Récupérer tous les avis et les noms des utilisateurs pour le livre spécifié
		const reviews = await Review.findAll({
			where: { id_book: cleanId },
			include: [
				{
					model: User,
					as: "reviewer",
					attributes: ["name"],
				},
			],
		});

		// Si aucun avis n'est trouvé, retourner un tableau vide
		if (reviews.length === 0) {
			return { reviews: [], averageRating: 0 };
		}

		// Calculer la moyenne des notes
		const totalRatings = reviews.reduce(
			(sum, review) => sum + review.rating,
			0,
		);
		const averageRating = totalRatings / reviews.length;

		// Retourner les avis et la moyenne des notes
		return {
			reviews: reviews.map((review) => ({
				id_review: review.id_review,
				rating: review.rating,
				comment: review.comment,
				userName: review.reviewer
					? review.reviewer.name
					: "Utilisateur inconnu", // Inclure le nom de l'utilisateur
				created_at: review.created_at,
				updated_at: review.updated_at,
			})),
			averageRating: averageRating.toFixed(1), // Limiter à 2 décimales
		};
	} catch (error) {
		console.error("Error fetching reviews:", error);
		throw error; // Propager l'erreur pour qu'elle soit gérée par l'appelant
	}
}
const bookController = {
	//CREATE
	async createBook(req, res) {
		try {
			const { error, value } = createBookSchema.validate(req.body); // Validate the request body against the schema

			if (error) {
				return res
					.status(400)
					.json({ message: "Données invalides", details: error.details });
			}

			const sanitizedData = {
				isbn: sanitizeHtml(value.isbn),
				title: sanitizeHtml(value.title),
				author: sanitizeHtml(value.author),
				publication_date: value.publication_date, // Pas besoin de nettoyer une date
				price: value.price, // Pas besoin de nettoyer un nombre
				gender: sanitizeHtml(value.gender),
				editor: sanitizeHtml(value.editor),
				bookimage: sanitizeHtml(value.bookimage),
				vignetteimage: sanitizeHtml(value.vignetteimage),
				age_limit: value.age_limit, // Pas besoin de nettoyer un entier
				description: sanitizeHtml(value.description),
				series: sanitizeHtml(value.series),
			};

			// Fetch all users from the database
			const newBook = await Book.create({
				id_book: randomUUID(),
				...sanitizedData,
			});

			// Return the list of books as a JSON response
			return res.status(201).json({
				message: "Livre créé avec succès !",
				data: [newBook],
			});
		} catch (error) {
			console.error("Error creating books:", error);
			return res.status(500).json({
				message: "Erreur serveur lors de la création du livre.",
			});
		}
	},

	//READ
	async getAllBooks(req, res) {
		try {
			const books = await Book.findAll({
				attributes: [
					"id_book",
					"isbn",
					"title",
					"author",
					"publication_date",
					"price",
					"gender",
					"editor",
					"bookimage",
					"vignetteimage",
					"age_limit",
					"description",
					"series",
				],
				order: [["title", "ASC"]], // Order by title in ascending order
			});
			return res
				.status(200)
				.json({ message: "Tous les livres sont chargés", data: books });
		} catch (error) {
			console.error("Error fetching books:", error);
			return res.status(500).json({
				message: "Erreur serveur lors de la récupération des livres.", data: []
			});
		}
	},

	async getBookById(req, res) {
		try {
			const id_book = req.params.id;

			// Récupérer l'utilisateur depuis le middleware
			const idUser = req.user.user.name.id_user;

			const { error, value } = readBookByIdSchema.validate({ id: id_book });

			if (error) {
				return res.status(400).json({
					message: "Données invalides",
					details: error.details,
				});
			}

			const cleanId = sanitizeHtml(id_book); // Nettoyer l'ID

			// Récupérer les avis associés au livre
			const reviews = await getAllReviews(cleanId);

			// Rechercher le livre dans la base de données
			const book = await Book.findOne({
				where: { id_book: cleanId },
				attributes: [
					"id_book",
					"isbn",
					"title",
					"author",
					"publication_date",
					"price",
					"gender",
					"editor",
					"bookimage",
					"vignetteimage",
					"age_limit",
					"description",
					"series",
				],
			});

			if (!book) {
				return res.status(404).json({ message: "Livre non trouvé" });
			}

			// Check if the user exists in the database
			const user = await User.findOne({
				where: { id_user: idUser },
				attributes: ["id_user"],
			});
			if (!user) {
				return res.status(404).json({ error: "User not found" });
			}

			const userBiblio = await Library.findOne({
				where: { id_user: idUser, name: "Bibliothèque livres lus" },
				attributes: ["id_library"],
			});
			if (!userBiblio) {
				return res.status(404).json({ error: "User not found" });
			}

			console.log("ID du livre :", book.id_book);
			console.log("ID de la bibliothèque :", userBiblio.id_library);
			const bookInLibrary = await bookHasLibrary.findOne({
				where: { id_book: id_book, id_library: userBiblio.id_library },
				attributes: ["id", "id_book", "is_read"],
			});

			if (bookInLibrary !== null) {
				if (bookInLibrary.is_read) {
					console.log(
						"Le livre est déjà marqué comme lu. Mise à jour pour le retirer.",
					);
					// If the book is already a favorite, remove it from read
					await bookHasLibrary.update(
						{ is_read: false },
						{ where: { id: bookInLibrary.id } },
					);
					return res.status(200).json({
						message: "Book removed from read",
						data: [{ book, reviews }],
					});
					// biome-ignore lint/style/noUselessElse: <explanation>
				} else {
					// If the book is not a favorite, add it to read
					console.log(
						"Le livre n'est pas marqué comme lu. Mise à jour pour le marquer comme lu.",
					);
					// biome-ignore lint/complexity/noUselessLoneBlockStatements: <explanation>

					await bookHasLibrary.update(
						{ is_read: true },
						{ where: { id: bookInLibrary.id } },
					);
				}
				return res
					.status(200)
					.json({ message: "Book added to read", data: [{ book, reviews }] });
			}
			// biome-ignore lint/style/noUselessElse: <explanation>
			else {
				// If the book is not in the library, add it with is_favorite set to true
				console.log(
					"Le livre n'est pas dans la bibliothèque. Ajout en cours...",
				);
				await bookHasLibrary.create({
					id: generateUUID(),
					id_library: userBiblio.id_library,
					id_book: book.id_book,
					is_read: true,
					is_favorite: false,
				});
				console.log("Livre ajouté avec succès.");
				// Retourner les détails du livre et les avis

				return res
					.status(200)
					.json({ message: "livre choisi", data: [{ book, reviews }] });
			}
		} catch (error) {
			console.error("Erreur lors de la récupération du livre :", error);
			return res.status(500).json({
				message: "Erreur serveur lors de la récupération du livre.",
			});
		}
	},

	//UPDATE
	async updateBook(req, res) {
		try {
			const bookId = req.params.id; // Get the user ID from the request parameters

			const { error, value } = updateBookShema.validate(req.body); // Validate the request body against the schema

			if (error) {
				return res
					.status(400)
					.json({ message: "Données invalides", details: error.details });
			}
			// Sanitize user data to prevent XSS attacks
			const cleanId = sanitizeHtml(bookId);
			const cleanisbn = value.isbn ? sanitizeHtml(value.isbn) : undefined;
			const cleantitle = value.title ? sanitizeHtml(value.title) : undefined;
			const cleanauthor = value.author ? sanitizeHtml(value.title) : undefined;
			const cleanpublication_date = value.publication_date
				? sanitizeHtml(value.title)
				: undefined;
			const cleanprice = value.price ? sanitizeHtml(value.title) : undefined;
			const cleangender = value.gender ? sanitizeHtml(value.title) : undefined;
			const cleaneditor = value.editor ? sanitizeHtml(value.title) : undefined;
			const cleanbookimage = value.image
				? sanitizeHtml(value.title)
				: undefined;
			const cleanvignetteimage = value.image
				? sanitizeHtml(value.title)
				: undefined;
			const cleanage_limit = value.age_limit
				? sanitizeHtml(value.title)
				: undefined;
			const cleandescription = value.description
				? sanitizeHtml(value.title)
				: undefined;
			const cleanseries = value.description
				? sanitizeHtml(value.series)
				: undefined;

			await Book.update(
				{
					isbn: cleanisbn,
					title: cleantitle,
					author: cleanauthor,
					publication_date: cleanpublication_date,
					price: cleanprice,
					gender: cleangender,
					editor: cleaneditor,
					bookimage: cleanbookimage,
					vignetteimage: cleanvignetteimage,
					age_limit: cleanage_limit,
					description: cleandescription,
					series: cleanseries,
				},
				{
					where: { id_book: cleanId },
				},
			);
			const retunUpdatedLibrary = await Book.findOne({
				where: { id_book: bookId },
			});

			return res.status(200).json({
				message: "Book updated successfully",
				data: [retunUpdatedLibrary],
			});
		} catch (error) {
			console.error("Error validating book data:", error);
			return res
				.status(400)
				.json({ message: "Données invalides", details: error.details });
		}
	},

	//DELETE

	async deleteBook(req, res) {
		try {
			const bookId = req.params.id;

			const { error, value } = deleteBookSchema.validate({ id: bookId });

			if (error) {
				return res
					.status(400)
					.json({ message: "ID invalide", details: error.details });
			}

			const cleanId = sanitizeHtml(value.id);

			const book = await Book.findOne({ where: { id_book: cleanId } });

			if (!book) {
				return res.status(404).json({ message: "Livre non trouvé" });
			}

			await book.destroy();

			return res
				.status(200)
				.json({ message: "Livre supprimé avec succès", data: [] });
		} catch (error) {
			console.error("Erreur lors de la suppression du livre:", error);
			return res.status(500).json({
				message: "Erreur serveur lors de la suppression du livre.",
			});
		}
	},
};

export default bookController;
