import React, { useEffect, useState } from "react";
import "./AdminDashboard.css";
import { getAuthToken } from "../../../utils/auth";

function AdminDashboard() {
  const [statsData, setStatsData] = useState({
    unread_messages: 0,
    pending_factures: 0,
    clients: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = getAuthToken();
        const response = await fetch("http://localhost:8000/api/admin/dashboard", {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.message || "Failed to load dashboard stats");
        }

        setStatsData({
          unread_messages: data?.unread_messages || 0,
          pending_factures: data?.pending_factures || 0,
          clients: data?.clients || 0,
        });
      } catch (error) {
        console.log("Admin dashboard fetch error:", error);
      }
    };

    fetchStats();
  }, []);

  const stats = [
    {
      id: 1,
      title: "Total des messages non répondu",
      value: statsData.unread_messages,
      description: "Nombre total de messages reçus",
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