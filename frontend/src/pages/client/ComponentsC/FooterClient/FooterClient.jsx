import React from "react";
import { useTranslation } from "react-i18next";
import {
  FaFacebookF,
  FaInstagram,
  FaYoutube,
  FaFacebookMessenger,
} from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";

import "./FooterClient.css";

function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="footer">
      <div className="footer-middle">
        <h5>
          <p>{t("footer.paymentMethods")}</p>
        </h5>
        <div className="payments">
          <img
            src="https://raw.githubusercontent.com/aaronfagan/svg-credit-card-payment-icons/master/flat/visa.svg"
            alt="visa"
          />
          <img
            src="https://raw.githubusercontent.com/aaronfagan/svg-credit-card-payment-icons/master/flat/mastercard.svg"
            alt="mastercard"
          />
          <img
            src="https://raw.githubusercontent.com/aaronfagan/svg-credit-card-payment-icons/master/flat/paypal.svg"
            alt="paypal"
          />
          <img
            src="https://raw.githubusercontent.com/aaronfagan/svg-credit-card-payment-icons/master/flat/amex.svg"
            alt="amex"
          />
        </div>
      </div>

      <div className="footer-bottom">
        <br />
        <div className="footer-right">
          <h5>
            <p>{t("footer.followUs")}</p>
          </h5>

          <div className="socials">
            <a
              className="social-link"
              href="https://www.facebook.com/RoyalAirMaroc/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              title="Facebook"
            >
              <FaFacebookF />
              <span className="sr-only">Facebook</span>
            </a>

            <a
              className="social-link"
              href="https://m.me/RoyalAirMaroc"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Messenger"
              title="Messenger"
            >
              <FaFacebookMessenger />
              <span className="sr-only">Messenger</span>
            </a>

            <a
              className="social-link"
              href="https://twitter.com/RAM_Maroc"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="X"
              title="X"
            >
              <FaXTwitter />
              <span className="sr-only">X</span>
            </a>

            <a
              className="social-link"
              href="https://www.instagram.com/royalairmaroc/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              title="Instagram"
            >
              <FaInstagram />
              <span className="sr-only">Instagram</span>
            </a>

            <a
              className="social-link"
              href="https://www.youtube.com/@RoyalAirMarocOfficielle"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="YouTube"
              title="YouTube"
            >
              <FaYoutube />
              <span className="sr-only">YouTube</span>
            </a>
          </div>

          <p className="copyright">{t("footer.copyright")}</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
