import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Form, Button, Card, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

import { api } from "../../../services/api";
import { normalizeRole, setAuthSession } from "../../../utils/auth";
import LanguageSwitcher from "../LanguageSwitcher/LanguageSwitcher";
import "./Login.css";

function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    const errors = {};

    if (!email.trim()) {
      errors.email = t("login.fieldRequired");
    }

    if (!password.trim()) {
      errors.password = t("login.fieldRequired");
    }

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    setLoading(true);

    try {
      const data = await api.login({ email, password });

      if (data.token) {
        const role = normalizeRole(data?.user?.role || data?.role);

        setAuthSession({
          token: data.token,
          user: data.user || null,
        });

        if (role === "admin") {
          navigate("/admin", { replace: true });
        } else {
          navigate("/home", { replace: true });
        }
      } else {
        setError(data.message || t("login.invalidCredentials"));
      }
    } catch (err) {
      console.error("Login error:", err);

      const validationErrors =
        err?.response?.data?.errors ||
        err?.errors ||
        err?.body?.errors ||
        {};

      if (
        (err?.status === 422 || err?.response?.status === 422) &&
        Object.keys(validationErrors).length > 0
      ) {
        const formattedErrors = {};
        Object.keys(validationErrors).forEach((key) => {
          formattedErrors[key] = Array.isArray(validationErrors[key])
            ? validationErrors[key][0]
            : validationErrors[key];
        });
        setFieldErrors(formattedErrors);
        setError("");
      } else if (err?.status === 401 || err?.response?.status === 401) {
        setError(
          err?.response?.data?.message ||
            err?.body?.message ||
            err?.message ||
            t("login.invalidCredentials")
        );
      } else if (!err?.status && !err?.response) {
        setError(t("login.serverUnreachable"));
      } else {
        setError(
          err?.response?.data?.message ||
            err?.body?.message ||
            err?.message ||
            t("login.genericError")
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-background d-flex justify-content-center align-items-center min-vh-100">
      <div className="page-language-switcher">
        <LanguageSwitcher />
      </div>
      <Card className="form-card p-4">
        <Card.Body>
          <h3 className="text-center mb-4">{t("login.title")}</h3>

          {error && <div className="form-summary-error">{error}</div>}

          <Form onSubmit={handleLogin}>
            <Form.Group className="mb-3">
              <Form.Label>{t("login.email")}</Form.Label>
              <Form.Control
                type="email"
                placeholder={t("login.placeholderEmail")}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: "" }));
                }}
                isInvalid={!!fieldErrors.email}
              />
              <Form.Control.Feedback type="invalid" className="error-text">
                {fieldErrors.email}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-1">
              <Form.Label>{t("login.password")}</Form.Label>
              <Form.Control
                type="password"
                placeholder={t("login.placeholderPassword")}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: "" }));
                }}
                isInvalid={!!fieldErrors.password}
              />
              <Form.Control.Feedback type="invalid" className="error-text">
                {fieldErrors.password}
              </Form.Control.Feedback>
            </Form.Group>

            <div className="text-end mb-3">
              <a href="/forgot-password" className="forgot-password">
                {t("login.forgotPassword")}
              </a>
            </div>

            <Button className="w-100 ram-button" type="submit" disabled={loading}>
              {loading ? <Spinner animation="border" size="sm" /> : t("login.login")}
            </Button>
          </Form>

          <div className="text-center mt-3">
            <a href="/signup" className="login-link">
              {t("login.newHere")}
            </a>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
}

export default Login;
