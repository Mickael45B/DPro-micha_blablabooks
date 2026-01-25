// ce fichier définit les routes accessibles aux administrateurs

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import MainLayout from '../../presentation/components/layout/MainLayout/mainLayout.jsx';
import AdminDashboard from '../../presentation/pages/Admin/adminDashboard.jsx';
import AdminRoute from '../../core/helpers/AdminRoute.jsx';


export default function AdminRoutes() {
return [
  <>
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
    </>
  ];
}
