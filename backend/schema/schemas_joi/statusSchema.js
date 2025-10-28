import Joi from "joi";

//-----------------------------------------------------------
//QUERIES 
//-----------------------------------------------------------
export const getStatusesSchema = Joi.object({
    limit: Joi.number().integer().min(1).max(100).default(50),
    offset: Joi.number().integer().min(0).default(0),
    order: Joi.string().valid('created_at', 'id_status', 'status_name', 'updated_at').default('created_at'),
    direction: Joi.string().valid('ASC', 'DESC').default('DESC'),
});

export const getStatusSchema = Joi.object({
    id_status: Joi.number().integer().required(),
});

export const searchStatusesSchema = Joi.object({
    status_name: Joi.string().min(2).max(255).required(),
    limit: Joi.number().integer().min(1).max(100).default(50),
    offset: Joi.number().integer().min(0).default(0),
    order: Joi.string().valid('created_at', 'id_status', 'status_name', 'updated_at').default('created_at'),
    direction: Joi.string().valid('ASC', 'DESC').default('DESC'),
});

//-----------------------------------------------------------
//MUTATIONS
//-----------------------------------------------------------
export const createStatusSchema = Joi.object({
    status_name: Joi.string().min(2).max(255).required(),
});

export const updateStatusSchema = Joi.object({
    id_status: Joi.number().integer().required(),
    status_name: Joi.string().min(2).max(255).required(),
});

export const deleteStatusSchema = Joi.object({
    id_status: Joi.number().integer().required(),
});

/*
-----------------------------------------------------------
TABLE STATUS
-----------------------------------------------------------

  id_status       VARCHAR(42) PRIMARY KEY,
  status_name     VARCHAR(255) NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ


*/

