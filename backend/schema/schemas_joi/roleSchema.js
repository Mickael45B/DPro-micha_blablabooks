import Joi from "joi";

//-----------------------------------------------------------
//QUERIES 
//-----------------------------------------------------------

export const getRolesSchema = Joi.object({
    limit: Joi.number().integer().min(1).max(100).default(50),
    offset: Joi.number().integer().min(0).default(0),
    order: Joi.string().valid('created_at', 'id_role', 'role_name', 'updated_at').default('created_at'),
    direction: Joi.string().valid('ASC', 'DESC').default('DESC'),
});

export const getRoleSchema = Joi.object({
    id_role: Joi.string().uuid().required(),
});

export const searchRolesSchema = Joi.object({
    role_name: Joi.string().min(2).max(100).required(),
    limit: Joi.number().integer().min(1).max(100).default(50),
    offset: Joi.number().integer().min(0).default(0),
    order: Joi.string().valid('created_at', 'id_role', 'role_name', 'updated_at').default('created_at'),
    direction: Joi.string().valid('ASC', 'DESC').default('DESC'),
});

//-----------------------------------------------------------
//MUTATIONS
//-----------------------------------------------------------

export const addRoleSchema = Joi.object({
    role_name: Joi.string().min(2).max(50).required(),
});

export const updateRoleSchema = Joi.object({
    id_role: Joi.string().uuid().required(),
    role_name: Joi.string().min(2).max(50).required(),
});

export const deleteRoleSchema = Joi.object({
    id_role: Joi.string().uuid().required(),
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
