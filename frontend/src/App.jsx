import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { I18nextProvider, useTranslation } from "react-i18next";

import "./styles/rtl.css";
import i18n from "./i18n";

import Navbar from "./pages/client/ComponentsC/NavbarClient/NavbarClient";
import ClientFooter from "./pages/client/ComponentsC/FooterClient/FooterClient";
import ProtectedRoute from "./ConponentsG/ProtectedRoute/ProtectedRoute";
import NavbarAdmin from "./pages/admin/ComponentsA/NavbarAdmin/NavbarAdmin";
import FooterAdmin from "./pages/admin/ComponentsA/FooterAdmin/FooterAdmin";

import AdminDashboard from "./pages/admin/AdminDashboard/AdminDashboard";
import GestionFactures from "./pages/admin/GestionFactures/GestionFactures";
import GestionMessages from "./pages/admin/GestionMessages/GestionMessages";
import GestionUtilisateurs from "./pages/admin/GestionUtilisateurs/GestionUtilisateurs";
import AjoutFacture from "./pages/admin/AjoutFacture/AjoutFacture";

import Landing from "./pages/client/Landing/Landing";
import Login from "./pages/client/Login/Login";
import Signup from "./pages/client/Signup/Signup";
import Home from "./pages/client/Home/Home";
import MesFactures from "./pages/client/MesFactures/MesFactures";
import Contact from "./pages/client/Contact/Contact";
import ForgotPassword from "./pages/client/ForgotPassword/ForgotPassword";
import Paiement from "./pages/client/Paiement/Paiement";
import Profile from "./pages/client/Profile/Profile";
import Facturepdf from "./pages/client/Facturepdf/Facturepdf";

function AdminLayout() {
  return (
    <>
      <NavbarAdmin />
      <Outlet />
      <FooterAdmin />
    </>
  );
}

function ClientLayout() {
  return (
    <>
      <Outlet />
      <ClientFooter />
    </>
  );
}

function AppContent() {
  const { i18n: i18nInstance } = useTranslation();

  useEffect(() => {
    document.dir = i18nInstance.language === "ar" ? "rtl" : "ltr";
  }, [i18nInstance.language]);

  return (
    <Router>
      <div className="app-container">
        <Routes>
          <Route element={<ClientLayout />}>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/invoice/:id" element={<Facturepdf />} />

            <Route
              path="/home"
              element={
                <ProtectedRoute allowedRoles={["client"]}>
                  <>
                    <Navbar />
                    <Home />
                  </>
                </ProtectedRoute>
              }
            />
            <Route
              path="/mes-factures"
              element={
                <ProtectedRoute allowedRoles={["client"]}>
                  <>
                    <Navbar />
                    <MesFactures />
                  </>
                </ProtectedRoute>
              }
            />
            <Route
              path="/paiement"
              element={
                <ProtectedRoute allowedRoles={["client"]}>
                  <>
                    <Navbar />
                    <Paiement />
                  </>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute allowedRoles={["client"]}>
                  <>
                    <Navbar />
                    <Profile />
                  </>
                </ProtectedRoute>
              }
            />
            <Route
              path="/contact"
              element={
                <ProtectedRoute allowedRoles={["client"]}>
                  <>
                    <Navbar />
                    <Contact />
                  </>
                </ProtectedRoute>
              }
            />
          </Route>

          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="factures" element={<GestionFactures />} />
            <Route path="messages" element={<GestionMessages />} />
            <Route path="users" element={<GestionUtilisateurs />} />
            <Route path="create-facture" element={<AjoutFacture />} />
            <Route path="ajout-facture" element={<Navigate to="/admin/create-facture" replace />} />
          </Route>

          <Route path="/factures" element={<Navigate to="/admin/factures" replace />} />
          <Route path="/messages" element={<Navigate to="/admin/messages" replace />} />
          <Route path="/utilisateurs" element={<Navigate to="/admin/users" replace />} />
          <Route path="/ajout-facture" element={<Navigate to="/admin/ajout-facture" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <AppContent />
    </I18nextProvider>
  );
}

export default App;
