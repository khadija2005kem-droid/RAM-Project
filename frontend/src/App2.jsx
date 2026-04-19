import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AdminDashboard from "./AdminDashboard";
import GestionFactures from "./GestionFactures";
import GestionUtilisateurs from "./GestionUtilisateurs";
import GestionMessages from "./GestionMessages";
import NavbarAdmin from "./pages/Admin/ComponentsA/NavbarAdmin/NavbarAdmin";
import AjoutFacture from "./AjoutFacture";
import Footer from "./Footer";

function App() {
  return (
    <BrowserRouter>
      <NavbarAdmin />

      <Routes>
        <Route path="/" element={<Navigate to="/admin" />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/factures" element={<GestionFactures />} />
        <Route path="/utilisateurs" element={<GestionUtilisateurs />} />
        <Route path="/ajout-facture" element={<AjoutFacture />} />
        <Route path="/messages" element={<GestionMessages />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  );
}

export default App;