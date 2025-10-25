import Joi from "joi";

//-----------------------------------------------------------
//QUERIES 
//-----------------------------------------------------------
export const getPermissionsSchema = Joi.object({
    limit: Joi.number().integer().min(1).max(100).default(50),
    offset: Joi.number().integer().min(0).default(0),
    order: Joi.string().valid('id_permission', 'permission_name', 'created_at', 'updated_at').default('created_at'),
    direction: Joi.string().valid('ASC', 'DESC').default('DESC'),
});

export const getPermissionSchema = Joi.object({
    id_permission: Joi.string().min(34).max(36).required(), // UUIDv4
});

export const searchPermissionsSchema = Joi.object({
    name: Joi.string().min(1).max(100).required(),// Terme de recherche
    limit: Joi.number().integer().min(1).max(100).default(50),// Nombre maximum de résultats à retourner
    offset: Joi.number().integer().min(0).default(0),
});

//-----------------------------------------------------------
//MUTATIONS
//-----------------------------------------------------------
export const addPermissionSchema = Joi.object({
    permission_name: Joi.string().min(1).max(50).required(), // Name must be a string of 1 to 50 characters
}); 

export const updatePermissionSchema = Joi.object({
    id_permission: Joi.string().min(34).max(36).required(), // UUIDv4
    permission_name: Joi.string().min(1).max(50).required(), // Name must be a string of 1 to 50 characters
});

export const deletePermissionSchema = Joi.object({
    id_permission: Joi.string().min(34).max(36).required(), // UUIDv4
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
