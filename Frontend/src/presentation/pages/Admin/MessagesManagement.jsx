/**
 * MessagesManagement - Gestion des messages
 */
import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { GET_MESSAGES, CREATE_MESSAGE, DELETE_MESSAGE } from './adminQueries.jsx';

const MessagesManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [formData, setFormData] = useState({
    id_receiver: '',
    subject: '',
    content: ''
  });

  const { data, loading, error, refetch } = useQuery(GET_MESSAGES, {
    variables: { limit: 100, offset: 0, order: 'created_at', direction: 'DESC' }
  });

  const [createMessage] = useMutation(CREATE_MESSAGE, {
    onCompleted: () => {
      refetch();
      setShowCreateModal(false);
      resetForm();
      alert('✅ Message envoyé avec succès !');
    },
    onError: (error) => {
      console.error('Erreur CREATE_MESSAGE:', error);
      alert('❌ Erreur : ' + error.message);
    }
  });

  const [deleteMessage] = useMutation(DELETE_MESSAGE, {
    onCompleted: () => {
      refetch();
      alert('✅ Message supprimé avec succès !');
    },
    onError: (error) => {
      console.error('Erreur DELETE_MESSAGE:', error);
      alert('❌ Erreur : ' + error.message);
    }
  });

  const resetForm = () => {
    setFormData({
      id_receiver: '',
      subject: '',
      content: ''
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    await createMessage({
      variables: {
        input: {
            id_receiver: formData.id_receiver,
            subject: formData.subject,
            content: formData.content
        }
    }
    });
  };

  const handleDelete = async (id_message) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce message ?')) {
      await deleteMessage({ variables: { input: { id_message } } });
    }
  };

  const openViewModal = (message) => {
    setSelectedMessage(message);
    setShowViewModal(true);
  };

  if (loading) return <div className="loading">Chargement...</div>;
  if (error) return <div className="error">Erreur : {error.message}</div>;

  const messages = data?.getMessages.messages || [];

  return (
    <div className="messages-management">
      <div className="section-header">
        <h2 className="section-title">
          <i className="fas fa-envelope"></i> Gestion des messages
        </h2>
        <button 
          className="btn btn--primary" 
          onClick={() => setShowCreateModal(true)}
        >
          <i className="fas fa-plus"></i> Nouveau message
        </button>
      </div>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Rechercher dans les messages..."
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
              <th>Statut</th>
              <th>Sujet</th>
              <th>De</th>
              <th>À</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {messages
              .filter(message =>
                !searchTerm ||
                message.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                message.content?.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map(message => (
                <tr key={message.id_message} className={message.is_read ? '' : 'unread'}>
                  <td>
                    {message.is_read ? (
                      <span className="badge badge--success">
                        <i className="fas fa-check"></i> Lu
                      </span>
                    ) : (
                      <span className="badge badge--warning">
                        <i className="fas fa-envelope"></i> Non lu
                      </span>
                    )}
                  </td>
                  <td>
                    <button
                      className="message-subject"
                      onClick={() => openViewModal(message)}
                    >
                      <strong>{message.subject}</strong>
                    </button>
                  </td>
                  <td>
                    <span className="badge badge--info">
                      {message.sender.pseudo}
                    </span>
                  </td>
                  <td>
                    <span className="badge badge--primary">
                      {message.receiver.pseudo}
                    </span>
                  </td>
                  <td>{new Date(message.created_at).toLocaleDateString()}</td>
                  <td className="actions-cell">
                    <button
                      className="btn-icon btn-icon--view"
                      onClick={() => openViewModal(message)}
                      title="Lire le message"
                    >
                      <i className="fas fa-eye"></i>
                    </button>
                    <button
                      className="btn-icon btn-icon--delete"
                      onClick={() => handleDelete(message.id_message)}
                      title="Supprimer"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Modal Création */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2>Nouveau message</h2>
              <button className="modal__close" onClick={() => setShowCreateModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleCreate} className="modal__body">
              <div className="form-group">
                <label>Destinataire (ID utilisateur) *</label>
                <input
                  type="text"
                  name="id_receiver"
                  value={formData.id_receiver}
                  onChange={handleChange}
                  placeholder="ID de l'utilisateur destinataire"
                  required
                />
              </div>

              <div className="form-group">
                <label>Sujet *</label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="Sujet du message"
                  required
                />
              </div>

              <div className="form-group">
                <label>Message *</label>
                <textarea
                  name="content"
                  value={formData.content}
                  onChange={handleChange}
                  rows="8"
                  placeholder="Contenu du message"
                  required
                />
              </div>

              <div className="modal__actions">
                <button type="submit" className="btn btn--primary">
                  <i className="fas fa-paper-plane"></i> Envoyer
                </button>
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Visualisation */}
      {showViewModal && selectedMessage && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal modal--large" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2>{selectedMessage.subject}</h2>
              <button className="modal__close" onClick={() => setShowViewModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="modal__body">
              <div className="message-detail">
                <div className="message-detail__meta">
                  <div className="meta-item">
                    <i className="fas fa-user"></i>
                    <span>De : <strong>{selectedMessage.sender.pseudo}</strong></span>
                  </div>
                  <div className="meta-item">
                    <i className="fas fa-user-tag"></i>
                    <span>À : <strong>{selectedMessage.receiver.pseudo}</strong></span>
                  </div>
                  <div className="meta-item">
                    <i className="fas fa-calendar"></i>
                    <span>{new Date(selectedMessage.created_at).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</span>
                  </div>
                  <div className="meta-item">
                    <i className={selectedMessage.is_read ? 'fas fa-check-circle' : 'fas fa-envelope'}></i>
                    <span>{selectedMessage.is_read ? 'Lu' : 'Non lu'}</span>
                  </div>
                </div>

                <div className="message-detail__content">
                  <h4>Message :</h4>
                  <div className="message-content">
                    {selectedMessage.content}
                  </div>
                </div>
              </div>
            </div>

            <div className="modal__actions">
              <button 
                className="btn btn--danger"
                onClick={() => {
                  setShowViewModal(false);
                  handleDelete(selectedMessage.id_message);
                }}
              >
                <i className="fas fa-trash"></i> Supprimer
              </button>
              <button 
                className="btn btn--secondary"
                onClick={() => setShowViewModal(false)}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessagesManagement;
