// Importing necessary modules from Node.js
import { scrypt, randomBytes, timingSafeEqual } from "node:crypto"; // For cryptographic operations
import { promisify } from "node:util"; // To convert callback-based functions to promise-based

// Promisify the scrypt function to use it with async/await
const scryptPromise = promisify(scrypt);

// Constants for key and salt lengths
const KEY_LENGTH = 64; // Length of the derived key
const SALT_LENGTH = 16; // Length of the salt in bytes

/**
 * Function to hash a password using scrypt.
 * @param {string} password - The password to hash.
 * @returns {Promise<string>} - A promise that resolves to the hashed password in the format "salt:derivedKey".
 * @throws {Error} - Throws an error if the password is empty or hashing fails.
 */
export async function hash(password) {
	if (!password) {
		throw new Error("Password cannot be empty"); // Ensure the password is provided
	}

	try {
		// Generate a random salt
		const salt = randomBytes(SALT_LENGTH).toString("hex");
		// Derive a key using the password and salt
		const derivedKey = await scryptPromise(password, salt, KEY_LENGTH);
		// Return the salt and derived key as a single string
		return `${salt}:${derivedKey.toString("hex")}`;
	} catch (error) {
		// Handle errors during the hashing process
		throw new Error(`Error while creating hash: ${error.message}`);
	}
}

/**
 * Function to verify if a password matches a given hash.
 * @param {string} password - The password to verify.
 * @param {string} hash - The hash to compare against, in the format "salt:derivedKey".
 * @returns {Promise<boolean>} - A promise that resolves to true if the password matches the hash, otherwise false.
 * @throws {Error} - Throws an error if inputs are invalid or verification fails.
 */
export async function verify(password, hash) {
	if (!password || !hash) {
		throw new Error("Password and hash cannot be empty"); // Ensure both inputs are provided
	}

	try {
		// Split the hash into salt and derived key
		const [salt, key] = hash.split(":");
		if (!salt || !key) {
			throw new Error("Invalid hash format"); // Ensure the hash is in the correct format
		}

		// Convert the derived key from hex to a buffer
		const keyBuffer = Buffer.from(key, "hex");
		// Derive a key using the provided password and salt
		const derivedKey = await scryptPromise(password, salt, KEY_LENGTH);

		// Log the lengths of the buffers for debugging
		//console.log("Key buffer length:", keyBuffer.length);
		//console.log("Derived key length:", derivedKey.length);

		// Check if the lengths of the buffers match
		if (keyBuffer.length !== derivedKey.length) {
			return false; // The lengths are different, so the password is invalid
		}

		// Use timingSafeEqual to securely compare the derived keys
		return timingSafeEqual(keyBuffer, derivedKey);
	} catch (error) {
		// Handle errors during the verification process
		throw new Error(`Error while verifying password: ${error.message}`);
	}
}
