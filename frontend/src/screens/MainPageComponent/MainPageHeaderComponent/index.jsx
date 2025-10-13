import React, { useState } from "react";
import "./style.scss";
import { useNavigate } from "react-router-dom";
import { FaRegUser, FaBars, FaTimes, FaTruck } from "react-icons/fa";

const MainPageHeaderComponent = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate("/login");
  };

  const handleRegister = () => {
    navigate("/register");
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
        const section = document.getElementById(id); // Re-select section after navigation
        if (section) {
          section.scrollIntoView({ behavior: "smooth" });
          setMenuOpen(false); // Close menu after navigation on mobile
        }
      }, 100); // Adjust delay as needed
    } else {
      if (section) {
        section.scrollIntoView({ behavior: "smooth" });
        setMenuOpen(false); // Close menu after navigation on mobile
      }
    }
  };
  return (
    // <div className={`main-page-wrapper ${isTransitioning ? "fade-out" : ""}`}>
    <header className="header-page">
      <nav className="nav-bar">
        <div className="main-logo">
          <FaTruck className="logo-icon" />
          <span className="logo-text">MALOG</span>
        </div>
        <button className="menu-icon" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <FaTimes /> : <FaBars />}
        </button>
        <ul className={`nav-links ${menuOpen ? "open" : ""}`}>
          <li onClick={() => scrollToSection("hero-section")}>Home</li>
          <li onClick={() => scrollToSection("features-section")}>Features</li>
          <li onClick={() => scrollToSection("pricing-section")}>Pricing</li>
          <li onClick={() => scrollToSection("info-section")}>About</li>
          <li onClick={() => handleCareer()}>Career</li>
          <li onClick={() => scrollToSection("cta-section")}>Contact</li>
          <button className="register-btn" onClick={handleRegister}>
            <span>Register</span>
          </button>
          <button className="enter-btn" onClick={handleLogin}>
            <FaRegUser />
            <span style={{ paddingLeft: "5px" }}>Login</span>
          </button>
        </ul>
      </nav>
    </header>
    // </div>
  );
};

export default MainPageHeaderComponent;
