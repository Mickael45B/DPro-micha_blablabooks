import { gql } from '@apollo/client';

export const CREATE_BOOK = gql`
  mutation CreateBook($input: CreateBookInput!) {
    createBook(input: $input) {
      id_book
      title
      author
      isbn
      description
      cover_image
      created_at
      updated_at
    }
  }
`;

export const UPDATE_BOOK = gql`
  mutation UpdateBook($input: UpdateBookInput!) {
    updateBook(input: $input) {
      id_book
      title
      author
      isbn
      description
      cover_image
      created_at
      updated_at
    }
  }
`;

export const DELETE_BOOK = gql`
  mutation DeleteBook($input: DeleteBookInput!) {
    deleteBook(input: $input) {
      id_book
      title
      author
      isbn
      description
      cover_image
      created_at
      updated_at
    }
  }
`;
