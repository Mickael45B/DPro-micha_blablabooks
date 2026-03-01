import e from "express";
import Joi from "joi";

//-----------------------------------------------------------
// GENERAL SORTING SCHEMA
//-----------------------------------------------------------

export const generalLibrarySchema = Joi.object({
	id_library: Joi.string().min(34).max(36), // UUIDv4
	name: Joi.string().min(1).max(255), // Nom de la bibliothèque
	is_editable: Joi.boolean().default(false),
	id_user: Joi.string().min(34).max(36), // UUIDv4
  is_default: Joi.boolean().default(false), // Indique si la bibliothèque est la bibliothèque par défaut de l'utilisateur
  color: Joi.string().pattern(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/).default('#FFFFFF'), // Couleur de la bibliothèque au format hexadécimal
  is_public: Joi.boolean().default(false), // Indique si la bibliothèque est publique ou privée
  description: Joi.string().max(500).allow(''), // Description de la bibliothèque, peut être vide
  sort_order: Joi.string().valid('name', 'created_at', 'id_library', 'is_editable', 'id_user').default('created_at'), // Critère de tri des bibliothèques
  created_at: Joi.date().default(() => new Date()), // Date de création de la bibliothèque
  updated_at: Joi.date().default(() => new Date()), // Date de la dernière mise à jour de la bibliothèque
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









