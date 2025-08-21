import Joi from "joi";

export const favoriteBookSchema = Joi.object({
	id_user: Joi.string(),
	id_book: Joi.string(),
});
