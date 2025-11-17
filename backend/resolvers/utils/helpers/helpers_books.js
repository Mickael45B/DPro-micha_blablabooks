import db from "../../../db/connect_DB.js";
import { GraphQLError } from 'graphql';
import fetchLibraryById from '../utils_librairies.js';
import { requireAuth} from './helpers_general.js';
import {getBooksSchema, createBookSchema, updateBookSchema, deleteBookSchema} from '../../../schema/schemas_joi/bookSchema.js';
import pkg from 'joi';
import { validate as uuidValidate } from 'uuid';

const { validate } = pkg;






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