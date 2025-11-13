import test from 'node:test';
import assert from 'node:assert/strict';
import { GraphQLError } from 'graphql';
import { findBookOrThrow } from '../../../backend/resolvers/utils/helpers/helpers_books.js';

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