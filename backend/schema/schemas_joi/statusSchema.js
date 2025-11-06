import e from "express";
import Joi from "joi";

//-----------------------------------------------------------
// GENERAL SORTING SCHEMA
//-----------------------------------------------------------

export const generalStatusSchema = Joi.object({
    id_status: Joi.number().integer(), // ID du status
    status_name: Joi.string().min(2).max(255), // Nom du status
    created_at: Joi.date(),// Date de création
    updated_at: Joi.date(),// Date de mise à jour
});
export const generalOrderStatusSchema = Joi.object({
    order: Joi.string().valid('created_at', 'id_status', 'status_name', 'updated_at').default('created_at'),
});

//-----------------------------------------------------------
//QUERIES 
//-----------------------------------------------------------
export const getStatusesSchema = Joi.object({
});

export const getStatusSchema = Joi.object({
});

export const searchStatusesSchema = Joi.object({
    query: Joi.string().min(2).max(255).required(),
});

//-----------------------------------------------------------
//MUTATIONS
//-----------------------------------------------------------
export const createStatusSchema = Joi.object({
});

export const updateStatusSchema = Joi.object({
});

export const deleteStatusSchema = Joi.object({
});

/*
-----------------------------------------------------------
TABLE STATUS
-----------------------------------------------------------

  id_status       VARCHAR(42) PRIMARY KEY,
  status_name     VARCHAR(255) NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ


*/

