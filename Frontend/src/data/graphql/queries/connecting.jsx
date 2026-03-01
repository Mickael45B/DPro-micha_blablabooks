import { gql } from '@apollo/client';

// requetes pour la page d'accueil

export const GET_NUMBER_OF_USERS = gql`
  query getTotalUsersCount {
    getTotalUsersCount
  }
`;

export const GET_NUMBER_OF_BOOKS = gql`
  query getTotalBooksCount {
    getTotalBooksCount
  }
`;

export const GET_NUMBER_OF_REVIEWS = gql`
    query getTotalReviewsCount {  
        getTotalReviewsCount
    }
`;

/**
 * Récupérer le nombre total d'avis postés par l'utilisateur
 */
export const GET_MY_REVIEWS_COUNT = gql`
  query GetMyReviewsCount {
    getMyReviews(limit: 1, offset: 0) {
      totalCount
    }
  }
`;

/**
 * Récupérer le nombre de fils de discussion dans lesquels l'utilisateur participe
 */
export const GET_MY_CONVERSATIONS_COUNT = gql`
  query GetMyConversationsCount {
    getUserDiscussions(limit: 1, offset: 0) {
      totalCount
    }
  }
`;

/**
 * Récupérer le nombre de messages non lus destinés à l'utilisateur
 * (tous fils de discussion confondus)
 */
export const GET_MY_UNREAD_MESSAGES_COUNT = gql`
  query GetMyUnreadMessagesCount {
    getMyUnreadMessagesCount
  }
`;

/**
 * Récupérer le nombre de signalements en cours (non résolus/non annulés)
 */
export const GET_MY_PENDING_REPORTS_COUNT = gql`
  query GetMyPendingReportsCount {
    getMyPendingReportsCount
  }
`;

/**
 * Récupérer toutes les statistiques en une seule query (optimisé)
 */
export const GET_DASHBOARD_STATS = gql`
  query GetDashboardStats {
    getMyReviews(limit: 1, offset: 0) {
      totalCount
    }
    getUserDiscussions(limit: 1, offset: 0) {
      totalCount
    }
    getMyUnreadMessagesCount
    getMyPendingReportsCount
  }
`;