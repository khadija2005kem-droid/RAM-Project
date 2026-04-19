import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Container, Row, Col, Card, Table, Button, Dropdown, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { api } from "../../../services/api";
import { getTranslatedInvoiceStatus, normalizeInvoiceStatus } from "../../../utils/invoiceStatus";
import "./MesFactures.css";

function MesFactures() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [facturesData, setFacturesData] = useState([]);
  const [viewMode, setViewMode] = useState("table"); // table or cards
  const [filterStatus, setFilterStatus] = useState("Tout"); // Tout, Payée, Non payée, En attente
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFactures = async () => {
      try {
        const data = await api.facturesAll();
        if (data.status && data.data) {
          const formatted = data.data.map(f => ({
            ...f,
            prix: `${f.prix} DH`
          }));
          setFacturesData(formatted);
        }
      } catch (error) {
        console.error("Error fetching factures:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFactures();
  }, []); // eslint-disable-next-line react-hooks/exhaustive-deps

  const getTranslatedStatus = (status) => getTranslatedInvoiceStatus(status, t);

  const filteredFactures = facturesData.filter(f =>
    filterStatus === "Tout" ? true : getTranslatedStatus(f.status) === filterStatus
  );

  const hasFactures = filteredFactures.length > 0;

  return (
    <Container className="mes-factures-container mt-4">

      <h2 className="mb-4">{t("mesFactures.title")}</h2>

      {/* Boutons */}
      <div className="mb-3 d-flex justify-content-between flex-wrap">
        {/* Filtrage */}
        <Dropdown>
          <Dropdown.Toggle variant="secondary" id="dropdown-basic">
            {t("mesFactures.filterByStatus")} {filterStatus}
          </Dropdown.Toggle>

        <Dropdown.Menu>
            {[
              { key: "Tout", label: "Tout" },
              { key: "paid", label: t("status.payee") },
              { key: "unpaid", label: t("status.non_payee") },
              { key: "pending", label: t("status.en_attente") }
            ].map(({key, label}) => (
              <Dropdown.Item
                key={key}
                onClick={() => setFilterStatus(key === "Tout" ? "Tout" : label)}
                className={filterStatus === label || (key === "Tout" && filterStatus === "Tout") ? "active-item" : ""}
              >
                {label}
              </Dropdown.Item>
            ))}
        </Dropdown.Menu>

        </Dropdown>

        <br/>

        {/* Basculer Table / Carte */}
        <Button 
            className="btn-toggle-carte" 
            onClick={() => setViewMode(viewMode === "table" ? "cards" : "table")}
            >
            {viewMode === "table" ? t("mesFactures.showAsCards") : t("mesFactures.showAsTable")}
        </Button>
      </div>

      {/* Tableau */}
      {viewMode === "table" && (
        loading ? (
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
              {filteredFactures.map(f => (
                <tr key={f.id}>
                  <td>{f.reference}</td>
                  <td>{f.date}</td>
                  <td>{f.prix}</td>
                  <td>{getTranslatedStatus(f.status)}</td>
                  <td>
                    <Button size="sm" className="btn-voir" onClick={() => navigate(`/invoice/${f.id}`)}>
                      {t("mesFactures.view")}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <div className="empty-state-message">
            {t("mesFactures.noInvoices")}
          </div>
        )
      )}

      {/* Cartes */}
      {viewMode === "cards" && (
        loading ? (
          <div style={{ textAlign: "center", padding: "2rem 0" }}>
            <Spinner animation="border" role="status" />
          </div>
        ) : hasFactures ? (
          <Row>
            {filteredFactures.map(f => (
              <Col md={3} sm={6} xs={12} className="mb-4" key={f.id}>
                <Card className={`facture-card ${normalizeInvoiceStatus(f.status)}`}>
                  <Card.Body>
                    <Card.Title>{f.reference}</Card.Title>
                    <Card.Text>{t("mesFactures.date")}: {f.date}</Card.Text>
                    <Card.Text>{t("mesFactures.price")}: {f.prix}</Card.Text>
                    <Card.Text>{t("mesFactures.status")}: {getTranslatedStatus(f.status)}</Card.Text>
                    <Button size="sm" className="btn-voir" onClick={() => navigate(`/invoice/${f.id}`)}>
                      {t("mesFactures.view")}
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          <div className="empty-state-message">
            {t("mesFactures.noInvoices")}
          </div>
        )
      )}

    </Container>
  );
}

export default MesFactures;
