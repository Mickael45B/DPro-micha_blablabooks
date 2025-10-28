import e from "express";
import Joi from "joi";

//-----------------------------------------------------------
//QUERIES 
//-----------------------------------------------------------
export const getBooksInLibrarySchema = Joi.object({
    limit: Joi.number().integer().min(1).max(100).default(50),
    offset: Joi.number().integer().min(0).default(0),
    order: Joi.string().valid('created_at', 'id_book', 'id_library', 'is_read', 'is_favorite', 'updated_at').default('created_at'),
    direction: Joi.string().valid('ASC', 'DESC').default('DESC'),
});

export const getBookInLibrarySchema = Joi.object({
    id: Joi.string().min(34).max(36).required(), // UUIDv4
});

export const searchBooksInLibrarySchema = Joi.object({
    titleOrAuthor: Joi.string().min(1).max(255).required(),// Terme de recherche
    limit: Joi.number().integer().min(1).max(100).default(50),// Nombre maximum de résultats à retourner
    offset: Joi.number().integer().min(0).default(0),
});

//-----------------------------------------------------------
//MUTATIONS
//-----------------------------------------------------------
export const addBookHasLibrarySchema = Joi.object({
    id: Joi.string().min(34).max(36), // UUIDv4
    id_library: Joi.string().min(34).max(36).required(), // UUIDv4
    id_book: Joi.string().min(34).max(36).required(), // UUIDv4
    is_read: Joi.boolean().default(false),
    is_favorite: Joi.boolean().default(false),
    created_at: Joi.date(),// Date de création
    updated_at: Joi.date(),// Date de mise à jour
});

export const updateBookHasLibrarySchema = Joi.object({
    id: Joi.string().min(34).max(36), // UUIDv4
    id_library: Joi.string().min(34).max(36), // UUIDv4
    id_book: Joi.string().min(34).max(36), // UUIDv4
    is_read: Joi.boolean(),
    is_favorite: Joi.boolean(),
    series: Joi.string().max(42), // Description du tome
    updated_at: Joi.date(),// Date de mise à jour
});

export const deleteBookHasLibrarySchema = Joi.object({
    id: Joi.string().min(34).max(36).required(), // UUIDv4
});

export const removeBooksFromLibrarySchema = Joi.object({
    id: Joi.string().min(34).max(36).required(), // UUIDv4
});     

export const addBooksToLibrarySchema = Joi.object({
    id_library: Joi.string().min(34).max(36).required(), // UUIDv4
    bookIds: Joi.array().items(Joi.string().min(34).max(36).required()).min(1).required(), // Liste des UUIDv4 des livres à ajouter
});

/*
-------------------------------------------------------------------------------------------------------------------------
	Table: bookhaslibrary
-------------------------------------------------------------------------------------------------------------------------

  id_bookhaslibrary VARCHAR(42) PRIMARY KEY,
  id_library        VARCHAR(42) REFERENCES libraries(id_library) ON DELETE SET NULL, 
  id_book           VARCHAR(42) REFERENCES books(id_book) ON DELETE SET NULL, 
  is_read           BOOLEAN DEFAULT FALSE,
  is_favorite       BOOLEAN DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ,

*/