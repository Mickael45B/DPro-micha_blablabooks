import Joi from "joi";

//-----------------------------------------------------------
//QUERIES 
//-----------------------------------------------------------

export const getPermissionsRolesSchema = Joi.object({
    limit: Joi.number().integer().min(1).max(100).default(50),
    offset: Joi.number().integer().min(0).default(0),
    order: Joi.string().valid('created_at', 'id_role', 'id_permission', 'updated_at').default('created_at'),
    direction: Joi.string().valid('ASC', 'DESC').default('DESC'),
});

export const getPermissionRoleSchema = Joi.object({
    id_rolehaspermission: Joi.string().uuid().required(),
});

export const searchPermissionsRolesSchema = Joi.object({
    id_permission: Joi.string().uuid().required(),
    limit: Joi.number().integer().min(1).max(100).default(50),
    offset: Joi.number().integer().min(0).default(0),
    order: Joi.string().valid('created_at', 'id_role', 'id_permission', 'updated_at').default('created_at'),
    direction: Joi.string().valid('ASC', 'DESC').default('DESC'),
});

//-----------------------------------------------------------
//MUTATIONS
//-----------------------------------------------------------
export const addPermissionRoleSchema = Joi.object({
    id_role: Joi.string().uuid().required(),
    id_permission: Joi.string().uuid().required(),
});

export const updatePermissionRoleSchema = Joi.object({
    id_rolehaspermission: Joi.string().uuid().required(),
    id_role: Joi.string().uuid().required(),
    id_permission: Joi.string().uuid().required(),
});

export const deletePermissionRoleSchema = Joi.object({
    id_rolehaspermission: Joi.string().uuid().required(),
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
