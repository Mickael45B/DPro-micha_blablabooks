import Joi from "joi";

export const getAllUsersSchema = Joi.object({});

export const getUsersByPKSchema = Joi.object({
	id: Joi.string().min(34).max(36), // Password between 6 and 255 characters
});

export const updateUserSchema = Joi.object({
	name: Joi.string().min(2).max(50), // Name between 2 and 50 characters
	email: Joi.string().email(), // Valid email
	password: Joi.string().min(6).max(255), // Password between 6 and 255 characters
});

export const deleteUsersByPKSchema = Joi.object({
	id: Joi.string().min(34).max(36), // Password between 6 and 255 characters
});
