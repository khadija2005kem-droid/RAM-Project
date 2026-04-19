import React from "react";
import { Navbar, Nav, Container, Button } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../../../../services/api";
import { clearAuthSession } from "../../../../utils/auth";
import "./NavbarAdmin.css";

function NavbarAdmin() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      clearAuthSession();
      navigate("/login", { replace: true });
    }
  };

  return (
    <Navbar expand="lg" className="navbar-admin">
      <Container>
        <Navbar.Brand as={Link} to="/admin" className="logo-container">
          <img
            src="https://www.kindpng.com/picc/m/443-4437921_royal-air-maroc-logo-png-transparent-png.png"
            alt="RAM"
            className="logo"
          />
          <h1 className="title">LA RAM</h1>
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="basic-navbar-nav" />

        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto nav-links">
            <Nav.Link as={Link} to="/admin">
              Accueil
            </Nav.Link>
            <Nav.Link as={Link} to="/factures">
              Factures
            </Nav.Link>
            <Nav.Link as={Link} to="/ajout-facture">
              envoyer facture
            </Nav.Link>
            <Nav.Link as={Link} to="/utilisateurs">
              Utilisateurs
            </Nav.Link>
            <Nav.Link as={Link} to="/messages">
              Messages
            </Nav.Link>
          </Nav>

          <Button className="logout-btn" onClick={handleLogout}>
            {t("navbar.logout")}
          </Button>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default NavbarAdmin;
