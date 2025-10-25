import Joi from "joi";

//-----------------------------------------------------------
//QUERIES 
//-----------------------------------------------------------

export const getMessagesSchema = Joi.object({
    limit: Joi.number().integer().min(1).max(100).default(50),
    offset: Joi.number().integer().min(0).default(0),
    order: Joi.string().valid('created_at', 'id_message', 'id_sender', 'id_receiver', 'is_read', 'updated_at').default('created_at'),
    direction: Joi.string().valid('ASC', 'DESC').default('DESC'),
    id_user: Joi.string().min(34).max(36).required(), // UUIDv4
});

export const getMessageSchema = Joi.object({
    id_message: Joi.string().min(34).max(36).required(), // UUIDv4
});

export const getUserMessagesSchema = Joi.object({
    id_user: Joi.string().min(34).max(36).required(), // UUIDv4
    limit: Joi.number().integer().min(1).max(100).default(50),
    offset: Joi.number().integer().min(0).default(0),
});

export const searchMessagesSchema = Joi.object({
    subjectOrContent: Joi.string().min(1).max(255).required(),// Terme de recherche
    id_user: Joi.string().min(34).max(36).required(), // UUIDv4
    limit: Joi.number().integer().min(1).max(100).default(50),// Nombre maximum de résultats à retourner
    offset: Joi.number().integer().min(0).default(0),
});

//-----------------------------------------------------------
//MUTATIONS
//-----------------------------------------------------------

export const addMessageSchema = Joi.object({
    id_message: Joi.string().min(34).max(36), // UUIDv4
    id_sender: Joi.string().min(34).max(36).required(), // UUIDv4
    id_receiver: Joi.string().min(34).max(36).required(), // UUIDv4
    subject: Joi.string().min(1).max(255).required(), // Sujet du message
    content: Joi.string().min(1).required(), // Contenu du message
    is_read: Joi.boolean().default(false),
    created_at: Joi.date(),// Date de création
    updated_at: Joi.date(),// Date de mise à jour
});

export const updateMessageSchema = Joi.object({
    id_message: Joi.string().min(34).max(36).required(), // UUIDv4
    subject: Joi.string().min(1).max(255), // Sujet du message
    content: Joi.string().min(1), // Contenu du message
    is_read: Joi.boolean(),
    created_at: Joi.date(),
    updated_at: Joi.date(),
});

export const markMessageAsReadSchema = Joi.object({
    id_message: Joi.string().min(34).max(36).required(), // UUIDv4
});

export const deleteMessageSchema = Joi.object({
    id_message: Joi.string().min(34).max(36).required(), // UUIDv4
});

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
