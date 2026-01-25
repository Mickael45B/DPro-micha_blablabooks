// Ce fichier contient les routes nécessitant une authentification.

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import MainLayout from '../../presentation/components/layout/MainLayout/mainLayout.jsx';
import BookPage from '../../presentation/pages/BookDetail/BookPage.jsx';
import LibraryPage from '../../presentation/pages/Catalog/LibraryPage.jsx';    
import UserLibraryPage from '../../presentation/pages/Profile/libraries/UserLibraryPage.jsx';
import ProfilePage from '../../presentation/pages/Profile/DashboardPage.jsx';
// import ProtectedRoute from './ProtectedRoute.jsx';




export default function PrivateRoutes() {

  return [
    <>
    {/* Route détail d'un livre */}
    <Route 
      path="/livres/:id" 
      element={
        <MainLayout>
          <BookPage />
        </MainLayout>
      } 
    />
    
    {/* Route catalogue */}
    <Route 
      path="/catalogue" 
      element={
        <MainLayout>
          <LibraryPage />
        </MainLayout>
      } 
    />

    {/* Routes nécessitant authentification */}
    <Route 
      path="/mybiblilbooks" 
      element={
        // <ProtectedRoute>
          <MainLayout>
            <UserLibraryPage />
          </MainLayout>
        // </ProtectedRoute>
      } 
    />
    
    <Route 
      path="/profile" 
      element={
        // <ProtectedRoute>
          <MainLayout>
            <ProfilePage />
          </MainLayout>
        // </ProtectedRoute>
      } 
    />
    </>
  ];
}

