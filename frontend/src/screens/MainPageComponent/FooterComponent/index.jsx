import React from "react";
import "./style.scss";
import { FaTruck } from "react-icons/fa";

const FooterComponent = () => {
  return (
    <footer className="footer-page">
      <div className="footer-content">
        <div className="footer-logo">
          <FaTruck className="logo-icon" />
          <span className="logo-text">TMS SOVTES</span>
        </div>
        <div className="footer-info">
          <span>&copy; 2025 TMS SOVTES. Усі права захищено.</span>
          <p>Ваше комплексне рішення для управління автопарком</p>
        </div>
      </div>
    </footer>
  );
};

export default FooterComponent;
