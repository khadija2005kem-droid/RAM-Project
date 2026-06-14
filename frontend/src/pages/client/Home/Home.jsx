import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Container, Row, Col } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

import { api } from "../../../services/api";
import { clearAuthSession } from "../../../utils/auth";
import { getErrorMessage } from "../../../utils/errorHandling";
import { getTranslatedInvoiceStatus, normalizeInvoiceStatus } from "../../../utils/invoiceStatus";
import "./Home.css";

const EMPTY_STATS = { payees: 0, non_payees: 0, en_attente: 0 };

function buildStatsFromFactures(factures) {
  return factures.reduce(
    (accumulator, facture) => {
      const normalizedStatus = normalizeInvoiceStatus(facture?.status);

      if (normalizedStatus === "paid") accumulator.payees += 1;
      if (normalizedStatus === "unpaid") accumulator.non_payees += 1;
      if (normalizedStatus === "pending") accumulator.en_attente += 1;

      return accumulator;
    },
    { ...EMPTY_STATS }
  );
}

function Home() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(EMPTY_STATS);
  const [recentActivities, setRecentActivities] = useState([]);
  const [newInvoices, setNewInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setErrorMessage("");
        const [dashboardResult, allFacturesResult, activitiesResult, unseenFacturesResult] = await Promise.allSettled([
          api.dashboard(),
          api.facturesAll(),
          api.activities(),
          api.facturesUnseen(),
        ]);

        const dashboardData = dashboardResult.status === "fulfilled" ? dashboardResult.value : null;
        const allFacturesData = allFacturesResult.status === "fulfilled" ? allFacturesResult.value : null;
        const activitiesData = activitiesResult.status === "fulfilled" ? activitiesResult.value : null;
        const unseenFacturesData = unseenFacturesResult.status === "fulfilled" ? unseenFacturesResult.value : null;

        const authError = [dashboardResult, allFacturesResult, activitiesResult, unseenFacturesResult]
          .filter((result) => result.status === "rejected")
          .map((result) => result.reason)
          .find((reason) => reason?.status === 401 || reason?.response?.status === 401 || reason?.isUnauthorized);

        if (authError) {
          clearAuthSession();
          navigate("/login", { replace: true });
          return;
        }

        const nonAuthErrors = [dashboardResult, allFacturesResult, activitiesResult, unseenFacturesResult]
          .filter((result) => result.status === "rejected")
          .map((result) => result.reason)
          .filter(Boolean);

        const dashboardPayload = dashboardData?.data || {};
        const allFactures = Array.isArray(allFacturesData?.data) ? allFacturesData.data : [];
        const recentActivitiesData = Array.isArray(activitiesData?.data) ? activitiesData.data : [];
        const unseenInvoicesData = Array.isArray(unseenFacturesData?.data) ? unseenFacturesData.data : [];

        if (dashboardPayload.user) {
          setUser(dashboardPayload.user);
        }

        if (nonAuthErrors.length > 0) {
          setErrorMessage(
            getErrorMessage(nonAuthErrors[0], {
              networkMessage: t("home.partialLoadError"),
              serverMessage: t("home.partialLoadError"),
              fallbackMessage: t("home.partialLoadError"),
            })
          );
        }

        setStats(buildStatsFromFactures(allFactures));

        const formatStatus = (status) => {
          return getTranslatedInvoiceStatus(status, t);
        };

        const formattedRecentActivities = recentActivitiesData
          .filter((activity) => activity?.invoice)
          .map((activity) => ({
            id: activity.id,
            title: t("home.invoiceLabel", { reference: activity.invoice.reference }),
            status: formatStatus(activity.invoice.status),
            amount: `${activity.invoice.prix} DH`,
          }));

        setRecentActivities(formattedRecentActivities);

        const formattedNewInvoices = unseenInvoicesData.map((facture) => ({
          id: facture.id,
          title: t("home.invoiceLabel", { reference: facture.reference }),
          status: formatStatus(facture.status),
          amount: `${facture.prix} DH`,
        }));

        setNewInvoices(formattedNewInvoices);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate, t]);

  if (loading) {
    return (
      <div className="home-page">
        <Container className="home-container">
          <p className="loading-text">{t("home.loading")}</p>
        </Container>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="home-page">
        <Container className="home-container">
          <p className="error-text">{errorMessage || t("home.loadingError")}</p>
        </Container>
      </div>
    );
  }

  const total = stats.payees + stats.non_payees + stats.en_attente;
  const hasRecentActivities = recentActivities.length > 0;
  const hasNewInvoices = newInvoices.length > 0;

  const statCards = [
    {
      id: "paid",
      title: t("home.paid"),
      value: stats.payees,
      description: t("home.paidDescription"),
      colorClass: "border-green",
    },
    {
      id: "unpaid",
      title: t("home.unpaid"),
      value: stats.non_payees,
      description: t("home.unpaidDescription"),
      colorClass: "border-red",
    },
    {
      id: "pending",
      title: t("home.pending"),
      value: stats.en_attente,
      description: t("home.pendingDescription"),
      colorClass: "border-yellow",
    },
  ];

  return (
    <div className="home-page">
      <Container className="home-container">
        <div className="dashboard-header">
          <h1 className="dashboard-title">
            {t("home.welcome", { firstName: user.prenom, lastName: user.nom })}
          </h1>
          <p className="dashboard-subtitle">
            {t("home.totalLabel", { total })} — {t("home.myInvoices")}
          </p>
        </div>

        {errorMessage && <div className="error-banner">{errorMessage}</div>}

        <Row className="stats-row mb-5">
          {statCards.map((item) => (
            <Col md={4} key={item.id} className="mb-4">
              <div className={`dashboard-card ${item.colorClass}`}>
                <h3 className="card-title">{item.title}</h3>
                <p className="card-value">{item.value}</p>
                <span className="card-description">{item.description}</span>
              </div>
            </Col>
          ))}
        </Row>

        <h2 className="section-title">{t("home.recentInvoices")}</h2>
        <Row className="recent-row">
          {hasRecentActivities ? (
            recentActivities.map((activity) => (
              <Col md={4} key={activity.id} className="mb-4">
                <div className="invoice-card">
                  <h4 className="invoice-card-title">{activity.title}</h4>
                  <div className="invoice-card-details">
                    <span className="invoice-label">{t("home.status")}</span>
                    <span className="invoice-value">{activity.status}</span>
                  </div>
                  <div className="invoice-card-details">
                    <span className="invoice-label">{t("home.amount")}</span>
                    <span className="invoice-value">{activity.amount}</span>
                  </div>
                </div>
              </Col>
            ))
          ) : (
            <Col xs={12}>
              <div className="empty-state-message">{t("home.noActivities")}</div>
            </Col>
          )}
        </Row>

        <h2 className="section-title">{t("home.newInvoices")}</h2>
        <Row className="recent-row">
          {hasNewInvoices ? (
            newInvoices.map((invoice) => (
              <Col md={4} key={invoice.id} className="mb-4">
                <div className="invoice-card">
                  <h4 className="invoice-card-title">{invoice.title}</h4>
                  <div className="invoice-card-details">
                    <span className="invoice-label">{t("home.status")}</span>
                    <span className="invoice-value">{invoice.status}</span>
                  </div>
                  <div className="invoice-card-details">
                    <span className="invoice-label">{t("home.amount")}</span>
                    <span className="invoice-value">{invoice.amount}</span>
                  </div>
                </div>
              </Col>
            ))
          ) : (
            <Col xs={12}>
              <div className="empty-state-message">{t("home.noNewInvoices")}</div>
            </Col>
          )}
        </Row>
      </Container>
    </div>
  );
}

export default Home;
