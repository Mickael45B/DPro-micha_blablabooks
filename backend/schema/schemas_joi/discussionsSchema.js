import e from "express";
import Joi from "joi";

//-----------------------------------------------------------
// GENERAL SORTING SCHEMA
//-----------------------------------------------------------
export const generalDiscussionsSchema = Joi.object({
    id_conversation: Joi.string().max(255), // UUIDv4
    subject: Joi.string().min(1).max(255), // Sujet de la discussion
    created_at: Joi.date(),// Date de création
    updated_at: Joi.date(),// Date de mise à jour
    last_message_at: Joi.date(),// Date du dernier message
    is_archived: Joi.boolean().default(false), // Indique si la discussion est archivée
    created_by: Joi.string().max(255), // UUIDv4 de l'utilisateur qui a initié la discussion
});

export const generalOrderDiscussionsSchema = Joi.object({
    order: Joi.string().valid('created_at', 'id_conversation', 'subject', 'updated_at', 'last_message_at').default('created_at'),
}); 





const VALID_ORDER_COLUMNS = ['created_at', 'id_conversation', 'subject', 'updated_at', 'last_message_at'];

//-----------------------------------------------------------
//QUERIES 
//-----------------------------------------------------------
export const searchDiscussionsSchema = Joi.object({
    subject: Joi.string().min(1).max(255).required(),// Terme de recherche
});

//-----------------------------------------------------------
//MUTATIONS
//-----------------------------------------------------------

export const createDiscussionSchema = Joi.object({
  subject:          Joi.string().min(1).max(255).required(),
  recipient_pseudo: Joi.string().min(1).max(255).required(),
  content:          Joi.string().min(1).required(),           
});

export const updateDiscussionSchema = Joi.object({
  id_conversation: Joi.string().max(255).required(),
  subject:         Joi.string().min(1).max(255),
  is_archived:     Joi.boolean(),
});

export const deleteDiscussionSchema = Joi.object({
  id_conversation: Joi.string().max(255).required(),
});

/*
-----------------------------------------------------------
TABLE DISCUSSIONS
-----------------------------------------------------------
    id_conversation VARCHAR(42) PRIMARY KEY,
    subject VARCHAR(255) NOT NULL CHECK (length(btrim(subject)) > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    last_message_at TIMESTAMPTZ,
    is_archived BOOLEAN DEFAULT FALSE
*/