import e from "express";
import Joi from "joi";


//-----------------------------------------------------------
// GENERAL SORTING SCHEMA
//-----------------------------------------------------------
export const generalTagsOnBookhasLibrarySchema = Joi.object({
    id_tagsOnBookhasLibrary: Joi.string().min(34).max(36), // UUIDv4
    id_book: Joi.string().min(34).max(36), // UUIDv4
    id_library: Joi.string().min(34).max(36), // UUIDv4
    created_at: Joi.date(),// Date de création
    updated_at: Joi.date(),// Date de mise à jour
});

export const generalOrderTagsOnBookhasLibrarySchema = Joi.object({
    order: Joi.string().valid('created_at', 'id_book', 'id_library', 'updated_at').default('created_at'),
});

//-----------------------------------------------------------
//QUERIES 
//-----------------------------------------------------------
export const viewAllTagsOnBookhasLibrarySchema = Joi.object({
    order: Joi.string().valid('created_at', 'id_book', 'id_library', 'updated_at').default('created_at'),
});

export const viewTagsOnBookhasLibraryByID = Joi.object({
    id_tagsOnBookhasLibrary: Joi.string().min(34).max(36).required(), // UUIDv4
});

//-----------------------------------------------------------
//MUTATIONS
//-----------------------------------------------------------
export const createTagsOnBookhasLibrarySchema = Joi.object({
    id_book: Joi.string().min(34).max(36).required(), // UUIDv4
    id_library: Joi.string().min(34).max(36).required(), // UUIDv4
    created_at: Joi.date().default(() => new Date()),
});

export const updateTagsOnBookhasLibrarySchema = Joi.object({
    id_book: Joi.string().min(34).max(36).required(), // UUIDv4
    id_library: Joi.string().min(34).max(36).required(), // UUIDv4
    updated_at: Joi.date().default(() => new Date()),
});

export const deleteTagsOnBookhasLibrarySchema = Joi.object({
    id_tagsOnBookhasLibrary: Joi.string().min(34).max(36).required(), // UUIDv4
});


/*
//-----------------------------------------------------------
// TABLE TAGS
//-----------------------------------------------------------

  id_tag VARCHAR(42) PRIMARY KEY,
  id_bookhaslibrary VARCHAR(42) REFERENCES bookhaslibrary(id_bookhaslibrary) ON DELETE CASCADE,
  tag_name VARCHAR(50) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ

*/