/**
 * UserProfileModalWrapper - Wrapper qui charge les données utilisateur
 */
import React from 'react';
import { useQuery } from '@apollo/client';
import { GET_USER } from './adminQueries.jsx';
import UserProfileModal from './UserProfileModal';

const UserProfileModalWrapper = ({ userId, onClose }) => {
  const { data, loading, error } = useQuery(GET_USER, {
    variables: { id_user: userId },
    skip: !userId
  });

  if (!userId) return null;

  if (loading) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <div className="loading">
            <i className="fas fa-spinner fa-spin"></i> Chargement du profil...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal__header">
            <h2>Erreur</h2>
            <button className="modal__close" onClick={onClose}>
              <i className="fas fa-times"></i>
            </button>
          </div>
          <div className="modal__body">
            <div className="error">
              <i className="fas fa-exclamation-triangle"></i>
              Impossible de charger le profil : {error.message}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const user = data?.getUser;
  if (!user) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal__body">
            <div className="error">Utilisateur non trouvé</div>
          </div>
        </div>
      </div>
    );
  }

  return <UserProfileModal user={user} onClose={onClose} />;
};

export default UserProfileModalWrapper;
