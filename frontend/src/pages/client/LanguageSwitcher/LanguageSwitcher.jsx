import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Dropdown } from "react-bootstrap";
import i18n from "../../../i18n";
import "./LanguageSwitcher.css";

function LanguageSwitcher() {
  const { t } = useTranslation();
  const [currentLang, setCurrentLang] = useState(i18n.language || "fr");

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    setCurrentLang(lng);
  };

  return (
    <Dropdown className="language-switcher-dropdown">
      <Dropdown.Toggle
        variant="outline-secondary"
        size="sm"
        id="language-dropdown"
        className="language-toggle-btn"
      >
        {currentLang.toUpperCase()}
      </Dropdown.Toggle>

      <Dropdown.Menu align="end">
        <Dropdown.Item
          onClick={() => changeLanguage("fr")}
          className={currentLang === "fr" ? "active" : ""}
        >
          {t("language.fr")}
        </Dropdown.Item>
        <Dropdown.Item
          onClick={() => changeLanguage("en")}
          className={currentLang === "en" ? "active" : ""}
        >
          {t("language.en")}
        </Dropdown.Item>
        <Dropdown.Item
          onClick={() => changeLanguage("ar")}
          className={currentLang === "ar" ? "active" : ""}
        >
          {t("language.ar")}
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );
}

export default LanguageSwitcher;
