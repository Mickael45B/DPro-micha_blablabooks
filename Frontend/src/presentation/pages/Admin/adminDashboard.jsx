/**
 * Composant MainContent qui affiche le contenu principal de la page.
 *
 * @returns {JSX.Element} Le composant MainContent rendu.
 */

import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import BooksManagement from './BooksManagement';
import UsersManagement from './UsersManagement';

import ReviewsManagement from './reviewsManagement.jsx';
import MessagesManagement from './MessagesManagement';
import ReportsManagement from './ReportsManagement';
import './adminDashboard.css';






const AdminDashboard = () => {

  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Statistiques du dashboard
  const dashboardStats = {
    totalUsers: 1542,
    totalBooks: 3204,
    pendingReports: 12,
    unreadMessages: 8,
    totalReviews: 8934
  };

  return (
    <div className="admin-dashboard">
      {/* Header du dashboard */}
      <div className="admin-header">
        <div className="admin-header__content">
          <div>
            <h1 className="admin-header__title">
              <i className="fas fa-shield-alt"></i>
              Dashboard Administrateur
            </h1>
            <p className="admin-header__subtitle">
              Gestion complète de la plateforme BlablaBooks
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

      {/* Navigation des sections */}
      <nav className="admin-nav">
        <button
          className={`admin-nav__btn ${activeTab === 'dashboard' ? 'admin-nav__btn--active' : ''}`}
          onClick={() => {
            setActiveTab('dashboard');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          <i className="fas fa-chart-line"></i>
          <span>Vue d'ensemble</span>
        </button>
        
        <button
          className={`admin-nav__btn ${activeTab === 'books' ? 'admin-nav__btn--active' : ''}`}
          onClick={() => {
            setActiveTab('books');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          <i className="fas fa-book"></i>
          <span>Livres</span>
        </button>
        
        <button
          className={`admin-nav__btn ${activeTab === 'users' ? 'admin-nav__btn--active' : ''}`}
          onClick={() => {
            setActiveTab('users');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          <i className="fas fa-users"></i>
          <span>Utilisateurs</span>
        </button>
        
        <button
          className={`admin-nav__btn ${activeTab === 'reviews' ? 'admin-nav__btn--active' : ''}`}
          onClick={() => {
            setActiveTab('reviews');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          <i className="fas fa-star"></i>
          <span>Avis</span>
        </button>
        
        <button
          className={`admin-nav__btn ${activeTab === 'messages' ? 'admin-nav__btn--active' : ''}`}
          onClick={() => {
            setActiveTab('messages');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          <i className="fas fa-envelope"></i>
          <span>Messages</span>
          {dashboardStats.unreadMessages > 0 && (
            <span className="admin-nav__badge">{dashboardStats.unreadMessages}</span>
          )}
        </button>
        
        <button
          className={`admin-nav__btn ${activeTab === 'reports' ? 'admin-nav__btn--active' : ''}`}
          onClick={() => {
            setActiveTab('reports');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          <i className="fas fa-flag"></i>
          <span>Signalements</span>
          {dashboardStats.pendingReports > 0 && (
            <span className="admin-nav__badge admin-nav__badge--danger">
              {dashboardStats.pendingReports}
            </span>
          )}
        </button>
      </nav>

      {/* Contenu des sections */}
      <div className="admin-content">
        {activeTab === 'dashboard' && (
          <div className="dashboard-overview">
            <h2 className="section-title">Vue d'ensemble</h2>
            
            <div className="stats-grid">

              <div className="stat-card stat-card--primary" 

                onClick={() => {
                  setActiveTab('users');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}

              >
                <div className="stat-card__icon">
                  <i className="fas fa-users"></i>
                </div>
                <div className="stat-card__content">
                  <h3>{dashboardStats.totalUsers.toLocaleString()}</h3>
                  <p>Utilisateurs</p>
                </div>
              </div>
              
              <div className="stat-card stat-card--success" 
                onClick={() => {
                  setActiveTab('books');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}>
                <div className="stat-card__icon">
                  <i className="fas fa-book"></i>
                </div>
                <div className="stat-card__content">
                  <h3>{dashboardStats.totalBooks.toLocaleString()}</h3>
                  <p>Livres</p>
                </div>
              </div>
              
              <div className="stat-card stat-card--warning"
                onClick={() => {
                  setActiveTab('reviews');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}              
              >
                <div className="stat-card__icon">
                  <i className="fas fa-star"></i>
                </div>
                <div className="stat-card__content">
                  <h3>{dashboardStats.totalReviews.toLocaleString()}</h3>
                  <p>Avis</p>
                </div>
              </div>
              
              <div className="stat-card stat-card--danger"
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
                  <p>Signalements en attente</p>
                </div>
              </div>
            </div>
            
            <div className="quick-actions">
              <h3>Actions rapides</h3>
              <div className="quick-actions__grid">
                <button 
                  className="quick-action-btn"
                  onClick={() => {
                    setActiveTab('books');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  <i className="fas fa-plus-circle"></i>
                  Ajouter un livre
                </button>
                
                <button 
                  className="quick-action-btn"
                  onClick={() => {
                    setActiveTab('messages');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  <i className="fas fa-envelope"></i>
                  Envoyer un message
                </button>
                
                <button 
                  className="quick-action-btn"
                  onClick={() => {
                    setActiveTab('reports');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  <i className="fas fa-flag"></i>
                  Voir les signalements
                </button>
                
                <button 
                  className="quick-action-btn"
                  onClick={() => {
                    setActiveTab('users');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  <i className="fas fa-user-shield"></i>
                  Gérer les utilisateurs
                </button>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'books' && <BooksManagement />}
        {activeTab === 'users' && <UsersManagement />}
        {activeTab === 'reviews' && <ReviewsManagement />}
        {activeTab === 'messages' && <MessagesManagement />}
        {activeTab === 'reports' && <ReportsManagement />} 
      </div>
    </div>
  );

};

export default AdminDashboard;