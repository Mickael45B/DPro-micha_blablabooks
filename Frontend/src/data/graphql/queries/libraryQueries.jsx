import { gql } from '@apollo/client';


export const GET_LIBRARIES_BY_ID_USER = gql`
  query GetMyLibraries {
    getMyLibraries {
      id_library
      name
      is_editable
      created_at
      updated_at
    }
  }
`;

export const GET_ALL_BOOKS_IN_ALL_MY_LIBRARIES = gql`
    query getAllBooksIn1Library { 
        books { 
            id_bookhaslibrary 
            book { 
                title 
                author 
            } 
            library { 
                id_library 
                name 
            } 
            
        } 
    } 
`;






































// ========================================
// FRAGMENTS
// ========================================

export const LIBRARY_FRAGMENT = gql`
  fragment LibraryFields on Library {
    id_library
    name
    description
    is_editable
    is_default
    is_public
    color
    sort_order
    created_at
    updated_at
  }
`;

export const LIBRARY_STATS_FRAGMENT = gql`
  fragment LibraryStatsFields on LibraryStats {
    total_books
    books_read
    books_reading
    books_to_read
    avg_rating
    total_pages
    books_lent
  }
`;

export const BOOK_IN_LIBRARY_FRAGMENT = gql`
  fragment BookInLibraryFields on BookHasLibrary {
    id_bookhaslibrary
    id_library
    id_book
    is_read
    is_favorite
    reading_status
    progress_percentage
    personal_note
    tags
    started_at
    finished_at
    lent_to
    lent_at
    created_at
    updated_at
  }
`;

// ========================================
// QUERIES
// ========================================

/**
 * Récupérer toutes mes bibliothèques
 */
export const GET_MY_LIBRARIES = gql`
  ${LIBRARY_FRAGMENT}
  ${LIBRARY_STATS_FRAGMENT}
  
  query GetMyLibraries($filter: LibraryFilterInput) {
    getMyLibraries(filter: $filter) {
      ...LibraryFields
      stats {
        ...LibraryStatsFields
      }
    }
  }
`;

/**
 * Récupérer une bibliothèque avec ses livres
 */
export const GET_LIBRARY = gql`
  ${LIBRARY_FRAGMENT}
  ${LIBRARY_STATS_FRAGMENT}
  ${BOOK_IN_LIBRARY_FRAGMENT}
  
  query GetLibrary($id_library: ID!) {
    getLibrary(id_library: $id_library) {
      ...LibraryFields
      stats {
        ...LibraryStatsFields
      }
      books {
        ...BookInLibraryFields
        book {
          id_book
          title
          author
          avg_rating
          bookimage
          vignetteimage
          genre
          series
        }
      }
    }
  }
`;

/**
 * Récupérer les livres d'une bibliothèque avec filtres
 */
export const GET_BOOKS_IN_LIBRARY = gql`
  ${BOOK_IN_LIBRARY_FRAGMENT}
  
  query GetBooksInLibrary(
    $id_library: ID!
    $filter: BookInLibraryFilterInput
  ) {
    getBooksInLibrary(id_library: $id_library, filter: $filter) {
      ...BookInLibraryFields
      book {
        id_book
        title
        author
        avg_rating
        nb_reviews
        bookimage
        vignetteimage
        genre
        editor
        series
        description
      }
    }
  }
`;

/**
 * Rechercher dans toutes mes bibliothèques
 */
export const SEARCH_IN_ALL_LIBRARIES = gql`
  ${BOOK_IN_LIBRARY_FRAGMENT}
  
  query SearchInAllLibraries($search: String!) {
    searchInAllLibraries(search: $search) {
      ...BookInLibraryFields
      book {
        id_book
        title
        author
        avg_rating
        bookimage
        vignetteimage
      }
    }
  }
`;

/**
 * Obtenir les statistiques d'une bibliothèque
 */
export const GET_LIBRARY_STATS = gql`
  ${LIBRARY_STATS_FRAGMENT}
  
  query GetLibraryStats($id_library: ID!) {
    getLibraryStats(id_library: $id_library) {
      ...LibraryStatsFields
    }
  }
`;

/**
 * Trouver les livres en double
 */
// export const FIND_MY_DUPLICATE_BOOKS = gql`
//   query FindMyDuplicateBooks {
//     findMyDuplicateBooks {
//       book_id
//       book_title
//       library_count
//       library_names
//     }
//   }
// `;

/**
 * Bibliothèques publiques d'un utilisateur
 */
export const GET_PUBLIC_LIBRARIES = gql`
  ${LIBRARY_FRAGMENT}
  
  query GetPublicLibraries($id_user: ID!) {
    getPublicLibraries(id_user: $id_user) {
      ...LibraryFields
      stats {
        total_books
        avg_rating
      }
    }
  }
`;

// ========================================
// MUTATIONS
// ========================================

/**
 * Créer une bibliothèque
 */
export const CREATE_LIBRARY = gql`
  ${LIBRARY_FRAGMENT}
  
  mutation CreateLibrary($input: CreateLibraryInput!) {
    createLibrary(input: $input) {
      ...LibraryFields
    }
  }
`;

/**
 * Mettre à jour une bibliothèque
 */
export const UPDATE_LIBRARY = gql`
  ${LIBRARY_FRAGMENT}
  
  mutation UpdateLibrary($input: UpdateLibraryInput!) {
    updateLibrary(input: $input) {
      ...LibraryFields
    }
  }
`;

/**
 * Supprimer une bibliothèque
 */
export const DELETE_LIBRARY = gql`
  mutation DeleteLibrary($id_library: ID!) {
    deleteLibrary(id_library: $id_library)
  }
`;

/**
 * Ajouter un livre à une bibliothèque
 */
export const ADD_BOOK_TO_LIBRARY = gql`
  ${BOOK_IN_LIBRARY_FRAGMENT}
  
  mutation AddBookToLibrary($input: AddBookToLibraryInput!) {
    addBookToLibrary(input: $input) {
      ...BookInLibraryFields
    }
  }
`;

/**
 * Retirer un livre d'une bibliothèque
 */
export const REMOVE_BOOK_FROM_LIBRARY = gql`
  mutation RemoveBookFromLibrary($id_bookhaslibrary: ID!) {
    removeBookFromLibrary(id_bookhaslibrary: $id_bookhaslibrary)
  }
`;

/**
 * Mettre à jour un livre dans une bibliothèque
 */
export const UPDATE_BOOK_IN_LIBRARY = gql`
  ${BOOK_IN_LIBRARY_FRAGMENT}
  
  mutation UpdateBookInLibrary($input: UpdateBookInLibraryInput!) {
    updateBookInLibrary(input: $input) {
      ...BookInLibraryFields
    }
  }
`;

/**
 * Déplacer un livre entre bibliothèques
 */
export const MOVE_BOOK_TO_LIBRARY = gql`
  mutation MoveBookToLibrary($input: MoveBookInput!) {
    moveBookToLibrary(input: $input)
  }
`;

/**
 * Déplacer plusieurs livres
 */
export const BULK_MOVE_BOOKS = gql`
  mutation BulkMoveBooks($input: BulkMoveInput!) {
    bulkMoveBooks(input: $input)
  }
`;

/**
 * Réorganiser les bibliothèques
 */
export const REORDER_LIBRARIES = gql`
  mutation ReorderLibraries($library_ids: [ID!]!) {
    reorderLibraries(library_ids: $library_ids)
  }
`;

/**
 * Réorganiser les livres dans une bibliothèque
 */
export const REORDER_BOOKS_IN_LIBRARY = gql`
  mutation ReorderBooksInLibrary($id_library: ID!, $book_ids: [ID!]!) {
    reorderBooksInLibrary(id_library: $id_library, book_ids: $book_ids)
  }
`;

/**
 * Mettre à jour la progression de lecture
 */
export const UPDATE_PROGRESS = gql`
  mutation UpdateProgress($id_bookhaslibrary: ID!, $progress_percentage: Int!) {
    updateProgressPercentage(id_bookhaslibrary: $id_bookhaslibrary, progress_percentage: $progress_percentage) {
      id_bookhaslibrary
      progress_percentage
    }
  }
`;

/**
 * Toggle lu/non lu
 */
export const TOGGLE_BOOK_READ = gql`
  ${BOOK_IN_LIBRARY_FRAGMENT}
  
  mutation ToggleBookRead($id_bookhaslibrary: ID!) {
    toggleBookRead(id_bookhaslibrary: $id_bookhaslibrary) {
      ...BookInLibraryFields
    }
  }
`;

/**
 * Toggle favori/non favori
 */
export const TOGGLE_BOOK_FAVORITE = gql`
  ${BOOK_IN_LIBRARY_FRAGMENT}
  
  mutation ToggleBookFavorite($id_bookhaslibrary: ID!) {
    toggleBookFavorite(id_bookhaslibrary: $id_bookhaslibrary) {
      ...BookInLibraryFields
    }
  }
`;

// ========================================
// SUBSCRIPTIONS
// ========================================

/**
 * S'abonner aux changements d'une bibliothèque
 */
export const LIBRARY_UPDATED_SUBSCRIPTION = gql`
  ${LIBRARY_FRAGMENT}
  
  subscription LibraryUpdated($id_library: ID!) {
    libraryUpdated(id_library: $id_library) {
      ...LibraryFields
    }
  }
`;

/**
 * S'abonner aux changements de toutes mes bibliothèques
 */
export const MY_LIBRARIES_UPDATED_SUBSCRIPTION = gql`
  ${LIBRARY_FRAGMENT}
  
  subscription MyLibrariesUpdated {
    myLibrariesUpdated {
      ...LibraryFields
    }
  }
`;
