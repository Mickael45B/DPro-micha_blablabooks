import test from 'node:test';
import assert from 'node:assert/strict';
import { GraphQLError } from 'graphql';
import { findBookOrThrow, validateBookInput } from '../../../backend/resolvers/utils/helpers/helpers_books.js';

test('findBookOrThrow retourne le livre quand il existe', async () => {
  const mockBook = { id_book: '1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p'};
  const mockDb = { query: async () => ({ rows: [mockBook] }) };

  const result = await findBookOrThrow(mockBook.id_book, mockDb);
  assert.deepEqual(result, mockBook);
});

test('findBookOrThrow lance GraphQLError si introuvable', async () => {
  const mockDb = { query: async () => ({ rows: [] }) };

  await assert.rejects(
    async () => { await findBookOrThrow('missing-id', mockDb); },
    (err) => err instanceof GraphQLError && err.message === 'Livre non trouvé'
  );
});

test('findBookOrThrow lance GraphQLError pour un UUID invalide/non existant fourni', async () => {
  const fakeId = '1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5856';
  // mockDb vérifie que l'id passé est bien celui attendu puis renvoie rows: []
  const mockDbNotFound = {
    query: async (sql, params) => {
      assert.strictEqual(params[0], fakeId, 'L\'id passé à la requête SQL doit correspondre au fakeId du test');
      return { rows: [] };
    }
  };

  await assert.rejects(
    async () => { await findBookOrThrow(fakeId, mockDbNotFound); },
    (err) => err instanceof GraphQLError && err.message === 'Livre non trouvé'
  );
});

test('validateBookInput - valeurs réelles (valide)', async () => {
  const valid = {
    title: 'Titre valide',
    isbn: '978-2017080251', // 13 chiffres avec tirets
    ageLimit: 12
  };
  // ne doit pas lancer
  assert.doesNotThrow(() => validateBookInput(valid));
});

test('validateBookInput - valeur nulle / titre manquant', async () => {
  // cas: objet vide
  await assert.rejects(
    () => Promise.resolve().then(() => validateBookInput({})),
    (err) => err instanceof GraphQLError && err.message === 'Le titre est requis'
  );

  // cas: titre vide string
  await assert.rejects(
    () => Promise.resolve().then(() => validateBookInput({ title: '   ' })),
    (err) => err instanceof GraphQLError && err.message === 'Le titre est requis'
  );

  // cas: input null -> TypeError attendu si la fonction n'a pas de garde
  await assert.rejects(
    () => Promise.resolve().then(() => validateBookInput(null)),
    (err) => (err instanceof TypeError) || (err instanceof GraphQLError)
  );
});

test('validateBookInput - valeurs fausses (ISBN invalide)', async () => {
  const badIsbn = { title: 'Titre', isbn: '12-34-56' };
  await assert.rejects(
    () => Promise.resolve().then(() => validateBookInput(badIsbn)),
    (err) => err instanceof GraphQLError && /Format ISBN invalide/.test(err.message)
  );
});

test('validateBookInput - valeurs fausses (ageLimit hors bornes)', async () => {
  const tooLow = { title: 'Titre', ageLimit: -1 };
  await assert.rejects(
    () => Promise.resolve().then(() => validateBookInput(tooLow)),
    (err) => err instanceof GraphQLError && /L'âge limite doit être entre 0 et 18/.test(err.message)
  );
      const tooHigh = { title: 'Titre', ageLimit: 99 };
  await assert.rejects(
    () => Promise.resolve().then(() => validateBookInput(tooHigh)),
    (err) => err instanceof GraphQLError && /L'âge limite doit être entre 0 et 18/.test(err.message)
  );
});