import e from "express";
import Joi from "joi";
// import { ref } from "process";

//-----------------------------------------------------------
// GENERAL SORTING SCHEMA
//-----------------------------------------------------------

export const generalUserSchema = Joi.object({
    id_user: Joi.string().uuid(), // UUIDv4
    name: Joi.string().min(2).max(255).allow(null, ''), // nom optionnel
    email: Joi.string().email().max(255),
    password: Joi.string().min(8).max(255),
    pseudo: Joi.string().pattern(new RegExp('^[A-Za-z0-9](?:[A-Za-z0-9_\' ]*[A-Za-z0-9])?$')).min(3).max(30),
    id_role: Joi.string().uuid(),
    status: Joi.number().integer().valid(1, 2, 3, 4, 5), // 1=actif, 2=bloqué par admin, 3=bloqué par l'utilisateur lui-même 4=bloqué par les 2 parties 5=supprimé
    refresh_token: Joi.string().allow(null, ''),
    last_login: Joi.date(),
    code_passwordReset: Joi.string().max(64).allow(null, ''),
    createDatetime_passwordReset: Joi.date().allow(null),
    validity_passwordReset: Joi.number().integer().positive().allow(null),
    created_at: Joi.date(),// Date de création
    updated_at: Joi.date(),// Date de mise à jour
});
export const generalOrderUserSchema = Joi.object({
    order: Joi.string().valid('created_at', 'id_user', 'name', 'email', 'pseudo', 'id_role', 'status', 'updated_at').default('created_at'),
});

//-----------------------------------------------------------
//QUERIES 
//-----------------------------------------------------------

export const getUsersSchema = Joi.object({
});

export const getUserSchema = Joi.object({
});

export const searchUsersSchema = Joi.object({
    query: Joi.string().min(2).max(100).required(),
});



//-----------------------------------------------------------
//MUTATIONS
//-----------------------------------------------------------

export const createUserSchema = Joi.object({
});

export const updateUserSchema = Joi.object({
});

export const deleteUserSchema = Joi.object({
});

export const adminResetPasswordSchema = Joi.object({
    new_password: Joi.string().min(8).max(255).required(),
});

export const changePasswordSchema = Joi.object({
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





