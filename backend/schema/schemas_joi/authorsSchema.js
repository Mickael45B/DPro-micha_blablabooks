import e from "express";
import Joi from "joi";


//-----------------------------------------------------------
// GENERAL SORTING SCHEMA
//-----------------------------------------------------------   
export const generalAuthorsSchema = Joi.object({
    id_author: Joi.string().min(34).max(36), // UUIDv4
    name: Joi.string().min(1).max(255), // Nom de l'auteur
    created_at: Joi.date(),// Date de création
    updated_at: Joi.date(),// Date de mise à jour
});

export const generalOrderAuthorsSchema = Joi.object({
    order: Joi.string().valid('created_at', 'name', 'updated_at').default('created_at'),    
});

//-----------------------------------------------------------
//QUERIES 
//-----------------------------------------------------------
export const viewAllAuthorsSchema = Joi.object({
    order: Joi.string().valid('created_at', 'name', 'updated_at').default('created_at'),    
});

export const viewAuthorByID = Joi.object({
    id_author: Joi.string().min(34).max(36).required(), // UUIDv4
});

export const viewAuthorByName = Joi.object({
    name: Joi.string().min(1).max(255).required(), // Nom de l'auteur
});

export const searchAuthorsSchema = Joi.object({
    name: Joi.string().min(1).max(255).required(),// Terme de recherche
});

//-----------------------------------------------------------
//MUTATIONS
//-----------------------------------------------------------   
export const createAuthorSchema = Joi.object({
    name: Joi.string().min(1).max(255).required(), // Nom de l'auteur
    created_at: Joi.date().default(() => new Date())
});

export const updateAuthorSchema = Joi.object({  
    name: Joi.string().min(1).max(255), // Nom de l'auteur
    updated_at: Joi.date(),
});

export const deleteAuthorSchema = Joi.object({
    id_author: Joi.string().min(34).max(36).required(), // UUIDv4
});

/*
-----------------------------------------------------------
TABLE AUTHORS
------------------------------------------------------------

  id_author VARCHAR(42) PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ

*/