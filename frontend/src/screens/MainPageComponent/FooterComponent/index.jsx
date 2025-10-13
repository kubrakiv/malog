import React from "react";
import "./style.scss";
import { FaTruck } from "react-icons/fa";

const FooterComponent = () => {
  return (
    <footer className="footer-page">
      <div className="footer-content">
        <div className="footer-logo">
          <FaTruck className="logo-icon" />
          <span className="logo-text">MALOG</span>
        </div>
        <div className="footer-info">
          <span>&copy; 2024 Malog System. All rights reserved.</span>
          <p>Your comprehensive logistics management solution</p>
        </div>
      </div>
    </footer>
  );
};

export default FooterComponent;
