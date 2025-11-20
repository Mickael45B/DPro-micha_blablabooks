import e from "express";
import Joi from "joi";

//-----------------------------------------------------------
// GENERAL SORTING SCHEMA
//-----------------------------------------------------------

export const generalMessagesSchema = Joi.object({
    id_message: Joi.string().min(34).max(36), // UUIDv4
    id_sender: Joi.string().min(34).max(36), // UUIDv4
    id_receiver: Joi.string().min(34).max(36), // UUIDv4
    subject: Joi.string().min(1).max(255), // Sujet du message
    content: Joi.string().min(1), // Contenu du message
    is_read: Joi.boolean().default(false),
    created_at: Joi.date(),// Date de création
    updated_at: Joi.date(),// Date de mise à jour
});

export const generalOrderMessagesSchema = Joi.object({
    order: Joi.string().valid('created_at', 'id_message', 'id_sender', 'id_receiver', 'is_read', 'updated_at').default('created_at'),
});


//-----------------------------------------------------------
//QUERIES 
//-----------------------------------------------------------

export const searchMessagesSchema = Joi.object({
    subjectOrContent: Joi.string().min(1).max(255).required(),// Terme de recherche
});

//-----------------------------------------------------------
//MUTATIONS
//-----------------------------------------------------------

/*
-----------------------------------------------------------
TABLE MESSAGES
-----------------------------------------------------------
 
  id_message    VARCHAR(42) PRIMARY KEY,
  id_sender     VARCHAR(42) REFERENCES users(id_user) ON DELETE SET NULL,
  id_receiver   VARCHAR(42) REFERENCES users(id_user) ON DELETE SET NULL,
  subject       VARCHAR(255) NOT NULL CHECK (length(btrim(subject)) > 0),
  content       TEXT NOT NULL CHECK (length(btrim(content)) > 0),
  is_read       BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ

*/
