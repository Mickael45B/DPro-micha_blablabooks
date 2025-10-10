// Importing necessary modules
import Joi from "joi"; // Used to validate input data
import sanitizeHtml from "sanitize-html"; // Used to sanitize user inputs to prevent XSS attacks
import { Review, Book, User, Sequelize } from "../models/associations.js"; // Importing Sequelize models to interact with the database
import dotenv from "dotenv";
import { randomUUID } from "crypto";
import {
	createReviewSchema,
	readReviewByIdSchema,
	updateReviewShema,
	deleteReviewSchema,
} from "../schema/schemas_joi/reviewSchema.js"; // Importing the review schema for validation
dotenv.config();

function generateUUID() {
	return randomUUID();
}

//id_review, id_user, id_book, rating, comment

const reviewController = {
	//CREATE
	async createReview(req, res) {
		try {
			// Récupérer l'utilisateur depuis le middleware
			const idUser = req.user.user.name.id_user;

			// Récupérer le id_book depuis l'URL
			const id = req.params.id;
			console.log("book", id);
			const { rating, comment } = req.body;

			const { error, value } = createReviewSchema.validate({ rating, comment });
			if (error) {
				return res.status(400).json({
					message: "Invalid data",
					details: error.details,
				});
			}

			// Nettoyer les données pour éviter les attaques XSS
			const cleanComment = sanitizeHtml(value.comment);
			const cleanRating = sanitizeHtml(value.rating);
			const cleanID = sanitizeHtml(value.id);

			const book = await Book.findOne({ where: { id_book: id } });
			if (!book) {
				return res.status(404).json({
					message: "Book not found",
				});
			}

			// Créer un nouvel avis dans la base de données
			const newReview = await Review.create({
				id_review: generateUUID(),
				id_user: idUser,
				id_book: id,
				rating: rating,
				comment: comment,
			});

			// Retourner l'avis créé
			return res.status(201).json({
				message: "Review successfully created!",
				data: [newReview], // Return the created user's ID
			});
		} catch (error) {
			console.error("Error creating review:", error);
			return res.status(500).json({
				message: "Internal server error",
			});
		}
	},

	//READ
	async getReviewById(req, res) {
		try {
			// Get the review ID from the request parameters
			const reviewId = req.params.id;

			const { error, value } = readReviewByIdSchema.validate({ id: reviewId });
			if (error) {
				return res.status(400).json({
					message: "Invalid data",
					details: error.details,
				});
			}

			// Nettoyer les données pour éviter les attaques XSS
			const cleanId = sanitizeHtml(reviewId);

			// Fetch the review from the database
			const reviews = await Review.findOne({
				where: { id_review: cleanId },
				attributes: ["id_review", "comment", "rating", "id_user"],
				include: [
					{
						model: User,
						as: "reviewer", // Doit correspondre à l'alias défini dans la relation
						attributes: ["name", "email"], // Récupérer uniquement le nom et l'email
					},
				],
			});

			// If the review is not found, return a 404 error
			if (!reviews) {
				return res.status(404).json({
					message: "Review not found",
				});
			}

			// Return the review data
			return res.status(200).json({
				message: "Review selected",
				data: [reviews],
			});
		} catch (error) {
			console.error("Error fetching review:", error);
			return res.status(500).json({
				message: "Internal server error",
			});
		}
	},

	//UPDATE
	async updateReview(req, res) {
		try {
			// Get the review ID from the request parameters
			const reviewId = req.params.id;
			const { comment, rating } = req.body;
			// Validate the data sent in the request
			const { error, value } = updateReviewShema.validate({
				id: reviewId,
				comment,
				rating,
			});

			// If the data is invalid, return a 400 error
			if (error) {
				return res.status(400).json({
					message: "Invalid data",
					details: error.details, // Error details
				});
			}
			// Sanitize the input data to prevent XSS attacks
			const cleanContent = value.content ? sanitizeHtml(comment) : undefined; //PB!!!!!
			const cleanRating = value.rating ? sanitizeHtml(rating) : undefined; //PB!!!!!

			const updateData = {};
			if (value.comment) {
				updateData.comment = value.comment; // Utiliser directement la valeur validée
			}
			if (value.rating) {
				updateData.rating = value.rating; // Utiliser directement la valeur validée
			}

			// Update the review in the database
			const [updatedRows] = await Review.update(
				updateData,

				{
					where: { id_review: reviewId },
				},
			);

			// If no review was updated, return a 404 error
			if (updatedRows === 0) {
				return res.status(404).json({
					message: "Review not found",
				});
			}

			const retourReviews = await Review.findOne({
				where: { id_review: reviewId },
				attributes: ["id_review", "comment", "rating", "id_user"],
				include: [
					{
						model: User,
						as: "reviewer", // Doit correspondre à l'alias défini dans la relation
						attributes: ["name", "email"], // Récupérer uniquement le nom et l'email
					},
				],
			});

			// Return the updated review 4d5e6f7g-8h9i-0j1k-2l3m-4n5o6p7q8p9s
			return res.status(200).json({
				message: "Review updated",
				data: [retourReviews],
			});
		} catch (error) {
			console.error("Error updating review:", error);
			return res.status(500).json({
				message: "Internal server error",
			});
		}
	},

	//DELETE

	async deleteReview(req, res) {
		try {
			// Get the review ID from the request parameters
			const reviewId = req.params.id;
			const { error, value } = deleteReviewSchema.validate({ id: reviewId });
			if (error) {
				return res.status(400).json({
					message: "Invalid data",
					details: error.details, // Détails de l'erreur
				});
			}

			// Nettoyer les données pour éviter les attaques XSS

			const cleanID = sanitizeHtml(value.id);
			// Delete the review from the database
			const deletedReview = await Review.destroy({
				where: { id_review: cleanID },
			});

			// If no review was deleted, return a 404 error
			if (!deletedReview) {
				return res.status(404).json({
					message: "Review not found",
				});
			}

			// Return a success message
			return res.status(200).json({
				message: "Review deleted successfully",
				data: [],
			});
		} catch (error) {
			console.error("Error deleting review:", error);
			return res.status(500).json({
				message: "Internal server error",
			});
		}
	},
};

export default reviewController;
