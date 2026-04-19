import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Row, Col, Button, Card, Spinner } from "react-bootstrap";

import { api } from "../../../services/api";
import { normalizeInvoiceStatus } from "../../../utils/invoiceStatus";
import Navbar from "../ComponentsC/NavbarClient/NavbarClient";
import logo from "../../../assets/logoRAM.jpg";
import "./Facturepdf.css";

const Facturepdf = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const response = await api.getFactureById(id);
        setInvoice(response);
      } catch (error) {
        console.error("Error fetching invoice:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [id]);

  const downloadPDF = async () => {
    if (!invoice) return;
    window.print();
  };

  const handlePayment = () => {
    navigate("/paiement", {
      state: { reference: invoice?.reference },
    });
  };

  const getStatusInfo = (status) => {
    const normalizedStatus = normalizeInvoiceStatus(status);

    const statusMap = {
      paid: {
        badge: "bg-success",
        text: t("status.payee"),
        message: t("status.payee_message"),
      },
      pending: {
        badge: "bg-warning",
        text: t("status.en_attente"),
        message: t("status.en_attente_message"),
      },
      unpaid: {
        badge: "bg-danger",
        text: t("status.non_payee"),
        message: t("status.non_payee_message"),
      },
    };

    return statusMap[normalizedStatus] || {
      badge: "bg-secondary",
      text: status,
      message: t("status.unknown_message"),
    };
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: "60vh" }}>
          <Spinner animation="border" role="status" className="text-danger">
            <span className="visually-hidden">{t("facturepdf.loading")}</span>
          </Spinner>
        </Container>
      </>
    );
  }

  if (!invoice) {
    return (
      <>
        <Navbar />
        <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: "60vh" }}>
          <div className="text-center">
            <h4>{t("facturepdf.invoiceNotFound")}</h4>
            <p>{t("facturepdf.invoiceNotFoundMessage")}</p>
          </div>
        </Container>
      </>
    );
  }

  const statusInfo = getStatusInfo(invoice.status);

  return (
    <>
      <Navbar />
      <div className="invoice-page">
        <Container className="invoice-container">
          <Row className="justify-content-center">
            <Col xs={12} lg={10} xl={8}>
              <Card className="invoice-paper">
                <Card.Body className="p-4">
                  <Row className="mb-4">
                    <Col md={6}>
                      <div className="d-flex align-items-center">
                        <div className="ram-logo me-3">
                          <img src={logo} alt="RAM Logo" style={{ width: "60px", height: "auto" }} />
                        </div>
                        <div>
                          <h2 className="text-danger mb-0">{t("facturepdf.companyName")}</h2>
                          <p className="text-muted small mb-0">{t("facturepdf.companyDescription")}</p>
                        </div>
                      </div>
                    </Col>
                    <Col md={6} className="text-end">
                      <h4 className="text-danger mb-2">{t("facturepdf.invoice")}</h4>
                      <p className="mb-1">
                        <strong>{t("facturepdf.reference")}</strong> {invoice.reference}
                      </p>
                      <p className="mb-0">
                        <strong>{t("facturepdf.date")}</strong> {invoice.date}
                      </p>
                    </Col>
                  </Row>

                  <hr className="invoice-separator" />

                  <Row className="mb-4">
                    <Col md={6}>
                      <h6 className="text-danger mb-2">{t("facturepdf.clientInfo")}</h6>
                      <p className="mb-0">{invoice?.user?.name || "Nom du client"}</p>
                      <p className="mb-0">{invoice?.user?.email || "Email du client"}</p>
                    </Col>
                  </Row>

                  <div className="invoice-table mb-4">
                    <Row className="table-header py-2">
                      <Col md={8}>
                        <strong>{t("facturepdf.description")}</strong>
                      </Col>
                      <Col md={4} className="text-end">
                        <strong>{t("facturepdf.price")}</strong>
                      </Col>
                    </Row>

                    <div className="table-body">
                      <Row className="table-row py-2">
                        <Col md={8}>{t("facturepdf.airplaneTicket")}</Col>
                        <Col md={4} className="text-end">
                          {invoice.prix} MAD
                        </Col>
                      </Row>
                    </div>
                  </div>

                  <Row className="justify-content-end">
                    <Col md={4}>
                      <div className="total-section p-3 bg-light rounded">
                        <div className="d-flex justify-content-between">
                          <strong>{t("facturepdf.total")}</strong>
                          <span className="text-danger fw-bold fs-5" style={{ whiteSpace: "nowrap" }}>
                            {invoice.prix} MAD
                          </span>
                        </div>
                      </div>
                    </Col>
                  </Row>

                  <Row className="mt-4">
                    <Col className="text-center">
                      <p className="text-muted small mb-0">{t("facturepdf.thankYou")}</p>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row className="mt-4">
            <Col className="text-center">
              <div className="status-section">
                <h5 className="mb-2">{t("facturepdf.invoiceStatus")}</h5>
                <span className={`badge ${statusInfo.badge} fs-6 px-3 py-2`}>{statusInfo.text}</span>
                <p className="mt-2 text-muted">{statusInfo.message}</p>
              </div>
            </Col>
          </Row>

          <Row className="mt-5">
            <Col className="text-center">
              <div className="d-flex gap-2 gap-md-3 justify-content-center flex-wrap">
                <Button variant="danger" size="lg" onClick={downloadPDF} className="download-btn">
                  {t("facturepdf.downloadPDF")}
                </Button>

                {normalizeInvoiceStatus(invoice?.status) === "unpaid" && (
                  <Button variant="success" size="lg" onClick={handlePayment} className="payment-btn">
                    {t("facturepdf.payNow")}
                  </Button>
                )}
              </div>
            </Col>
          </Row>
        </Container>
      </div>
    </>
  );
};

export default Facturepdf;
