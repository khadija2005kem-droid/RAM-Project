import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { Container, Card, Form, Button } from "react-bootstrap";
import { FaCcVisa, FaCcAmex } from "react-icons/fa";
import { api } from "../../../services/api";
import { normalizeInvoiceStatus } from "../../../utils/invoiceStatus";
import "./Paiement.css";

function MastercardIcon() {
  return (
    <svg viewBox="0 0 48 32" aria-hidden="true" focusable="false">
      <circle cx="18" cy="16" r="10" fill="#EB001B" />
      <circle cx="30" cy="16" r="10" fill="#F79E1B" />
      <path
        d="M24 8.2a10 10 0 0 0 0 15.6a10 10 0 0 0 0-15.6Z"
        fill="#FF5F00"
      />
    </svg>
  );
}

const CARD_TYPE_META = {
  visa: {
    label: "Visa",
    Icon: FaCcVisa,
  },
  mastercard: {
    label: "Mastercard",
    Icon: MastercardIcon,
  },
  amex: {
    label: "American Express",
    Icon: FaCcAmex,
  },
};

function detectCardType(cardNumber) {
  const digits = cardNumber.replace(/\D/g, "");

  if (!digits) return null;
  if (digits.startsWith("4")) return "visa";

  if (digits.startsWith("34") || digits.startsWith("37")) {
    return "amex";
  }

  if (digits.length >= 2) {
    const twoDigits = Number(digits.slice(0, 2));
    if (twoDigits >= 51 && twoDigits <= 55) {
      return "mastercard";
    }
  }

  if (digits.length >= 4) {
    const fourDigits = Number(digits.slice(0, 4));
    if (fourDigits >= 2221 && fourDigits <= 2720) {
      return "mastercard";
    }
  }

  return null;
}

function Paiement() {
  const { t } = useTranslation();
  const location = useLocation();
  const [formData, setFormData] = useState({
    numero_facture: location.state?.reference || "",
    nom_titulaire: "",
    numero_carte: "",
    date_expiration: "",
    cvc: ""
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [invoiceCheck, setInvoiceCheck] = useState(null);
  const [checkingInvoice, setCheckingInvoice] = useState(false);

  const reference = location.state?.reference;
  const detectedCardType = detectCardType(formData.numero_carte);
  const detectedCardMeta = detectedCardType ? CARD_TYPE_META[detectedCardType] : null;

  // Check invoice if reference is provided via route state
  const checkInvoice = useCallback(async (invoiceReference) => {
    if (!invoiceReference || invoiceReference.length < 10) {
      setInvoiceCheck(null);
      return null;
    }

    setCheckingInvoice(true);
    try {
      const result = await api.checkFactureByReference(invoiceReference);
      setInvoiceCheck(result);
      return result;
    } catch (err) {
      if (err.status === 404) {
        setInvoiceCheck({ error: "Facture introuvable" });
      } else {
        setInvoiceCheck({ error: t("paiement.invoiceCheckError") });
      }
      return null;
    } finally {
      setCheckingInvoice(false);
    }
  }, [t]);

  useEffect(() => {
    if (reference) {
      checkInvoice(reference);
    }
  }, [checkInvoice, reference]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value
    });

    // Clear field error
    if (fieldErrors[name]) {
      setFieldErrors({ ...fieldErrors, [name]: "" });
    }

    // Clear global error
    if (error) setError("");

    // Check invoice when reference changes
    if (name === "numero_facture") {
      checkInvoice(value);
    }
  };

  const getInvoiceMessage = () => {
    if (checkingInvoice) {
      return <div className="text-muted">{t("paiement.checkingInvoice")}</div>;
    }

    if (!invoiceCheck) {
      return null;
    }

    if (invoiceCheck.error) {
      return <div className="text-danger">{invoiceCheck.error}</div>;
    }

    const normalizedStatus = normalizeInvoiceStatus(invoiceCheck.status);

    if (normalizedStatus === "paid") {
      return <div className="text-danger">{t("paiement.alreadyPaid")}</div>;
    }

    if (normalizedStatus === "pending") {
      return <div className="text-warning">{t("paiement.pendingValidation")}</div>;
    }

    if (normalizedStatus === "unpaid") {
      return <div className="text-success">{t("paiement.amountToPay", { amount: invoiceCheck.prix })}</div>;
    }

    return null;
  };

  const isPaymentDisabled = () => {
    return !invoiceCheck ||
           invoiceCheck.error ||
           normalizeInvoiceStatus(invoiceCheck.status) === "paid" ||
           normalizeInvoiceStatus(invoiceCheck.status) === "pending";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSubmitted(false);

    const errors = {};

    // Validation
    if (!formData.numero_facture.trim()) {
      errors.numero_facture = t("paiement.invoiceNumberRequired");
    }

    if (!formData.nom_titulaire.trim()) {
      errors.nom_titulaire = t("paiement.cardholderNameRequired");
    }

    if (!formData.numero_carte.trim()) {
      errors.numero_carte = t("paiement.cardNumberRequired");
    } else if (formData.numero_carte.replace(/\s/g, "").length < 16) {
      errors.numero_carte = t("paiement.invalidCardNumber");
    }

    if (!formData.date_expiration.trim()) {
      errors.date_expiration = t("paiement.expiryDateRequired");
    }

    if (!formData.cvc.trim()) {
      errors.cvc = t("paiement.cvcRequired");
    } else if (formData.cvc.length < 3) {
      errors.cvc = t("paiement.invalidCvc");
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);

    try {
      const invoiceReference = formData.numero_facture;

      const data = await api.paiementSubmit({
        numero_facture: formData.numero_facture,
        nom_titulaire: formData.nom_titulaire,
        numero_carte: formData.numero_carte.replace(/\s/g, ""),
        date_expiration: `20${formData.date_expiration.split('/')[1]}-${formData.date_expiration.split('/')[0]}-01`,
        cvc: formData.cvc,
        montant: invoiceCheck?.prix // Use the checked invoice price
      });

      if (data.status) {
        const updatedInvoice =
          data?.data?.facture || (await checkInvoice(invoiceReference));

        setSubmitted(true);
        setInvoiceCheck(updatedInvoice);

        setFormData({
          numero_facture: "",
          nom_titulaire: "",
          numero_carte: "",
          date_expiration: "",
          cvc: ""
        });
      } else {
        setError(data.message || t("paiement.paymentError"));
      }

    } catch (err) {
      console.error("Payment error:", err);

      if (err.status === 422 && err.errors) {
        const formatted = {};
        Object.keys(err.errors).forEach((key) => {
          formatted[key] = err.errors[key][0];
        });
        setFieldErrors(formatted);
      } else {
        setError(t("paiement.serverError"));
      }

    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="paiement-container mt-4">
      <Card className="paiement-card custom-card">
        <Card.Header className="custom-card-header text-center">
          <h4>{t("paiement.title")}</h4>
        </Card.Header>

        <Card.Body>
          {/* SUCCESS ONLY */}
          {submitted && (
            <div className="form-summary-success">
              {t("paiement.paymentSuccess")}
            </div>
          )}

          <Form onSubmit={handleSubmit}>

            <Form.Group className="mb-3">
              <Form.Label>{t("paiement.invoiceNumber")}</Form.Label>
              <Form.Control
                type="text"
                placeholder={t("paiement.invoiceNumberPlaceholder")}
                name="numero_facture"
                value={formData.numero_facture}
                onChange={handleChange}
                isInvalid={!!fieldErrors.numero_facture}
              />
              <Form.Control.Feedback type="invalid" className="d-block">
                {fieldErrors.numero_facture}
              </Form.Control.Feedback>
              {getInvoiceMessage()}
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>{t("paiement.cardholderName")}</Form.Label>
              <Form.Control
                type="text"
                name="nom_titulaire"
                placeholder={t("paiement.cardholderNamePlaceholder")}
                autoComplete="cc-name"
                value={formData.nom_titulaire}
                onChange={handleChange}
                isInvalid={!!fieldErrors.nom_titulaire}
              />
              <Form.Control.Feedback type="invalid" className="d-block">
                {fieldErrors.nom_titulaire}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>{t("paiement.cardNumber")}</Form.Label>
              <div className={`card-number-field ${detectedCardMeta ? "has-card-icon" : ""}`}>
                <Form.Control
                  type="text"
                  name="numero_carte"
                  value={formData.numero_carte}
                  onChange={handleChange}
                  placeholder={t("paiement.cardNumberPlaceholder")}
                  isInvalid={!!fieldErrors.numero_carte}
                />
                {detectedCardMeta && (
                  <span
                    className={`card-type-indicator card-type-${detectedCardType}`}
                    aria-label={detectedCardMeta.label}
                    title={detectedCardMeta.label}
                  >
                    <detectedCardMeta.Icon />
                  </span>
                )}
              </div>
              <Form.Control.Feedback type="invalid" className="d-block">
                {fieldErrors.numero_carte}
              </Form.Control.Feedback>
            </Form.Group>

            <div className="row">
              <div className="col">
                <Form.Group className="mb-3">
                  <Form.Label>{t("paiement.expiryDate")}</Form.Label>
                  <Form.Control
                    type="text"
                    name="date_expiration"
                    placeholder={t("paiement.expiryDatePlaceholder")}
                    value={formData.date_expiration}
                    onChange={handleChange}
                    isInvalid={!!fieldErrors.date_expiration}
                  />
                  <Form.Control.Feedback type="invalid" className="d-block">
                    {fieldErrors.date_expiration}
                  </Form.Control.Feedback>
                </Form.Group>
              </div>

              <div className="col">
                <Form.Group className="mb-3">
                  <Form.Label>{t("paiement.cvc")}</Form.Label>
                  <Form.Control
                    type="password"
                    name="cvc"
                    value={formData.cvc}
                    onChange={handleChange}
                    isInvalid={!!fieldErrors.cvc}
                  />
                  <Form.Control.Feedback type="invalid" className="d-block">
                    {fieldErrors.cvc}
                  </Form.Control.Feedback>
                </Form.Group>
              </div>
            </div>

            {error && (
              <div className="error-text text-center mb-3">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="paiement-btn w-100"
              disabled={loading || isPaymentDisabled()}
            >
              {loading ? t("paiement.processing") : t("paiement.pay")}
            </Button>

          </Form>

        </Card.Body>
      </Card>
    </Container>
  );
}

export default Paiement;
