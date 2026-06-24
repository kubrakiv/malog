import { createContext, useCallback, useContext, useRef, useState } from "react";
import ConfirmModal from "./index";

const ConfirmModalContext = createContext(null);

export const ConfirmModalProvider = ({ children }) => {
  const [modal, setModal] = useState(null);
  const resolveRef = useRef(null);

  const confirm = useCallback((message, options = {}) => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setModal({ message, ...options });
    });
  }, []);

  const handleConfirm = () => {
    resolveRef.current?.(true);
    setModal(null);
  };

  const handleCancel = () => {
    resolveRef.current?.(false);
    setModal(null);
  };

  return (
    <ConfirmModalContext.Provider value={confirm}>
      {children}
      {modal && (
        <ConfirmModal
          message={modal.message}
          title={modal.title}
          confirmLabel={modal.confirmLabel}
          cancelLabel={modal.cancelLabel}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </ConfirmModalContext.Provider>
  );
};

export const useConfirm = () => useContext(ConfirmModalContext);
