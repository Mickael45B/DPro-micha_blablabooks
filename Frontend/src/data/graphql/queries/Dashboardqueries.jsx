import { gql } from '@apollo/client';

// ========================================
// QUERIES POUR LES AVIS
// ========================================

export const GET_MY_REVIEWS = gql`
  query GetMyReviews($limit: Int, $offset: Int) {
    getMyReviews(limit: $limit, offset: $offset) {
      reviews {
        id_review
        title_rating
        rating
        comment
        created_at
        updated_at
        book {
          id_book
          title
          author
          vignetteimage
        }
      }
      totalCount
      hasNextPage
    }
  }
`;

export const DELETE_REVIEW = gql`
  mutation DeleteReview($input: DeleteReviewInput!) {
    deleteReview(input: $input)
  }
`;

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

// ========================================
// QUERIES POUR LES CONVERSATIONS/MESSAGES
// ========================================

/**
 * Récupérer mes conversations (regroupées par sujet + paire users)
 */
export const GET_MY_CONVERSATIONS = gql`
  query GetMyConversations {
    getUserDiscussions {
      discussions {
        id_conversation
        subject
        created_at
        updated_at
        is_archived
      }
      totalCount
      hasNextPage
    }
  }
`;

/**
 * Récupérer tous les messages d'une conversation
 */
export const GET_CONVERSATION_MESSAGES = gql`
  query GetConversationMessages($id_conversation: ID!) {
    getDiscussionByID(id_conversation: $id_conversation) {
      id_conversation
      subject
      created_at
      messages {
        id_message
        content
        created_at
        is_read
        sender {
          id_user
          pseudo
        }
        receiver {
          id_user
          pseudo
        }
      }
    }
  }
`;

/**
 * Envoyer un message dans une conversation
 */
export const SEND_MESSAGE = gql`
  mutation AddMessage($input: CreateMessageInput!) {
    addMessage(input: $input) {
      id_message
      content
      created_at
      is_read
    }
  }
`;


export const GET_MY_REPORTS = gql`
  query getMyReports($limit: Int, $offset: Int) {
    getMyReports(limit: $limit, offset: $offset) {
      reports {
        id_report
        report_type
        reported_id
        reason
        details
        status
        created_at
        updated_at
      }
      totalCount
      hasNextPage
    }
  }
`;

export const CREATE_REPORT = gql`
  mutation addReport($input: CreateReportInput!) {
    addReport(input: $input) {
      id_report
      details
      status
      created_at
    }
  }
`;














/**
 * Marquer un message comme lu
 */
export const MARK_MESSAGE_AS_READ = gql`
  mutation MarkMessageAsRead($id_message: ID!) {
    markMessageAsRead(id_message: $id_message)
  }
`;

// ========================================
// MUTATIONS POUR MESSAGES
// ========================================

/**
 * ✅ NOUVEAU : Modifier un message
 */
export const UPDATE_MESSAGE = gql`
  mutation UpdateMessage($input: UpdateMessageInput!) {
    updateMessage(input: $input) {
      id_message
      content
      updated_at
    }
  }
`;

/**
 * ✅ NOUVEAU : Supprimer un message
 */
export const DELETE_MESSAGE = gql`
  mutation deleteMessage($input: DeleteMessageInput!) {
    deleteMessage(input: $input)
  }
`;

// ========================================
// MUTATIONS POUR DISCUSSIONS
// ========================================

/**
 * ✅ NOUVEAU : Créer une discussion
 */
export const CREATE_DISCUSSION = gql`
  mutation addDiscussion($input: CreateDiscussionInput!) {
    addDiscussion(input: $input) {
      id_conversation
      subject
      created_at
      created_by {
        id_user
        pseudo
      }
    }
  }
`;

/**
 * ✅ NOUVEAU : Modifier une discussion (sujet)
 */
export const UPDATE_DISCUSSION = gql`
  mutation updateDiscussion($input: UpdateDiscussionInput!) {
    updateDiscussion(input: $input) {
      id_conversation
      subject
      updated_at
    }
  }
`;

/**
 * ✅ NOUVEAU : Supprimer une discussion
 */
export const DELETE_DISCUSSION = gql`
  mutation deleteDiscussion($input: DeleteDiscussionInput!) {
    deleteDiscussion(input: $input)
  }
`;

// ========================================
// MUTATIONS POUR SIGNALEMENTS
// ========================================

/**
 * ✅ NOUVEAU : Modifier un signalement (détails)
 */
export const UPDATE_REPORT = gql`
  mutation updateReport($input: UpdateReportInput!) {
    updateReport(input: $input) {
      id_report
      details
      updated_at
    }
  }
`;

/**
 * ✅ NOUVEAU : Supprimer un signalement
 */
export const DELETE_REPORT = gql`
  mutation deleteReport($input: DeleteReportInput!) {
    deleteReport(input: $input)
  }
`;





// ========================================
// QUERIES POUR LE PROFIL
// ========================================

export const UPDATE_PROFILE = gql`
  mutation UpdateProfile($input: UpdateProfileInput!) {
    updateProfile(input: $input) {
      id_user
      pseudo
      name
      email
      updated_at
    }
  }
`;

export const CHANGE_PASSWORD = gql`
  mutation ChangePassword($input: ChangePasswordInput!) {
    changePassword(input: $input)
  }
`;
