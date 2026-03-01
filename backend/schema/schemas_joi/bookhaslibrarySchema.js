import e from "express";
import Joi from "joi";

//-----------------------------------------------------------
// GENERAL SORTING SCHEMA
//-----------------------------------------------------------

export const generalBookHasLibrarySchema = Joi.object({
    id_bookhaslibrary: Joi.string().uuid().optional(),
    id_library: Joi.string().uuid(),
    id_book: Joi.string().min(1).max(42),
    is_read: Joi.boolean().default(false),
    is_favorite: Joi.boolean().default(false),
    progress_percentage: Joi.number().min(0).max(100).default(0),
    personal_note: Joi.string().max(1000).allow(null, ''),
    tags: Joi.array().items(Joi.string().max(50)).default([]),
    started_at: Joi.date().iso().allow(null),
    finished_at: Joi.date().iso().allow(null),
    lent_to: Joi.string().max(255).allow(null, ''),
    lent_at: Joi.date().iso().allow(null),
    created_at: Joi.date().iso().default(() => new Date()),
    updated_at: Joi.date().iso().default(() => new Date()),

});
export const generalOrderBookHasLibrarySchema = Joi.object({
    order: Joi.string().valid('created_at', 'id_book', 'id_library', 'is_read', 'is_favorite', 'updated_at').default('created_at'),
});

//-----------------------------------------------------------
//QUERIES 
//-----------------------------------------------------------
export const getBooksInLibrarySchema = Joi.object({
});

export const getBookInLibrarySchema = Joi.object({
});

export const searchBooksInLibrary = Joi.object({
    titleOrAuthor: Joi.string().min(2).max(255).required(),// Terme de recherche
});

//-----------------------------------------------------------
//MUTATIONS
//-----------------------------------------------------------
export const addBookHasLibrarySchema = Joi.object({
});

export const updateBookHasLibrarySchema = Joi.object({
});

export const deleteBookHasLibrarySchema = Joi.object({
        id_bookhaslibrary: Joi.string().min(1).max(42),
        id_book: Joi.string().min(1).max(42),
        id_library: Joi.string().min(1).max(42),
})
    // .or('id_bookhaslibrary', 'id_book')
    // .with('id_book', 'id_library');

export const addBooksToLibrarySchema = Joi.object({
});

export const removeBooksFromLibrarySchema = Joi.object({
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