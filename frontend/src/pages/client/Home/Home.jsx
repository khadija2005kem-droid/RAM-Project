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
  const [recentFactures, setRecentFactures] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashboardData, allFacturesData, recentData] = await Promise.all([
          api.dashboard(),
          api.facturesAll(),
          api.facturesRecent(),
        ]);

        const dashboardPayload = dashboardData?.data || {};
        const allFactures = Array.isArray(allFacturesData?.data) ? allFacturesData.data : [];
        const recentFacturesData = Array.isArray(recentData?.data) ? recentData.data : [];

        if (dashboardPayload.user) {
          setUser(dashboardPayload.user);
        }

        setStats(buildStatsFromFactures(allFactures));

        const formattedRecentFactures = recentFacturesData.map((facture) => ({
          id: facture.id,
          title: `Facture ${facture.reference}`,
          status: formatStatus(facture.status),
          amount: `${facture.prix} DH`,
        }));
        setRecentFactures(formattedRecentFactures);
      } catch (error) {
        console.error("Error fetching data:", error);

        if (error?.status === 401 || error?.response?.status === 401 || error?.isUnauthorized) {
          clearAuthSession();
          navigate("/login", { replace: true });
          return;
        }
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
  const hasRecentFactures = recentFactures.length > 0;

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
        {hasRecentFactures ? (
          recentFactures.map((facture) => (
            <Col md={4} key={facture.id} className="mb-3">
              <Card className="recent-card">
                <Card.Body>
                  <h6>{facture.title}</h6>
                  <p>
                    {t("home.status")} {facture.status}
                  </p>
                  <p>
                    {t("home.amount")} {facture.amount}
                  </p>
                </Card.Body>
              </Card>
            </Col>
          ))
        ) : (
          <Col xs={12}>
            <div className="empty-state-message">{t("home.noInvoices")}</div>
          </Col>
        )}
      </Row>
    </Container>
  );
}

export default Home;
