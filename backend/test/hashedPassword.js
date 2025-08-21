import { promisify } from "node:util";
import { scrypt, randomBytes } from "node:crypto";

const scryptPromise = promisify(scrypt);
const KEY_LENGTH = 64; // Length of the derived key
const SALT_LENGTH = 16; // Length of the salt in bytes

async function hashPassword(password) {
	if (!password) {
		throw new Error("Password cannot be empty");
	}

	try {
		// Generate a random salt
		const salt = randomBytes(SALT_LENGTH).toString("hex");
		// Derive a key using the password and salt
		const derivedKey = await scryptPromise(password, salt, KEY_LENGTH);
		// Return the salt and derived key as a single string
		return `${salt}:${derivedKey.toString("hex")}`;
	} catch (error) {
		throw new Error(`Error while creating hash: ${error.message}`);
	}
}

// Example usage
(async () => {
	const password = "Pa$$w0rd!";
	const hashedPassword = await hashPassword(password);
	console.log("Hashed password:", hashedPassword);
})();
