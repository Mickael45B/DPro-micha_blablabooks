import e from "express";
import Joi from "joi";

//-----------------------------------------------------------
// GENERAL REASON OF REPORT SCHEMA
//-----------------------------------------------------------
export const generalReasonOfReportSchema = Joi.object({
    id_report_reason: Joi.string().min(34).max(36), // UUIDv4
    name: Joi.string().min(1).max(255).required(), // Raison du signalement
    created_at: Joi.date(),// Date de création
    updated_at: Joi.date(),// Date de mise à jour
});

export const generalOrderReasonOfReportSchema = Joi.object({
    order: Joi.string().valid('created_at', 'name').default('created_at'),
    direction: Joi.string().valid('ASC', 'DESC').default('DESC'),
});


//-----------------------------------------------------------
//QUERIES 
//-----------------------------------------------------------
export const viewAllReasonsOfReportSchema = Joi.object({
    order: Joi.string().valid('created_at', 'name').default('created_at'),
});

export const viewReasonOfReportByID = Joi.object({
    id_report_reason: Joi.string().min(34).max(36).required(), // UUIDv4
});

export const searchReasonOfReportSchema = Joi.object({
    name: Joi.string().min(1).max(255).required(), // Raison du signalement
     order: Joi.string().valid('created_at', 'name').default('created_at'),
     direction: Joi.string().valid('ASC', 'DESC').default('DESC'),
});
//-----------------------------------------------------------       
//MUTATIONS
//-----------------------------------------------------------
export const createReasonOfReportSchema = Joi.object({
    name: Joi.string().min(1).max(255).required(), // Raison du signalement
    created_at: Joi.date().default(() => new Date()),
});

export const updateReasonOfReportSchema = Joi.object({
    name: Joi.string().min(1).max(255), // Raison du signalement
    updated_at: Joi.date(),
});

export const deleteReasonOfReportSchema = Joi.object({
    id_report_reason: Joi.string().min(34).max(36).required(), // UUIDv4
});



/*
-----------------------------------------------------------
TABLE REASON_OF_REPORT
------------------------------------------------------------

  id_report_reason VARCHAR(42) PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
*/