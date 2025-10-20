import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { FaTimes, FaArrowRight, FaArrowLeft, FaCheck } from "react-icons/fa";
import "./PlannerTutorial.scss";

/**
 * Planner Tutorial Component
 * Shows contextual tooltips for first-time planner users
 * Guides them through the main features of the planner
 */

const PlannerTutorial = ({ onComplete, onSkip }) => {
  const userInfo = useSelector((state) => state.userLogin.userInfo);
  const [currentStep, setCurrentStep] = useState(0);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const tutorialSteps = [
    {
      id: "welcome",
      title: "Welcome to the Planner! 👋",
      description:
        "This is your command center for managing routes, assigning trucks and drivers, and organizing deliveries. Let's take a quick tour!",
      target: null, // Centered modal
      position: "center",
    },
    {
      id: "add-truck",
      title: "Add Trucks",
      description:
        "Click here to add trucks to your planner. Each row represents a truck that can be assigned to routes.",
      target: ".add-truck-button",
      position: "bottom",
      highlight: ".add-truck-button",
    },
    {
      id: "truck-row",
      title: "Truck Rows",
      description:
        "Each truck row shows the truck's schedule. You can drag and drop orders to assign them to specific time slots.",
      target: ".truck-row:first-child",
      position: "right",
      highlight: ".truck-row:first-child",
    },
    {
      id: "week-navigation",
      title: "Navigate Between Weeks",
      description:
        "Use these arrows to switch between different weeks. Plan ahead or review past deliveries.",
      target: ".week-navigation",
      position: "bottom",
      highlight: ".week-navigation",
    },
    {
      id: "filter-toggle",
      title: "Filter Views",
      description:
        "Toggle between different views: by Driver, Order, Customer, or Task. This helps you focus on what matters most.",
      target: ".filter-toggle-buttons",
      position: "bottom",
      highlight: ".filter-toggle-buttons",
    },
    {
      id: "assign-driver",
      title: "Assign Drivers",
      description:
        "Each truck can be assigned a driver. Click on the driver field to select or change the driver for a specific truck.",
      target: ".driver-assignment",
      position: "right",
      highlight: ".driver-assignment",
    },
    {
      id: "complete",
      title: "You're Ready to Go! 🎉",
      description:
        "That's it! You now know the basics of the planner. Start adding your orders and planning your routes. You can always access help from the menu.",
      target: null,
      position: "center",
    },
  ];

  const currentStepData = tutorialSteps[currentStep];

  useEffect(() => {
    // Calculate position for tooltip based on target element
    if (currentStepData.target) {
      const targetElement = document.querySelector(currentStepData.target);
      if (targetElement) {
        const rect = targetElement.getBoundingClientRect();
        calculatePosition(rect, currentStepData.position);

        // Add highlight class
        if (currentStepData.highlight) {
          const highlightElement = document.querySelector(
            currentStepData.highlight
          );
          if (highlightElement) {
            highlightElement.classList.add("tutorial-highlight");
          }
        }
      }
    }

    // Cleanup highlight on step change
    return () => {
      if (currentStepData.highlight) {
        const highlightElement = document.querySelector(
          currentStepData.highlight
        );
        if (highlightElement) {
          highlightElement.classList.remove("tutorial-highlight");
        }
      }
    };
  }, [currentStep]);

  const calculatePosition = (rect, position) => {
    const offset = 20;
    let top, left;

    switch (position) {
      case "bottom":
        top = rect.bottom + offset;
        left = rect.left + rect.width / 2;
        break;
      case "top":
        top = rect.top - offset;
        left = rect.left + rect.width / 2;
        break;
      case "right":
        top = rect.top + rect.height / 2;
        left = rect.right + offset;
        break;
      case "left":
        top = rect.top + rect.height / 2;
        left = rect.left - offset;
        break;
      default:
        top = window.innerHeight / 2;
        left = window.innerWidth / 2;
    }

    setPosition({ top, left });
  };

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    try {
      await fetch("/api/onboarding/tutorial/complete/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
          "Content-Type": "application/json",
        },
      });
    } catch (error) {
      console.error("Error marking tutorial as complete:", error);
    }

    if (onComplete) {
      onComplete();
    }
  };

  const handleSkip = () => {
    handleComplete(); // Mark as complete even if skipped
    if (onSkip) {
      onSkip();
    }
  };

  const isCenter = currentStepData.position === "center";

  return (
    <>
      {/* Overlay */}
      <div className="tutorial-overlay" onClick={handleSkip}></div>

      {/* Tutorial Tooltip */}
      <div
        className={`tutorial-tooltip ${
          isCenter ? "tooltip-center" : `tooltip-${currentStepData.position}`
        }`}
        style={
          isCenter
            ? {}
            : {
                top: `${position.top}px`,
                left: `${position.left}px`,
              }
        }
      >
        {/* Close Button */}
        <button className="tutorial-close" onClick={handleSkip}>
          <FaTimes />
        </button>

        {/* Step Counter */}
        <div className="tutorial-step-counter">
          Step {currentStep + 1} of {tutorialSteps.length}
        </div>

        {/* Content */}
        <div className="tutorial-content">
          <h3>{currentStepData.title}</h3>
          <p>{currentStepData.description}</p>
        </div>

        {/* Progress Dots */}
        <div className="tutorial-progress">
          {tutorialSteps.map((_, index) => (
            <div
              key={index}
              className={`progress-dot ${
                index === currentStep ? "active" : ""
              } ${index < currentStep ? "completed" : ""}`}
              onClick={() => setCurrentStep(index)}
            ></div>
          ))}
        </div>

        {/* Navigation Buttons */}
        <div className="tutorial-actions">
          {currentStep > 0 && (
            <button className="btn-tutorial-secondary" onClick={handlePrevious}>
              <FaArrowLeft /> Previous
            </button>
          )}

          {currentStep < tutorialSteps.length - 1 ? (
            <button className="btn-tutorial-primary" onClick={handleNext}>
              Next <FaArrowRight />
            </button>
          ) : (
            <button className="btn-tutorial-primary" onClick={handleComplete}>
              Finish <FaCheck />
            </button>
          )}
        </div>

        {/* Skip Link */}
        <div className="tutorial-skip-link">
          <button onClick={handleSkip} className="text-link-tutorial">
            Skip tutorial
          </button>
        </div>
      </div>
    </>
  );
};

export default PlannerTutorial;
