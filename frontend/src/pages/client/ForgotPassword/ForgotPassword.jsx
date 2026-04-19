import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Container, Form, Button, Card } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import "./ForgotPassword.css";
import LanguageSwitcher from "../LanguageSwitcher/LanguageSwitcher";

function ForgotPassword() {
  const { t } = useTranslation();

  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [fieldErrors, setFieldErrors] = useState({
    email: ""
  });

  const handleReset = (e) => {
    e.preventDefault();

    let errors = {};

    setError("");
    setSuccess("");
    setFieldErrors({ email: "" });

    // ✅ Validation
    if (!email.trim()) {
      errors.email = t("forgotPassword.emailRequired");
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = t("forgotPassword.invalidEmail");
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    // ✅ Fake success (until backend exists)
    setSuccess(t("forgotPassword.successMessage"));
    setEmail("");
  };

  return (
    <div className="page-background">
      <div className="page-language-switcher">
        <LanguageSwitcher />
      </div>

      <Container className="d-flex justify-content-center">
        <Card className="form-card p-4">

          <Card.Body>

            <h3 className="text-center mb-4">{t("forgotPassword.title")}</h3>

            {/* ✅ Global error */}
            {error && (
              <div className="form-summary-error">
                {error}
              </div>
            )}

            {/* ✅ Success message (same style as other pages) */}
            {success && (
              <div className="form-summary-success">
                {success}
              </div>
            )}

            <Form onSubmit={handleReset} noValidate>

              <Form.Group className="mb-3">
                <Form.Label>{t("forgotPassword.email")}</Form.Label>

                <Form.Control
                  type="email"
                  name="email"
                  placeholder={t("forgotPassword.placeholderEmail")}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) {
                      setFieldErrors(prev => ({ ...prev, email: "" }));
                    }
                  }}
                  isInvalid={!!fieldErrors.email}
                />

                <Form.Control.Feedback type="invalid" className="d-block">
                  {fieldErrors.email}
                </Form.Control.Feedback>

              </Form.Group>

              <Button
                className="w-100 ram-button mb-2"
                type="submit"
              >
                {t("forgotPassword.send")}
              </Button>

              <Button
                variant="light"
                className="w-100 forgot-password-link"
                onClick={() => navigate("/login")}
              >
                {t("forgotPassword.backToLogin")}
              </Button>

            </Form>

          </Card.Body>

        </Card>
      </Container>

    </div>
  );
}

export default ForgotPassword;