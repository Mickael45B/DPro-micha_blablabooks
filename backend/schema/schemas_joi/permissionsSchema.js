import e from "express";
import Joi from "joi";

//-----------------------------------------------------------
// GENERAL SORTING SCHEMA
//-----------------------------------------------------------

export const generalPermissionSchema = Joi.object({
    id_permission: Joi.string().min(34).max(36), // UUIDv4
    permission_name: Joi.string().min(1).max(50), // Name must be a string of 1 to 50 characters
    created_at: Joi.date(),// Date de création
    updated_at: Joi.date(),// Date de mise à jour
});

export const generalOrderPermissionSchema = Joi.object({
    order: Joi.string().valid('id_permission', 'permission_name', 'created_at', 'updated_at').default('created_at'),
});

//-----------------------------------------------------------
//QUERIES 
//-----------------------------------------------------------
export const getPermissionsSchema = Joi.object({
});

export const getPermissionSchema = Joi.object({
});

export const searchPermissionsSchema = Joi.object({
    query: Joi.string().min(1).max(100).required(),// Terme de recherche
});

//-----------------------------------------------------------
//MUTATIONS
//-----------------------------------------------------------
export const addPermissionSchema = Joi.object({
}); 

export const updatePermissionSchema = Joi.object({
});

export const deletePermissionSchema = Joi.object({
});

/*
-----------------------------------------------------------
TABLE MESSAGES
-----------------------------------------------------------

  id_permission     VARCHAR(42) PRIMARY KEY,
  permission_name   VARCHAR(50) NOT NULL UNIQUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ

*/
