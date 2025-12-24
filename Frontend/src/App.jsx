/**
 * Exemple de modification de App.jsx pour utiliser MainLayout
 */
import "./css/App.css";
import "./css/MediaQueries.css";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ApolloProvider } from '@apollo/client';
import { Toaster } from 'react-hot-toast';
import apolloClient from './services/apolloClient';
import AuthProvider from './AuthContext';

// Composants
import MainLayout from './components/mainLayout.jsx';
import NotFoundPage from './components/NotFoundPage';
import AdminRoute from "./components/AdminRoute.jsx";
import BottomBar from "./components/BottomBar.jsx";
import Footer from "./components/Footer.jsx";

// Pages
import BookPage from "./components/BookPage.jsx";
import LibraryPage from "./components/LibraryPage.jsx";
import LoginPage from "./components/LoginPage.jsx";
import RegisterPage from "./components/RegisterPage.jsx";
import UserLibraryPage from "./components/UserLibraryPage.jsx";
import ProfilePage from "./components/DashboardPage.jsx";
import AdminDashboard from "./components/adminDashboard.jsx";
import Forbidden from "./components/forbiden.jsx";
import Carousel from './components/Carousel.jsx';
import AuthDebug from './components/AuthDebug.jsx'; // 🔍 Ajout du debug

/**
 * Page d'accueil avec contenu personnalisé
 */
const HomePage = () => {
  return (
    <MainLayout
      contextualMenu={
        <>
          <div className="contextualMenu__info">
            <h3>🎯 Pourquoi BlablaBooks ?</h3>
            <p>Organisez votre bibliothèque, partagez vos coups de cœur et découvrez de nouvelles lectures.</p>
          </div>
          <div className="contextualMenu__action">
            <h3>🚀 Commencez maintenant</h3>
            <a href="/inscription" className="cta-button">
              Essai gratuit 30 jours
            </a>
            <p style={{fontSize: '0.8em', marginTop: '1em', opacity: 0.7}}>
              Puis 9,99€/mois ou 99,99€/an
            </p>
          </div>
        </>
      }
    >
      {/* Contenu de la page d'accueil */}
      <section className="home-hero">
        <h1 style={{fontSize: '2em', marginBottom: '0.5em'}}>
          Bienvenue sur BlablaBooks
        </h1>
        <p style={{fontSize: '1.2em', opacity: 0.9, marginBottom: '2em'}}>
          Retrouvez et partagez tous vos livres en un clin d'œil
        </p>
      </section>

      {/* Section des livres les plus lus */}
      <section className="most_read">
        <h2>📚 Les plus lus</h2>
        <div className="carousel_items">
          <Carousel reverse={false} speedClass="carousel-speed-1" />
        </div>
      </section>

      {/* Section des nouveautés */}
      <section className="novelties">
        <h2>✨ Les nouveautés</h2>
        <div className="carousel_items">
          <Carousel reverse={true} speedClass="carousel-speed-2" />
        </div>
      </section>

      {/* Call to action */}
      <section style={{textAlign: 'center', marginTop: '3em', padding: '2em', backgroundColor: 'rgba(215, 53, 92, 0.1)', borderRadius: '12px'}}>
        <h3 style={{fontSize: '1.5em', marginBottom: '1em'}}>
          Prêt à plonger dans l'univers de la lecture ?
        </h3>
        <a href="/inscription" className="button_library" style={{display: 'inline-flex'}}>
          Créer mon compte gratuitement
        </a>
      </section>
    </MainLayout>
  );
};

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
          <Routes>
            {/* Page d'accueil */}
            <Route path="/" element={<HomePage />} />

            {/* Routes publiques avec MainLayout */}
            <Route path="/livres/:id" element={
              <MainLayout>
                <BookPage />
              </MainLayout>
            } />
            
            <Route path="/catalogue" element={
              <MainLayout>
                <LibraryPage />
              </MainLayout>
            } />

            <Route path="/connexion" element={
              <MainLayout>
                <LoginPage />
              </MainLayout>
          } />
            <Route path="/inscription" element={
              <MainLayout>
                <RegisterPage />
              </MainLayout>
          } />
            
            {/* Routes utilisateur avec MainLayout */}
            <Route path="/mybiblilbooks" element={
              <MainLayout>
                <UserLibraryPage />
              </MainLayout>
            } />
            
            <Route path="/profile" element={
              <MainLayout>
                <ProfilePage />
              </MainLayout>
            } />

            {/* Routes admin */}
            <Route
              path="/admin/*"
              element={
                <AdminRoute>
                  <MainLayout>
                    <AdminDashboard />
                  </MainLayout>
                </AdminRoute>
              }
            />
            <Route
              path="/adminDashboard"
              element={
                <AdminRoute>
                  <MainLayout>
                    <AdminDashboard />
                  </MainLayout>
                </AdminRoute>
              }
            />

            {/* Pages spéciales */}
            <Route path="/forbidden" element={<Forbidden />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
          
          <BottomBar />
          <Footer />
          
          {/* 🔍 Composant de debug - À RETIRER EN PRODUCTION */}
          <AuthDebug />
        </Router>
      </AuthProvider>
    </ApolloProvider>
  );
}

export default App;