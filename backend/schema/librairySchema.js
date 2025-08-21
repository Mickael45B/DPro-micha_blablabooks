import Joi from "joi";

export const createLibairySchema = Joi.object({
	name: Joi.string().min(2).max(50),
});

export const readAllLibrariesOfUserSchema = Joi.object({
	id: Joi.string().min(14).max(36),
});

export const readLibraryByIdSchema = Joi.object({
	id: Joi.string().min(14).max(36),
});

export const readAllBooksOfLibrarySchema = Joi.object({
	id: Joi.string().min(14).max(36),
});

export const readAllBookOfLibraryByIdSchema = Joi.object({
	id: Joi.string().min(14).max(36),
});

export const updateLibairyShema = Joi.object({
	id: Joi.string().min(14).max(36), // ID must be a string of 14 to 36 characters
	name: Joi.string().min(2).max(50), // Name between 2 and 50 characters
});

export const deleteLibairySchema = Joi.object({
	id: Joi.string(),
});
