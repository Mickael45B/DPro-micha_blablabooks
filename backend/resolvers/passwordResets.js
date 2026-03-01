import db from "../db/connect_DB.js";
import { v4 as uuidv4 } from 'uuid';
import { validateOrderParams } from '../utils/validators.js';

import { GraphQLError } from 'graphql';

import { findBy1ParameterOrThrow, withSecureResolver, generalSortingSchema} from './utils/helper.js';
// Importer les wrappers et helpers de sécurité
import { sanitizeStrict} from './utils/helpers/helpers_securite.js';

// Importer les schemas Joi spécifiques
//import { generalOrderPasswordResetSchema, searchPasswordResetSchema, generalPasswordResetSchema} from '../schema/schemas_joi/passwordResetSchema.js';

// Validation des ordres valides pour les messages
const generalValidationOrder = ['created_at', 'id_user', 'updated_at'];

const toDateString = (v) => {
  if (!v) return null;
  if (v instanceof Date) return v.toISOString().split('T')[0];
  if (typeof v === 'string') return v.split('T')[0];
  return null;
};


export default {
  Query: {
  },

  Mutation: {

  },

  PasswordReset: {
  }
};