/**
 * Composant de débogage pour l'authentification
 * À ajouter TEMPORAIREMENT dans App.jsx pour débugger
 */
import React, { useState, useEffect } from 'react';
import { getUserFromToken, isUserAdmin, getToken } from '../../../data/graphql/queries/auth.jsx';

const AuthDebug = () => {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [token, setToken] = useState(null);
  const [authStorage, setAuthStorage] = useState(null);
  const [isVisible, setIsVisible] = useState(true);

  const refresh = () => {
    const currentUser = getUserFromToken();
    const adminStatus = isUserAdmin();
    const currentToken = getToken();
    const storage = localStorage.getItem('auth');
    
    setUser(currentUser);
    setIsAdmin(adminStatus);
    setToken(currentToken);
    setAuthStorage(storage);
    
    console.log('=== AUTH DEBUG ===');
    console.log('User:', currentUser);
    console.log('Is Admin:', adminStatus);
    console.log('Token:', currentToken);
    console.log('Auth Storage:', storage);
  };

  useEffect(() => {
    refresh();
    
    const handleAuthChange = () => {
      refresh();
    };
    
    window.addEventListener('authChanged', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);
    
    return () => {
      window.removeEventListener('authChanged', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, []);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        style={{
          position: 'fixed',
          bottom: '10px',
          right: '10px',
          background: '#F6495C',
          color: '#fff',
          border: 'none',
          padding: '10px 15px',
          borderRadius: '8px',
          cursor: 'pointer',
          zIndex: 9999,
          fontSize: '12px',
          fontWeight: 'bold'
        }}
      >
        🔍 DEBUG AUTH
      </button>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      right: '10px',
      background: 'rgba(0,0,0,0.95)',
      color: '#fff',
      padding: '15px',
      borderRadius: '8px',
      fontSize: '11px',
      maxWidth: '450px',
      maxHeight: '400px',
      overflow: 'auto',
      zIndex: 9999,
      border: '2px solid #F6495C',
      boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '10px',
        borderBottom: '1px solid #F6495C',
        paddingBottom: '8px'
      }}>
        <div style={{ fontWeight: 'bold', color: '#F6495C', fontSize: '14px' }}>
          🔍 AUTH DEBUG
        </div>
        <button
          onClick={() => setIsVisible(false)}
          style={{
            background: 'transparent',
            color: '#fff',
            border: '1px solid #F6495C',
            padding: '4px 8px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '10px'
          }}
        >
          Masquer
        </button>
      </div>
      
      <button 
        onClick={refresh}
        style={{
          background: '#F6495C',
          color: '#fff',
          border: 'none',
          padding: '6px 12px',
          borderRadius: '4px',
          cursor: 'pointer',
          marginBottom: '12px',
          width: '100%',
          fontSize: '11px',
          fontWeight: 'bold'
        }}
      >
        🔄 Rafraîchir
      </button>
      
      <div style={{ 
        display: 'grid', 
        gap: '8px',
        padding: '8px',
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '4px',
        marginBottom: '10px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <strong>Connecté:</strong> 
          <span style={{ color: user ? '#4ade80' : '#ef4444' }}>
            {user ? '✅ Oui' : '❌ Non'}
          </span>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <strong>Admin (glossaire):</strong> 
          <span style={{ color: isAdmin ? '#4ade80' : '#ef4444' }}>
            {isAdmin ? '✅ Oui' : '❌ Non'}
          </span>
        </div>
      </div>
      
      {user && (
        <div style={{ 
          padding: '8px',
          background: 'rgba(74, 222, 128, 0.1)',
          borderRadius: '4px',
          marginBottom: '10px',
          border: '1px solid rgba(74, 222, 128, 0.3)'
        }}>
          <div style={{ marginBottom: '6px', fontSize: '12px', fontWeight: 'bold', color: '#4ade80' }}>
            📋 Infos Utilisateur:
          </div>
          <div style={{ fontSize: '10px', lineHeight: '1.6' }}>
            <div><strong>Pseudo:</strong> {user.pseudo || 'N/A'}</div>
            <div><strong>Nom:</strong> {user.name || 'N/A'}</div>
            <div><strong>Email:</strong> {user.email || 'N/A'}</div>
            <div><strong>Groupe:</strong> <span style={{color: '#F6495C', fontWeight: 'bold'}}>{user.groupe || 'N/A'}</span></div>
            <div><strong>ID Role:</strong> {user.id_role || 'N/A'}</div>
          </div>
        </div>
      )}
      
      <div style={{ 
        padding: '8px',
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '4px',
        fontSize: '9px',
        wordBreak: 'break-all',
        marginBottom: '8px'
      }}>
        <strong style={{ color: '#F6495C' }}>localStorage 'auth':</strong>
        <pre style={{ 
          margin: '5px 0 0 0', 
          whiteSpace: 'pre-wrap',
          fontFamily: 'monospace',
          fontSize: '9px',
          lineHeight: '1.4'
        }}>
          {authStorage ? JSON.stringify(JSON.parse(authStorage), null, 2) : '❌ Vide'}
        </pre>
      </div>
      
      <div style={{ 
        padding: '8px',
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '4px',
        fontSize: '9px',
        wordBreak: 'break-all'
      }}>
        <strong style={{ color: '#F6495C' }}>Token (premiers 50 car.):</strong>
        <pre style={{ 
          margin: '5px 0 0 0', 
          whiteSpace: 'pre-wrap',
          fontFamily: 'monospace',
          fontSize: '9px'
        }}>
          {token ? token.substring(0, 50) + '...' : '❌ Pas de token'}
        </pre>
      </div>
    </div>
  );
};

export default AuthDebug;