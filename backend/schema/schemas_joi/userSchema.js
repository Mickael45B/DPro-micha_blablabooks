import Joi from "joi";

//-----------------------------------------------------------
//QUERIES 
//-----------------------------------------------------------

export const getUsersSchema = Joi.object({
    limit: Joi.number().integer().min(1).max(100).default(50),
    offset: Joi.number().integer().min(0).default(0),
    order: Joi.string().valid('created_at', 'id_user', 'name', 'email', 'pseudo', 'id_role', 'status', 'updated_at').default('created_at'),
    direction: Joi.string().valid('ASC', 'DESC').default('DESC'),
});

export const getUserSchema = Joi.object({
    id_user: Joi.string().uuid().required(),
});

export const searchUsersSchema = Joi.object({
    nameOrPseudo: Joi.string().min(2).max(100).required(),
    limit: Joi.number().integer().min(1).max(100).default(50),
    offset: Joi.number().integer().min(0).default(0),
    order: Joi.string().valid('created_at', 'id_user', 'name', 'email', 'pseudo', 'id_role', 'status', 'updated_at').default('created_at'),
    direction: Joi.string().valid('ASC', 'DESC').default('DESC'),
});



//-----------------------------------------------------------
//MUTATIONS
//-----------------------------------------------------------

export const createUserSchema = Joi.object({
    name: Joi.string().min(2).max(255).allow(null, ''),
    email: Joi.string().email().max(255).required(),
    password: Joi.string().min(8).max(255).required(),
    pseudo: Joi.string().pattern(new RegExp('^[A-Za-z0-9](?:[A-Za-z0-9_\' ]*[A-Za-z0-9])?$')).min(3).max(30).required(),
    id_role: Joi.string().uuid().valid(1, 2, 3, 4, 5).default(1), // par défaut rôle "utilisateur" (id_role = 1)
});

export const updateUserSchema = Joi.object({
    id_user: Joi.string().uuid().required(),
    name: Joi.string().min(2).max(255).allow(null, ''),
    email: Joi.string().email().max(255).required(),
    password: Joi.string().min(8).max(255).optional(),
    pseudo: Joi.string().pattern(new RegExp('^[A-Za-z0-9](?:[A-Za-z0-9_\' ]*[A-Za-z0-9])?$')).min(3).max(30).required(),
    id_role: Joi.string().uuid().optional(),
});

export const deleteUserSchema = Joi.object({
    id_user: Joi.string().uuid().required(),
});

export const adminResetPasswordSchema = Joi.object({
    id_user: Joi.string().uuid().required(),
    new_password: Joi.string().min(8).max(255).required(),
});

export const changePasswordSchema = Joi.object({
    id_user: Joi.string().uuid().required(),
    old_password: Joi.string().min(8).max(255).required(),
    new_password: Joi.string().min(8).max(255).required(),
});

/*
-----------------------------------------------------------
TABLE USERS
-----------------------------------------------------------

  id_user       VARCHAR(42) PRIMARY KEY,
  name          VARCHAR(255) CHECK (length(btrim(name)) > 0), -- nom optionnel, servira pour la personnalisation des messages entre utilisateurs et admins (si non renseigné, on utilisera le pseudo)
  email         VARCHAR(255) NOT NULL UNIQUE 
                CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'), -- format d'email basique
  password      VARCHAR(255) NOT NULL,
  pseudo        VARCHAR(100) UNIQUE NOT NULL CHECK (pseudo ~ '^[A-Za-z0-9](?:[A-Za-z0-9_'' ]*[A-Za-z0-9])?$'), -- lettres, chiffres, underscore, 3-30 caractères. Le pseudo est obligatoire et unique (2 utilisateurs ne peuvent pas avoir le même pseudo)
  id_role       VARCHAR(42) REFERENCES roles(id_role) ON DELETE SET NULL,
  status        INTEGER NOT NULL DEFAULT 1 CHECK (status IN (1, 2, 3, 4, 5)), -- 1=actif, 2=bloqué par admin, 3=bloqué par l'utilisateur lui-même 4=bloqué par les 2 parties 5=supprimé
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ

*/





