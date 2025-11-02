import e from "express";
import Joi from "joi";

//-----------------------------------------------------------
//QUERIES 
//-----------------------------------------------------------
export const generalSortingSchema = Joi.object({
    limit: Joi.number().integer().min(1).max(100).default(50),
    offset: Joi.number().integer().min(0).default(0),
    direction: Joi.string().valid('ASC', 'DESC').default('DESC'),
});
