import Joi from "joi";

export const registerSchema = Joi.object({
	name: Joi.string().min(2).max(50).required(), // Name between 2 and 50 characters
	email: Joi.string().email().required(), // Valid email required
	password: Joi.string().min(6).max(255).required(), // Password between 6 and 255 characters
});

export const loginSchema = Joi.object({
	email: Joi.string().email().required(), // Valid email required
	password: Joi.string().min(6).max(255).required(), // Password between 6 and 255 characters
});
