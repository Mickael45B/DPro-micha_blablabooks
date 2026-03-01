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
    publication_date
    genre
    editor
    series
    age_limit
    description
    avg_rating
    nb_reviews
    is_in_favorite
    is_in_library
    created_at
    bookimage
    vignetteimage
    reviews {
      id_review
      title_rating
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
    }
  }
`;

// Mutation pour supprimer un livre
export const DELETE_BOOK = gql`
  mutation DeleteBook($input: DeleteBookInput!) {
    deleteBook(input: $input)
  }
`;







// ========================================
// QUERIES POUR BOOKPAGE
// ========================================

/**
 * ✅ Récupérer mes bibliothèques
 */
export const GET_MY_LIBRARIES_WITH_BOOK = gql`
  query GetMyLibrariesWithBook {
    getMyLibraries {
      id_library
      name
      is_default
      is_editable
      color
      books {
        id_book
        id_bookhaslibrary
      }
    }
  }
`;

/**
 * ✅ Vérifier si le livre est dans les favoris
 */
export const IS_BOOK_IN_FAVORITES = gql`
  query IsBookInFavorites($id_book: ID!) {
    IsBookInFavorites(id_book: $id_book)
  }
`;

/**
 * ✅ Récupérer mon avis sur un livre
 */
export const GET_MY_REVIEW_FOR_BOOK = gql`
  query GetMyReviewForBook($id_book: ID!) {
    GetMyReviewForBook(id_book: $id_book) {
      id_review
      title_rating
      rating
      comment
      created_at
      updated_at
    }
  }
`;

// ========================================
// MUTATIONS POUR BIBLIOTHÈQUES
// ========================================

                /**
                 * ✅ Ajouter un livre à une bibliothèque
                 */
                export const ADD_BOOK_TO_LIBRARY = gql`
                  mutation AddBookHasLibrary($input: CreateBookHasLibraryInput!) {  
                    addBookHasLibrary(input: $input) {
                      id_bookhaslibrary
                      id_library
                      id_book
                      is_favorite
                    }
                  }
                `;

                /**
                 * ✅ Retirer un livre d'une bibliothèque
                 */
                //   mutation RemoveBookFromLibrary($id_library: ID!, $id_book: ID!) {
                export const REMOVE_BOOK_FROM_LIBRARY = gql`
                  mutation DeleteBookHasLibrary($input: DeleteBookHasLibraryInput!) {
                    deleteBookHasLibrary(input: $input)
                  }
                `;

                /**
                 * ✅ Toggle favori (ajouter/retirer des favoris)
                 */
                export const TOGGLE_BOOK_FAVORITE = gql`
                  mutation UpdateFavoriteStatusInBookHasLibrary($input: UpdateFavoriteStatusInBookHasLibraryInput!) {
                    updateFavoriteStatusInBookHasLibrary(input: $input) {
                      is_favorite
                    }
                  }
                `;

// ========================================
// MUTATIONS POUR AVIS
// ========================================

/**
 * ✅ Créer un avis
 */
export const CREATE_REVIEW = gql`
  mutation AddReview($input: CreateReviewInput!) {
    addReview(input: $input) {
      id_review
      title_rating
      rating
      comment
      id_book
      created_at
      updated_at
    }
  }
`;

/**
 * ✅ Modifier un avis
 */
export const UPDATE_REVIEW = gql`
  mutation UpdateReview($input: UpdateReviewInput!) {
    updateReview(input: $input) {
      id_review
      title_rating
      rating
      comment
      updated_at
    }
  }
`;

/**
 * ✅ Supprimer un avis
 */
export const DELETE_REVIEW = gql`
  mutation DeleteReview($input: DeleteReviewInput!) {
    deleteReview(input: $input)
  }
`;
