/**
 * ReportsManagement - Gestion des signalements
 */
import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { GET_REPORTS, UPDATE_REPORT, DELETE_REPORT } from './adminQueries.jsx';

const ReportsManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [formData, setFormData] = useState({
    status: '',
    details: ''
  });

  const { data, loading, error, refetch } = useQuery(GET_REPORTS, {
    variables: { limit: 100, offset: 0, order: 'created_at', direction: 'DESC' }
  });

  const [updateReport] = useMutation(UPDATE_REPORT, {
    onCompleted: () => {
      refetch();
      setShowEditModal(false);
      setSelectedReport(null);
      alert('✅ Signalement mis à jour avec succès !');
    },
    onError: (error) => {
      console.error('Erreur UPDATE_REPORT:', error);
      alert('❌ Erreur : ' + error.message);
    }
  });

  const [deleteReport] = useMutation(DELETE_REPORT, {
    onCompleted: () => {
      refetch();
      alert('✅ Signalement supprimé avec succès !');
    },
    onError: (error) => {
      console.error('Erreur DELETE_REPORT:', error);
      alert('❌ Erreur : ' + error.message);
    }
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    await updateReport({
      variables: {
        input: {
        id_report: selectedReport.id_report,
        status: formData.status,
        details: formData.details
        }
      }
    });
  };

  const handleDelete = async (id_report) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce signalement ?')) {
      await deleteReport({ variables: { input: {id_report } } });
    }
  };

  const openEditModal = (report) => {
    setSelectedReport(report);
    setFormData({
      status: report.status || 'pending',
      details: report.details || ''
    });
    setShowEditModal(true);
  };

  const openViewModal = (report) => {
    setSelectedReport(report);
    setShowViewModal(true);
  };

  const getStatusInfo = (status) => {
    const statusMap = {
      'PENDING': { label: 'En attente', class: 'warning', icon: 'clock' },
      'IN_REVIEW': { label: 'En cours', class: 'info', icon: 'spinner' },
      'RESOLVED': { label: 'Résolu', class: 'success', icon: 'check-circle' },
      'DISMISSED': { label: 'Rejeté', class: 'danger', icon: 'times-circle' }
    };
    return statusMap[status] || { label: status, class: 'secondary', icon: 'question' };
  };

  const getReportTypeInfo = (type) => {
    const typeMap = {
      'USER': { label: 'Utilisateur', icon: 'user', class: 'info' },
      'REVIEW': { label: 'Avis', icon: 'star', class: 'warning' },
      'MESSAGE': { label: 'Message', icon: 'envelope', class: 'success' },
      'OTHER': { label: 'Autre', icon: 'flag', class: 'secondary' }
    };
    return typeMap[type] || { label: type, icon: 'flag', class: 'secondary' };
  };

  const getReasonLabel = (reason) => {
    const reasonMap = {
      'HARASSMENT_INSULTING_LANGUAGE': 'Harcèlement/Langage insultant',
      'HATEFUL_DISCRIMINATORY_CONTENT': 'Contenu haineux/Discriminatoire',
      'SPAM_UNSOLICITED_ADVERTISING': 'Spam/Publicités non sollicitées',
      'IMPERSONATION': 'Usurpation d\'identité',
      'SPREAD_OF_FALSE_INFORMATION': 'Diffusion de fausses informations',
      'SHARING_OF_PERSONAL_INFORMATION_DOXING': 'Partage d\'infos personnelles/Doxxing',
      'THREATS_CALLS_FOR_VIOLENCE': 'Menaces/Appels à la violence',
      'PORNOGRAPHY_EXPLICIT_SEXUAL_CONTENT': 'Contenu pornographique/Sexuel explicite',
      'INAPPROPRIATE_CONTENT_FOR_MINORS': 'Contenu inapproprié pour mineurs',
      'COPYRIGHT_INFRINGEMENT': 'Violation de droits d\'auteur',
      'SCAM_ATTEMPTED_FRAUD': 'Arnaque/Tentative de fraude',
      'AGGRESSIVE_BEHAVIOR_IN_PRIVATE_MESSAGES': 'Comportement agressif en messages privés',
      'DEFAMATORY_COMMENT': 'Commentaire diffamatoire',
      'REPEATED_TARGETED_HARASSMENT': 'Harcèlement ciblé répété',
      'POSTING_OF_BANKING_SENSITIVE_INFORMATION': 'Publication d\'infos bancaires sensibles',
      'OFFENSIVE_CONTENT_RELATED_TO_RELIGION': 'Contenu offensant relatif à la religion',
      'VIOLATION_OF_COMMUNITY_RULES': 'Violation des règles communautaires',
      'NON_COMPLIANCE_WITH_TERMS_OF_SERVICE': 'Non-conformité aux conditions d\'utilisation',
      'MISLEADING_CONTENT': 'Contenu trompeur',
      'OTHER_SPECIFY_IN_DETAILS': 'Autre (voir détails)'
    };
    return reasonMap[reason] || reason;
  };

  // Gérer les états de chargement et d'erreur
  if (loading) return <div className="loading">Chargement...</div>;
  if (error) return <div className="error">Erreur : {error.message}</div>;

  // Filtrer les signalements selon la recherche et le statut
  const reports = data?.getReports.reports || [];
  
  const filteredReports = reports.filter(report => {
    const matchesSearch = !searchTerm ||
      report.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.details?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || report.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  // Statistiques
  const stats = {
    pending: reports.filter(r => r.status === 'PENDING').length,
    in_progress: reports.filter(r => r.status === 'IN_REVIEW').length,
    resolved: reports.filter(r => r.status === 'RESOLVED').length,
    rejected: reports.filter(r => r.status === 'DISMISSED').length
  };

  return (
    <div className="reports-management">
      <div className="section-header">
        <h2 className="section-title">
          <i className="fas fa-flag"></i> Gestion des signalements
        </h2>
      </div>

      {/* Statistiques rapides */}
      <div className="reports-stats">
        <div className="stat-item stat-item--warning" onClick={() => setFilterStatus('PENDING')}>
          <i className="fas fa-clock"></i>
          <div>
            <strong>{stats.pending}</strong>
            <span>En attente</span>
          </div>
        </div>
        <div className="stat-item stat-item--info" onClick={() => setFilterStatus('IN_REVIEW')}>
          <i className="fas fa-spinner"></i>
          <div>
            <strong>{stats.in_progress}</strong>
            <span>En cours</span>
          </div>
        </div>
        <div className="stat-item stat-item--success" onClick={() => setFilterStatus('RESOLVED')}>
          <i className="fas fa-check-circle"></i>
          <div>
            <strong>{stats.resolved}</strong>
            <span>Résolus</span>
          </div>
        </div>
        <div className="stat-item stat-item--danger" onClick={() => setFilterStatus('DISMISSED')}>
          <i className="fas fa-times-circle"></i>
          <div>
            <strong>{stats.rejected}</strong>
            <span>Rejetés</span>
          </div>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="filters-bar">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Rechercher dans les signalements..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <i className="fas fa-search search-icon"></i>
        </div>

        <select 
          className="filter-select"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">Tous les statuts</option>
          <option value="pending">En attente</option>
          <option value="in_progress">En cours</option>
          <option value="resolved">Résolus</option>
          <option value="rejected">Rejetés</option>
        </select>
      </div>

      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Raison</th>
              <th>Statut</th>
              <th>Rapporteur</th>
              <th>Cible</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredReports.map(report => {
              const statusInfo = getStatusInfo(report.status);
              const typeInfo = getReportTypeInfo(report.report_type);
              
              return (
                <tr key={report.id_report}>
                  <td>
                    <span className={`badge badge--${typeInfo.class}`}>
                      <i className={`fas fa-${typeInfo.icon}`}></i> {typeInfo.label}
                    </span>
                  </td>
                  <td>
                    <button
                      className="report-reason"
                      onClick={() => openViewModal(report)}
                    >
                      <strong>{getReasonLabel(report.reason)}</strong>
                    </button>
                  </td>
                  <td>
                    <span className={`badge badge--${statusInfo.class}`}>
                      <i className={`fas fa-${statusInfo.icon}`}></i> {statusInfo.label}
                    </span>
                  </td>
                  <td>
                   {report.whistleblower ? (
                     <span className="badge badge--info">
                       {report.whistleblower.pseudo}
                     </span>
                   ) : (
                     <span className="badge badge--muted">
                       [Utilisateur supprimé]
                     </span>
                   )}
                  </td>
                  <td>
                   {report.reported ? (
                     <span className="badge badge--secondary">
                       {report.reported.pseudo}
                     </span>
                   ) : (
                     <span className="badge badge--muted">
                       [Utilisateur supprimé]
                     </span>
                   )}
                  </td>
                  <td>{new Date(report.created_at).toLocaleDateString()}</td>
                  <td className="actions-cell">
                    <button
                      className="btn-icon btn-icon--view"
                      onClick={() => openViewModal(report)}
                      title="Voir le détail"
                    >
                      <i className="fas fa-eye"></i>
                    </button>
                    <button
                      className="btn-icon btn-icon--edit"
                      onClick={() => openEditModal(report)}
                      title="Modifier le statut"
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button
                      className="btn-icon btn-icon--delete"
                      onClick={() => handleDelete(report.id_report)}
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

      {/* Modal Visualisation */}
      {showViewModal && selectedReport && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal modal--large" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2>Détails du signalement</h2>
              <button className="modal__close" onClick={() => setShowViewModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="modal__body">
              <div className="report-detail">
                <div className="report-detail__header">
                  <div>
                    {(() => {
                      const typeInfo = getReportTypeInfo(selectedReport.report_type);
                      return (
                        <span className={`badge badge--${typeInfo.class} badge--large`}>
                          <i className={`fas fa-${typeInfo.icon}`}></i> {typeInfo.label}
                        </span>
                      );
                    })()}
                  </div>
                  <div>
                    {(() => {
                      const statusInfo = getStatusInfo(selectedReport.status);
                      return (
                        <span className={`badge badge--${statusInfo.class} badge--large`}>
                          <i className={`fas fa-${statusInfo.icon}`}></i> {statusInfo.label}
                        </span>
                      );
                    })()}
                  </div>
                </div>

                <div className="report-detail__meta">
                  <div className="meta-item">
                    <i className="fas fa-user"></i>
                    <span>Rapporteur : <strong>{selectedReport.whistleblower?.pseudo || '[Supprimé]'}</strong></span>
                  </div>
                  <div className="meta-item">
                    <i className="fas fa-crosshairs"></i>
                    <span>Cible : <strong>{selectedReport.reported?.pseudo || '[Supprimé]'}</strong></span>
                  </div>
                  <div className="meta-item">
                    <i className="fas fa-calendar"></i>
                    <span>{new Date(selectedReport.created_at).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</span>
                  </div>
                </div>

                <div className="report-detail__content">
                  <h4>Raison :</h4>
                  <p className="report-reason-text">{selectedReport.reason}</p>

                  <h4>Détails :</h4>
                  <p className="report-details-text">
                    {selectedReport.details || 'Aucun détail supplémentaire'}
                  </p>
                </div>
              </div>
            </div>

            <div className="modal__actions">
              <button 
                className="btn btn--primary"
                onClick={() => {
                  setShowViewModal(false);
                  openEditModal(selectedReport);
                }}
              >
                <i className="fas fa-edit"></i> Modifier le statut
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

      {/* Modal Édition */}
      {showEditModal && selectedReport && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2>Modifier le signalement</h2>
              <button className="modal__close" onClick={() => setShowEditModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleEdit} className="modal__body">
              <div className="form-group">
                <label>Statut *</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  required
                >
                  <option value="PENDING">⏳ En attente</option>
                  <option value="IN_REVIEW">🔄 En cours</option>
                  <option value="RESOLVED">✅ Résolu</option>
                  <option value="DISMISSED">❌ Rejeté</option>
                </select>
              </div>

              <div className="form-group">
                <label>Notes / Détails de traitement</label>
                <textarea
                  name="details"
                  value={formData.details}
                  onChange={handleChange}
                  rows="6"
                  placeholder="Ajouter des notes sur le traitement de ce signalement..."
                />
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
    </div>
  );
};

export default ReportsManagement;
