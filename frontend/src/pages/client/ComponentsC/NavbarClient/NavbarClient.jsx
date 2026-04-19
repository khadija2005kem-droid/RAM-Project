import React from "react";
import { Navbar as BSNavbar, Nav, Container, Button } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { api } from "../../../../services/api";
import { clearAuthSession } from "../../../../utils/auth";
import logo from "../../../../assets/logoRAM.jpg";
import "./NavbarClient.css";

function Navbar() {
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
    <BSNavbar expand="lg" className="navbar-ram">
      <Container>
        <BSNavbar.Brand as={Link} to="/home">
          <img src={logo} alt="RAM Logo" className="ram-logo" />
        </BSNavbar.Brand>

        <BSNavbar.Brand as={Link} to="/home" className="navbar-logo">
          RAM
        </BSNavbar.Brand>

        <BSNavbar.Toggle aria-controls="basic-navbar-nav" />

        <BSNavbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/home" className="nav-link-ram">
              Accueil
            </Nav.Link>

            <Nav.Link as={Link} to="/mes-factures" className="nav-link-ram">
              Mes Factures
            </Nav.Link>

            <Nav.Link as={Link} to="/paiement" className="nav-link-ram">
              Paiement
            </Nav.Link>

            <Nav.Link as={Link} to="/contact" className="nav-link-ram">
              Contact
            </Nav.Link>

            <Nav.Link as={Link} to="/profile" className="nav-link-ram">
              Profil
            </Nav.Link>
          </Nav>

          <div className="d-flex">
            <Button className="logout-btn" onClick={handleLogout}>
              {t("navbar.logout")}
            </Button>
          </div>
        </BSNavbar.Collapse>
      </Container>
    </BSNavbar>
  );
}

export default Navbar;
