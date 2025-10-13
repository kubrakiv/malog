import { useRef, useEffect, useCallback } from "react";

import GenericFooterComponent from "./GenericFooterComponent";
import GenericHeaderComponent from "./GenericHeaderComponent";

import "./style.scss";

const GenericModalComponent = ({
  title,
  show,
  onClose,
  content,
  footer,
  header,
}) => {
  const modalRef = useRef(null);

  const handleKeyDown = useCallback(
    (event) => {
      if (event.keyCode === 27) {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (show) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [show, handleKeyDown]);

  return (
    <>
      <div
        className="modal-overlay"
        style={{ display: show ? "block" : "none" }}
      >
        <div className="modal-background" onClick={onClose} />
        <div
          ref={modalRef}
          className={`generic-modal${show ? "" : " hidden"}`}
          style={{ display: show ? "block" : "none" }}
        >
          {header && <GenericHeaderComponent title={title} onClose={onClose} />}
          {content}
          {footer && <GenericFooterComponent onClose={onClose} />}
        </div>
      </div>
    </>
  );
};

export default GenericModalComponent;
