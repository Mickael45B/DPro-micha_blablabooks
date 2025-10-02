import Joi from "joi";

export const createReviewSchema = Joi.object({
	rating: Joi.number().integer().min(1).max(5),
	comment: Joi.string().min(10).max(1000),
	id: Joi.string(),
});

export const readReviewByIdSchema = Joi.object({
	id: Joi.string(),
});

export const updateReviewShema = Joi.object({
	rating: Joi.number().integer().min(1).max(5),
	comment: Joi.string().min(10).max(1000),
	id: Joi.string(),
});

export const deleteReviewSchema = Joi.object({
	id: Joi.string(),
});
