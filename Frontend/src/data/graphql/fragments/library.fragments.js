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
