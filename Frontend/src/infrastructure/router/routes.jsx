// Ce fichier contient toutes les routes de l'application (HUB) .

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import HomePage from '../../presentation/pages/Home/homePage.jsx';
import PublicRoutes from './publicRoutes.jsx';
import PrivateRoutes from './PrivateRoute.jsx';
import AdminRoute from './AdminRouter.jsx';
import ErrorRoutes from './errorsRouter.jsx';
import NotFoundPage from '../../presentation/components/common/ErrorBoundary/NotFoundPage.jsx';
import TestPage from '../../presentation/pages/test.jsx';

const Hubrouters = () => {
  return (
    <Routes>
      {/* Page d'accueil */}
      <Route path="/" element={<HomePage />} />
      {/* <Route path="/" element={<TestPage />} /> */}

      {/* Routes publiques (connexion, inscription) */}
      {PublicRoutes()}

      {/* Routes privées (nécessitent authentification) */}
      {PrivateRoutes()}

      {/* Routes admin */}
      {AdminRoute()}

      {/* Pages d'erreur (403, etc.) */}
      {ErrorRoutes()}

      {/* Fallback - 404 Not Found */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default Hubrouters;