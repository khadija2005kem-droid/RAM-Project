import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Container, Row, Col, Card } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

import { api } from "../../../services/api";
import { clearAuthSession } from "../../../utils/auth";
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

  useEffect(() => {
    const fetchData = async () => {
      try {
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

        const dashboardPayload = dashboardData?.data || {};
        const allFactures = Array.isArray(allFacturesData?.data) ? allFacturesData.data : [];
        const recentActivitiesData = Array.isArray(activitiesData?.data) ? activitiesData.data : [];
        const unseenInvoicesData = Array.isArray(unseenFacturesData?.data) ? unseenFacturesData.data : [];

        if (dashboardPayload.user) {
          setUser(dashboardPayload.user);
        }

        setStats(buildStatsFromFactures(allFactures));

        const formattedRecentActivities = recentActivitiesData
          .filter((activity) => activity?.invoice)
          .map((activity) => ({
            id: activity.id,
            title: `Facture ${activity.invoice.reference}`,
            status: formatStatus(activity.invoice.status),
            amount: `${activity.invoice.prix} DH`,
          }));

        setRecentActivities(formattedRecentActivities);

        const formattedNewInvoices = unseenInvoicesData.map((facture) => ({
          id: facture.id,
          title: `Facture ${facture.reference}`,
          status: formatStatus(facture.status),
          amount: `${facture.prix} DH`,
        }));

        setNewInvoices(formattedNewInvoices);
      } finally {
        setLoading(false);
      }
    };

    const formatStatus = (status) => {
      return getTranslatedInvoiceStatus(status, t);
    };

    fetchData();
  }, [navigate, t]);

  if (loading) {
    return (
      <Container className="home-container">
        <p>{t("home.loading")}</p>
      </Container>
    );
  }

  if (!user) {
    return (
      <Container className="home-container">
        <p>{t("home.loadingError")}</p>
      </Container>
    );
  }

  const total = stats.payees + stats.non_payees + stats.en_attente;
  const hasRecentActivities = recentActivities.length > 0;
  const hasNewInvoices = newInvoices.length > 0;

  return (
    <Container className="home-container">
      <h2 className="welcome-text">{t("home.welcome", { firstName: user.prenom, lastName: user.nom })}</h2>

      <div className="mes-factures-bar">
        <h4>
          Total: {total} - {t("home.myInvoices")}
        </h4>
      </div>

      <Row className="stats-row justify-content-center mb-5">
        <Col md={3}>
          <Card className="stat-card accepte">
            <Card.Body>
              <h5>{t("home.paid")}</h5>
              <h3>{stats.payees}</h3>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="stat-card refuse">
            <Card.Body>
              <h5>{t("home.unpaid")}</h5>
              <h3>{stats.non_payees}</h3>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="stat-card attente">
            <Card.Body>
              <h5>{t("home.pending")}</h5>
              <h3>{stats.en_attente}</h3>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <h4 className="recent-title mb-3">{t("home.recentInvoices")}</h4>
      <Row className="recent-row">
        {hasRecentActivities ? (
          recentActivities.map((activity) => (
            <Col md={4} key={activity.id} className="mb-3">
              <Card className="recent-card">
                <Card.Body>
                  <h6>{activity.title}</h6>
                  <p>
                    {t("home.status")} {activity.status}
                  </p>
                  <p>
                    {t("home.amount")} {activity.amount}
                  </p>
                </Card.Body>
              </Card>
            </Col>
          ))
        ) : (
          <Col xs={12}>
            <div className="empty-state-message">{t("home.noActivities")}</div>
          </Col>
        )}
      </Row>

      <h4 className="recent-title mb-3">{t("home.newInvoices")}</h4>
      <Row className="recent-row">
        {hasNewInvoices ? (
          newInvoices.map((invoice) => (
            <Col md={4} key={invoice.id} className="mb-3">
              <Card className="recent-card">
                <Card.Body>
                  <h6>{invoice.title}</h6>
                  <p>
                    {t("home.status")} {invoice.status}
                  </p>
                  <p>
                    {t("home.amount")} {invoice.amount}
                  </p>
                </Card.Body>
              </Card>
            </Col>
          ))
        ) : (
          <Col xs={12}>
            <div className="empty-state-message">{t("home.noNewInvoices")}</div>
          </Col>
        )}
      </Row>
    </Container>
  );
}

export default Home;
