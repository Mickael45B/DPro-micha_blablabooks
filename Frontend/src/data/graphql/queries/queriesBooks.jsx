import { gql } from '@apollo/client';

// Query pour récupérer TOUS les livres avec pagination
// ⚠️ IMPORTANT : Utiliser les bons types selon votre schema backend
export const GET_BOOKS = gql`
  query GetBooks(
    $limit: Int
    $offset: Int
  ) {
    getBooks(
      pagination: { limit: $limit, offset: $offset }
    ) {
      books {
        id_book
        title
        author
        isbn
        publication_date
        genre
        editor
        vignetteimage
        bookimage
        age_limit
        description
        series
        avg_rating
        nb_reviews
        is_in_favorite
        is_in_library
        created_at
        updated_at
      }
      totalCount
      hasNextPage
      httpStatus
    }
  }
`;

// Query pour récupérer UN livre par son ID avec ses reviews
// ⚠️ ATTENTION : Le backend attend "id_book" pas "id" !
export const GET_BOOK_BY_ID = gql`
  query GetBookById($id_book: ID!) {
    getBook(id_book: $id_book) {
      id_book
      title
      author
      isbn
      publication_date
      genre
      editor
      vignetteimage
      bookimage
      age_limit
      description
      series
      avg_rating
      nb_reviews
      is_in_favorite
      is_in_library
      created_at
      updated_at
      reviews {
        id_review
        rating
        comment
        updated_at
        user {
          id_user
          pseudo
          name
        }
      }
    }
  }
`;

// Query séparée pour les reviews (SI le backend ne les retourne pas dans getBook)
export const GET_BOOK_REVIEWS = gql`
  query GetBookReviews($id_book: ID!) {
    getBookReviews(id_book: $id_book) {
      averageRating
      reviews {
        id_review
        rating
        comment
        userName
        updated_at
      }
    }
  }
`;

// Query pour rechercher des livres
export const SEARCH_BOOKS = gql`
  query SearchBooks(
    $titleOrAuthor: String!
    $limit: Int
    $offset: Int
  ) {
    searchBooks(
      titleOrAuthor: $titleOrAuthor
      limit: $limit
      offset: $offset
    ) {
      books {
        id_book
        title
        author
        isbn
        publication_date
        genre
        editor
        vignetteimage
        bookimage
        age_limit
        description
        series
        avg_rating
        nb_reviews
      }
      totalCount
      hasNextPage
      httpStatus
    }
  }
`;

// Mutation pour ajouter un livre
export const CREATE_BOOK = gql`
  mutation AddBook($input: CreateBookInput!) {
    addBook(input: $input) {
      id_book
      title
      author
      isbn
      publication_date
      genre
      editor
      vignetteimage
      bookimage
      age_limit
      description
      series
    }
  }
`;

// Mutation pour mettre à jour un livre
export const UPDATE_BOOK = gql`
  mutation UpdateBook($input: UpdateBookInput!) {
    updateBook(input: $input) {
      id_book
      title
      author
      isbn
      publication_date
      genre
      editor
      vignetteimage
      bookimage
      age_limit
      description
      series
      updated_at
    }
  }
`;

// Mutation pour supprimer un livre
export const DELETE_BOOK = gql`
  mutation DeleteBook($input: DeleteBookInput!) {
    deleteBook(input: $input)
  }
`;