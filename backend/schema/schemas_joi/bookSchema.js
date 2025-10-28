import e from "express";
import Joi from "joi";


//-----------------------------------------------------------
//QUERIES 
//-----------------------------------------------------------
export const getBooksSchema = Joi.object({
	limit: Joi.number().integer().min(1).max(100).default(50),
	offset: Joi.number().integer().min(0).default(0),
	order: Joi.string().valid('created_at', 'title', 'author', 'publication_date', 'price').default('created_at'),
	direction: Joi.string().valid('ASC', 'DESC').default('DESC'),
});

export const getBookSchema = Joi.object({
	id: Joi.string().min(34).max(36).required(), // UUIDv4
});

export const searchBooksSchema = Joi.object({
	query: Joi.string().min(1).max(255).required(),// Terme de recherche
	limit: Joi.number().integer().min(1).max(100).default(50),// Nombre maximum de résultats à retourner
	offset: Joi.number().integer().min(0).default(0),// Nombre de résultats à sauter (pour la pagination)
	order: Joi.string().valid('created_at', 'title', 'author', 'publication_date', 'price').default('created_at'),// Champ pour trier les résultats
	direction: Joi.string().valid('ASC', 'DESC').default('DESC'),// Direction du tri (ascendant ou descendant)
});

//-----------------------------------------------------------
//MUTATIONS
//-----------------------------------------------------------
export const createBookSchema = Joi.object({
	id: Joi.string().min(34).max(36), // UUIDv4
	isbn: Joi.string().max(42), // ISBN du livre
	title: Joi.string().min(1).max(255).required(), // Titre du livre
	author: Joi.string().min(1).max(255), // Auteur du livre
	publication_date: Joi.date(), // Date de publication
	genre: Joi.string().max(100), // Genre du livre
	editor: Joi.string().max(255), // Éditeur du livre
	bookimage: Joi.string().max(100), // URL de l'image
	vignetteimage: Joi.string().max(100), // URL de l'image
	age_limit: Joi.number().integer().positive(), // Limite d'âge
	description: Joi.string().max(1000), // Description du livre
	series: Joi.string().max(42), // Description du tome
	created_at: Joi.date(),// Date de création
	updated_at: Joi.date(),// Date de mise à jour
});

export const updateBookSchema = Joi.object({
	id: Joi.string().min(34).max(36).required(), // UUIDv4
	isbn: Joi.string().max(42), // ISBN du livre
	title: Joi.string().min(1).max(255), // Titre du livre
	author: Joi.string().min(1).max(255), // Auteur du livre
	publication_date: Joi.date(), // Date de publication
	genre: Joi.string().max(100), // Genre du livre
	editor: Joi.string().max(255), // Éditeur du livre
	bookimage: Joi.string().max(100), // URL de l'image
	vignetteimage: Joi.string().max(100), // URL de l'image
	age_limit: Joi.number().integer().positive(), // Limite d'âge
	description: Joi.string().max(1000), // Description du livre
	series: Joi.string().max(42), // Description du tome
	updated_at: Joi.date(),// Date de mise à jour
});

export const deleteBookSchema = Joi.object({
	id: Joi.string().min(34).max(36).required(), // UUIDv4
});



/*
-------------------------------------------------------------------------------------------------------------------------
	Table: books
-------------------------------------------------------------------------------------------------------------------------

  id_book            VARCHAR(42) PRIMARY KEY,
  title              VARCHAR(255) NOT NULL CHECK (length(btrim(title)) > 0),
  isbn               VARCHAR(42),
  publication_date   TIMESTAMPTZ CHECK (publication_date IS NULL OR publication_date <= CURRENT_DATE), -- date format européen (jj/mm/aaaa)
  author             VARCHAR(255),
  editor             VARCHAR(255),
  genre              VARCHAR(100), 
  vignetteimage      VARCHAR(255),
  bookimage          VARCHAR(255),
  age_limit          INTEGER CHECK (age_limit IS NULL OR age_limit >= 0),
  description        TEXT,
  series             VARCHAR(255),
  is_in_favorite     INTEGER DEFAULT 0 CHECK (is_in_favorite >= 0),
  nb_reviews         INTEGER DEFAULT 0 CHECK (nb_reviews >= 0),
  is_in_library      INTEGER DEFAULT 0 CHECK (is_in_library >= 0),
  avg_rating         NUMERIC(3,2) CHECK (avg_rating IS NULL OR (avg_rating >= 1.0 AND avg_rating <= 5.0)), 
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ

*/