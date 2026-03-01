/**
 * Gestion des utilisateurs - Section Admin
 */
import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { GET_USERS, SEARCH_USERS, UPDATE_USER, DELETE_USER, ADMIN_RESET_PASSWORD } from './adminQueries.jsx';
import UserProfileModal from './UserProfileModal';

const UsersManagement = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false); // ✅ NOUVEAU
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    pseudo: '',
    status: 1
  });
  const [newPassword, setNewPassword] = useState('');

  const { data, loading, error, refetch } = useQuery(GET_USERS, {
    variables: { limit: 100, offset: 0, order: 'created_at', direction: 'DESC' }
  });

  const [updateUser] = useMutation(UPDATE_USER, {
    onCompleted: () => {
      refetch();
      setShowEditModal(false);
      setSelectedUser(null);
      alert('Utilisateur modifié avec succès !');
    },
    onError: (error) => {
      console.error('Erreur UPDATE_USER:', error);
      alert('Erreur lors de la modification : ' + error.message);
    }
  });

  const [deleteUser] = useMutation(DELETE_USER, {
    onCompleted: () => {
      refetch();
      alert('Utilisateur supprimé avec succès !');
    },
    onError: (error) => {
      console.error('Erreur DELETE_USER:', error);
      alert('Erreur lors de la suppression : ' + error.message);
    }
  });

  const [adminResetPassword] = useMutation(ADMIN_RESET_PASSWORD, {
    onCompleted: () => {
      setShowPasswordModal(false);
      setSelectedUser(null);
      setNewPassword('');
      alert('Mot de passe réinitialisé avec succès !');
    },
    onError: (error) => {
      console.error('Erreur ADMIN_RESET_PASSWORD:', error);
      alert('Erreur lors de la réinitialisation : ' + error.message);
    }
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    await updateUser({
      variables: { 
       input: {
         id_user: selectedUser.id_user,
         name: formData.name,
         email: formData.email,
         pseudo: formData.pseudo,
         status: parseInt(formData.status, 10)
       }
      }
    });
  };

  const handleDelete = async (id_user) => {
    //console.log('Suppression de l\'utilisateur ID:', id_user);
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      await deleteUser({ variables: { input: { id_user } } });
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    await adminResetPassword({
      variables: {
        input: {
          id_user: selectedUser.id_user,
          newPassword: newPassword
        }
      }
    });
  };



  
  const openEditModal = (user) => {
    setSelectedUser(user);
    setFormData({
      name: user.name || '',
      email: user.email || '',
      pseudo: user.pseudo || '',
      status: user.status?.id_status || 1
    });
    setShowEditModal(true);
  };

  const openPasswordModal = (user) => {
    setSelectedUser(user);
    setShowPasswordModal(true);
  };

  const openProfileModal = (user) => {
    setSelectedUser(user);
    setShowProfileModal(true);
  };

  const closeProfileModal = () => {
    setShowProfileModal(false);
    setSelectedUser(null);
  };

    /**
   * @param {number|string} statusId - L'ID du status (1-5)
   * @returns {object} {label, class}
   */
   const getStatusLabel = (statusId) => {
    const statusMap = {
      1: { label: 'Actif', class: 'success' },
      2: { label: 'Bloqué par admin', class: 'danger' },
      3: { label: 'Autobloqué', class: 'warning' },
      4: { label: 'Bloqué (admin + user)', class: 'danger' },
      5: { label: 'Supprimé', class: 'danger' }
    };
    return statusMap[statusId] || { label: 'Inconnu', class: 'secondary' };
  };


  if (loading) return <div className="loading">Chargement...</div>;
  if (error) return <div className="error">Erreur : {error.message}</div>;

  const users = data?.getUsers?.users ?? [];

  return (
    <div className="users-management">
      <div className="section-header">
        <h2 className="section-title">
          <i className="fas fa-users"></i> Gestion des utilisateurs
        </h2>
      </div>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Rechercher par nom, email ou pseudo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <i className="fas fa-search search-icon"></i>
      </div>

      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Pseudo</th>
              <th>Email</th>
              <th>Nom</th>
              <th>Statut</th>
              <th>Inscription</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users
              .filter(user =>
                !searchTerm ||
                user.pseudo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.name?.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map(user => {
                const statusId = user.status?.id_status;
                const statusInfo = getStatusLabel(statusId);

                return (
                  <tr key={user.id_user}>
                    <td>
                      <button
                        className="user-link"
                        onClick={() => openProfileModal(user)}
                      >
                        <strong>{user.pseudo}</strong>
                      </button>
                    </td>
                    <td>{user.email}</td>
                    <td>{user.name || '-'}</td>
                    <td>
                      <span className={`badge badge--${statusInfo.class}`} id={`status_${statusId}`} title={`Status ID: ${statusId}`}>
                        {statusInfo.label}
                      </span>
                    </td>
                    <td>{new Date(user.created_at).toLocaleDateString()}</td>
                    <td className="actions-cell">
                      <button
                        className="btn-icon btn-icon--view"
                        onClick={() => openProfileModal(user)}
                        title="Voir le profil"
                      >
                        <i className="fas fa-eye"></i>
                      </button>
                      <button
                        className="btn-icon btn-icon--edit"
                        onClick={() => openEditModal(user)}
                        title="Modifier"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button
                        className="btn-icon btn-icon--key"
                        onClick={() => openPasswordModal(user)}
                        title="Réinitialiser mot de passe"
                      >
                        <i className="fas fa-key"></i>
                      </button>
                      <button
                        className="btn-icon btn-icon--delete"
                        onClick={() => handleDelete(user.id_user)}
                        title="Supprimer"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {showProfileModal && selectedUser && (
        <UserProfileModal 
          user={selectedUser} 
          onClose={closeProfileModal} 
        />
      )}

      {/* Modal Édition */}
      {showEditModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2>Modifier l'utilisateur</h2>
              <button className="modal__close" onClick={() => setShowEditModal(false)} aria-label="Close edit modal">
                <i className="fas fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleEdit} className="modal__body">
              <div className="form-group">
                <label>Pseudo</label>
                <input
                  type="text"
                  name="pseudo"
                  value={formData.pseudo}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Nom</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Statut</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  required
                >
                  <option value="1">Actif</option>
                  <option value="2">Bloqué par admin</option>
                  <option value="3">Autobloqué</option>
                  <option value="4">Bloqué (admin + user)</option>
                  <option value="5">Supprimé</option>
                </select>
              </div>

              <div className="modal__actions">
                <button type="submit" className="btn btn--primary">
                  <i className="fas fa-save"></i> Enregistrer
                </button>
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={() => setShowEditModal(false)}
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Réinitialisation mot de passe */}
      {showPasswordModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2>Réinitialiser le mot de passe</h2>
              <button className="modal__close" onClick={() => setShowPasswordModal(false)} aria-label="Close password reset modal">
                <i className="fas fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="modal__body">
              <p>Réinitialiser le mot de passe pour <strong>{selectedUser.pseudo}</strong></p>

              <div className="form-group">
                <label>Nouveau mot de passe</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength="8"
                  required
                />
                <small>Au moins 8 caractères</small>
              </div>

              <div className="modal__actions">
                <button type="submit" className="btn btn--primary">
                  <i className="fas fa-key"></i> Réinitialiser
                </button>
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={() => setShowPasswordModal(false)}
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersManagement;
