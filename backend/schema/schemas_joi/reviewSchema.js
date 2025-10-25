import Joi from "joi";

//-----------------------------------------------------------
//QUERIES 
//-----------------------------------------------------------
export const getReviewsSchema = Joi.object({
    limit: Joi.number().integer().min(1).max(100).default(50),
    offset: Joi.number().integer().min(0).default(0),
    order: Joi.string().valid('created_at', 'id_review', 'id_user', 'id_book', 'rating', 'updated_at').default('created_at'),
    direction: Joi.string().valid('ASC', 'DESC').default('DESC'),
});

export const getReviewSchema = Joi.object({
    id_review: Joi.string().min(34).max(36).required(), // UUIDv4
});

export const searchReviewsSchema = Joi.object({
    content: Joi.string().min(34).max(36).required(), // UUIDv4
});

//-----------------------------------------------------------
//MUTATIONS
//-----------------------------------------------------------

export const addReviewSchema = Joi.object({
  id_user: Joi.string().uuid().required(),
  id_book: Joi.string().uuid().required(),
  title_rating: Joi.string().min(3).max(100).required(),
  comment: Joi.string().min(10).max(2000).required(),
  rating: Joi.number().integer().min(1).max(5).required(),
});

export const updateReviewSchema = Joi.object({
	id_review: Joi.string().min(34).max(36).required(), // UUIDv4
  title_rating: Joi.string().min(3).max(100),
  comment: Joi.string().min(10).max(2000),
  rating: Joi.number().integer().min(1).max(5),
});

export const deleteReviewSchema = Joi.object({
	id_review: Joi.string().min(34).max(36).required(), // UUIDv4
});

/*
-----------------------------------------------------------
TABLE REVIEWS
-----------------------------------------------------------

  id_review    VARCHAR(42) PRIMARY KEY,
  id_user   VARCHAR(42) REFERENCES users(id_user) ON DELETE SET NULL, 
  id_book      VARCHAR(42) NOT NULL REFERENCES books(id_book) ON DELETE SET NULL, 
  title_rating  VARCHAR(255) NOT NULL CHECK (length(btrim(title_rating)) > 0), 
  comment      VARCHAR(1024) NOT NULL CHECK (length(btrim(comment)) > 0),
  rating       INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ,

*/
