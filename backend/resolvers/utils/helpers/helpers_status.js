import db from "../../../db/connect_DB.js";
import { GraphQLError } from 'graphql';

export const findStatusOrThrow = async (id_status) => {
  if (!id_status) throw new GraphQLError('ID de statut manquant', {
    extensions: { code: 'BAD_USER_INPUT', httpStatus: 400 }
  });

  const result = await db.query(
    'SELECT id_status, status_name, created_at, updated_at FROM status WHERE id_status = $1',
    [id_status]
  );

  if (!result.rows[0]) throw new GraphQLError('Statut non trouvé', {
    extensions: { code: 'NOT_FOUND', httpStatus: 404 }
  });

  return result.rows[0];
};

export const validateStatusInput = (input) => {
  const { status_name } = input;

  if (!status_name || typeof status_name !== 'string' || status_name.trim().length === 0) {
    throw new GraphQLError('Nom de statut invalide', {
      extensions: { code: 'BAD_USER_INPUT', httpStatus: 400 }
    });
  }

  if (status_name.length < 3 || status_name.length > 100) {
    throw new GraphQLError('Le nom doit contenir entre 3 et 100 caractères', {
      extensions: { code: 'BAD_USER_INPUT', httpStatus: 400 }
    });
  }

  return {
    status_name: status_name.trim()
  };
};

export const existingStatusInput = async(input) => {
  const { status_name } = input;
  if (!status_name) return false;
  const result = await db.query(
    'SELECT COUNT(*)::int as count FROM status WHERE LOWER(status_name) = LOWER($1)',
    [status_name]
  );

  const count = result.rows[0]?.count || 0;
  if (count > 0) {
    throw new GraphQLError('Ce statut existe déjà', {
      extensions: { code: 'BAD_USER_INPUT', httpStatus: 400 }
    });
  }

  return false;
};


