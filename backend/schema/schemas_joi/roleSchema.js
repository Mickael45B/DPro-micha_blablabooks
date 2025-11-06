import e from "express";
import Joi from "joi";

//-----------------------------------------------------------
// GENERAL SORTING SCHEMA
//-----------------------------------------------------------

export const generalRoleSchema = Joi.object({
    id_role: Joi.string().uuid(), // UUIDv4
    role_name: Joi.string().min(2).max(50), // Nom du rôle
    created_at: Joi.date(),// Date de création
    updated_at: Joi.date(),// Date de mise à jour
});
export const generalOrderRoleSchema = Joi.object({
    order: Joi.string().valid('created_at', 'id_role', 'role_name', 'updated_at').default('created_at'),
});

//-----------------------------------------------------------
//QUERIES 
//-----------------------------------------------------------

export const getRolesSchema = Joi.object({
});

export const getRoleSchema = Joi.object({
});

export const searchRolesSchema = Joi.object({
    query: Joi.string().min(2).max(100).required(),
});

//-----------------------------------------------------------
//MUTATIONS
//-----------------------------------------------------------

export const addRoleSchema = Joi.object({
});

export const updateRoleSchema = Joi.object({
});

export const deleteRoleSchema = Joi.object({
});

/*
-----------------------------------------------------------
TABLE REVIEWS
-----------------------------------------------------------

  id_role       VARCHAR(42) PRIMARY KEY,
  role_name     VARCHAR(50) NOT NULL UNIQUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ

*/
