import { gql } from '@apollo/client';

export const GET_BOOKS = gql`
  query {
    getBooks {
      books {
        id_book
        title
        author
        editor
        genre
        bookimage
        age_limit
        series
        isbn
        description
        vignetteimage
        is_in_favorite
        nb_reviews
        is_in_library
        avg_rating
        created_at
        updated_at
        publication_date
      }
      totalCount
      hasNextPage
    }
  }
`;














export const GET_BOOK = gql`
  query GetBook($id: ID!) {
    getBook(id: $id) {
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