import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Row, Col, Button, Card, Spinner } from "react-bootstrap";
import { jsPDF } from "jspdf";

import { api } from "../../../services/api";
import { getErrorMessage, isUnauthorizedError } from "../../../utils/errorHandling";
import { normalizeInvoiceStatus } from "../../../utils/invoiceStatus";
import Navbar from "../ComponentsC/NavbarClient/NavbarClient";
import logo from "../../../assets/logoRAM.jpg";
import "./Facturepdf.css";

const inFlightInvoiceRequests = new Map();

function fetchInvoiceOnce(id) {
  if (!inFlightInvoiceRequests.has(id)) {
    const request = api.getFactureById(id).finally(() => {
      inFlightInvoiceRequests.delete(id);
    });

    inFlightInvoiceRequests.set(id, request);
  }

  return inFlightInvoiceRequests.get(id);
}

const formatAmount = (amount) => Number(amount || 0).toFixed(2);

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function buildPdfFileName(reference) {
  const safeReference = String(reference || "facture").replace(/[^a-z0-9_-]/gi, "_");
  return `${safeReference}.pdf`;
}

const Facturepdf = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [downloadError, setDownloadError] = useState("");

  useEffect(() => {
    let isActive = true;

    const fetchInvoice = async () => {
      try {
        setLoadError("");
        const response = await fetchInvoiceOnce(id);

        if (!isActive) {
          return;
        }

        setInvoice(response);
      } catch (error) {
        if (isActive && isUnauthorizedError(error)) {
          navigate("/login", { replace: true });
          return;
        }

        if (isActive && error?.status !== 404) {
          console.error("Error fetching invoice:", error);
          setLoadError(
            getErrorMessage(error, {
              networkMessage: t("facturepdf.loadError"),
              serverMessage: t("facturepdf.loadError"),
              fallbackMessage: t("facturepdf.loadError"),
            })
          );
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    setLoading(true);
    fetchInvoice();

    return () => {
      isActive = false;
    };
  }, [id, navigate, t]);

    const downloadPDF = async () => {
    if (!invoice || isDownloading) return;

    setIsDownloading(true);
    setDownloadError("");

    try {
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const rightEdge = pageWidth - margin;
      const contentWidth = pageWidth - margin * 2;
      let cursorY = 24;

      const logoImage = await loadImage(logo).catch(() => null);

      if (logoImage) {
        pdf.addImage(logoImage, "JPEG", margin, cursorY, 22, 22);
      }

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(21);
      pdf.setTextColor(194, 8, 49);
      pdf.text("RAM", margin + 28, cursorY + 8);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(12);
      pdf.setTextColor(90, 90, 90);
      pdf.text(t("facturepdf.companyName"), margin + 28, cursorY + 15);

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(19);
      pdf.setTextColor(194, 8, 49);
      pdf.text(t("facturepdf.invoice"), rightEdge, cursorY + 5, { align: "right" });

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(12);
      pdf.setTextColor(60, 60, 60);
      pdf.text(`${t("facturepdf.reference")} ${invoice.reference}`, rightEdge, cursorY + 13, { align: "right" });
      pdf.text(`${t("facturepdf.date")} ${invoice.date}`, rightEdge, cursorY + 20, { align: "right" });

      cursorY += 34;
      pdf.setDrawColor(225, 225, 225);
      pdf.line(margin, cursorY, rightEdge, cursorY);

      cursorY += 12;
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      pdf.setTextColor(194, 8, 49);
      pdf.text(t("facturepdf.clientInfo"), margin, cursorY);

      cursorY += 8;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(12);
      pdf.setTextColor(33, 33, 33);
      pdf.text(invoice?.user?.name || t("facturepdf.clientNameFallback"), margin, cursorY);
      cursorY += 8;
      pdf.text(invoice?.user?.email || t("facturepdf.clientEmailFallback"), margin, cursorY);

      cursorY += 14;
      pdf.setFillColor(248, 249, 250);
      pdf.rect(margin, cursorY, contentWidth, 12, "F");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      pdf.setTextColor(194, 8, 49);
      pdf.text(t("facturepdf.description"), margin + 6, cursorY + 7.5);
      pdf.text(t("facturepdf.price"), rightEdge - 6, cursorY + 7.5, { align: "right" });

      cursorY += 14;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(12);
      pdf.setTextColor(33, 33, 33);

      for (const item of invoiceItems) {
        const descriptionLines = pdf.splitTextToSize(item.description || "", contentWidth - 48);
        const rowHeight = Math.max(10, descriptionLines.length * 5.5 + 4);

        if (cursorY + rowHeight + 30 > pageHeight) {
          pdf.addPage();
          cursorY = 24;
        }

        pdf.setDrawColor(234, 234, 234);
        pdf.rect(margin, cursorY, contentWidth, rowHeight);
        pdf.text(descriptionLines, margin + 6, cursorY + 6);
        pdf.text(`${formatAmount(item.price)} MAD`, rightEdge - 6, cursorY + 6, { align: "right" });
        cursorY += rowHeight;
      }

      cursorY += 14;

      const totalText = `${formatAmount(totalAmount)} MAD`;
      const totalTextWidth = pdf.getTextWidth(totalText);
      const totalLabelWidth = pdf.getTextWidth(t("facturepdf.total"));
      const totalBoxWidth = Math.min(Math.max(totalTextWidth + totalLabelWidth + 28, 64), contentWidth);
      const totalBoxX = rightEdge - totalBoxWidth;

      if (cursorY + 28 > pageHeight) {
        pdf.addPage();
        cursorY = 24;
      }

      pdf.setDrawColor(194, 8, 49);
      pdf.setFillColor(250, 247, 248);
      pdf.roundedRect(totalBoxX, cursorY, totalBoxWidth, 16, 3, 3, "FD");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12.5);
      pdf.setTextColor(194, 8, 49);
      pdf.text(t("facturepdf.total"), totalBoxX + 7, cursorY + 9.5);
      pdf.setTextColor(33, 33, 33);
      pdf.text(totalText, totalBoxX + totalBoxWidth - 7, cursorY + 9.5, { align: "right" });

      cursorY += 30;

      if (cursorY + 16 > pageHeight) {
        pdf.addPage();
        cursorY = 24;
      }

      pdf.setDrawColor(229, 229, 229);
      pdf.line(margin, cursorY, rightEdge, cursorY);
      cursorY += 10;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(11);
      pdf.setTextColor(120, 120, 120);
      pdf.text(t("facturepdf.thankYou"), pageWidth / 2, cursorY, { align: "center" });

      pdf.save(buildPdfFileName(invoice.reference));
    } catch (error) {
      console.error("PDF download error:", error);
      setDownloadError(t("facturepdf.downloadError"));
    } finally {
      setIsDownloading(false);
    }
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
        <div className="invoice-page">
          <Container className="invoice-container d-flex justify-content-center align-items-center" style={{ minHeight: "60vh" }}>
            <Spinner animation="border" role="status" className="ram-red-text">
              <span className="visually-hidden">{t("facturepdf.loading")}</span>
            </Spinner>
          </Container>
        </div>
      </>
    );
  }

  if (!invoice) {
    return (
      <>
        <Navbar />
        <div className="invoice-page">
          <Container className="invoice-container d-flex justify-content-center align-items-center" style={{ minHeight: "60vh" }}>
            <div className="text-center">
              <h4>{loadError ? t("home.loadingError") : t("facturepdf.invoiceNotFound")}</h4>
              <p>{loadError || t("facturepdf.invoiceNotFoundMessage")}</p>
            </div>
          </Container>
        </div>
      </>
    );
  }

  const statusInfo = getStatusInfo(invoice.status);
  const invoiceItems = Array.isArray(invoice.items) && invoice.items.length > 0
    ? invoice.items
    : [
        {
          description: t("facturepdf.airplaneTicket"),
          price: invoice.prix,
        },
      ];
  const totalAmount = invoice.prix ?? invoiceItems.reduce((sum, item) => sum + Number(item.price || 0), 0);

  return (
    <>
      <Navbar />
      <div className="invoice-page">
        <Container className="invoice-container">
          <Row className="justify-content-center">
            <Col xs={12} lg={10} xl={8}>
              <Card className="invoice-card border-gray">
                <Card.Body className="p-4">
                  <Row className="mb-4">
                    <Col md={6}>
                      <div className="d-flex align-items-center">
                        <div className="ram-logo me-3">
                          <img src={logo} alt={t("navbar.brand")} style={{ width: "60px", height: "auto" }} />
                        </div>
                        <div>
                          <h2 className="ram-red-text mb-0">{t("facturepdf.companyName")}</h2>
                          <p className="text-muted small mb-0">{t("facturepdf.companyDescription")}</p>
                        </div>
                      </div>
                    </Col>
                    <Col md={6} className="text-end">
                      <h4 className="ram-red-text mb-2">{t("facturepdf.invoice")}</h4>
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
                      <h6 className="ram-red-text mb-2">{t("facturepdf.clientInfo")}</h6>
                      <p className="mb-0">{invoice?.user?.name || t("facturepdf.clientNameFallback")}</p>
                      <p className="mb-0">{invoice?.user?.email || t("facturepdf.clientEmailFallback")}</p>
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
                      {invoiceItems.map((item, index) => (
                        <Row className="table-row py-2" key={`${item.description}-${index}`}>
                          <Col md={8}>{item.description}</Col>
                          <Col md={4} className="text-end">
                            {formatAmount(item.price)} MAD
                          </Col>
                        </Row>
                      ))}
                    </div>
                  </div>

                  <Row className="justify-content-end">
                    <Col md={4}>
                      <div className="total-section p-3 rounded">
                        <div className="d-flex justify-content-between">
                          <strong>{t("facturepdf.total")}</strong>
                          <span className="ram-red-text fw-bold fs-5" style={{ whiteSpace: "nowrap" }}>
                            {formatAmount(totalAmount)} MAD
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

          <Row className="mt-4 justify-content-center">
            <Col xs={12} lg={10} xl={8}>
              <Card className="status-card">
                <Card.Body className="text-center p-4">
                  <h5 className="mb-3">{t("facturepdf.invoiceStatus")}</h5>
                  <span className={`badge ${statusInfo.badge} fs-6 px-3 py-2`}>{statusInfo.text}</span>
                  <p className="mt-2 text-muted mb-0">{statusInfo.message}</p>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row className="mt-4 justify-content-center">
            <Col xs={12} lg={10} xl={8}>
              <Card className="actions-card">
                <Card.Body className="text-center p-4">
                  <div className="d-flex gap-2 gap-md-3 justify-content-center flex-wrap">
                    <Button
                      variant="danger"
                      size="lg"
                      onClick={downloadPDF}
                      className="download-btn"
                      disabled={isDownloading}
                    >
                      {t("facturepdf.downloadPDF")}
                    </Button>

                    {normalizeInvoiceStatus(invoice?.status) === "unpaid" && (
                      <Button variant="success" size="lg" onClick={handlePayment} className="payment-btn">
                        {t("facturepdf.payNow")}
                      </Button>
                    )}
                  </div>

                  {downloadError && <div className="text-danger mt-3">{downloadError}</div>}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>

        <div className="invoice-print-root" aria-hidden="true">
          <div className="invoice-print-sheet">
            <header className="print-header">
              <div className="print-brand">
                <div className="print-logo">
                  <img src={logo} alt={t("navbar.brand")} />
                </div>
                <div className="print-brand-copy">
                  <div className="print-brand-name">RAM</div>
                  <div className="print-brand-subtitle">{t("facturepdf.companyName")}</div>
                </div>
              </div>

              <div className="print-meta">
                <div className="print-meta-title">{t("facturepdf.invoice")}</div>
                <div className="print-meta-row">
                  <span>{t("facturepdf.reference")}</span>
                  <strong>{invoice.reference}</strong>
                </div>
                <div className="print-meta-row">
                  <span>{t("facturepdf.date")}</span>
                  <strong>{invoice.date}</strong>
                </div>
              </div>
            </header>

            <section className="print-section">
              <div className="print-section-title">{t("facturepdf.clientInfo")}</div>
              <div className="print-client-box">
                <p>{invoice?.user?.name || t("facturepdf.clientNameFallback")}</p>
                <p>{invoice?.user?.email || t("facturepdf.clientEmailFallback")}</p>
              </div>
            </section>

            <section className="print-section">
              <div className="print-items">
                <div className="print-items-head">
                  <span>{t("facturepdf.description")}</span>
                  <span className="print-amount-cell">{t("facturepdf.price")}</span>
                </div>

                <div className="print-items-body">
                  {invoiceItems.map((item, index) => (
                    <div className="print-item-row" key={`print-${item.description}-${index}`}>
                      <span className="print-item-description">{item.description}</span>
                      <span className="print-amount-cell">{formatAmount(item.price)} MAD</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="print-total-wrap">
              <div className="print-total-box">
                <span>{t("facturepdf.total")}</span>
                <strong>{formatAmount(totalAmount)} MAD</strong>
              </div>
            </section>

            <footer className="print-note">
              <p>{t("facturepdf.thankYou")}</p>
            </footer>
          </div>
        </div>
      </div>
    </>
  );
};

export default Facturepdf;