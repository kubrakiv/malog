import React, { useState } from "react";
import { FaCopy, FaTimes } from "react-icons/fa";
import toast from "react-hot-toast";
import "./PasswordResetModal.scss";

const PasswordResetModal = ({ isOpen, username, password, onClose }) => {
  const [isCopying, setIsCopying] = useState(false);

  if (!isOpen) {
    return null;
  }

  const handleCopy = async () => {
    try {
      setIsCopying(true);
      await navigator.clipboard.writeText(password);
      toast.success("Password copied to clipboard", {
        position: "top-right",
      });
    } catch (error) {
      toast.error("Failed to copy password", {
        position: "top-right",
      });
    } finally {
      setIsCopying(false);
    }
  };

  return (
    <div className="password-reset-modal__backdrop" onClick={onClose}>
      <div
        className="password-reset-modal"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="password-reset-modal-title"
      >
        <div className="password-reset-modal__header">
          <div>
            <h3 id="password-reset-modal-title">Temporary password ready</h3>
            <p>Save this password now for {username}.</p>
          </div>
          <button
            type="button"
            className="password-reset-modal__close"
            onClick={onClose}
            aria-label="Close password reset modal"
          >
            <FaTimes />
          </button>
        </div>

        <div className="password-reset-modal__body">
          <label htmlFor="temporary-password">Temporary password</label>
          <div className="password-reset-modal__password-row">
            <input
              id="temporary-password"
              type="text"
              readOnly
              value={password}
              onFocus={(event) => event.target.select()}
            />
            <button
              type="button"
              className="password-reset-modal__copy"
              onClick={handleCopy}
              disabled={isCopying}
            >
              <FaCopy />
              {isCopying ? "Copying..." : "Copy"}
            </button>
          </div>
          <p className="password-reset-modal__note">
            This password is shown only now. Share it with the user through a
            secure channel.
          </p>
        </div>

        <div className="password-reset-modal__footer">
          <button type="button" className="button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PasswordResetModal;
