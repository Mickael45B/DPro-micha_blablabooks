import e from "express";
import Joi from "joi";

//-----------------------------------------------------------
// GENERAL SORTING SCHEMA
//-----------------------------------------------------------
export const generalGenresSchema = Joi.object({
    id_genre: Joi.string().min(34).max(36), // UUIDv4
    name: Joi.string().min(1).max(255), // Nom du genre
    created_at: Joi.date(),// Date de création
    updated_at: Joi.date(),// Date de mise à jour
});

export const generalOrderGenresSchema = Joi.object({
    order: Joi.string().valid('created_at', 'name', 'updated_at').default('created_at'),
});

//-----------------------------------------------------------
//QUERIES 
//-----------------------------------------------------------
export const viewAllGenresSchema = Joi.object({
    order: Joi.string().valid('created_at', 'name', 'updated_at').default('created_at'),
});

export const viewGenreByID = Joi.object({
    id_genre: Joi.string().min(34).max(36).required(), // UUIDv4
});

export const viewGenreByName = Joi.object({
name: Joi.string().min(1).max(255).required(), // Nom du genre
});

export const searchGenresSchema = Joi.object({
    name: Joi.string().min(1).max(255).required(),// Terme de recherche
});

//-----------------------------------------------------------
//MUTATIONS
//-----------------------------------------------------------
export const createGenreSchema = Joi.object({
    name: Joi.string().min(1).max(255).required(),
    created_at: Joi.date().default(() => new Date()),
});

export const updateGenreSchema = Joi.object({
    name: Joi.string().min(1).max(255),
    updated_at: Joi.date(),
});

export const deleteGenreSchema = Joi.object({
    id_genre: Joi.string().min(34).max(36).required(), // UUIDv4
});














/*
-----------------------------------------------------------
TABLE GENRES
------------------------------------------------------------

*/