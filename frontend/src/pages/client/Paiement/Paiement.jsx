import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { Container, Card, Form, Button } from "react-bootstrap";
import { FaCcVisa, FaCcAmex } from "react-icons/fa";
import { api } from "../../../services/api";
import { clearAuthSession, getStoredUser } from "../../../utils/auth";
import { getErrorMessage, isUnauthorizedError } from "../../../utils/errorHandling";
import { normalizeInvoiceStatus } from "../../../utils/invoiceStatus";
import "./Paiement.css";

function MastercardIcon() {
  return (
    <svg viewBox="0 0 48 32" aria-hidden="true" focusable="false">
      <circle cx="18" cy="16" r="10" fill="#EB001B" />
      <circle cx="30" cy="16" r="10" fill="#F79E1B" />
      <path d="M24 8.2a10 10 0 0 0 0 15.6a10 10 0 0 0 0-15.6Z" fill="#FF5F00" />
    </svg>
  );
}

const CARD_TYPE_META = {
  visa: { label: "Visa", Icon: FaCcVisa },
  mastercard: { label: "Mastercard", Icon: MastercardIcon },
  amex: { label: "American Express", Icon: FaCcAmex },
};

function detectCardType(cardNumber) {
  const digits = cardNumber.replace(/\D/g, "");

  if (!digits) return null;
  if (digits.startsWith("4")) return "visa";
  if (digits.startsWith("34") || digits.startsWith("37")) return "amex";

  if (digits.length >= 2) {
    const twoDigits = Number(digits.slice(0, 2));
    if (twoDigits >= 51 && twoDigits <= 55) return "mastercard";
  }

  if (digits.length >= 4) {
    const fourDigits = Number(digits.slice(0, 4));
    if (fourDigits >= 2221 && fourDigits <= 2720) return "mastercard";
  }

  return null;
}

function parseExpiryDate(value) {
  const [month, year] = value.split("/");

  if (!month || !year || month.length !== 2 || year.length !== 2) {
    return null;
  }

  const normalizedMonth = Number(month);

  if (normalizedMonth < 1 || normalizedMonth > 12) {
    return null;
  }

  return `20${year}-${month}-01`;
}

function isEmailValid(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function Paiement() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const storedUser = getStoredUser();
  const [formData, setFormData] = useState({
    numero_facture: location.state?.reference || "",
    prenom: storedUser?.prenom || "",
    nom: storedUser?.nom || "",
    email: storedUser?.email || "",
    nom_titulaire: "",
    numero_carte: "",
    date_expiration: "",
    cvc: "",
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
      if (isUnauthorizedError(err)) {
        clearAuthSession();
        navigate("/login", { replace: true });
      } else if (err.status === 404) {
        setInvoiceCheck({ error: t("paiement.invoiceNotFound") });
      } else {
        setInvoiceCheck({
          error: getErrorMessage(err, {
            networkMessage: t("paiement.serverError"),
            serverMessage: t("paiement.invoiceCheckError"),
            fallbackMessage: t("paiement.invoiceCheckError"),
          }),
        });
      }

      return null;
    } finally {
      setCheckingInvoice(false);
    }
  }, [navigate, t]);

  useEffect(() => {
    if (reference) {
      checkInvoice(reference);
    }
  }, [checkInvoice, reference]);

  const validateForm = useCallback(() => {
    const errors = {};
    const sanitizedCardNumber = formData.numero_carte.replace(/\s/g, "");
    const expiryDate = parseExpiryDate(formData.date_expiration);

    if (!formData.numero_facture.trim()) {
      errors.numero_facture = t("paiement.invoiceNumberRequired");
    }

    if (!formData.prenom.trim()) {
      errors.prenom = t("contact.firstNameRequired");
    }

    if (!formData.nom.trim()) {
      errors.nom = t("contact.lastNameRequired");
    }

    if (!formData.email.trim()) {
      errors.email = t("contact.emailRequired");
    } else if (!isEmailValid(formData.email)) {
      errors.email = t("contact.invalidEmailFormat");
    }

    if (!formData.nom_titulaire.trim()) {
      errors.nom_titulaire = t("paiement.cardholderNameRequired");
    }

    if (!sanitizedCardNumber) {
      errors.numero_carte = t("paiement.cardNumberRequired");
    } else if (sanitizedCardNumber.length < 16) {
      errors.numero_carte = t("paiement.invalidCardNumber");
    }

    if (!formData.date_expiration.trim()) {
      errors.date_expiration = t("paiement.expiryDateRequired");
    } else if (!expiryDate) {
      errors.date_expiration = t("paiement.invalidExpiryDate");
    }

    if (!formData.cvc.trim()) {
      errors.cvc = t("paiement.cvcRequired");
    } else if (formData.cvc.length < 3) {
      errors.cvc = t("paiement.invalidCvc");
    }

    return errors;
  }, [formData, t]);

  const isPaymentDisabled = useMemo(() => {
    const hasInvoiceIssue =
      !invoiceCheck ||
      invoiceCheck.error ||
      normalizeInvoiceStatus(invoiceCheck.status) === "paid" ||
      normalizeInvoiceStatus(invoiceCheck.status) === "pending";

    return loading || hasInvoiceIssue || Object.keys(validateForm()).length > 0;
  }, [invoiceCheck, loading, validateForm]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setSubmitted(false);

    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }

    if (error) {
      setError("");
    }

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

    return <div className="text-success">{t("paiement.amountToPay", { amount: invoiceCheck.prix })}</div>;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = validateForm();
    setFieldErrors(errors);
    setSubmitted(false);

    if (Object.keys(errors).length > 0 || isPaymentDisabled) {
      return;
    }

    setLoading(true);

    try {
      const data = await api.paiementSubmit({
        invoice_id: invoiceCheck.id,
        user_id: storedUser?.id,
        numero_facture: formData.numero_facture,
        prenom: formData.prenom,
        nom: formData.nom,
        email: formData.email,
        nom_titulaire: formData.nom_titulaire,
        numero_carte: formData.numero_carte.replace(/\s/g, ""),
        date_expiration: parseExpiryDate(formData.date_expiration),
        cvc: formData.cvc,
        montant: invoiceCheck?.prix,
        status: "en_attente",
      });

      if (!data.status) {
        setError(data.message || t("paiement.paymentError"));
        return;
      }

      setSubmitted(true);
      setError("");

      const updatedInvoice = data?.data?.facture || (await checkInvoice(formData.numero_facture));
      setInvoiceCheck(updatedInvoice);

      setFormData((prev) => ({
        ...prev,
        numero_facture: "",
        nom_titulaire: "",
        numero_carte: "",
        date_expiration: "",
        cvc: "",
      }));
      setInvoiceCheck(null);
    } catch (err) {
      console.error("Payment error:", err);

      if (isUnauthorizedError(err)) {
        clearAuthSession();
        navigate("/login", { replace: true });
      } else if (err.status === 422 && err.errors) {
        const formatted = {};
        Object.keys(err.errors).forEach((key) => {
          formatted[key] = err.errors[key][0];
        });
        setFieldErrors(formatted);
      } else {
        setError(
          getErrorMessage(err, {
            networkMessage: t("paiement.serverError"),
            serverMessage: t("paiement.paymentError"),
            fallbackMessage: t("paiement.paymentError"),
          })
        );
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
          {submitted && <div className="form-summary-success">{t("paiement.paymentRequestSuccess")}</div>}

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

            <div className="row">
              <div className="col">
                <Form.Group className="mb-3">
                  <Form.Label>{t("contact.firstName")}</Form.Label>
                  <Form.Control
                    type="text"
                    name="prenom"
                    value={formData.prenom}
                    onChange={handleChange}
                    placeholder={t("contact.placeholderFirstName")}
                    isInvalid={!!fieldErrors.prenom}
                  />
                  <Form.Control.Feedback type="invalid" className="d-block">
                    {fieldErrors.prenom}
                  </Form.Control.Feedback>
                </Form.Group>
              </div>

              <div className="col">
                <Form.Group className="mb-3">
                  <Form.Label>{t("contact.lastName")}</Form.Label>
                  <Form.Control
                    type="text"
                    name="nom"
                    value={formData.nom}
                    onChange={handleChange}
                    placeholder={t("contact.placeholderLastName")}
                    isInvalid={!!fieldErrors.nom}
                  />
                  <Form.Control.Feedback type="invalid" className="d-block">
                    {fieldErrors.nom}
                  </Form.Control.Feedback>
                </Form.Group>
              </div>
            </div>

            <Form.Group className="mb-3">
              <Form.Label>{t("contact.email")}</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder={t("contact.placeholderEmail")}
                isInvalid={!!fieldErrors.email}
              />
              <Form.Control.Feedback type="invalid" className="d-block">
                {fieldErrors.email}
              </Form.Control.Feedback>
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

            {error && <div className="error-text text-center mb-3">{error}</div>}

            <Button type="submit" className="paiement-btn w-100" disabled={isPaymentDisabled}>
              {loading ? t("paiement.processing") : t("paiement.pay")}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default Paiement;
