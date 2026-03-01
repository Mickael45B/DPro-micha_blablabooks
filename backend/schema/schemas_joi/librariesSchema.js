import Joi from "joi";

//-----------------------------------------------------------
// GENERAL SORTING SCHEMA
//-----------------------------------------------------------

export const generalLibrariesSchema = Joi.object({
    id_library: Joi.string().uuid().required(),
    name: Joi.string().max(255).required(),
    is_editable: Joi.boolean().default(false),
    id_user: Joi.string().uuid().allow(null),
    is_default: Joi.boolean().default(false),
    color: Joi.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).default('#d7355c'),
    is_public: Joi.boolean().default(false),
    description: Joi.string().max(512).allow(null, ''),
    sort_order: Joi.number().default(0),
    created_at: Joi.date().iso(),
    updated_at: Joi.date().iso().allow(null),
});

export const generalOrderLibrariesSchema = Joi.object({
    order: Joi.string().valid('created_at', 'name', 'updated_at').default('created_at'),
});

//-----------------------------------------------------------
// QUERIES
//-----------------------------------------------------------

export const viewAllLibrariesSchema = Joi.object({
    limit: Joi.number().integer().min(1).max(100).default(50),
    offset: Joi.number().integer().min(0).default(0),
    direction: Joi.string().valid('ASC', 'DESC').default('DESC'),
    order: Joi.string().valid('created_at', 'name', 'updated_at').default('created_at'),
});

export const viewLibraryByIDSchema = Joi.object({
    id_library: Joi.string().uuid().required(),
});

export const searchLibrariesSchema = Joi.object({
    selectedLibrary: Joi.string().min(2).required(),
    limit: Joi.number().integer().min(1).max(100).default(50),
    offset: Joi.number().integer().min(0).default(0),
    direction: Joi.string().valid('ASC', 'DESC').default('DESC'),
    order: Joi.string().valid('created_at', 'name', 'updated_at').default('created_at'),
});

//-----------------------------------------------------------
// MUTATIONS
//-----------------------------------------------------------

export const createLibrarySchema = Joi.object({
    selectedArguments: Joi.object({
        name: Joi.string().max(255).required(),
        is_editable: Joi.boolean().default(false),
        id_user: Joi.string().uuid().required(),
        is_default: Joi.boolean().default(false),
        color: Joi.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).default('#d7355c'),
        is_public: Joi.boolean().default(false),
        description: Joi.string().max(512).allow(null, ''),
        sort_order: Joi.number().default(0),
    }).required(),
});

export const updateLibrarySchema = Joi.object({
    selectedArguments: Joi.object({
        id_library: Joi.string().uuid().required(),
        name: Joi.string().max(255),
        is_editable: Joi.boolean(),
        is_default: Joi.boolean(),
        color: Joi.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})/),
        is_public: Joi.boolean(),
        description: Joi.string().max(512).allow(null, ''),
        sort_order: Joi.number(),
    }).required(),
});

export const deleteLibrarySchema = Joi.object({
    selectedArguments: Joi.object({
        id_library: Joi.string().uuid().required(),
    }).required(),
});
