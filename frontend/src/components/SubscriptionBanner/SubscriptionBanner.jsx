import React from "react";
import { useNavigate } from "react-router-dom";
import {
  FaCrown,
  FaTruck,
  FaExclamationTriangle,
  FaLock,
} from "react-icons/fa";
import useSubscription from "../../hooks/useSubscription";
import "./SubscriptionBanner.scss";

const SubscriptionBanner = ({ showOnlyWarnings = false }) => {
  const navigate = useNavigate();
  const { subscription, loading, getSubscriptionLimits } = useSubscription();

  if (loading || !subscription) {
    return null;
  }

  const limits = getSubscriptionLimits();
  const daysRemaining = subscription.days_remaining || 0;
  const isExpiringSoon = daysRemaining <= 7 && daysRemaining > 0;
  const isExpired = daysRemaining <= 0;
  const isTruckLimitReached =
    limits.truck_limit !== -1 && limits.truck_count >= limits.truck_limit;
  const isNearTruckLimit =
    limits.truck_limit !== -1 && limits.truck_count >= limits.truck_limit * 0.8;

  // Determine banner type and content
  let bannerType = "info";
  let bannerContent = null;

  if (isExpired) {
    bannerType = "danger";
    bannerContent = {
      icon: <FaLock />,
      title: "Підписка закінчилась",
      message:
        "Термін дії вашої підписки закінчився. Деякі функції можуть бути обмежені.",
      action: "Поновити підписку",
      actionPath: "/subscription-plans",
    };
  } else if (isExpiringSoon) {
    bannerType = "warning";
    bannerContent = {
      icon: <FaExclamationTriangle />,
      title: `Підписка закінчується через ${daysRemaining} ${
        daysRemaining === 1 ? "день" : daysRemaining < 5 ? "дні" : "днів"
      }`,
      message: "Поновіть підписку, щоб уникнути переривання сервісу.",
      action: "Поновити зараз",
      actionPath: "/subscriptions",
    };
  } else if (isTruckLimitReached) {
    bannerType = "warning";
    bannerContent = {
      icon: <FaTruck />,
      title: "Досягнуто ліміт вантажівок",
      message: `Ви досягли ліміту вантажівок (${limits.truck_count}/${limits.truck_limit}). Оновіть план, щоб додати більше вантажівок.`,
      action: "Оновити план",
      actionPath: "/subscription-plans",
    };
  } else if (isNearTruckLimit && !showOnlyWarnings) {
    bannerType = "info";
    bannerContent = {
      icon: <FaTruck />,
      title: "Наближення до ліміту вантажівок",
      message: `Ви використовуєте ${limits.truck_count} з ${limits.truck_limit} доступних вантажівок.`,
      action: "Оновити план",
      actionPath: "/subscription-plans",
    };
  }

  // Show regular status if no warnings and not showOnlyWarnings
  if (!bannerContent && !showOnlyWarnings) {
    bannerType = "success";
    bannerContent = {
      icon: <FaCrown />,
      title: limits.plan_name,
      message: `${limits.truck_count}/${
        limits.truck_limit === -1 ? "∞" : limits.truck_limit
      } вантажівок використано • ${daysRemaining} ${
        daysRemaining === 1 ? "день" : daysRemaining < 5 ? "дні" : "днів"
      } залишилось`,
      action: "Керувати підпискою",
      actionPath: "/subscriptions",
    };
  }

  // Don't render if no content to show
  if (!bannerContent) {
    return null;
  }

  const handleActionClick = () => {
    navigate(bannerContent.actionPath);
  };

  return (
    <div className={`subscription-banner subscription-banner--${bannerType}`}>
      <div className="subscription-banner__content">
        <div className="subscription-banner__icon">{bannerContent.icon}</div>
        <div className="subscription-banner__text">
          <div className="subscription-banner__title">
            {bannerContent.title}
          </div>
          <div className="subscription-banner__message">
            {bannerContent.message}
          </div>
        </div>
        <div className="subscription-banner__action">
          <button
            className="subscription-banner__button"
            onClick={handleActionClick}
          >
            {bannerContent.action}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionBanner;
