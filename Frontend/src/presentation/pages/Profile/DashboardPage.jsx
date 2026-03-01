import React, { useState, useMemo, useEffect   } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import { getUserFromToken, clearAuth, DELETE_USER_MUTATION } from '../../../data/graphql/queries/auth.jsx';
import './DashboardPage.css';

// Import queries
import {
  GET_MY_REVIEWS,
  DELETE_REVIEW,
  UPDATE_REVIEW,
  GET_MY_CONVERSATIONS,
  GET_CONVERSATION_MESSAGES,
  SEND_MESSAGE,
  GET_MY_REPORTS,
  UPDATE_PROFILE,
  CHANGE_PASSWORD,
  UPDATE_MESSAGE,
  DELETE_MESSAGE,
  CREATE_DISCUSSION,
  UPDATE_DISCUSSION,
  DELETE_DISCUSSION,
  UPDATE_REPORT,
  DELETE_REPORT,
  CREATE_REPORT
} from '../../../data/graphql/queries/Dashboardqueries.jsx';


import {GET_DASHBOARD_STATS} from '../../../data/graphql/queries/connecting.jsx';

const DashboardPage = () => {
  const navigate = useNavigate();
  const userState = getUserFromToken();
  
  // États
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [editFormData, setEditFormData] = useState({
    title_rating: '',
    rating: 5,
    comment: ''
  });

  //  ÉTATS POUR MESSAGES
  const [showNewDiscussionModal, setShowNewDiscussionModal] = useState(false);
  const [showEditDiscussionModal, setShowEditDiscussionModal] = useState(false);
  const [showEditMessageModal, setShowEditMessageModal] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [selectedDiscussion, setSelectedDiscussion] = useState(null);
  const [newDiscussionForm, setNewDiscussionForm] = useState({
    subject: '',
    recipient_pseudo: '',
    content: ''
  });
  const [editDiscussionSubject, setEditDiscussionSubject] = useState('');
  const [editMessageContent, setEditMessageContent] = useState('');

  //  ÉTATS POUR SIGNALEMENTS
  const [showNewReportModal, setShowNewReportModal] = useState(false);
  const [showEditReportModal, setShowEditReportModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [newReportForm, setNewReportForm] = useState({
    report_type: 'USER',
    reported_id: '',
    reason: 'Spam ou publicité non sollicitée',
    details: ''
  });
  const [editReportDetails, setEditReportDetails] = useState('');  

  // Form data
  const [formData, setFormData] = useState({
    email: userState?.email || '',
    pseudo: userState?.pseudo || userState?.name || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [message, setMessage] = useState({ type: '', text: '' });

  // ========================================
  // QUERIES
  // ========================================

  const { data: statsData, refetch: refetchStats } = useQuery(GET_DASHBOARD_STATS, {
    fetchPolicy: 'cache-and-network', // Toujours récupérer les dernières données
    pollInterval: 30000 // Rafraîchir toutes les 30 secondes
  });

  const { data: reviewsData, refetch: refetchReviews } = useQuery(GET_MY_REVIEWS, {
    skip: activeTab !== 'reviews',
    fetchPolicy: 'network-only'
  });

  const { data: conversationsData, refetch: refetchConversations } = useQuery(GET_MY_CONVERSATIONS, {
    skip: activeTab !== 'messages',
    fetchPolicy: 'network-only'
  });

  const { data: messagesData, refetch: refetchMessages } = useQuery(GET_CONVERSATION_MESSAGES, {
    variables: { id_conversation: selectedConversation },
    skip: !selectedConversation,
    fetchPolicy: 'network-only'
  });

  const {data: reportsData, refetch: refetchReports } = useQuery(GET_MY_REPORTS, {
    skip: activeTab !== 'reports',
    fetchPolicy: 'network-only'
  });

  // Scroll automatique vers le dernier message
  useEffect(() => {
    if (messagesData?.getDiscussionByID?.messages) {
      const messagesContainer = document.querySelector('.messages-list');
      if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    }
  }, [messagesData]);  
  // ========================================
  // STATISTIQUES (calculées depuis statsData)
  // ========================================

  const dashboardStats = useMemo(() => ({
    totalReviews: statsData?.getMyReviews?.totalCount || 0,
    totalConversations: statsData?.getUserDiscussions?.totalCount || 0,
    unreadMessages: statsData?.getMyUnreadMessagesCount || 0,
    pendingReports: statsData?.getMyPendingReportsCount || 0
  }), [statsData]);

  // ========================================
  // MUTATIONS
  // ========================================

  const [deleteReview] = useMutation(DELETE_REVIEW, {
    onCompleted: () => {
      refetchReviews();
      refetchStats(); // Rafraîchir les statistiques
      setMessage({ type: 'success', text: 'Avis supprimé avec succès' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  });

  const [updateReview] = useMutation(UPDATE_REVIEW, {
    onCompleted: () => {
      refetchReviews();
      setIsEditModalOpen(false);
      setSelectedReview(null);
      setMessage({ type: 'success', text: 'Avis modifié avec succès' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    },
    onError: (error) => {
      setMessage({ type: 'error', text: error.message });
    }
  });  

  // ========================================
  // MUTATIONS - MESSAGES
  // ========================================
  
  const [sendMessage_mutation] = useMutation(SEND_MESSAGE, {
    onCompleted: () => {
      setNewMessage('');
      refetchMessages();
      refetchConversations();
      refetchStats(); // Rafraîchir les statistiques
    },
    onError: (error) => {
      setMessage({ type: 'error', text: error.message });
    }
  });

  const [updateMessage_mutation] = useMutation(UPDATE_MESSAGE, {
    onCompleted: () => {
      refetchMessages();
      setShowEditMessageModal(false);
      setSelectedMessage(null);
      setMessage({ type: 'success', text: 'Message modifié' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    },
    onError: (error) => {
      setMessage({ type: 'error', text: error.message });
    }
  });

  const [deleteMessage_mutation] = useMutation(DELETE_MESSAGE, {
    onCompleted: () => {
      refetchMessages();
      refetchStats();
      setMessage({ type: 'success', text: 'Message supprimé' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    },
    onError: (error) => {
      setMessage({ type: 'error', text: error.message });
    }
  });

  // ========================================
  // MUTATIONS - DISCUSSIONS
  // ========================================

  const [createDiscussion_mutation] = useMutation(CREATE_DISCUSSION, {
    onCompleted: () => {
      refetchConversations();
      refetchStats();
      setShowNewDiscussionModal(false);
      setNewDiscussionForm({ subject: '', recipient_pseudo: '', content: '' });
      setMessage({ type: 'success', text: 'Discussion créée' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    },
    onError: (error) => {
      setMessage({ type: 'error', text: error.message });
    }
  });

  const [updateDiscussion_mutation] = useMutation(UPDATE_DISCUSSION, {
    onCompleted: () => {
      refetchConversations();
      refetchMessages();
      setShowEditDiscussionModal(false);
      setSelectedDiscussion(null);
      setMessage({ type: 'success', text: 'Sujet modifié' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    },
    onError: (error) => {
      setMessage({ type: 'error', text: error.message });
    }
  });

  const [deleteDiscussion_mutation] = useMutation(DELETE_DISCUSSION, {
    onCompleted: () => {
      refetchConversations();
      refetchStats();
      setSelectedConversation(null);
      setMessage({ type: 'success', text: 'Discussion supprimée' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    },
    onError: (error) => {
      setMessage({ type: 'error', text: error.message });
    }
  });

  // ========================================
  // MUTATIONS - SIGNALEMENTS
  // ========================================

  const [createReport_mutation] = useMutation(CREATE_REPORT, {
    onCompleted: () => {
      refetchReports();
      refetchStats();
      setShowNewReportModal(false);
      setNewReportForm({ report_type: 'USER', reported_id: '', reason: 'Spam ou publicité non sollicitée', details: '' });
      setMessage({ type: 'success', text: 'Signalement créé' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    },
    onError: (error) => {
      setMessage({ type: 'error', text: error.message });
    }
  });

  const [updateReport_mutation] = useMutation(UPDATE_REPORT, {
    onCompleted: () => {
      refetchReports();
      setShowEditReportModal(false);
      setSelectedReport(null);
      setMessage({ type: 'success', text: 'Signalement modifié' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    },
    onError: (error) => {
      setMessage({ type: 'error', text: error.message });
    }
  });

  const [deleteReport_mutation] = useMutation(DELETE_REPORT, {
    onCompleted: () => {
      refetchReports();
      refetchStats();
      setMessage({ type: 'success', text: 'Signalement supprimé' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    },
    onError: (error) => {
      setMessage({ type: 'error', text: error.message });
    }
  });

  // ========================================
  // MUTATIONS - PROFIL
  // ========================================

  const [updateProfile] = useMutation(UPDATE_PROFILE, {
    onCompleted: () => {
      setMessage({ type: 'success', text: 'Profil mis à jour' });
      setIsEditing(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  });

  const [changePassword] = useMutation(CHANGE_PASSWORD, {
    onCompleted: () => {
      setMessage({ type: 'success', text: 'Mot de passe modifié' });
      setShowPasswordModal(false);
      setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    },
    onError: (error) => {
      setMessage({ type: 'error', text: error.message });
    }
  });

  const [deleteAccount_mutation] = useMutation(DELETE_USER_MUTATION, {
    onCompleted: () => {
      setMessage({ type: 'success', text: 'Compte supprimé avec succès.' });
      setTimeout(() => {
        localStorage.removeItem('token');
        navigate('/connexion');
      }, 2000);
    },
    onError: (error) => {
      setMessage({ type: 'error', text: error.message });
    }
  });

  // ========================================
  // HANDLERS - GÉNÉRAL
  // ========================================

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // ========================================
  // HANDLERS - AVIS
  // ========================================

  const handleDeleteReview = (id_review) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet avis ?')) {
      deleteReview({ variables: { input: { id_review } } });
    }
  };

  const handleOpenEditModal = (review) => {
    setSelectedReview(review);
    setEditFormData({
      title_rating: review.title_rating || '',
      rating: review.rating || 5,
      comment: review.comment || ''
    });
    setIsEditModalOpen(true);
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: name === 'rating' ? parseInt(value) : value
    }));
  };

  const handleSubmitEditReview = (e) => {
    e.preventDefault();
    
    if (!selectedReview) return;

    updateReview({
      variables: {
        input: {
          id_review: selectedReview.id_review,
          title_rating: editFormData.title_rating,
          rating: editFormData.rating,
          comment: editFormData.comment
        }
      }
    });
  };

  // ========================================
  // HANDLERS - MESSAGES
  // ========================================

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    // Déterminer le receveur (l'autre participant de la discussion)
    const discussion = messagesData?.getDiscussionByID;
    const otherParticipant = discussion?.messages?.length > 0
      ? discussion.messages[0].sender.id_user === userState.id_user
        ? discussion.messages[0].receiver.id_user
        : discussion.messages[0].sender.id_user
      : null;

    if (!otherParticipant) {
      setMessage({ type: 'error', text: 'Impossible de déterminer le destinataire' });
      return;
    }

    sendMessage_mutation({
      variables: {
        input: {
          id_sender: userState.id_user,
          id_receiver: otherParticipant,
          subject: selectedConversation,
          content: newMessage
        }
      }
    });
  };

  const handleOpenEditMessageModal = (msg) => {
    setSelectedMessage(msg);
    setEditMessageContent(msg.content);
    setShowEditMessageModal(true);
  };

  const handleUpdateMessage = (e) => {
    e.preventDefault();
    if (!editMessageContent.trim()) return;

    updateMessage_mutation({
      variables: {
        input: {
          id_message: selectedMessage.id_message,
          content: editMessageContent
        }
      }
    });
  };

  const handleDeleteMessage = (id_message) => {
    if (window.confirm('Supprimer ce message ?')) {
      deleteMessage_mutation({ variables: {input : { id_message } } });
    }
  };

  // ========================================
  // HANDLERS - DISCUSSIONS
  // ========================================

  const handleOpenEditDiscussionModal = (discussion) => {
    setSelectedDiscussion(discussion);
    setEditDiscussionSubject(discussion.subject);
    setShowEditDiscussionModal(true);
  };

  const handleUpdateDiscussion = (e) => {
    e.preventDefault();
    if (!editDiscussionSubject.trim()) return;

    updateDiscussion_mutation({
      variables: {
        input: {
          id_conversation: selectedDiscussion.id_conversation,
          subject: editDiscussionSubject
        }
      }
    });
  };

  const handleDeleteDiscussion = (id_conversation) => {
    if (window.confirm('Supprimer cette discussion et tous ses messages ?')) {
      deleteDiscussion_mutation({ variables: { input: { id_conversation } } });
    }
  };

  const handleCreateDiscussion = (e) => {
    e.preventDefault();
    if (!newDiscussionForm.subject.trim() || !newDiscussionForm.recipient_pseudo.trim() || !newDiscussionForm.content.trim()) {
      setMessage({ type: 'error', text: 'Tous les champs sont requis' });
      return;
    }

    createDiscussion_mutation({
      variables: {
        input: {
          subject: newDiscussionForm.subject,
          recipient_pseudo: newDiscussionForm.recipient_pseudo,
          content: newDiscussionForm.content
        }
      }
    });
  };

  // ========================================
  // HANDLERS - SIGNALEMENTS
  // ========================================

  const handleCreateReport = (e) => {
    e.preventDefault();
    if (!newReportForm.details.trim()) {
      setMessage({ type: 'error', text: 'Les détails sont requis' });
      return;
    }

    createReport_mutation({
      variables: {
        input: {
          report_type: newReportForm.report_type,
          reported_id: newReportForm.reported_id || null,
          reason: newReportForm.reason,
          details: newReportForm.details
        }
      }
    });
  };

  const handleOpenEditReportModal = (report) => {
    setSelectedReport(report);
    setEditReportDetails(report.details);
    setShowEditReportModal(true);
  };

  const handleUpdateReport = (e) => {
    e.preventDefault();
    if (!editReportDetails.trim()) return;

    updateReport_mutation({
      variables: {
        input: {
          id_report: selectedReport.id_report,
          details: editReportDetails
        }
      }
    });
  };

  const handleDeleteReport = (id_report) => {
    if (window.confirm('Supprimer ce signalement ?')) {
      deleteReport_mutation({ variables: { input: { id_report } } });
    }
  };

  // ========================================
  // HANDLERS - PROFIL
  // ========================================

  const handleSaveProfile = (e) => {
    e.preventDefault();
    updateProfile({
      variables: {
        input: {
          pseudo: formData.pseudo,
          email: formData.email
        }
      }
    });
  };

  const handleChangePassword_submit = (e) => {
    e.preventDefault();
    
    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'Les mots de passe ne correspondent pas' });
      return;
    }
    
    if (formData.newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Le mot de passe doit contenir au moins 8 caractères' });
      return;
    }
    
    changePassword({
      variables: {
        input: {
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        }
      }
    });
  };

  const handleDeleteAccount = () => {
  if (window.confirm('Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.')) {
    deleteAccount_mutation({
      variables: {
        input: {
          id_user: userData?.getUser?.id_user
        }
      }
    });
  }
  };


  // ========================================
  // 
  // ========================================

  const handleToggleBlock = async () => {
    try {
      // TODO: Appel API pour bloquer/débloquer le profil
      // await toggleProfileBlock(!formData.isProfileBlocked);
      
      setFormData(prev => ({ ...prev, isProfileBlocked: !prev.isProfileBlocked }));
      setMessage({ 
        type: 'success', 
        text: formData.isProfileBlocked ? 'Profil débloqué.' : 'Profil bloqué.' 
      });
      
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur lors de la modification du statut.' });
    }
  };


  const setShowEditReviewModal = (review) => {
  setSelectedReview(review);
  setIsEditModalOpen(true);
  };

  // ========================================
  // RENDER - DASHBOARD
  // ========================================

  const renderDashboard = () => (
    <div className="dashboard-overview">
      <h2 className="section-title">
        <i className="fas fa-chart-line"></i>
        Vue d'ensemble
      </h2>
      
      <div className="stats-grid">
        <div
          className="stat-card stat-card--warning"
          onClick={() => {
            setActiveTab('reviews');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          <div className="stat-card__icon">
            <i className="fas fa-star"></i>
          </div>
          <div className="stat-card__content">
            <h3>{dashboardStats.totalReviews}</h3>
            <p>Mes avis</p>
          </div>
        </div>

        <div
          className="stat-card stat-card--info"
          onClick={() => {
            setActiveTab('messages');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          <div className="stat-card__icon">
            <i className="fas fa-envelope"></i>
          </div>
          <div className="stat-card__content">
            <h3>{dashboardStats.totalConversations}</h3>
            <p>Conversations</p>
          </div>
        </div>

        <div
          className="stat-card stat-card--primary"
          onClick={() => {
            setActiveTab('messages');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          <div className="stat-card__icon">
            <i className="fas fa-envelope-open"></i>
          </div>
          <div className="stat-card__content">
            <h3>{dashboardStats.unreadMessages}</h3>
            <p>Messages non lus</p>
          </div>
        </div>

        <div
          className="stat-card stat-card--danger"
          onClick={() => {
            setActiveTab('reports');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          <div className="stat-card__icon">
            <i className="fas fa-flag"></i>
          </div>
          <div className="stat-card__content">
            <h3>{dashboardStats.pendingReports}</h3>
            <p>Signalements en cours</p>
          </div>
        </div>
      </div>
      
      <div className="quick-actions">
        <h3>Actions rapides</h3>
        <div className="quick-actions__grid">
          <button 
            className="quick-action-btn"
            onClick={() => {
              setActiveTab('personal');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <i className="fas fa-user-edit"></i>
            Modifier mon profil
          </button>
          
          <button 
            className="quick-action-btn"
            onClick={() => {
              setActiveTab('reviews');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <i className="fas fa-star"></i>
            Voir mes avis
          </button>
          
          <button 
            className="quick-action-btn"
            onClick={() => {
              setActiveTab('messages');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <i className="fas fa-envelope"></i>
            Mes messages
            {dashboardStats.unreadMessages > 0 && (
              <span className="badge-notification">{dashboardStats.unreadMessages}</span>
            )}
          </button>
          
          <button 
            className="quick-action-btn"
            onClick={() => {
              navigate('/catalogue');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <i className="fas fa-book"></i>
            Parcourir les livres
          </button>
        </div>
      </div>
    </div>
  );

  // ========================================
  // RENDER - MESSAGES
  // ========================================

  const renderMessages = () => {
    const conversations = conversationsData?.getUserDiscussions?.discussions || [];
    const currentDiscussion = messagesData?.getDiscussionByID;

    return (
      <div className="dashboard-section">

        <div className="section-header">
          <h2 className="section-title">
            <i className="fas fa-envelope"></i>
            Mes messages
          </h2>
          <button 
            className="btn btn--primary"
            onClick={() => setShowNewDiscussionModal(true)}
          >
            <i className="fas fa-plus"></i>
            Nouvelle discussion
          </button>
        </div>

        <div className="messages-layout">
          {/* Liste conversations avec scroll */}
          <div className="conversations-panel card">
            <h3 className="panel-title">Conversations ({conversations.length})</h3>
            <div className="conversations-list">
              {conversations.length === 0 ? (
                <div className="empty-state-small">
                  <i className="fas fa-inbox"></i>
                  <p>Aucune conversation</p>
                </div>
              ) : (
                conversations.map((conv) => (
                  <div
                    key={conv.id_conversation}
                    className={`conversation-item ${selectedConversation === conv.id_conversation ? 'conversation-item--active' : ''}`}
                    onClick={() => setSelectedConversation(conv.id_conversation)}
                  >
                    <div className="conversation-avatar">
                      <i className="fas fa-user-circle"></i>
                    </div>
                    <div className="conversation-info">
                      {/* Titre avec défilement automatique */}
                      <h4 className="conversation-subject-scroll">{conv.subject}</h4>
                      <span className="conversation-date">
                        {conv.last_message_at && new Date(conv.last_message_at).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Messages avec actions */}
          {selectedConversation && currentDiscussion ? (
            <div className="messages-panel card">

              <div className="panel-header">

                <h3 className="panel-title">
                  {currentDiscussion.subject}
                </h3>

                {/*  Actions sur la discussion (si créateur) */}
                {currentDiscussion.created_by?.id_user === userState.id_user && (
                  <div className="panel-actions">
                    <button
                      className="btn btn--icon"
                      onClick={() => handleOpenEditDiscussionModal(currentDiscussion)}
                      title="Modifier le sujet"
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button
                      className="btn btn--icon btn--danger"
                      onClick={() => handleDeleteDiscussion(currentDiscussion.id_conversation)}
                      title="Supprimer la discussion"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                )}
                
              </div>
              
              <div className="messages-list">
                {currentDiscussion.messages.map((msg) => {
                  const isMine = msg.sender.id_user === userState.id_user;
                  return (
                    <div
                      key={msg.id_message}
                      className={`message-bubble ${isMine ? 'message-bubble--sent' : 'message-bubble--received'}`}
                    >

                      <div className="message-content">
                        <p>{msg.content}</p>
                        <span className="message-time">
                          {new Date(msg.created_at).toLocaleString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>

                        {/* ✅ Actions sur le message (si c'est le sien) */}
                        {isMine && (
                          <div className="message-actions">
                            <button
                              className="btn-message-action"
                              onClick={() => handleOpenEditMessageModal(msg)}
                              title="Modifier"
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button
                              className="btn-message-action btn-message-action--danger"
                              onClick={() => handleDeleteMessage(msg.id_message)}
                              title="Supprimer"
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        )}

                      </div>
                    </div>
                  );
                })}
              </div>

              <form className="message-input-form" onSubmit={handleSendMessage}>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Écrire un message..."
                  className="form-control"
                />
                <button type="submit" className="btn btn--primary">
                  <i className="fas fa-paper-plane"></i>
                </button>
              </form>
            </div>
          ) : (
            <div className="messages-panel-empty card">
              <div className="empty-state">
                <i className="fas fa-comments"></i>
                <p>Sélectionnez une conversation pour voir les messages</p>
              </div>
            </div>
          )}
        </div>

        {/*  MODAL - Nouvelle discussion */}
        {showNewDiscussionModal && (
          <div className="modal-backdrop" onClick={() => setShowNewDiscussionModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Nouvelle discussion</h3>
                <button className="modal-close" onClick={() => setShowNewDiscussionModal(false)}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <form onSubmit={handleCreateDiscussion}>
                <div className="modal-body">
                  <div className="form-group">
                    <label>Sujet</label>
                    <input
                      type="text"
                      className="form-control"
                      value={newDiscussionForm.subject}
                      onChange={(e) => setNewDiscussionForm(prev => ({ ...prev, subject: e.target.value }))}
                      placeholder="Ex: Question sur un livre"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Destinataire (pseudo)</label>
                    <input
                      type="text"
                      className="form-control"
                      value={newDiscussionForm.recipient_pseudo}
                      onChange={(e) => setNewDiscussionForm(prev => ({ ...prev, recipient_pseudo: e.target.value }))}
                      placeholder="Ex: grand malade"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Premier message</label>
                    <textarea
                      className="form-control"
                      rows="4"
                      value={newDiscussionForm.content}
                      onChange={(e) => setNewDiscussionForm(prev => ({ ...prev, content: e.target.value }))}
                      placeholder="Votre message..."
                      required
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn--default" onClick={() => setShowNewDiscussionModal(false)}>
                    Annuler
                  </button>
                  <button type="submit" className="btn btn--primary">
                    Créer
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/*  MODAL - Modifier discussion */}
        {showEditDiscussionModal && selectedDiscussion && (
          <div className="modal-backdrop" onClick={() => setShowEditDiscussionModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Modifier le sujet</h3>
                <button className="modal-close" onClick={() => setShowEditDiscussionModal(false)}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <form onSubmit={handleUpdateDiscussion}>
                <div className="modal-body">
                  <div className="form-group">
                    <label>Nouveau sujet</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editDiscussionSubject}
                      onChange={(e) => setEditDiscussionSubject(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn--default" onClick={() => setShowEditDiscussionModal(false)}>
                    Annuler
                  </button>
                  <button type="submit" className="btn btn--success">
                    Modifier
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/*  MODAL - Modifier message */}
        {showEditMessageModal && selectedMessage && (
          <div className="modal-backdrop" onClick={() => setShowEditMessageModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Modifier le message</h3>
                <button className="modal-close" onClick={() => setShowEditMessageModal(false)}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <form onSubmit={handleUpdateMessage}>
                <div className="modal-body">
                  <div className="form-group">
                    <label>Contenu</label>
                    <textarea
                      className="form-control"
                      rows="4"
                      value={editMessageContent}
                      onChange={(e) => setEditMessageContent(e.target.value)}
                      required
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn--default" onClick={() => setShowEditMessageModal(false)}>
                    Annuler
                  </button>
                  <button type="submit" className="btn btn--success">
                    Modifier
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}      
      </div>
    );
  };

  // ========================================
  // RENDER - SIGNALEMENTS
  // ========================================

  const renderReports = () => (
    <div className="dashboard-section">

      <div className="section-header">

        <h2 className="section-title">
          <i className="fas fa-flag"></i>
          Mes signalements
        </h2>

        <button 
          className="btn btn--primary"
          onClick={() => setShowNewReportModal(true)}
        >
          <i className="fas fa-plus"></i>
          Nouveau signalement
        </button>

      </div>

      {!reportsData?.getMyReports?.reports?.length ? (
        <div className="empty-state">
          <i className="fas fa-clipboard-check"></i>
          <p>Aucun signalement</p>
        </div>
      ) : (
        <div className="reports-list">
          {reportsData.getMyReports.reports.map((report) => (
            <div key={report.id_report} className="report-card card">

              <div className="report-header">
                <span className={`badge badge--${report.status}`}>
                  {report.status === 'pending' && '⏳ En attente'}
                  {report.status === 'in_review' && '🔍 En cours'}
                  {report.status === 'resolved' && '✅ Résolu'}
                  {report.status === 'dismissed' && '❌ Rejeté'}
                </span>
                <span className="report-date">
                  {new Date(report.created_at).toLocaleDateString('fr-FR')}
                </span>
              </div>

              <div className="report-content">
                <p className="report-description">{report.details}</p>
              </div>

              {/* ✅ Actions (seulement si status = pending ou in_review) */}
              {(report.status === 'pending' || report.status === 'in_review') && (
                <div className="report-actions">
                  <button
                    className="btn btn--icon"
                    onClick={() => handleOpenEditReportModal(report)}
                    title="Modifier"
                  >
                    <i className="fas fa-edit"></i>
                  </button>
                  <button
                    className="btn btn--icon btn--danger"
                    onClick={() => handleDeleteReport(report.id_report)}
                    title="Supprimer"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              )}

            </div>

          ))}
        </div>
      )}

      {/* ✅ MODAL - Nouveau signalement */}
      {showNewReportModal && (
        <div className="modal-backdrop" onClick={() => setShowNewReportModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Nouveau signalement</h3>
              <button className="modal-close" onClick={() => setShowNewReportModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleCreateReport}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Type</label>
                  <select
                    className="form-control"
                    value={newReportForm.report_type}
                    onChange={(e) => setNewReportForm(prev => ({ ...prev, report_type: e.target.value }))}
                  >
                    <option value="USER">Utilisateur</option>
                    <option value="REVIEW">Avis</option>
                    <option value="MESSAGE">Message</option>
                    <option value="OTHER">Autre</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>ID de l'élément signalé</label>
                  <input
                    type="text"
                    className="form-control"
                    value={newReportForm.reported_id}
                    onChange={(e) => setNewReportForm(prev => ({ ...prev, reported_id: e.target.value }))}
                    placeholder="ID (optionnel)"
                  />
                </div>
                <div className="form-group">
                  <label>Raison</label>
                  <select
                    className="form-control"
                    value={newReportForm.reason}
                    onChange={(e) => setNewReportForm(prev => ({ ...prev, reason: e.target.value }))}
                  >
                    <option value="Spam ou publicité non sollicitée">Spam</option>
                    <option value="Contenu inapproprié ou offensant">Contenu inapproprié</option>
                    <option value="Harcèlement ou insultes">Harcèlement</option>
                    <option value="Violation de droits d'auteur">Violation de droits</option>
                    <option value="Autre raison">Autre</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Détails</label>
                  <textarea
                    className="form-control"
                    rows="4"
                    value={newReportForm.details}
                    onChange={(e) => setNewReportForm(prev => ({ ...prev, details: e.target.value }))}
                    placeholder="Décrivez le problème..."
                    required
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn--default" onClick={() => setShowNewReportModal(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn btn--danger">
                  Signaler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ✅ MODAL - Modifier signalement */}
      {showEditReportModal && selectedReport && (
        <div className="modal-backdrop" onClick={() => setShowEditReportModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Modifier le signalement</h3>
              <button className="modal-close" onClick={() => setShowEditReportModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleUpdateReport}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Détails</label>
                  <textarea
                    className="form-control"
                    rows="4"
                    value={editReportDetails}
                    onChange={(e) => setEditReportDetails(e.target.value)}
                    required
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn--default" onClick={() => setShowEditReportModal(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn btn--success">
                  Modifier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );

  // ========================================
  // RENDER - AVIS
  // ========================================

  const renderReviews = () => (
    <div className="dashboard-section">

      <h2 className="section-title">
        <i className="fas fa-star"></i>
        Mes avis
      </h2>
      
      {!reviewsData?.getMyReviews?.reviews?.length ? (
        <div className="empty-state">
          <i className="fas fa-comment-slash"></i>
          <p>Vous n'avez pas encore posté d'avis</p>
          <button className="btn btn--primary" onClick={() => navigate('/livres')}>
            <i className="fas fa-book"></i>
            Parcourir les livres
          </button>
        </div>
      ) : (
        <>
          <div className="reviews-grid">
            {reviewsData.getMyReviews.reviews.map((review) => {
              const book = review.book;
              return (
              <div key={review.id_review} className="review-card card">
                <div className="review-card__image">
                  <img
                    src={book?.vignetteimage ? `/images/vignettesImages/${book.vignetteimage}` : '/images/booksImages/image_not_found.png'}
                    alt={book?.title || 'Livre supprimé'}
                    onError={(e) => {
                      e.target.src = '/images/booksImages/image_not_found.png';
                    }}
                  />
                </div>
                
                <div className="review-card__content">
                  <h4>{book?.title || 'Livre supprimé'}</h4>
                  <div className="review-rating">
                    {[...Array(5)].map((_, i) => (
                      <i
                        key={i}
                        className={`fas fa-star ${i < review.rating ? 'star--filled' : 'star--empty'}`}
                      ></i>
                    ))}
                  </div>
                  <h5>{review.title_rating}</h5>
                  <p>{review.comment}</p>
                  <span className="review-date">
                    <i className="far fa-calendar"></i>
                    {new Date(review.created_at).toLocaleDateString('fr-FR')}
                  </span>
                </div>

                <div className="review-card__actions">
                  <button
                    className="btn btn--icon"
                    onClick={() => book?.id_book && navigate(`/livres/${book.id_book}`)}
                    disabled={!book?.id_book}
                    title="Voir le livre"
                  >
                    <i className="fas fa-book-open"></i>
                  </button>

                  <button
                    className="btn btn--icon btn--primary"
                    onClick={() => handleOpenEditModal(review)}
                    title="Modifier"
                  >
                    <i className="fas fa-edit"></i>
                  </button>

                  <button
                    className="btn btn--icon btn--danger"
                    onClick={() => handleDeleteReview(review.id_review)}
                    title="Supprimer"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            );
            })}
          </div>

          {/* Modal d'édition d'avis */}
          {isEditModalOpen && selectedReview && (
            <div className="modal-backdrop" onClick={() => setIsEditModalOpen(false)}>
              <div className="modal modal--large" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>
                    <i className="fas fa-edit"></i>
                    Modifier l'avis
                  </h3>
                  <button className="modal-close" onClick={() => setIsEditModalOpen(false)}>
                    <i className="fas fa-times"></i>
                  </button>
                </div>
                
                <form onSubmit={handleSubmitEditReview}>
                  <div className="modal-body">
                    <div className="form-group">
                      <label htmlFor="title_rating">Titre de l'avis</label>
                      <input
                        type="text"
                        id="title_rating"
                        name="title_rating"
                        value={editFormData.title_rating}
                        onChange={handleEditFormChange}
                        className="form-control"
                        placeholder="Donnez un titre à votre avis"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="rating">Note</label>
                      <div className="rating-input">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            className={`star-btn ${star <= editFormData.rating ? 'star-btn--active' : ''}`}
                            onClick={() => setEditFormData(prev => ({ ...prev, rating: star }))}
                          >
                            <i className="fas fa-star"></i>
                          </button>
                        ))}
                        <span className="rating-text">
                          {editFormData.rating} / 5
                        </span>
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="comment">Commentaire</label>
                      <textarea
                        id="comment"
                        name="comment"
                        value={editFormData.comment}
                        onChange={handleEditFormChange}
                        className="form-control"
                        rows="6"
                        placeholder="Partagez votre avis sur ce livre..."
                        required
                      ></textarea>
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button 
                      type="button" 
                      className="btn btn--default" 
                      onClick={() => setIsEditModalOpen(false)}
                    >
                      Annuler
                    </button>
                    <button type="submit" className="btn btn--success">
                      <i className="fas fa-save"></i>
                      Enregistrer les modifications
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
          
        </>
      )}
    </div>
  );

  // ========================================
  // RENDER - PARAMETRES
  // ========================================

  const renderSettings = () => (
    <div className="profile-section">
      <div className="profile-section__header">
        <h2>Paramètres du compte</h2>
      </div>
      
      <div className="settings-card">
        <div className="settings-card__content">
          <div className="settings-card__icon">
            <i className="fas fa-user-lock"></i>
          </div>
          <div>
            <h3>Bloquer mon profil</h3>
            <p>Votre profil sera invisible pour les autres utilisateurs</p>
          </div>
        </div>
        <label className="toggle-switch">
          <input
            type="checkbox"
            checked={formData.isProfileBlocked}
            onChange={handleToggleBlock}
          />
          <span className="toggle-slider"></span>
        </label>
      </div>
      
      <div className="danger-zone">
        <h3>Zone dangereuse</h3>
        <p>Actions irréversibles sur votre compte</p>
        
        <button 
          className="btn btn--danger" 
          onClick={() => setShowDeleteModal(true)}
        >
          <i className="fas fa-trash-alt"></i> Supprimer mon compte
        </button>
      </div>
    </div>
  );

  // ========================================
  // RENDER - INFOS
  // ========================================

  const renderPersonalInfo = () => (
    
    <div className="dashboard-section">
      <div className="section-header">
        <h2 className="section-title">
          <i className="fas fa-user-circle"></i>
          Informations personnelles
        </h2>
        {!isEditing && (
          <button className="btn btn--primary" onClick={() => setIsEditing(true)}>
            <i className="fas fa-edit"></i>
            Modifier
          </button>
        )}
      </div>

      {message.text && (
        <div className={`alert alert--${message.type}`}>
          <i className={`fas fa-${message.type === 'success' ? 'check-circle' : 'exclamation-circle'}`}></i>
          {message.text}
        </div>
      )}

      <div className="card">
        <form onSubmit={handleSaveProfile} className="form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={!isEditing}
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label htmlFor="pseudo">Pseudo</label>
              <input
                type="text"
                id="pseudo"
                name="pseudo"
                value={formData.pseudo}
                onChange={handleChange}
                disabled={!isEditing}
                className="form-control"
              />
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn--secondary"
              onClick={() => setShowPasswordModal(true)}
            >
              <i className="fas fa-key"></i>
              Changer le mot de passe
            </button>

            {isEditing && (
              <>
                <button type="submit" className="btn btn--success">
                  <i className="fas fa-save"></i>
                  Enregistrer
                </button>
                <button
                  type="button"
                  className="btn btn--default"
                  onClick={() => setIsEditing(false)}
                >
                  Annuler
                </button>
              </>
            )}
          </div>
        </form>
      </div>

      {/* Modal suppression de compte */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal modal--danger" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2>Supprimer le compte</h2>
              <button 
                className="modal__close" 
                onClick={() => setShowDeleteModal(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="modal__body">
              <div className="warning-box">
                <i className="fas fa-exclamation-triangle"></i>
                <p>
                  <strong>Attention !</strong> Cette action est irréversible. 
                  Toutes vos données seront définitivement supprimées.
                </p>
              </div>
              
              <p>Êtes-vous sûr de vouloir supprimer votre compte ?</p>
              
              <div className="modal__actions">
                <button 
                  className="btn btn--danger" 
                  onClick={handleDeleteAccount}
                >
                  <i className="fas fa-trash-alt"></i> Oui, supprimer
                </button>
                <button 
                  className="btn btn--secondary" 
                  onClick={() => setShowDeleteModal(false)}
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal changement mot de passe */}
      {showPasswordModal && (
        <div className="modal-backdrop" onClick={() => setShowPasswordModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Changer le mot de passe</h3>
              <button className="modal-close" onClick={() => setShowPasswordModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleChangePassword_submit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Mot de passe actuel</label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleChange}
                    className="form-control"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Nouveau mot de passe</label>
                  <input
                    type="password"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    className="form-control"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Confirmer le mot de passe</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="form-control"
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn--default" onClick={() => setShowPasswordModal(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn btn--success">
                  Valider
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  // ========================================
  // AFFICHAGE  
  // ========================================

  return (
    <div className="user-dashboard">
      {/* Header */}
      <div className="user-header">
        <div className="user-header__content">
          <div>
            <h1 className="user-header__title">
              <i className="fas fa-user-circle"></i>
              Mon Dashboard
            </h1>
            <p className="user-header__subtitle">
              Bonjour {userState?.pseudo || 'Utilisateur'} !
            </p>
          </div>
          
          <button 
            className="btn btn--secondary"
            onClick={() => navigate('/')}
          >
            <i className="fas fa-home"></i>
            Retour à l'accueil
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="user-nav">
        <button
          className={`user-nav__btn ${activeTab === 'dashboard' ? 'user-nav__btn--active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <i className="fas fa-chart-line"></i>
          <span>Vue d'ensemble</span>
        </button>
        
        <button
          className={`user-nav__btn ${activeTab === 'personal' ? 'user-nav__btn--active' : ''}`}
          onClick={() => setActiveTab('personal')}
        >
          <i className="fas fa-user-circle"></i>
          <span>Informations</span>
        </button>
        
        <button
          className={`user-nav__btn ${activeTab === 'reviews' ? 'user-nav__btn--active' : ''}`}
          onClick={() => setActiveTab('reviews')}
        >
          <i className="fas fa-star"></i>
          <span>Avis</span>
        </button>
        
        <button
          className={`user-nav__btn ${activeTab === 'messages' ? 'user-nav__btn--active' : ''}`}
          onClick={() => setActiveTab('messages')}
        >
          <i className="fas fa-envelope"></i>
          <span>Messages</span>
          {dashboardStats.pendingReports > 0 && (
            <span className="user-nav__badge user-nav__badge--danger">
              {dashboardStats.unreadMessages}
            </span>
          )}
        </button>
        
        <button
          className={`user-nav__btn ${activeTab === 'reports' ? 'user-nav__btn--active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          <i className="fas fa-flag"></i>
          <span>Signalements</span>
          {dashboardStats.pendingReports > 0 && (
            <span className="user-nav__badge user-nav__badge--danger">
              {dashboardStats.pendingReports}
            </span>
          )}
        </button>

        <button
          className={`user-nav__btn ${activeTab === 'settings' ? 'user-nav__btn--active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <i className="fas fa-cog"></i>
          <span>Paramètres</span>
        </button>


      </nav>

      {/* Content */}
      <div className="user-content">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'personal' && renderPersonalInfo()}
        {activeTab === 'reviews' && renderReviews()}
        {activeTab === 'messages' && renderMessages()}
        {activeTab === 'reports' && renderReports()}
        {activeTab === 'settings' && renderSettings()}
      </div>
    </div>
  );
};

export default DashboardPage;
