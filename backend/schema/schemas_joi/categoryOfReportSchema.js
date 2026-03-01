import e from "express";
import Joi from "joi";


//-----------------------------------------------------------
// GENERAL SORTING SCHEMA
//-----------------------------------------------------------
export const generalCategoryOfReportSchema = Joi.object({
    id_categoryOfReport: Joi.string().min(34).max(36), // UUIDv4
    name: Joi.string().min(1).max(255), // Nom de la catégorie de signalement
    created_at: Joi.date(),// Date de création
    updated_at: Joi.date(),// Date de mise à jour
});

export const generalOrderCategoryOfReportSchema = Joi.object({
    order: Joi.string().valid('created_at', 'name', 'updated_at').default('created_at'),
});

//-----------------------------------------------------------
//QUERIES 
//-----------------------------------------------------------
export const viewAllCategoryOfReportsSchema = Joi.object({
    order: Joi.string().valid('created_at', 'name', 'updated_at').default('created_at'),
});

export const viewCategoryOfReportByID = Joi.object({
    id_categoryOfReport: Joi.string().min(34).max(36).required(), // UUIDv4
});

export const searchCategoryOfReportSchema = Joi.object({
    name: Joi.string().min(1).max(255).required(),// Terme de recherche
});

//-----------------------------------------------------------
//MUTATIONS
//-----------------------------------------------------------
export const createCategoryOfReportSchema = Joi.object({
    name: Joi.string().min(1).max(255).required(),
    created_at: Joi.date().default(() => new Date()),
});

export const updateCategoryOfReportSchema = Joi.object({
    name: Joi.string().min(1).max(255),
    updated_at: Joi.date(),
});

export const deleteCategoryOfReportSchema = Joi.object({
    id_categoryOfReport: Joi.string().min(34).max(36).required(), // UUIDv4
});

/*
-----------------------------------------------------------
TABLE PASSWORD_RESETS
------------------------------------------------------------
  id_report_category VARCHAR(42) PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ


*/