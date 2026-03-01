import e from "express";
import Joi from "joi";

//-----------------------------------------------------------
// GENERAL SORTING SCHEMA
//-----------------------------------------------------------
export const generalEditorsSchema = Joi.object({
    id_editor: Joi.string().min(34).max(36), // UUIDv4
    name: Joi.string().min(1).max(255), // Nom de l'éditeur
    created_at: Joi.date(),// Date de création
    updated_at: Joi.date(),// Date de mise à jour
});

export const generalOrderEditorsSchema = Joi.object({
    order: Joi.string().valid('created_at', 'name', 'updated_at').default('created_at'),
});

//-----------------------------------------------------------
//QUERIES 
//-----------------------------------------------------------
export const viewAllEditorsSchema = Joi.object({
    order: Joi.string().valid('created_at', 'name', 'updated_at').default('created_at'),
});

export const viewEditorByID = Joi.object({
    id_editor: Joi.string().min(34).max(36).required(), // UUIDv4
});

export const viewEditorByName = Joi.object({
    name: Joi.string().min(1).max(255).required(), // Nom de l'éditeur
});

export const searchEditorsSchema = Joi.object({
    name: Joi.string().min(1).max(255).required(),// Terme de recherche
});

//-----------------------------------------------------------
//MUTATIONS
//-----------------------------------------------------------
export const createEditorSchema = Joi.object({
    name: Joi.string().min(1).max(255).required(),
    created_at: Joi.date().default(() => new Date()),
});

export const updateEditorSchema = Joi.object({
    name: Joi.string().min(1).max(255),
    updated_at: Joi.date(),
});

export const deleteEditorSchema = Joi.object({
    id_editor: Joi.string().min(34).max(36).required(), // UUIDv4
});



/*
-----------------------------------------------------------
TABLE EDITORS
------------------------------------------------------------

  id_editor VARCHAR(42) PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ

  */