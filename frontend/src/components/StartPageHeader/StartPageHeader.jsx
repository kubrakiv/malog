import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaBars, FaRegUser, FaTimes, FaTruck } from "react-icons/fa";
import "./StartPageHeader.scss";

const StartPageHeader = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate("/login");
  };

  const handleCareer = () => {
    window.scrollTo(0, 0);
    navigate("/career");
  };

  const scrollToSection = (id) => {
    const section = document.getElementById(id);

    if (window.location.pathname !== "/") {
      navigate("/", { replace: true });
      setTimeout(() => {
        const nextSection = document.getElementById(id);
        if (nextSection) {
          nextSection.scrollIntoView({ behavior: "smooth" });
          setMenuOpen(false);
        }
      }, 100);
      return;
    }

    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
      setMenuOpen(false);
    }
  };

  return (
    <header className="start-page-header">
      <nav className="start-page-header__nav">
        <div
          className="start-page-header__logo"
          onClick={() => scrollToSection("hero-section")}
        >
          <FaTruck className="logo-icon" />
          <span className="logo-text">TMS SOVTES</span>
        </div>

        <button
          className="start-page-header__menu-btn"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation"
        >
          {menuOpen ? <FaTimes /> : <FaBars />}
        </button>

        <ul className={`start-page-header__links ${menuOpen ? "open" : ""}`}>
          <li
            className="active"
            onClick={() => scrollToSection("hero-section")}
          >
            Головна
          </li>
          <li onClick={() => scrollToSection("features-section")}>Функції</li>
          <li onClick={() => scrollToSection("pricing-section")}>Ціни</li>
          <li onClick={() => scrollToSection("info-section")}>Про нас</li>
          <li onClick={handleCareer}>Кар'єра</li>
          <li onClick={() => scrollToSection("cta-section")}>Контакти</li>
          <button className="login-btn" onClick={handleLogin}>
            <FaRegUser />
            <span>Вхід</span>
          </button>
        </ul>
      </nav>
    </header>
  );
};

export default StartPageHeader;
