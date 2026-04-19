import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Form, Button, Card, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

import { api } from "../../../services/api";
import { setAuthSession } from "../../../utils/auth";
import LanguageSwitcher from "../LanguageSwitcher/LanguageSwitcher";
import "./Signup.css";

function Signup() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password_confirmation, setPasswordConfirmation] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({
    nom: "",
    prenom: "",
    email: "",
    password: "",
    password_confirmation: "",
  });

  const handleSignup = async (e) => {
    e.preventDefault();

    const errors = {};

    setError("");
    setFieldErrors({});

    if (!nom.trim()) errors.nom = t("signup.lastNameRequired");
    if (!prenom.trim()) errors.prenom = t("signup.firstNameRequired");

    if (!email.trim()) {
      errors.email = t("signup.emailRequired");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = t("signup.invalidEmailFormat");
    }

    if (!password) {
      errors.password = t("signup.passwordRequired");
    } else if (!/^(?=(?:.*[A-Za-z]){6,})(?=(?:.*\d){3,})[A-Za-z\d]+$/.test(password)) {
      errors.password = t("signup.passwordComplexity");
    }

    if (!password_confirmation) {
      errors.password_confirmation = t("signup.confirmationRequired");
    } else if (password !== password_confirmation) {
      errors.password_confirmation = t("signup.passwordsDontMatch");
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);

    try {
      const data = await api.register({
        nom,
        prenom,
        email,
        password,
        password_confirmation,
      });

      if (data && data.token) {
        setAuthSession({
          token: data.token,
          user: data.user || null,
        });
        navigate("/home", { replace: true });
        return;
      }

      setError(data.message || t("signup.genericError"));
    } catch (err) {
      const validationErrors =
        err?.response?.data?.errors ||
        err?.errors ||
        err?.body?.errors;

      if ((err?.status === 422 || err?.response?.status === 422) && validationErrors) {
        const formattedErrors = {};

        Object.keys(validationErrors).forEach((key) => {
          const value = validationErrors[key];
          formattedErrors[key] = Array.isArray(value) ? value[0] : value;
        });

        setFieldErrors((prev) => ({ ...prev, ...formattedErrors }));
        setError("");
      } else if (!err?.status && !err?.response) {
        setError(t("signup.serverUnreachable"));
      } else {
        setError(
          err?.response?.data?.message ||
            err?.body?.message ||
            err?.message ||
            t("signup.genericError")
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-background">
      <div className="page-language-switcher">
        <LanguageSwitcher />
      </div>
      <div className="signup-container d-flex justify-content-center align-items-center min-vh-100">
        <Card className="signup-card p-4">
          <Card.Body>
            <h3 className="text-center mb-4">{t("signup.title")}</h3>

            {error && (
              <div className="form-summary-error">
                <div className="form-summary-title">{t("signup.pleaseFix")}</div>
                <ul className="mb-0 mt-2">
                  {error && <li>{error}</li>}
                  {Object.entries(fieldErrors)
                    .filter(([, msg]) => msg)
                    .map(([key, msg]) => (
                      <li key={key}>{msg}</li>
                    ))}
                </ul>
              </div>
            )}

            <Form onSubmit={handleSignup} noValidate>
              <Form.Group className="mb-3">
                <Form.Label>{t("signup.lastName")}</Form.Label>
                <Form.Control
                  type="text"
                  placeholder={t("signup.placeholderLastName")}
                  value={nom}
                  onChange={(e) => {
                    setNom(e.target.value);
                    if (fieldErrors.nom) setFieldErrors((prev) => ({ ...prev, nom: "" }));
                  }}
                  required
                  isInvalid={!!fieldErrors.nom}
                />
                <Form.Control.Feedback type="invalid" className="d-block">
                  {fieldErrors.nom}
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>{t("signup.firstName")}</Form.Label>
                <Form.Control
                  type="text"
                  placeholder={t("signup.placeholderFirstName")}
                  value={prenom}
                  onChange={(e) => {
                    setPrenom(e.target.value);
                    if (fieldErrors.prenom) setFieldErrors((prev) => ({ ...prev, prenom: "" }));
                  }}
                  required
                  isInvalid={!!fieldErrors.prenom}
                />
                <Form.Control.Feedback type="invalid" className="d-block">
                  {fieldErrors.prenom}
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>{t("signup.email")}</Form.Label>
                <Form.Control
                  type="email"
                  placeholder={t("signup.placeholderEmail")}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: "" }));
                  }}
                  required
                  isInvalid={!!fieldErrors.email}
                />
                <Form.Control.Feedback type="invalid" className="d-block">
                  {fieldErrors.email}
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>{t("signup.password")}</Form.Label>
                <Form.Control
                  type="password"
                  placeholder={t("signup.placeholderPassword")}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: "" }));
                  }}
                  required
                  isInvalid={!!fieldErrors.password}
                />
                <Form.Control.Feedback type="invalid" className="d-block">
                  {fieldErrors.password}
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>{t("signup.confirmPassword")}</Form.Label>
                <Form.Control
                  type="password"
                  placeholder={t("signup.placeholderConfirmPassword")}
                  value={password_confirmation}
                  onChange={(e) => {
                    setPasswordConfirmation(e.target.value);
                    if (fieldErrors.password_confirmation) {
                      setFieldErrors((prev) => ({ ...prev, password_confirmation: "" }));
                    }
                  }}
                  required
                  isInvalid={!!fieldErrors.password_confirmation}
                />
                <Form.Control.Feedback type="invalid" className="d-block">
                  {fieldErrors.password_confirmation}
                </Form.Control.Feedback>
              </Form.Group>

              <Button className="w-100 signup-button" type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    {t("signup.signingUp")}
                  </>
                ) : (
                  t("signup.signUp")
                )}
              </Button>
            </Form>

            <div className="text-center mt-3">
              <a href="/login" className="login-link">
                {t("signup.alreadyHaveAccount")}
              </a>
            </div>
          </Card.Body>
        </Card>
      </div>
    </div>
  );
}

export default Signup;
