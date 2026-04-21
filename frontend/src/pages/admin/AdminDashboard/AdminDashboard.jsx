import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../../services/api";
import { clearAuthSession } from "../../../utils/auth";
import { getErrorMessage, isUnauthorizedError } from "../../../utils/errorHandling";
import "./AdminDashboard.css";

function AdminDashboard() {
  const navigate = useNavigate();
  const [statsData, setStatsData] = useState({
    unread_messages: 0,
    pending_factures: 0,
    clients: 0,
  });
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setErrorMessage("");
        const data = await api.adminDashboard();

        setStatsData({
          unread_messages: data?.unread_messages || 0,
          pending_factures: data?.pending_factures || 0,
          clients: data?.clients || 0,
        });
      } catch (error) {
        console.log("Admin dashboard fetch error:", error);

        if (isUnauthorizedError(error)) {
          clearAuthSession();
          navigate("/login", { replace: true });
          return;
        }

        setErrorMessage(
          getErrorMessage(error, {
            networkMessage: "Impossible de charger les statistiques du tableau de bord.",
            serverMessage: "Impossible de charger les statistiques du tableau de bord.",
            fallbackMessage: "Impossible de charger les statistiques du tableau de bord.",
          })
        );
      }
    };

    fetchStats();
  }, [navigate]);

  const stats = [
    {
      id: 1,
      title: "Total des messages non repondu",
      value: statsData.unread_messages,
      description: "Nombre total de messages recus",
    },
    {
      id: 2,
      title: "Factures en attente",
      value: statsData.pending_factures,
      description: "Factures en cours de traitement",
    },
    {
      id: 3,
      title: "Total client",
      value: statsData.clients,
      description: "Utilisateurs inscrits sur la plateforme",
    },
  ];

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Tableau de bord Administrateur</h1>
        <p className="dashboard-subtitle">
          Suivez rapidement les informations principales de votre plateforme.
        </p>
      </div>

      {errorMessage && <div className="error">{errorMessage}</div>}

      <div className="dashboard-cards">
        {stats.map((item) => (
          <div className="dashboard-card" key={item.id}>
            <h3 className="card-title">{item.title}</h3>
            <p className="card-value">{item.value}</p>
            <span className="card-description">{item.description}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminDashboard;
