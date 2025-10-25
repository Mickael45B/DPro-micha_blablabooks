import Joi from "joi";

//-----------------------------------------------------------
//QUERIES 
//-----------------------------------------------------------
export const getLibrariesSchema = Joi.object({
	limit: Joi.number().integer().min(1).max(100).default(50),	
	offset: Joi.number().integer().min(0).default(0),
	order: Joi.string().valid( 'id_library', 'name', 'id_user', 'created_at', 'updated_at').default('created_at'),
	direction: Joi.string().valid('ASC', 'DESC').default('DESC'),
});

export const getUserLibrariesSchema = Joi.object({
	id_user: Joi.string().min(14).max(36).required(), // ID must be a string of 14 to 36 characters
});

export const getLibrarySchema = Joi.object({
	id_library: Joi.string().min(14).max(36).required(), // ID must be a string of 14 to 36 characters
});

export const searchLibrariesSchema = Joi.object({
	name: Joi.string().min(2).max(100).required(), // Search query must be a string of 2 to 100 characters
	limit: Joi.number().integer().min(1).max(100).default(50),
	offset: Joi.number().integer().min(0).default(0),
	order: Joi.string().valid( 'id_library', 'name', 'id_user', 'created_at', 'updated_at').default('created_at'),
	direction: Joi.string().valid('ASC', 'DESC').default('DESC'),
});

//-----------------------------------------------------------
//MUTATIONS
//-----------------------------------------------------------
export const addLibrarySchema = Joi.object({
	name: Joi.string().min(1).max(255).required(), // Name must be a string of 1 to 255 characters
	is_editable: Joi.boolean().default(true),
	id_user: Joi.string().min(14).max(36).required(), // ID must be a string of 14 to 36 characters
	created_at: Joi.date(),// Creation date
	updated_at: Joi.date(),// Update date
});

export const updateLibrarySchema = Joi.object({
	id: Joi.string().min(14).max(36).required(), // ID must be a string of 14 to 36 characters
	name: Joi.string().min(1).max(255), // Name must be a string of 1 to 255 characters
	is_editable: Joi.boolean(),
	updated_at: Joi.date(),// Update date
});

export const deleteAllLibrariesFromUserSchema = Joi.object({
	id_user: Joi.string().min(14).max(36).required(), // ID must be a string of 14 to 36 characters
});

export const deleteLibrarySchema = Joi.object({
	id_library: Joi.string().min(14).max(36).required(), // ID must be a string of 14 to 36 characters
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









