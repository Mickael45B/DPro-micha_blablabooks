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
    }
  }
`;

// Mutation pour supprimer un livre
export const DELETE_BOOK = gql`
  mutation DeleteBook($input: DeleteBookInput!) {
    deleteBook(input: $input)
  }
`;






// ==============================================
// UTILISATEURS - QUERIES
// ==============================================

export const GET_USERS = gql`
  query GetUsers($limit: Int, $offset: Int, $order: String, $direction: String) {
    getUsers(limit: $limit, offset: $offset, order: $order, direction: $direction) {
      users {
        id_user
        name
        email
        pseudo
        id_role
        status{id_status, status_name}
        created_at
        updated_at
      }
      totalCount
      hasNextPage
      httpStatus
    }
  }
`;

export const GET_USER = gql`
  query GetUser($id_user: ID!) {
    getUser(id_user: $id_user) {
      id_user
      name
      email
      pseudo
      id_role
      status {
        id_status
        status_name
      }
      created_at
      updated_at
    }
  }
`;

export const SEARCH_USERS = gql`
  query SearchUsers($query: String!) {
    searchUsers(query: $query) {
      id_user
      name
      email
      pseudo
      status {
        id_status
        status_name
      }
    }
  }
`;

// ==============================================
// UTILISATEURS - MUTATIONS
// ==============================================

export const UPDATE_USER = gql`
  mutation UpdateUser($input: UpdateUserInput!) {
    updateUser(input: $input){
      id_user
      name
      email
      pseudo
      status {
        id_status
        status_name
      }
      created_at
    }
  }
`;

export const DELETE_USER = gql`
  mutation DeleteUser($input: DeleteUserInput!) {
    deleteUser(input: $input)
  }
`;

export const ADMIN_RESET_PASSWORD = gql`
  mutation AdminResetPassword($input: AdminResetPasswordInput!) { 
    adminResetPassword(input: $input) 
  }
`;

// ==============================================
// AVIS - QUERIES
// ==============================================

export const GET_REVIEWS = gql`
  query GetReviews($limit: Int, $offset: Int, $order: String, $direction: String) {
    getReviews(limit: $limit, offset: $offset, order: $order, direction: $direction) {
      reviews {
        id_review
        user {
          id_user
          pseudo
        }
        book {
          id_book
          title
        }
        title_rating
        comment
        rating
        created_at
        updated_at
      }
      totalCount
      hasNextPage
      httpStatus
    }
  }
`;

/*export const GET_REVIEW = gql`
  query GetReview($id_review: ID!) {
    getReview(id_review: $id_review) {
      reviews {
        id_review
        id_user
        id_book
        title_rating
        comment
        rating
        created_at
        updated_at
      }
    }
  }
`;*/

export const SEARCH_REVIEWS = gql`
  query SearchReviews($content: String!) {
    searchReviews(content: $content) {
      id_review
      title_rating
      comment
      rating
    }
  }
`;

// ==============================================
// AVIS - MUTATIONS
// ==============================================

export const UPDATE_REVIEW = gql`
  mutation UpdateReview($input: UpdateReviewInput!) {
    updateReview(input: $input) {
      id_review
      id_user
      id_book
      title_rating
      comment
      rating
      created_at
      updated_at
    }
  }
`;

export const DELETE_REVIEW = gql`
  mutation DeleteReview($input: DeleteReviewInput!) {
    deleteReview(input: $input)
  }
`;

// ==============================================
// MESSAGES - QUERIES
// ==============================================

export const GET_MESSAGES = gql`
  query GetMessages($limit: Int, $offset: Int, $order: String, $direction: String) {
    getMessages(limit: $limit, offset: $offset, order: $order, direction: $direction) {
      messages{
        id_message
        sender {
          id_user
          pseudo
        }
        receiver {
          id_user
          pseudo
        }
        subject
        content
        is_read
        created_at
        updated_at
      }
    }
  }
`;

export const GET_MESSAGE = gql`
  query GetMessage($id_message: ID!) {
    getMessage(id_message: $id_message) {
      message{
        id_message
        sender {
          id_user
          pseudo
        }
        receiver {
          id_user
          pseudo
        }
        subject
        content
        is_read
        created_at
        updated_at
      }
    }
  }
`;

export const SEARCH_MESSAGES = gql`
  query SearchMessages($subjectOrContent: String!) {
    searchMessages(subjectOrContent: $subjectOrContent) {
      messages{
        id_message
        sender {
          id_user
          pseudo
        }
        receiver {
          id_user
          pseudo
        }
        subject
        content
        is_read
        created_at
      }
    }
  }
`;

// ==============================================
// MESSAGES - MUTATIONS
// ==============================================

export const CREATE_MESSAGE = gql`
  mutation CreateMessage($input: CreateMessageInput!) {
    createMessage(input: $input)
  }
`;

export const UPDATE_MESSAGE = gql`
  mutation UpdateMessage($input: UpdateMessageInput!) {
    updateMessage(input: $input) 
  }
`;

export const DELETE_MESSAGE = gql`
   mutation DeleteMessage($input: DeleteMessageInput!) {
    deleteMessage(input: $input)
  }
`;

export const MARK_MESSAGE_AS_READ = gql`
  mutation MarkMessageAsRead($input: MarkMessageAsReadInput!) {
    markMessageAsRead(input: $input)
  }
`;

// ==============================================
// REPORTS - QUERIES
// ==============================================

export const GET_REPORTS = gql`
  query GetReports($limit: Int, $offset: Int, $order: String, $direction: String) {
    getReports(limit: $limit, offset: $offset, order: $order, direction: $direction) {
      reports{
        id_report
        whistleblower {
          id_user
          pseudo
        }
        report_type
        reported{
          id_user
          pseudo
        }
        reason
        details
        status
        created_at
        updated_at
      }
    }
  }
`;

export const GET_REPORT = gql`
  query GetReport($id_report: ID!) {
    getReport(id_report: $id_report) {
      reports{
        id_report
        whistleblower {
          id_user
          pseudo
        }
        report_type
        reported{
          id_user
          pseudo
        }
        reason
        details
        status
        created_at
        updated_at
      }
    }
  }
`;

export const SEARCH_REPORTS_BY_STATUS = gql`
  query SearchReportsByStatus($status: String!) {
    searchReportsByStatus(status: $status) {
      report{
        id_report
        whistleblower {
          id_user
          pseudo
        }
        report_type
        reported{
          id_user
          pseudo
        }
        reason
        details
        status
        created_at
        updated_at
      }
    }
  }
`;

export const SEARCH_REPORTS = gql`
  query SearchReports(
    $id_report: ID
    $id_user: ID
    $status: String
    $content: String
  ) {
    searchReports(
      id_report: $id_report
      id_user: $id_user
      status: $status
      content: $content
    ) {
      report{
        id_report
        whistleblower {
          id_user
          pseudo
        }
        report_type
        reported{
          id_user
          pseudo
        }
        reason
        details
        status
        created_at
        updated_at
      }
    }
  }
`;

// ==============================================
// REPORTS - MUTATIONS
// ==============================================

export const UPDATE_REPORT = gql`
  mutation UpdateReport($input: UpdateReportInput!) {
    updateReport(input: $input)
{
      id_report
      report_type
      reason
      details
      status
      created_at
      updated_at
    }

  }
`;

export const DELETE_REPORT = gql`
  mutation DeleteReport($input: DeleteReportInput!) {
    deleteReport(input: $input)
  }
`;
