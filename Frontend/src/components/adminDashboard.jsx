/**
 * Composant MainContent qui affiche le contenu principal de la page.
 *
 * @returns {JSX.Element} Le composant MainContent rendu.
 */

import React from "react";
import Header from "./Header.jsx";

const AdminDashboard = () => (
  <div style={{ padding: 24 }}>
    <h1>Admin Dashboard</h1>
    <p>Contenu réservé aux administrateurs.</p>
  </div>
);

export default AdminDashboard;