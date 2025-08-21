// Importing necessary modules
import sanitizeHtml from "sanitize-html"; // Used to sanitize user inputs to prevent XSS attacks
import { hash, verify } from "../utils/scrypt.js"; // Importing password hashing and verification functions
import { User, Library, Sequelize } from "../models/associations.js"; // Sequelize models for database interaction
import jwt from "jsonwebtoken"; // Used to generate JWT tokens for authentication
import { registerSchema, loginSchema } from "../schema/authSchema.js"; // Validation schemas for registration and login
import { randomUUID } from "crypto"; // Used to generate unique IDs
import dotenv from "dotenv"; // Used to load environment variables
dotenv.config(); // Load environment variables from .env file

// Function to generate a unique UUID
function generateUUID() {
	return randomUUID();
}

// Function to generate a JWT token
function generateToken(name, email, id_user, is_admin) {
	// The token contains user information (name, email, ID, and admin status)
	const token = jwt.sign(
		{
			user: {
				name: name, // User's name
				email: email, // User's email
				id_user: id_user, // User's unique ID
				is_admin: is_admin, // Admin status (default is false)
			},
		},
		process.env.JWT_SECRET, // Secret key for signing the token
		{
			expiresIn: "10h", // Token expiration time
		},
	);
	return token; // Return the generated token
}

// Authentication controller
export const authController = {
	// Method to register a new user
	async register(req, res) {
		try {
			// Validate the incoming request data using Joi
			const { error, value } = registerSchema.validate(req.body);

			// If validation fails, return a 400 Bad Request error
			if (error) {
				return res.status(400).json({
					message: "Invalid data",
					details: error.details, // Provide validation error details
				});
			}

			// Sanitize user inputs to prevent XSS attacks
			const cleanName = sanitizeHtml(value.name);
			const cleanEmail = sanitizeHtml(value.email);
			const cleanPassword = sanitizeHtml(value.password);

			// Check if the email already exists in the database
			const existingUser = await User.findOne({ where: { email: cleanEmail } });

			// If the email is already in use, return a 400 error
			if (existingUser) {
				return res
					.status(400)
					.json({ message: "This email is already in use" });
			}

			// Hash the user's password for secure storage
			const hashedPassword = await hash(cleanPassword);

			// Generate a unique ID for the user
			const uuid_user = generateUUID();

			// Create a new user in the database
			const newUser = await User.create({
				name: cleanName,
				email: cleanEmail,
				password: hashedPassword, // Store the hashed password
				id_user: uuid_user, // Assign the generated unique ID
				is_admin: false, // Default to non-admin
			});

			// Create a "Read Books" library for the user
			const newLibraryRead = await Library.create({
				id_library: generateUUID(), // Generate a unique ID for the library
				name: "Bibliothèque livres lus", // Library name
				is_editable: "FALSE", // Mark the library as non-editable
				id_user: uuid_user, // Associate the library with the user
			});

			// Create a "Favorite Books" library for the user
			const newLibraryFavorite = await Library.create({
				id_library: generateUUID(), // Generate a unique ID for the library
				name: "Bibliothèque livres favoris", // Library name
				is_editable: "FALSE", // Mark the library as non-editable
				id_user: uuid_user, // Associate the library with the user
			});

			// Respond with a 201 Created status and the user's ID
			res.status(201).json({
				message: "User successfully created!",
				data: [newUser], // Return the created user's ID
			});
		} catch (err) {
			// Handle server errors
			console.error("❌ Erreur complète :", err);
			res.status(500).json({
				message: "Server error during registration",
				error: err.message,
			});
		}
	},

	// Method to log in a user
	async login(req, res) {
		try {
			// Validate the incoming request data using Joi
			const { error, value } = loginSchema.validate(req.body);
			console.log(req.body);
			// If validation fails, return a 400 Bad Request error
			if (error) {
				return res
					.status(400)
					.json({ message: "Invalid data", details: error.details });
			}

			// Sanitize user inputs to prevent XSS attacks
			const cleanEmail = sanitizeHtml(value.email);
			const cleanPassword = sanitizeHtml(value.password);

			// Search for the user in the database by email
			const user = await User.findOne({ where: { email: cleanEmail } });

			// If the user does not exist, return a 401 Unauthorized error
			if (!user) {
				return res
					.status(401)
					.json({ message: "This email or password is incorrect" });
			}

			// Verify the password using the `verify` function
			if (!user || !(await verify(cleanPassword, user.password))) {
				// If the credentials are invalid, return a 401 Unauthorized error
				return res.status(401).json({ error: "Invalid credentials" });
			}

			// Generate a JWT token for the user
			const token = generateToken({
				id_user: user.id_user, // User's unique ID
				name: user.name || "", // User's name (default to empty string if undefined)
				email: user.email, // User's email
				is_admin: user.is_admin,
			});

			// Respond with a 200 OK status and the generated token
			res.status(200).json({
				message: "success",
				data: [token],
			});
		} catch (err) {
			// Handle server errors
			console.error("Error during login:", err);
			res.status(500).json({ message: "Server error during login" });
		}
	},
};
export default authController;
