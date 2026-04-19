import React from "react";
import { useTranslation } from "react-i18next";
import { Button, Card } from "react-bootstrap";
import { Link } from "react-router-dom";

import LanguageSwitcher from "../LanguageSwitcher/LanguageSwitcher";
import "./Landing.css";

function Landing() {
  const { t } = useTranslation();

  return (
    <div className="landing-background">
      <div className="page-language-switcher">
        <LanguageSwitcher />
      </div>
      <div className="landing-container d-flex justify-content-center align-items-center vh-100">
        <Card className="landing-card text-center p-4">
          <Card.Body>
            <h1 className="mb-3">{t("landing.welcome")}</h1>
            <p className="mb-4">{t("landing.description")}</p>

            <Link to="/login">
              <Button variant="danger" className="mb-2 w-100 landing-button">
                {t("landing.login")}
              </Button>
            </Link>

            <Link to="/signup">
              <Button variant="light" className="w-100 text-dark landing-button-light">
                {t("landing.signUp")}
              </Button>
            </Link>
          </Card.Body>
        </Card>
      </div>
    </div>
  );
}

export default Landing;
