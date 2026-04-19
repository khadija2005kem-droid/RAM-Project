import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Container, Row, Col, Form, Button, Spinner, Card } from "react-bootstrap";
import { api } from "../../../services/api";
import "./Contact.css";

function Contact() {
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    email: "",
    sujet: "",
    message: ""
  });

  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Validation errors
  const [fieldErrors, setFieldErrors] = useState({
    nom: "",
    prenom: "",
    email: "",
    sujet: "",
    message: ""
  });

  useEffect(() => {
  if (submitted) {
    const timer = setTimeout(() => setSubmitted(false), 3000);
    return () => clearTimeout(timer);
  }
  }, [submitted]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await api.getProfile();
        const userData = response.data || response;
        setFormData(prev => ({
          ...prev,
          nom: userData.nom || "",
          prenom: userData.prenom || "",
          email: userData.email || ""
        }));
      } catch (err) {
        console.error("Failed to fetch user data for contact form:", err);
      }
    };
    fetchUserData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({...formData, [name]: value });
    
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors({...fieldErrors, [name]: ""});
    }
  };

    const handleSubmit = async (e) => {
    e.preventDefault();

    let errors = {};

    // Reset
    setError("");
    setFieldErrors({});
    setSubmitted(false);

    // ✅ Validation propre
    if (!formData.nom.trim()) errors.nom = t("contact.lastNameRequired");
    if (!formData.prenom.trim()) errors.prenom = t("contact.firstNameRequired");

    if (!formData.email.trim()) {
      errors.email = t("contact.emailRequired");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = t("contact.invalidEmailFormat");
    }

    if (!formData.sujet.trim()) errors.sujet = t("contact.subjectRequired");
    if (!formData.message.trim()) errors.message = t("contact.messageRequired");

    // ❌ Stop if errors
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);

    try {
      const data = await api.contactSubmit(formData);

      // ✅ Success
      if (data.status || data.message) {
        setSubmitted(true);
        setFormData({ nom: "", prenom: "", email: "", sujet: "", message: "" });
        setFieldErrors({});
      }

    } catch (err) {
      console.error("Contact error:", err);

      // ✅ Laravel validation
      if (err.status === 422 && Object.keys(err.errors || {}).length > 0) {
        const formattedErrors = {};

        Object.keys(err.errors).forEach((key) => {
          formattedErrors[key] = err.errors[key][0];
        });

        setFieldErrors(formattedErrors);
        setError("");
      } 
      // ❌ Server unreachable
      else if (!err.status) {
        setError(t("contact.serverUnreachable"));
      } 
      // ❌ Other errors
      else {
        setError(err.message || t("contact.genericError"));
      }

    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="contact-container mt-4">
      <Card className="custom-card mx-auto">
        <Card.Header className="custom-card-header">
          <h4>{t("contact.title")}</h4>
        </Card.Header>

        <Card.Body>
          {error && (
            <div className="form-summary-error">
              <div className="form-summary-title">{t("contact.pleaseFix")}</div>
              <ul className="mb-0 mt-2">            {error && <li>{error}</li>}
                {Object.entries(fieldErrors)
                  .filter(([, msg]) => msg)
                  .map(([key, msg]) => (
                    <li key={key}>{msg}</li>
                  ))}
              </ul>
            </div>
          )}

          {submitted && (
            <div className="form-summary-success">
              {t("contact.successMessage")}
            </div>
          )}

          <Row>
            <Col md={12} sm={12}>
              <Form onSubmit={handleSubmit} noValidate>
                <Row>
              <Col md={6}>
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
              </Col>
              <Col md={6}>
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
              </Col>
            </Row>

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
              <Form.Label>{t("contact.subject")}</Form.Label>
              <Form.Control
                type="text"
                name="sujet"
                value={formData.sujet}
                onChange={handleChange}
                placeholder={t("contact.placeholderSubject")}
                isInvalid={!!fieldErrors.sujet}
              />
              <Form.Control.Feedback type="invalid" className="d-block">
                {fieldErrors.sujet}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>{t("contact.message")}</Form.Label>
              <Form.Control
                as="textarea"
                rows={5}
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder={t("contact.placeholderMessage")}
                isInvalid={!!fieldErrors.message}
              />
              <Form.Control.Feedback type="invalid" className="d-block">
                {fieldErrors.message}
              </Form.Control.Feedback>
            </Form.Group>

            <Button 
              type="submit" 
              className="btn-send"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                    className="me-2"
                  />
                  {t("contact.sending")}
                </>
              ) : (
                t("contact.send")
              )}
            </Button>
              </Form>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default Contact;
