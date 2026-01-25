// Ce fichier contient les fichiers accessibles sans authentification.

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Fragment } from 'react';
import MainLayout from '../../presentation/components/layout/MainLayout/mainLayout.jsx';
import LoginPage from '../../presentation/pages/Auth/loginPage.jsx';
import RegisterPage from '../../presentation/pages/Auth/registerPage.jsx';



export default function PublicRoutes() {
return [
  <>
      <Route 
      path="/connexion" 
      element={
        <MainLayout showSearch={false}>
          <LoginPage />
        </MainLayout>
      } 
    />
    
    <Route 
      path="/inscription" 
      element={
        <MainLayout showSearch={false}>
          <RegisterPage />
        </MainLayout>
      } 
    />
    </>
  ];
}
