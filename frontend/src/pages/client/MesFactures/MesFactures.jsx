import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Container, Row, Col, Card, Table, Button, Dropdown, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { api } from "../../../services/api";
import { clearAuthSession } from "../../../utils/auth";
import { getErrorMessage } from "../../../utils/errorHandling";
import { getTranslatedInvoiceStatus, normalizeInvoiceStatus } from "../../../utils/invoiceStatus";
import "./MesFactures.css";

function MesFactures() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [facturesData, setFacturesData] = useState([]);
  const [viewMode, setViewMode] = useState("table");
  const [filterStatus, setFilterStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [navigatingInvoiceId, setNavigatingInvoiceId] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchFactures = async () => {
      try {
        setErrorMessage("");
        const [facturesResult, activitiesResult] = await Promise.allSettled([
          api.facturesAll(),
          api.facturesUnseen(),
        ]);

        const authError = [facturesResult, activitiesResult]
          .filter((result) => result.status === "rejected")
          .map((result) => result.reason)
          .find((reason) => reason?.status === 401 || reason?.response?.status === 401 || reason?.isUnauthorized);

        if (authError) {
          clearAuthSession();
          navigate("/login", { replace: true });
          return;
        }

        const facturesResponse = facturesResult.status === "fulfilled" ? facturesResult.value : null;
        const activitiesResponse = activitiesResult.status === "fulfilled" ? activitiesResult.value : null;

        if (facturesResult.status === "rejected") {
          setErrorMessage(
            getErrorMessage(facturesResult.reason, {
              networkMessage: t("mesFactures.loadError"),
              serverMessage: t("mesFactures.loadError"),
              fallbackMessage: t("mesFactures.loadError"),
            })
          );
        } else if (activitiesResult.status === "rejected") {
          setErrorMessage(
            getErrorMessage(activitiesResult.reason, {
              networkMessage: t("mesFactures.partialLoadError"),
              serverMessage: t("mesFactures.partialLoadError"),
              fallbackMessage: t("mesFactures.partialLoadError"),
            })
          );
        }

        const unseenInvoiceIds = new Set(
          Array.isArray(activitiesResponse?.data)
            ? activitiesResponse.data.map((facture) => facture.id)
            : []
        );

        if (facturesResponse?.status && Array.isArray(facturesResponse.data)) {
          const formatted = facturesResponse.data.map((facture) => ({
            ...facture,
            prix: `${facture.prix} DH`,
            isUnseen: unseenInvoiceIds.has(facture.id),
          }));
          setFacturesData(formatted);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchFactures();
  }, [navigate, t]);

  const getTranslatedStatus = (status) => getTranslatedInvoiceStatus(status, t);

  const filteredFactures = facturesData.filter((facture) =>
    filterStatus === "all" ? true : normalizeInvoiceStatus(facture.status) === filterStatus
  );

  const hasFactures = filteredFactures.length > 0;

  const handleViewInvoice = (invoiceId) => {
    if (navigatingInvoiceId !== null) {
      return;
    }

    setNavigatingInvoiceId(invoiceId);
    navigate(`/invoice/${invoiceId}`);
  };

  return (
    <Container className="mes-factures-container mt-4">
      <h2 className="mb-4">{t("mesFactures.title")}</h2>

      {errorMessage && <div className="empty-state-message mb-3">{errorMessage}</div>}

      <div className="mb-3 d-flex justify-content-between flex-wrap">
        <Dropdown>
          <Dropdown.Toggle variant="secondary" id="dropdown-basic">
            {t("mesFactures.filterByStatus")}{" "}
            {filterStatus === "all" ? t("mesFactures.all") : getTranslatedStatus(filterStatus)}
          </Dropdown.Toggle>

          <Dropdown.Menu>
            {[
              { key: "all", label: t("mesFactures.all") },
              { key: "paid", label: t("status.payee") },
              { key: "unpaid", label: t("status.non_payee") },
              { key: "pending", label: t("status.en_attente") },
            ].map(({ key, label }) => (
              <Dropdown.Item
                key={key}
                onClick={() => setFilterStatus(key)}
                className={filterStatus === key ? "active-item" : ""}
              >
                {label}
              </Dropdown.Item>
            ))}
          </Dropdown.Menu>
        </Dropdown>

        <br />

        <Button
          className="btn-toggle-carte"
          onClick={() => setViewMode(viewMode === "table" ? "cards" : "table")}
        >
          {viewMode === "table" ? t("mesFactures.showAsCards") : t("mesFactures.showAsTable")}
        </Button>
      </div>

      {viewMode === "table" &&
        (loading ? (
          <div style={{ textAlign: "center", padding: "2rem 0" }}>
            <Spinner animation="border" role="status" />
          </div>
        ) : hasFactures ? (
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>{t("mesFactures.reference")}</th>
                <th>{t("mesFactures.date")}</th>
                <th>{t("mesFactures.price")}</th>
                <th>{t("mesFactures.status")}</th>
                <th>{t("mesFactures.action")}</th>
              </tr>
            </thead>
            <tbody>
              {filteredFactures.map((facture) => (
                <tr key={facture.id}>
                  <td>{facture.reference}</td>
                  <td>{facture.date}</td>
                  <td>{facture.prix}</td>
                  <td>{getTranslatedStatus(facture.status)}</td>
                  <td>
                    <div className="facture-action">
                      <Button
                        size="sm"
                        className="btn-voir"
                        onClick={() => handleViewInvoice(facture.id)}
                        disabled={navigatingInvoiceId !== null}
                      >
                        {t("mesFactures.view")}
                      </Button>
                      {facture.isUnseen && <span className="unseen-indicator-dot" aria-hidden="true" />}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <div className="empty-state-message">{errorMessage || t("mesFactures.noInvoices")}</div>
        ))}

      {viewMode === "cards" &&
        (loading ? (
          <div style={{ textAlign: "center", padding: "2rem 0" }}>
            <Spinner animation="border" role="status" />
          </div>
        ) : hasFactures ? (
          <Row>
            {filteredFactures.map((facture) => (
              <Col md={3} sm={6} xs={12} className="mb-4" key={facture.id}>
                <Card className={`facture-card ${normalizeInvoiceStatus(facture.status)}`}>
                  <Card.Body>
                    <Card.Title>{facture.reference}</Card.Title>
                    <Card.Text>
                      {t("mesFactures.date")}: {facture.date}
                    </Card.Text>
                    <Card.Text>
                      {t("mesFactures.price")}: {facture.prix}
                    </Card.Text>
                    <Card.Text>
                      {t("mesFactures.status")}: {getTranslatedStatus(facture.status)}
                    </Card.Text>
                    <div className="facture-action">
                      <Button
                        size="sm"
                        className="btn-voir"
                        onClick={() => handleViewInvoice(facture.id)}
                        disabled={navigatingInvoiceId !== null}
                      >
                        {t("mesFactures.view")}
                      </Button>
                      {facture.isUnseen && <span className="unseen-indicator-dot" aria-hidden="true" />}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          <div className="empty-state-message">{errorMessage || t("mesFactures.noInvoices")}</div>
        ))}
    </Container>
  );
}

export default MesFactures;
