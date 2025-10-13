import React from "react";
import { Link } from "react-router-dom";
import "./RegistrationPendingPage.scss";

const RegistrationPendingPage = () => {
  return (
    <div className="registration-pending-container">
      <div className="registration-pending-card">
        <div className="icon-section">
          <div className="pending-icon">⏳</div>
        </div>

        <h1>Registration Pending Approval</h1>

        <p className="main-message">
          Thank you for registering with <strong>Malog TMS</strong>!
        </p>

        <div className="status-info">
          <div className="status-item">
            <span className="status-label">Status:</span>
            <span className="status-value pending">Pending Review</span>
          </div>
        </div>

        <div className="info-section">
          <h3>What happens next?</h3>
          <ul>
            <li>Our team will review your registration within 24-48 hours</li>
            <li>You'll receive an email notification once approved</li>
            <li>After approval, you can log in and start using Malog TMS</li>
          </ul>
        </div>

        <div className="contact-info">
          <p>Questions about your registration?</p>
          <p>
            Contact us at:{" "}
            <a href="mailto:support@malog.com">support@malog.com</a>
          </p>
        </div>

        <div className="actions">
          <Link to="/login" className="btn btn-secondary">
            Try to Login
          </Link>
          <Link to="/" className="btn btn-primary">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegistrationPendingPage;
