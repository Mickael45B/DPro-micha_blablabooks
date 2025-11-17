import db from "../../db/connect_DB.js";
import { GraphQLError } from 'graphql';

//=========================================================
// RECHERCHE DANS UNE TABLE PAR UN SEUL PARAMÈTRE
//=========================================================
/**
 * 
 * @param {string} database 
 * @param {string} columnSearch 
 * @param {(string|boolean|number)} value 
 * @param {string} errorMessage 
 * @returns {Promise<object>} La première ligne trouvée
 * @throws {GraphQLError} Si non trouvée (404)
 */
export const findBy1ParameterOrThrow = async (database, columnSearch, value, errorMessage) => {
// console.log(`findBy1ParameterOrThrow called with database=${database}, columnSearch=${columnSearch}, value=${value}`);
// sécuriser les identifiants (accepte "schema.table" ou "table")
  const identPartRx = /^[A-Za-z_][A-Za-z0-9_]*$/;
  const isValidQualified = (ident) => ident.split('.').every(p => identPartRx.test(p));

// Valider les noms de table et de colonne
  if (!isValidQualified(database) || !identPartRx.test(columnSearch)) {
    throw new GraphQLError('Nom de table ou colonne invalide', {
      extensions: { code: 'BAD_REQUEST', httpStatus: 400 },
    });
  }

  // Construire la requête en gérant le cas NULL ou UNDEFINED
  const queryText = (value === null || typeof value === 'undefined')
    ? `SELECT * FROM ${database} WHERE ${columnSearch} IS NULL`
    : `SELECT * FROM ${database} WHERE ${columnSearch} = $1`;
// console.log('Constructed query:', queryText);
// Exécuter la requête
  try {
    const params = (value === null || typeof value === 'undefined') ? [] : [value];
    const request = await db.query(queryText, params);

    // cas où rien n'est trouvé
    if (!request.rows[0]) {
      throw new GraphQLError(errorMessage, {
        extensions: { code: 'NOT_FOUND', httpStatus: 404 },
      });
    }
    // console.log(request.rows[0]);
    // Tout est OK
    return { data: request.rows[0], httpStatus: 200 };

    // Gestion des erreurs
  } catch (err) {
    if (err && err.extensions && err.extensions.code) throw err;
    throw new GraphQLError('Erreur interne lors de la recherche', {
      extensions: { code: 'INTERNAL_SERVER_ERROR', httpStatus: 500 },
    });
  }
};

//=========================================================
// 
//=========================================================
























//=========================================================
// 
//=========================================================