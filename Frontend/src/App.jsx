/**
 * Exemple de modification de App.jsx pour utiliser MainLayout
 */
import "./App.css";
import "./presentation/styles/MediaQueries.css";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ApolloProvider } from '@apollo/client';
import { Toaster } from 'react-hot-toast';
import apolloClient from './data/apollo/apolloClient.js';
import AuthProvider from './infrastructure/context/AuthContext.jsx';



// Composants
import Hubrouters from './infrastructure/router/routes.jsx';
import  BottomBar from './presentation/components/layout/BottomBar.jsx';
import Footer from './presentation/components/layout/Footer/Footer.jsx';
import AuthDebug from './presentation/pages/Auth/AuthDebug.jsx';


function App() {
  return (
    <ApolloProvider client={apolloClient}>
      <AuthProvider>
        <Router>

          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#4ade80',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />

          {/* Toutes les routes sont gérées ici */}
          <Hubrouters />

          <BottomBar />
          <Footer />

          {/* 🔍 Composant de debug - À RETIRER EN PRODUCTION */}
          {/* <AuthDebug /> */}

        </Router>
      </AuthProvider>
    </ApolloProvider>
  );
}

export default App;