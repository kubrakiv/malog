import React from "react";
import "./style.scss";

const ButtonComponent = ({
  children,
  onClick,
  type = "button",
  className = "",
  disabled = false,
  variant = "primary",
  size = "medium",
  ...props
}) => {
  const getButtonClasses = () => {
    const baseClasses = "button-component";
    const variantClass = `button-component--${variant}`;
    const sizeClass = `button-component--${size}`;
    const disabledClass = disabled ? "button-component--disabled" : "";
    const customClass = className ? className : "";

    return [baseClasses, variantClass, sizeClass, disabledClass, customClass]
      .filter(Boolean)
      .join(" ");
  };

  return (
    <button
      type={type}
      className={getButtonClasses()}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default ButtonComponent;
