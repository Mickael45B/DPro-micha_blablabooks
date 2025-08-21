// Importing necessary modules
import Joi from "joi"; // Used to validate input data
import sanitizeHtml from "sanitize-html"; // Used to sanitize user inputs to prevent XSS attacks
import {
	Library,
	bookHasLibrary,
	Book,
	User,
	Sequelize,
} from "../models/associations.js"; // Importing Sequelize models to interact with the database
import dotenv from "dotenv";
import { randomUUID } from "crypto";
import {
	createLibairySchema,
	readLibraryByIdSchema,
	readAllLibrariesOfUserSchema,
	readAllBooksOfLibrarySchema,
	readAllBookOfLibraryByIdSchema,
	updateLibairyShema,
	deleteLibairySchema,
} from "../schema/librairySchema.js";

dotenv.config();

function generateUUID() {
	return randomUUID();
}

const libraryController = {
	//CREATE
	async createLibrary(req, res) {
		try {
			// Récupérer l'utilisateur depuis le middleware
			const idUser = req.user.user.name.id_user;

			const name = req.body.name;

			// Validate the data sent in the request
			const { error, value } = createLibairySchema.validate({ name });

			// If the data is invalid, return a 400 error
			if (error) {
				return res.status(400).json({
					message: "Invalid data",
					details: error.details, // Error details
				});
			}

			// Sanitize the input data to prevent XSS attacks
			const cleanName = sanitizeHtml(name);

			// Create a new library in the database
			const newLibrary = await Library.create({
				id_library: generateUUID(),
				id_user: idUser,
				name: name,
				is_editable: "TRUE",
			});

			// Return the created library
			return res
				.status(201)
				.json({ message: "nouvelle bibliothéque crée", data: [newLibrary] });
		} catch (error) {
			console.error("Error creating library:", error);
			return res.status(500).json({
				message: "Internal server error",
			});
		}
		//Rajouter une fonction qui empêche de créer une bibliothèque avec le même nom
	},

	//READ
	async getAllLibraries(req, res) {
		try {
			// Avec "id_user" recuperé cidessus, récuperer le nom et le mail de l'utilisateur
			const usersOfLibrary = await Library.findAll({
				attributes: ["id_library", "name", "id_user"],
				include: [
					{
						model: User,
						as: "owner",
						attributes: ["name", "email"],
					},
				],
				order: [["id_library", "ASC"]], // Order by name in ascending order
			});
			// If no libraries are found, return a 404 error
			if (usersOfLibrary.length === 0) {
				return res.status(404).json({
					message: "No libraries found",
				});
			}

			// Return the list of libraries
			return res.status(200).json({
				message: "Affichage de toutes les bibliotheques",
				data: [usersOfLibrary],
			});
		} catch (error) {
			console.error("Error fetching libraries:", error);
			return res.status(500).json({
				message: "Internal server error",
			});
		}
	},

	async getLibraryById(req, res) {
		try {
			// Get the library ID from the request parameters
			const userID = req.params.id;

			const { error, value } = readLibraryByIdSchema.validate({
				id: userID,
			});
			if (error) {
				return res.status(400).json({
					message: "Invalid library ID",
					details: error.details,
				});
			}

			// Sanitize the library ID to prevent XSS attacks
			const cleanuserID = sanitizeHtml(userID);

			// Fetch the library from the database
			const usersOfLibrary = await Library.findAll({
				attributes: ["id_library", "name", "id_user"],
				include: [
					{
						model: User,
						as: "owner",
						attributes: ["name", "email"],
					},
				],
				where: { id_user: userID },
				order: [["id_library", "ASC"]], // Order by id_library in ascending order
			});
			// If the library is not found, return a 404 error
			if (!usersOfLibrary) {
				return res.status(404).json({
					message: "Library not found",
				});
			}

			// Return the library data
			return res.status(200).json({
				message: "Affichage de la bibliotheque choisie",
				data: usersOfLibrary,
			});
		} catch (error) {
			console.error("Error fetching library:", error);
			return res.status(500).json({
				message: "Internal server error",
			});
		}
	},

	async getAllLibrariesOfUser(req, res) {
		try {
			// Récupérer l'utilisateur depuis le middleware
			const id_users = req.user.user.name.id_user;

			const { error, value } = readAllLibrariesOfUserSchema.validate({
				id: id_users,
			});
			if (error) {
				return res.status(400).json({
					message: "Invalid user ID",
					details: error.details,
				});
			}
			// Sanitize the user ID to prevent XSS attacks
			const cleanUserId = sanitizeHtml(value.id);

			// Fetch all libraries of the user from the database
			const usersOfLibrary = await Library.findAll({
				attributes: ["id_library", "name", "id_user"],
				include: [
					{
						model: User,
						as: "owner",
						attributes: ["name", "email"],
					},
				],
				where: { id_user: id_users },
				order: [["id_library", "ASC"]], // Order by name in ascending order
			});

			// If no libraries are found, return a 404 error
			if (usersOfLibrary.length === 0) {
				return res.status(200).json({
					message: "No libraries found for this user",
				});
			}
			//avec "id_user" recupéré, obtenir le nom et le mail de l'user

			// Return the list of libraries
			return res.status(200).json({
				message: "Affichage de toutes les bibliotheques de l'utilisateur",
				data: usersOfLibrary,
			});
		} catch (error) {
			console.error("Error fetching libraries:", error);
			return res.status(500).json({
				message: "Internal server error",
			});
		}
	},

	async getAllBooksOfLibrary(req, res) {
		try {
			// Récupérer l'utilisateur depuis le middleware
			const id_user = req.user.user.name.id_user;

			// Get the library ID from the request parameters
			const Libraryid = req.params.idLibrary;

			const { error, value } = readAllBooksOfLibrarySchema.validate({
				id: Libraryid,
			});
			if (error) {
				return res.status(400).json({
					message: "Invalid library ID",
					details: error.details,
				});
			}
			// Sanitize the library ID to prevent XSS attacks
			const cleanLibraryId = sanitizeHtml(value.Library);

			//verifier si la bibliothèque qui a l'id recuperé existe
			const findlibrary = await Library.findOne({
				where: { id_library: Libraryid },
				attributes: ["id_library", "name"],
			});
			if (!findlibrary) {
				return res.status(404).json({
					message: "Library not found",
				});
			}

			// Construire la condition WHERE en fonction du nom de la bibliothèque
			// biome-ignore lint/style/useConst: <explanation>
			let whereCondition = { id_library: Libraryid }; // Condition par défaut
			if (findlibrary.name === "Bibliothèque livres lus") {
				whereCondition.is_read = true; // Ajouter la condition pour "is_read"
			} else if (findlibrary.name === "Bibliothèque livres favoris") {
				whereCondition.is_favorite = true; // Ajouter la condition pour "is_favorite"
			}

			// Récupérer tous les "id_book" de la table "bookHasLibrary" avec les conditions
			const books = await bookHasLibrary.findAll({
				where: whereCondition,
				attributes: ["id_book"],
			});
			if (books.length === 0) {
				return res.status(200).json({
					message: "No books found in this library",
				});
			}
			// console.log("books", books);

			const bookDetails = await Promise.all(
				books.map((book) =>
					Book.findOne({
						where: { id_book: book.id_book },
					}),
				),
			);

			if (bookDetails.length === 0) {
				return res.status(404).json({
					message: "No books found in this library",
				});
			}

			// Return the list of books
			return res.status(200).json({
				message: "touts les livres contenu dans une de ses bibliotheque perso.",
				data: bookDetails,
			});
		} catch (error) {
			console.error("Error fetching books:", error);
			return res.status(500).json({
				message: "Internal server error",
			});
		}
	},

	async getAllBookOfLibraryById(req, res) {
		try {
			// Get the library ID from the request parameters
			const libraryId = req.params.idLibrary;

			const { error, value } = readAllBookOfLibraryByIdSchema.validate({
				id: libraryId,
			});
			if (error) {
				return res.status(400).json({
					message: "Invalid library ID",
					details: error.details,
				});
			}

			// Sanitize the library ID to prevent XSS attacks
			const cleanLibraryId = sanitizeHtml(libraryId);

			// Fetch the library from the database
			const library = await Library.findOne({
				where: { id_library: libraryId },
				attributes: ["id_library", "name"],
			});
			// If the library is not found, return a 404 error
			if (!library) {
				return res.status(404).json({
					message: "Library not found",
				});
			}
			// Fetch all books in the library from the database
			const books = await bookHasLibrary.findAll({
				where: { id_library: libraryId },
				attributes: ["id_book"],
			});
			// If no books are found, return a 404 error
			if (books.length === 0) {
				return res.status(200).json({
					message: "No books found in this library",
				});
			}
			// Fetch the details of each book
			const bookIds = books.map((book) => book.id_book);
			const bookDetails = await Book.findAll({
				where: { id_book: bookIds },
				attributes: ["id_book", "title", "author", "description"],
			});
			// If no book details are found, return a 404 error
			if (bookDetails.length === 0) {
				return res.status(404).json({
					message: "No book details found",
				});
			}
			// Return the list of books
			return res.status(200).json({
				message: "voir tous les livres d'une bibliotheque",
				data: [bookDetails],
			});
		} catch (error) {
			console.error("Error fetching books:", error);
			return res.status(500).json({
				message: "Internal server error",
			});
		}
	},

	//UPDATE
	async updateLibrary(req, res) {
		try {
			// Get the library ID from the request parameters
			const libraryId = req.params.id;
			const labraryName = req.body.name;
			// Validate the data sent in the request
			const { error, value } = updateLibairyShema.validate({
				name: labraryName,
				id: libraryId,
			});

			// If the data is invalid, return a 400 error
			if (error) {
				return res.status(400).json({
					message: "Invalid data",
					details: error.details, // Error details
				});
			}

			// Sanitize the input data to prevent XSS attacks
			const cleanName = sanitizeHtml(value.name);
			const cleanID = sanitizeHtml(value.id);

			// Update the library in the database
			const updatedLibrary = await Library.update(
				{
					name: cleanName,
				},
				{
					where: { id_library: libraryId },
				},
			);

			// If no library was updated, return a 404 error
			if (!updatedLibrary[0]) {
				return res.status(404).json({
					message: "Library not found",
				});
			}
			const returnedUpdateLibrary = await Library.findOne({
				where: { id_library: libraryId },
			});

			// Return the updated library data
			return res.status(200).json({
				message: "mise a jour de la bibliotheques",
				data: [returnedUpdateLibrary],
			});
		} catch (error) {
			console.error("Error updating library:", error);
			return res.status(500).json({
				message: "Internal server error",
			});
		}
	},

	//DELETE
	async deleteLibrary(req, res) {
		try {
			const libraryId = req.params.id;
			const idUser = req.user.user.name.id_user;
			const isAdmin = req.user.user.name.is_admin;

			const { error, value } = deleteLibairySchema.validate({ id: libraryId });

			if (error) {
				return res
					.status(400)
					.json({ message: "ID invalide", details: error.details });
			}

			const cleanId = sanitizeHtml(value.id);

			// Récupérer la bibliothèque ciblée
			const library = await Library.findOne({
				where: { id_library: cleanId },
				attributes: ["id_library", "id_user", "is_editable"],
			});

			if (!library) {
				return res.status(404).json({ message: "Bibliothèque non trouvée" });
			}

			// Vérifier si elle est modifiable (peu importe si "is_editable" est un booléen ou une chaîne)
			const isEditable =
				library.is_editable === true ||
				library.is_editable === "true" ||
				library.is_editable === 1 ||
				library.is_editable === "1";

			if (!isEditable) {
				return res.status(403).json({
					error:
						"Suppression interdite : la bibliothèque n'est pas modifiable.",
				});
			}

			// Vérifier les droits selon l'utilisateur
			if (!isAdmin && library.id_user !== idUser) {
				return res.status(403).json({
					error:
						"Suppression interdite : vous n'avez pas accès à cette bibliothèque.",
				});
			}

			// Supprimer la bibliothèque
			await library.destroy();

			return res.status(200).json({
				message: "Bibliothèque supprimée avec succès",
				data: [],
			});
		} catch (error) {
			console.error("Erreur lors de la suppression du bibliotheque:", error);
			return res.status(500).json({
				message: "Erreur serveur lors de la suppression du bibliotheque.",
			});
		}
	},
};
export default libraryController;
