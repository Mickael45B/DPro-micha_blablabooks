import e from "express";
import Joi from "joi";

//-----------------------------------------------------------
// GENERAL SORTING SCHEMA
//-----------------------------------------------------------

export const generalRolesHasPermissionsSchema = Joi.object({
    id_rolehaspermission: Joi.string().min(34).max(36), // UUIDv4
    id_role: Joi.string().min(34).max(36), // UUIDv4
    id_permission: Joi.string().min(34).max(36), // UUIDv4
    created_at: Joi.date(),// Date de création
    updated_at: Joi.date(),// Date de mise à jour
});
export const generalOrderRolesHasPermissionsSchema = Joi.object({
    order: Joi.string().valid('created_at', 'id_role', 'id_permission', 'updated_at').default('created_at'),
});

//-----------------------------------------------------------
//QUERIES 
//-----------------------------------------------------------

export const getPermissionsRolesSchema = Joi.object({
});

export const getPermissionRoleSchema = Joi.object({
});

export const searchPermissionsRolesSchema = Joi.object({
    query: Joi.string().uuid().required(),
});

//-----------------------------------------------------------
//MUTATIONS
//-----------------------------------------------------------
export const addPermissionRoleSchema = Joi.object({
});

export const updatePermissionRoleSchema = Joi.object({
});

export const deletePermissionRoleSchema = Joi.object({
});

/*
-----------------------------------------------------------
TABLE ROLESHASPERMISSION
-----------------------------------------------------------

  id_rolehaspermission VARCHAR(42) PRIMARY KEY,
  id_role              VARCHAR(42) NOT NULL REFERENCES roles(id_role) ON DELETE CASCADE,
  id_permission        VARCHAR(42) NOT NULL REFERENCES permissions(id_permission) ON DELETE CASCADE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ,

*/
