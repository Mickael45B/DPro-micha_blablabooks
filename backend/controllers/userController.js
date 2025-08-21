// Importing necessary modules
import Joi from "joi"; // Used for input data validation
import sanitizeHtml from "sanitize-html"; // Used to sanitize user inputs to prevent XSS attacks
import { hash } from "../utils/scrypt.js"; // Importing password hashing function
import { User, Library } from "../models/associations.js"; // Sequelize models for database interaction
import jwt from "jsonwebtoken"; // Used to generate JWT tokens for authentication
import {
	getUsersByPKSchema,
	updateUserSchema,
	deleteUsersByPKSchema,
} from "../schema/userSchema.js"; // Validation schema for user ID

import dotenv from "dotenv"; // Used to load environment variables
dotenv.config(); // Load environment variables from .env file

const userController = {
	// READ: Fetch all user profiles
	async allProfiles(req, res) {
		try {
			// Fetch all users from the database, excluding their passwords
			const users = await User.findAll({
				attributes: { exclude: ["password"] }, // Exclude password from the response
			});

			// Return the list of users
			return res
				.status(200)
				.json({ message: "liste de tous les utilisateurs", data: users });
		} catch (error) {
			// Handle server errors
			console.error("Error fetching users:", error);
			return res.status(500).json({
				message: "Internal server error",
			});
		}
	},

	async getUserById(req, res) {
		try {
			// Get the user ID from the request parameters
			const userId = req.params.id;

			// Validate the user ID using Joi schema
			const { error } = getUsersByPKSchema.validate({ id: userId });
			if (error) {
				// Return a 400 error if the ID is invalid
				return res.status(400).json({
					message: "Invalid user ID",
					details: error.details,
				});
			}

			// Sanitize the user ID to prevent XSS attacks
			const cleanid = sanitizeHtml(userId);

			// Fetch the user from the database
			const user = await User.findOne({
				where: { id_user: cleanid },
				attributes: { exclude: ["password"] }, // Exclude password from the response
			});

			// If the user is not found, return a 404 error
			if (!user) {
				return res.status(404).json({
					message: "User not found",
				});
			}

			// Return the user data
			return res
				.status(200)
				.json({ message: "utilisateur recherché", data: [user] });
		} catch (error) {
			// Handle server errors
			console.error("Error fetching user:", error);
			return res.status(500).json({
				message: "Internal server error",
			});
		}
	},

	//UPDATE: Update a user's information
	async updateUser(req, res) {
		try {
			// Get the user ID from the request parameters
			const userId = req.params.id;

			// Validate the data using Joi schema
			const { error, value } = updateUserSchema.validate(req.body);

			// If the data is invalid, return a 400 error
			if (error) {
				return res.status(400).json({
					message: "Invalid data",
					details: error.details,
				});
			}

			// Sanitize user data to prevent XSS attacks
			const cleanName = value.name ? sanitizeHtml(value.name) : undefined;
			const cleanEmail = value.email ? sanitizeHtml(value.email) : undefined;
			const cleanPassword = value.password
				? await hash(sanitizeHtml(value.password)) // Hash the password if provided
				: undefined;

			// Update the user in the database
			await User.update(
				{
					name: cleanName,
					email: cleanEmail,
					password: cleanPassword,
				},
				{
					where: { id_user: userId },
				},
			);

			const returnUpdatedUser = await User.findOne({
				where: { id_user: userId },
				attributes: { exclude: ["password"] }, // Exclude password from the response
			});

			// Return a success message
			return res.status(200).json({
				message: "User updated successfully",
				data: [returnUpdatedUser],
			});
		} catch (error) {
			// Handle server errors
			console.error("Error updating user:", error);
			return res.status(500).json({
				message: "Internal server error",
			});
		}
	},

	//DELETE: Delete a user and their associated libraries
	async deleteUser(req, res) {
		try {
			// Get the user ID from the request parameters
			const userId = req.params.id;

			// Validate the user ID using Joi schema
			const { error } = deleteUsersByPKSchema.validate({ id: userId });
			if (error) {
				// Return a 400 error if the ID is invalid
				return res.status(400).json({
					message: "Invalid user ID",
					details: error.details,
				});
			}

			// Sanitize the user ID to prevent XSS attacks
			const cleanid = sanitizeHtml(userId);

			// Delete the user from the database
			await User.destroy({
				where: { id_user: cleanid },
			});

			// Delete all libraries associated with the user
			await Library.destroy({
				where: { id_user: cleanid },
			});

			// Return a success message
			return res.status(200).json({
				message: "User deleted successfully",
				data: [],
			});
		} catch (error) {
			console.error("Error deleting user:", error);
			return res.status(500).json({
				message: "Internal server error",
			});
		}
	},
};

export default userController;
