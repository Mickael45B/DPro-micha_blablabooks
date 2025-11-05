import e from "express";
import Joi from "joi";

//-----------------------------------------------------------
// GENERAL SORTING SCHEMA
//-----------------------------------------------------------

export const generalLibrarySchema = Joi.object({
	id_library: Joi.string().min(34).max(36).required(), // UUIDv4
	name: Joi.string().min(1).max(255).required(), // Nom de la bibliothèque
	is_editable: Joi.boolean().default(false),
	id_user: Joi.string().min(34).max(36).required(), // UUIDv4
});
export const generalOrderLibrarySchema = Joi.object({
	order: Joi.string().valid('name', 'created_at', 'id_library', 'is_editable', 'id_user').default('created_at'),
});

//-----------------------------------------------------------
//QUERIES 
//-----------------------------------------------------------
export const getLibrariesSchema = Joi.object({
});

export const getUserLibrariesSchema = Joi.object({
});

export const getLibrarySchema = Joi.object({
});

export const searchLibrariesSchema = Joi.object({
	query: Joi.string().min(2).max(100).required(), // Search query must be a string of 2 to 100 characters
});

//-----------------------------------------------------------
//MUTATIONS
//-----------------------------------------------------------
export const addLibrarySchema = Joi.object({
});

export const updateLibrarySchema = Joi.object({
});

export const deleteAllLibrariesFromUserSchema = Joi.object({
});

export const deleteLibrarySchema = Joi.object({
});


/*
-----------------------------------------------------------
TABLE LIBRARIES
-----------------------------------------------------------
  id_library   VARCHAR(42) PRIMARY KEY,
  name         VARCHAR(255) NOT NULL CHECK (length(btrim(name)) > 0),
  is_editable  BOOLEAN DEFAULT FALSE,
  id_user      VARCHAR(42) REFERENCES users(id_user) ON DELETE SET NULL, 
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ
*/









