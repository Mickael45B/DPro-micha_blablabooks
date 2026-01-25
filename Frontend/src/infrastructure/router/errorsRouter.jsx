import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import MainLayout from '../../presentation/components/layout/MainLayout/mainLayout.jsx';
import Forbidden from '../../presentation/components/common/ErrorBoundary/forbiden.jsx';


export default function ErrorRoutes() {
return [
  <>
{/* Route pour la page 403 Forbidden */}
<Route path="/forbidden" element={
    <MainLayout>
        <Forbidden />
    </MainLayout>
} />
    </>
  ];
}
