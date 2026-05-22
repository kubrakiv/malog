import React from "react";
import {
  FaEnvelope,
  FaFacebookF,
  FaLinkedinIn,
  FaPhoneAlt,
  FaTruck,
} from "react-icons/fa";
import "./StartPageFooter.scss";

const StartPageFooter = () => {
  return (
    <footer className="start-page-footer">
      <div className="start-page-footer__top">
        <div className="brand-col">
          <div className="brand-logo">
            <FaTruck className="logo-icon" />
            <span className="logo-text">TMS SOVTES</span>
          </div>
          <p>
            Онлайн-сервіс для розумного управління логістикою та автопарком.
          </p>
        </div>

        <div className="links-col">
          <h4>Навігація</h4>
          <ul>
            <li>Головна</li>
            <li>Функції</li>
            <li>Ціни</li>
            <li>Про нас</li>
          </ul>
        </div>

        <div className="contact-col">
          <h4>Контакти</h4>
          <div className="contact-item">
            <FaPhoneAlt />
            <span>+380 44 123 45 67</span>
          </div>
          <div className="contact-item">
            <FaEnvelope />
            <span>support@tms.sovtes.com</span>
          </div>
          <div className="socials">
            <span>
              <FaFacebookF />
            </span>
            <span>
              <FaLinkedinIn />
            </span>
          </div>
        </div>
      </div>

      <div className="start-page-footer__bottom">
        <span>© 2026 TMS SOVTES. Усі права захищено.</span>
      </div>
    </footer>
  );
};

export default StartPageFooter;
