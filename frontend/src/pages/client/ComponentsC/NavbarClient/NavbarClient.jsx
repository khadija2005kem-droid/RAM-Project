import React from "react";
import { Navbar as BSNavbar, Nav, Container, Button } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { api } from "../../../../services/api";
import { clearAuthSession } from "../../../../utils/auth";
import logo from "../../../../assets/logoRAM.jpg";
import LanguageSwitcher from "../../LanguageSwitcher/LanguageSwitcher";
import "./NavbarClient.css";

function Navbar() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (error) {
      console.error("Logout error:", error);
      sessionStorage.setItem("logout_warning", "1");
    } finally {
      clearAuthSession();
      navigate("/login", { replace: true });
    }
  };

  return (
    <BSNavbar expand="lg" className="navbar-ram">
      <Container>
        <BSNavbar.Brand as={Link} to="/home">
          <img src={logo} alt={t("navbar.brand")} className="ram-logo" />
        </BSNavbar.Brand>

        <BSNavbar.Brand as={Link} to="/home" className="navbar-logo">
          RAM
        </BSNavbar.Brand>

        <BSNavbar.Toggle aria-controls="basic-navbar-nav" />

        <BSNavbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/home" className="nav-link-ram">
              {t("navbar.home")}
            </Nav.Link>

            <Nav.Link as={Link} to="/mes-factures" className="nav-link-ram">
              {t("navbar.myInvoices")}
            </Nav.Link>

            <Nav.Link as={Link} to="/paiement" className="nav-link-ram">
              {t("navbar.payment")}
            </Nav.Link>

            <Nav.Link as={Link} to="/contact" className="nav-link-ram">
              {t("navbar.contact")}
            </Nav.Link>

            <Nav.Link as={Link} to="/profile" className="nav-link-ram">
              {t("navbar.profile")}
            </Nav.Link>
          </Nav>

          <div className="d-flex client-navbar-actions">
            <Button className="logout-btn" onClick={handleLogout}>
              {t("navbar.logout")}
            </Button>
            <div className="client-navbar-language-switcher">
              <LanguageSwitcher />
            </div>
          </div>
        </BSNavbar.Collapse>
      </Container>
    </BSNavbar>
  );
}

export default Navbar;
