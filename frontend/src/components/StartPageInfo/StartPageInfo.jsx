import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaTruck,
  FaRoute,
  FaUsers,
  FaFileInvoiceDollar,
  FaMapMarkedAlt,
  FaChartLine,
  FaCog,
  FaShieldAlt,
  FaCrown,
  FaCheck,
  FaTimes,
  FaCalculator,
  FaMapMarker,
  FaClipboardList,
  FaTasks,
  FaUserTie,
} from "react-icons/fa";
import "./StartPageInfo.scss";

function StartPageInfo() {
  const navigate = useNavigate();
  const [subscriptionPlans, setSubscriptionPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBilling, setSelectedBilling] = useState("monthly");

  useEffect(() => {
    const fetchSubscriptionPlans = async () => {
      try {
        const response = await axios.get("/api/subscriptions/plans/");
        setSubscriptionPlans(response.data);
      } catch (error) {
        console.error("Error fetching subscription plans:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptionPlans();
  }, []);

  const handleGetStarted = () => {
    navigate("/register");
  };

  const handleChoosePlan = (planId) => {
    // Navigate to registration with selected plan
    navigate(`/register?plan=${planId}&billing=${selectedBilling}`);
  };

  const features = [
    {
      icon: <FaTruck />,
      title: "Fleet Management",
      description:
        "Comprehensive truck and trailer management system with real-time tracking and maintenance scheduling.",
    },
    {
      icon: <FaRoute />,
      title: "Route Planning",
      description:
        "Advanced route optimization algorithms to ensure efficient delivery paths and reduced fuel consumption.",
    },
    {
      icon: <FaUsers />,
      title: "Driver Management",
      description:
        "Complete driver profile management, work schedules, and performance tracking system.",
    },
    {
      icon: <FaFileInvoiceDollar />,
      title: "Order Management",
      description:
        "Streamlined order processing, tracking, and invoice generation for seamless business operations.",
    },
    {
      icon: <FaMapMarkedAlt />,
      title: "Real-time Tracking",
      description:
        "Live GPS tracking of vehicles with interactive maps and location updates for customers.",
    },
    {
      icon: <FaChartLine />,
      title: "Analytics & Reports",
      description:
        "Detailed analytics and reporting tools to monitor performance, costs, and business metrics.",
    },
    {
      icon: <FaCog />,
      title: "Task Automation",
      description:
        "Automated task scheduling and workflow management to improve operational efficiency.",
    },
    {
      icon: <FaShieldAlt />,
      title: "Multi-tenant Security",
      description:
        "Enterprise-grade security with multi-tenant architecture for data isolation and protection.",
    },
  ];

  return (
    <div className="start-page-container">
      <div id="hero-section" className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Welcome to Malog System</h1>
          <p className="hero-subtitle">
            Your comprehensive logistics management solution for modern
            transportation needs
          </p>
          <div className="hero-stats">
            <div className="stat-item">
              <span className="stat-number">100+</span>
              <span className="stat-label">Active Vehicles</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">24/7</span>
              <span className="stat-label">Real-time Tracking</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">99.9%</span>
              <span className="stat-label">System Uptime</span>
            </div>
          </div>
        </div>
      </div>

      <div id="features-section" className="features-section">
        <div className="container-page">
          <div className="section-header">
            <h2>Platform Features</h2>
            <p>
              Discover the powerful tools that make Malog the perfect choice for
              your logistics operations
            </p>
          </div>

          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon">{feature.icon}</div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div id="info-section" className="info-section">
        <div className="container-page">
          <div className="info-grid">
            <div className="info-card">
              <h3>About Malog System</h3>
              <p>
                Malog is a comprehensive logistics management platform designed
                to streamline transportation operations. Built with modern
                technologies including Django and React, it provides robust
                solutions for fleet management, route optimization, and
                real-time tracking.
              </p>
            </div>
            <div className="info-card">
              <h3>Key Benefits</h3>
              <ul>
                <li>Reduce operational costs by up to 30%</li>
                <li>Improve delivery times with smart routing</li>
                <li>Real-time visibility across all operations</li>
                <li>Scalable multi-tenant architecture</li>
                <li>Comprehensive reporting and analytics</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div id="pricing-section" className="pricing-section">
        <div className="container-page">
          <div className="section-header">
            <h2>Choose Your Perfect Plan</h2>
            <p>
              Select a subscription plan that fits your business needs and scale
              as you grow
            </p>

            <div className="billing-toggle">
              <button
                className={selectedBilling === "monthly" ? "active" : ""}
                onClick={() => setSelectedBilling("monthly")}
              >
                Monthly
              </button>
              <button
                className={selectedBilling === "yearly" ? "active" : ""}
                onClick={() => setSelectedBilling("yearly")}
              >
                Yearly
                <span className="discount-badge">Save 17%</span>
              </button>
            </div>
          </div>

          {loading ? (
            <div className="loading-plans">
              <div className="loading-spinner"></div>
              <p>Loading subscription plans...</p>
            </div>
          ) : (
            <div className="pricing-grid">
              {subscriptionPlans.map((plan, index) => (
                <div
                  key={plan.id}
                  className={`pricing-card ${
                    plan.name === "pro" ? "featured" : ""
                  }`}
                >
                  {plan.name === "pro" && (
                    <div className="featured-badge">
                      <FaCrown /> Most Popular
                    </div>
                  )}

                  <div className="plan-header">
                    <h3>{plan.display_name}</h3>
                    <div className="price">
                      <span className="currency">$</span>
                      <span className="amount">
                        {selectedBilling === "yearly"
                          ? Math.round((plan.yearly_price / 12) * 100) / 100
                          : plan.monthly_price}
                      </span>
                      <span className="period">/month</span>
                    </div>
                    {selectedBilling === "yearly" && (
                      <div className="yearly-total">
                        Billed yearly: ${plan.yearly_price}
                      </div>
                    )}
                    <p className="plan-description">{plan.description}</p>
                  </div>

                  <div className="plan-features">
                    <div className="truck-limit">
                      <strong>
                        {plan.truck_limit === -1
                          ? "Unlimited"
                          : plan.truck_limit}{" "}
                        Trucks
                      </strong>
                    </div>

                    <ul className="features-list">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex}>
                          <FaCheck className="check-icon" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    className={`plan-btn ${
                      plan.name === "pro" ? "btn-featured" : "btn-primary"
                    }`}
                    onClick={() => handleChoosePlan(plan.id)}
                  >
                    Choose {plan.display_name}
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="compare-plans-section">
            <button
              className="compare-plans-btn"
              onClick={() => navigate("/subscription-plans")}
            >
              Compare Plans in Detail
            </button>
            <p className="compare-plans-text">
              View detailed feature comparison and manage your subscription
            </p>
          </div>
        </div>
      </div>

      <div id="cta-section" className="cta-section">
        <div className="container-page">
          <div className="cta-content">
            <h2>Ready to Transform Your Logistics?</h2>
            <p>
              Join hundreds of companies already using Malog to optimize their
              transportation operations
            </p>
            <div className="cta-buttons">
              <button className="btn-primary" onClick={handleGetStarted}>
                Get Started
              </button>
              <button className="btn-secondary">Learn More</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StartPageInfo;
