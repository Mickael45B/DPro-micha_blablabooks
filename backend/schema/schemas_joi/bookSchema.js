import Joi from "joi";

export const createBookSchema = Joi.object({
	isbn: Joi.string().max(42).required(), // ISBN du livre
	title: Joi.string().min(1).max(255).required(), // Titre du livre
	author: Joi.string().min(1).max(42).required(), // Auteur du livre
	publication_date: Joi.date().required(), // Date de publication
	price: Joi.number().positive().required(), // Prix positif
	gender: Joi.string().max(42).required(), // Genre du livre
	editor: Joi.string().max(42).required(), // Éditeur du livre
	bookimage: Joi.string().max(100), // URL de l'image
	vignetteimage: Joi.string().max(100), // URL de l'image
	age_limit: Joi.number().integer().positive().required(), // Limite d'âge
	description: Joi.string().max(1000).required(), // Description du livre
	series: Joi.string().max(42).required(), // Description du tome
});

export const readBookByIdSchema = Joi.object({
	id: Joi.string().min(34).max(36),
});

export const updateBookShema = Joi.object({
	isbn: Joi.string().max(42), // ISBN du livre
	title: Joi.string().min(1).max(255), // Titre du livre
	author: Joi.string().min(1).max(42), // Auteur du livre
	publication_date: Joi.date(), // Date de publication
	price: Joi.number().positive(), // Prix positif
	gender: Joi.string().max(42), // Genre du livre
	editor: Joi.string().max(42), // Éditeur du livre
	bookimage: Joi.string().max(100), // URL de l'image
	vignetteimage: Joi.string().max(100), // URL de l'image
	age_limit: Joi.number().integer().positive(), // Limite d'âge
	description: Joi.string().max(1000), // Description du livre
	series: Joi.string().max(42), // Description du tome
});

export const deleteBookSchema = Joi.object({
	id: Joi.string(),
});
