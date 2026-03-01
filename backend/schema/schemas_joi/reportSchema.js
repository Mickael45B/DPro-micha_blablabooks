import e from "express";
import Joi from "joi";

//-----------------------------------------------------------
// GENERAL SORTING SCHEMA
//-----------------------------------------------------------

export const generalReportSchema = Joi.object({
    id_report: Joi.string().min(34).max(36), // UUIDv4
    id_user: Joi.string().min(34).max(36), // UUIDv4
    report_type: Joi.string().valid('user', 'review', 'message', 'other'),
    reported_id: Joi.string().min(34).max(36), // UUIDv4
    reason: Joi.string().min(3).max(255),
    details: Joi.string().max(1000),
    status: Joi.string().valid('PENDING', 'IN_REVIEW', 'RESOLVED', 'DISMISSED'),
    created_at: Joi.date(),// Date de création
    updated_at: Joi.date(),// Date de mise à jour
});
export const generalOrderReportSchema = Joi.object({
    order: Joi.string().valid('id_report', 'id_user', 'report_type', 'reported_id', 'reason', 'status', 'created_at', 'updated_at').default('created_at'),
});

//-----------------------------------------------------------
//QUERIES 
//-----------------------------------------------------------
export const getReportsSchema = Joi.object({
});

export const getReportSchema = Joi.object({
});

export const searchReportsByUserSchema = Joi.object({
    id_user: Joi.string().min(34).max(36).required(), // UUIDv4
});

export const searchReportsByStatusSchema = Joi.object({
    status: Joi.string().valid('PENDING', 'IN_REVIEW', 'RESOLVED', 'DISMISSED').required(),
});

export const searchReportsByDetailsOrReasonSchema = Joi.object({
    content: Joi.string().min(3).max(255).required(),
});

export const searchReportsSchema = Joi.object({
    id_report: Joi.string().min(34).max(36).optional(), // UUIDv4
    id_user: Joi.string().min(34).max(36).optional(), // UUIDv4
    status: Joi.string().valid('PENDING', 'IN_REVIEW', 'RESOLVED', 'DISMISSED').optional(),
    content: Joi.string().min(3).max(255).optional(),
});

//-----------------------------------------------------------
//MUTATIONS
//-----------------------------------------------------------
export const addReportSchema = Joi.object({
});

export const updateReportSchema = Joi.object({
});

export const deleteReportSchema = Joi.object({
});



/*
-----------------------------------------------------------
TABLE MESSAGES
-----------------------------------------------------------

  id_report     VARCHAR(42) PRIMARY KEY,
  id_user       VARCHAR(42) REFERENCES users(id_user) ON DELETE SET NULL,-- Le champ id_user référence l'utilisateur qui a fait le signalement
  report_type   VARCHAR(50) NOT NULL CHECK (report_type IN ('user', 'review', 'message', 'other')),-- Le champ report_type indique le type d'entité signalée
  reported_id   VARCHAR(42), -- Le champ reported_id contient l'ID de l'entité signalée. ID de l'entité signalée (user, review, message, etc.)
  reason        VARCHAR(255) NOT NULL CHECK (length(btrim(reason)) > 0),-- Le champ reason contient la raison du signalement
  details       TEXT,-- Le champ details peut contenir des informations supplémentaires
  status        VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'in_review', 'resolved', 'dismissed')) DEFAULT 'pending',-- Le champ status indique l'état du signalement (en attente, en cours de traitement, résolu, rejeté)
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ

*/
