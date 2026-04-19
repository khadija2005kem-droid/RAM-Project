import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Container, Card, Form, Button, Alert, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { api } from "../../../services/api";
import "./Profile.css";

function Profile() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    prenom: "",
    nom: "",
    email: "",
    new_password: "",
    confirm_password: ""
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // ✅ FIX: stable function reference (prevents ESLint warning)
  const fetchUserData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.getProfile();
      console.log("/profile response", response);

      const profileData = response.data || response;

      setFormData((prev) => ({
        ...prev,
        prenom: profileData.prenom || "",
        nom: profileData.nom || "",
        email: profileData.email || ""
      }));
    } catch (err) {
      console.error("Failed to fetch profile data:", err);
      if (err.isUnauthorized) {
        navigate("/login");
      } else {
        setErrorMessage("Impossible de charger vos informations.");
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (errorMessage) setErrorMessage("");
    if (successMessage) setSuccessMessage("");
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.prenom.trim()) errors.prenom = t("profile.firstNameRequired");
    if (!formData.nom.trim()) errors.nom = t("profile.lastNameRequired");

    if (!formData.email.trim()) {
      errors.email = t("profile.emailRequired");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = t("profile.invalidEmail");
    }

    if (formData.new_password || formData.confirm_password) {
      if (formData.new_password.length < 6) {
        errors.new_password = t("profile.passwordMinLength");
      }
      if (!formData.confirm_password) {
        errors.confirm_password = t("profile.confirmPasswordRequired");
      } else if (formData.new_password !== formData.confirm_password) {
        errors.confirm_password = t("profile.passwordsDontMatch");
      }
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSuccessMessage("");
    setErrorMessage("");

    const errors = validateForm();
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);

    const payload = {
      prenom: formData.prenom,
      nom: formData.nom,
      email: formData.email
    };

    if (formData.new_password) {
      payload.password = formData.new_password;
      payload.password_confirmation = formData.confirm_password;
    }

    try {
      await api.updateProfile(payload);
      setSuccessMessage("Profil mis à jour avec succès.");

      setFormData((prev) => ({
        ...prev,
        new_password: "",
        confirm_password: ""
      }));
    } catch (err) {
      console.error("Profile update error:", err);

      const validationErrors =
        err?.response?.data?.errors ||
        err?.errors ||
        err?.body?.errors ||
        {};

      if (
        (err?.status === 422 || err?.response?.status === 422) &&
        Object.keys(validationErrors).length > 0
      ) {
        const formatted = {};
        Object.keys(validationErrors).forEach((key) => {
          formatted[key] = Array.isArray(validationErrors[key])
            ? validationErrors[key][0]
            : validationErrors[key];
        });
        setFieldErrors(formatted);
      } else {
        setErrorMessage(
          err?.response?.data?.message ||
          err?.body?.message ||
          err?.message ||
          t("profile.updateError")
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Container className="profile-container">
        <div className="profile-loading">
          <Spinner animation="border" role="status" variant="danger">
            <span className="visually-hidden">{t("profile.loading")}</span>
          </Spinner>
        </div>
      </Container>
    );
  }

  return (
    <Container className="profile-container">

      {successMessage && (
        <Alert variant="success" dismissible onClose={() => setSuccessMessage("")}>
          {successMessage}
        </Alert>
      )}

      {errorMessage && (
        <Alert variant="danger" dismissible onClose={() => setErrorMessage("")}>
          {errorMessage}
        </Alert>
      )}

      <Card className="profile-card custom-card">
        <Card.Header className="profile-card-header custom-card-header">
          <h4>{t("profile.title")}</h4>
        </Card.Header>

        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>{t("profile.firstName")}</Form.Label>
              <Form.Control
                type="text"
                name="prenom"
                value={formData.prenom}
                onChange={handleChange}
                isInvalid={!!fieldErrors.prenom}
              />
              <Form.Control.Feedback type="invalid">
                {fieldErrors.prenom}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>{t("profile.lastName")}</Form.Label>
              <Form.Control
                type="text"
                name="nom"
                value={formData.nom}
                onChange={handleChange}
                isInvalid={!!fieldErrors.nom}
              />
              <Form.Control.Feedback type="invalid">
                {fieldErrors.nom}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>{t("profile.email")}</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                isInvalid={!!fieldErrors.email}
              />
              <Form.Control.Feedback type="invalid">
                {fieldErrors.email}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>{t("profile.newPassword")}</Form.Label>
              <Form.Control
                type="password"
                placeholder={t("profile.placeholderNewPassword")}
                name="new_password"
                value={formData.new_password}
                onChange={handleChange}
                isInvalid={!!fieldErrors.new_password}
              />
              <Form.Control.Feedback type="invalid">
                {fieldErrors.new_password}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>{t("profile.confirmNewPassword")}</Form.Label>
              <Form.Control
                type="password"
                placeholder={t("profile.placeholderConfirmPassword")}
                name="confirm_password"
                value={formData.confirm_password}
                onChange={handleChange}
                isInvalid={!!fieldErrors.confirm_password}
              />
              <Form.Control.Feedback type="invalid">
                {fieldErrors.confirm_password}
              </Form.Control.Feedback>
            </Form.Group>

            <Button variant="danger" type="submit" disabled={submitting}>
              {submitting ? t("profile.saving") : t("profile.saveChanges")}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default Profile;