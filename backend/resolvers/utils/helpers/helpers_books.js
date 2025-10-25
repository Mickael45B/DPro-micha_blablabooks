import db from "../../../db/connect_DB.js";
import { GraphQLError } from 'graphql';
import fetchLibraryById from '../utils_librairies.js';
import { requireAuth} from './helpers_general.js';
import {getBooksSchema, createBookSchema, updateBookSchema, deleteBookSchema} from '../../../schema/schemas_joi/bookSchema.js';
import pkg from 'joi';
import { validate as uuidValidate } from 'uuid';

const { validate } = pkg;

/** * Valide les données avec un schéma Joi
 * @param {Joi.Schema} schema - Schéma de validation Joi
 * @param {object} data - Données à valider
 */
export const validateWithJoi = (schema, data) => {
  const { error, value } = schema.validate(data, {
    abortEarly: false, // Récupère toutes les erreurs
    stripUnknown: true, // Supprime les champs non définis dans le schéma
  });

  if (error) {
    const messages = error.details.map(detail => detail.message).join(', ');
    throw new GraphQLError(messages, {
      extensions: { 
        code: 'BAD_REQUEST',
        httpStatus: 400,
        originalError: error.message
      },
    });
  }

  return value;
};

/**
 * @param {object} bookId 
  * @returns {object} Livre trouvé 
  * @throws {GraphQLError} Si le livre n'est pas trouvé (404) 
 */
export const findBookOrThrow = async (bookId) => {
  const result = await db.query(
    'SELECT * FROM books WHERE id_book = $1',
    [bookId]
  );
  if (!result.rows[0]) {
    throw new GraphQLError('Livre non trouvé', {
      extensions: { 
        code: 'NOT_FOUND',
        httpStatus: 404
      },
    });
  }
  
  return result.rows[0];
};

/**
 * Valide les champs d'un livre
 * @param {object} input - Données du livre
 * @throws {GraphQLError} Si validation échoue
 */
export const validateBookInput = (input) => {
  if (!input.title || input.title.trim().length < 1) {
    throw new GraphQLError('Le titre est requis', {
      extensions: { 
        code: 'BAD_REQUEST',
        httpStatus: 400
      },
    });
  }
  
  // Validation optionnelle de l'ISBN (format basique)
  if (input.isbn && !/^(?:\d{10}|\d{13})$/.test(input.isbn.replace(/-/g, ''))) {
    throw new GraphQLError('Format ISBN invalide (10 ou 13 chiffres attendus)', {
      extensions: { 
        code: 'BAD_REQUEST',
        httpStatus: 400
      },
    });
  }
  
  // Validation de l'âge limite
  if (input.ageLimit !== undefined && (input.ageLimit < 0 || input.ageLimit > 18)) {
    throw new GraphQLError('L\'âge limite doit être entre 0 et 18', {
      extensions: { 
        code: 'BAD_REQUEST',
        httpStatus: 400
      },
    });
  }
};