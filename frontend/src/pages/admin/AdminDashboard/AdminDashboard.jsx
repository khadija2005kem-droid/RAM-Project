import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { api } from "../../../services/api";
import { clearAuthSession } from "../../../utils/auth";
import { getErrorMessage, isUnauthorizedError } from "../../../utils/errorHandling";
import "./AdminDashboard.css";

function AdminDashboard() {
  const { t } = useTranslation();
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
            networkMessage: t("admin.dashboard.loadError"),
            serverMessage: t("admin.dashboard.loadError"),
            fallbackMessage: t("admin.dashboard.loadError"),
          })
        );
      }
    };

    fetchStats();
  }, [navigate, t]);

  const stats = [
    {
      id: 1,
      title: t("admin.dashboard.unansweredMessages"),
      value: statsData.unread_messages,
      description: t("admin.dashboard.receivedMessages"),
    },
    {
      id: 2,
      title: t("admin.dashboard.pendingInvoices"),
      value: statsData.pending_factures,
      description: t("admin.dashboard.processingInvoices"),
    },
    {
      id: 3,
      title: t("admin.dashboard.totalClients"),
      value: statsData.clients,
      description: t("admin.dashboard.registeredUsers"),
    },
  ];

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1 className="dashboard-title">{t("admin.dashboard.title")}</h1>
        <p className="dashboard-subtitle">
          {t("admin.dashboard.subtitle")}
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
