export const BOOK_IN_LIBRARY_FRAGMENT = gql`
  fragment BookInLibraryFields on BookHasLibrary {
    id_bookhaslibrary
    id_library
    id_book
    is_read
    is_favorite
    created_at
    updated_at
  }
`;
