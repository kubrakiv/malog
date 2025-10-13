import { useState } from "react";
import OpenContext from "../OpenContext";

const OpenContextProvider = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const [showAddPointModal, setShowAddPointModal] = useState(false);
  const libraries = ["places", "geometry"];
  const defaultCenter = {
    lat: 50.0786592,
    lng: 14.5223136,
  };

  const handleAddPointButtonClick = (e) => {
    e.stopPropagation();
    setShowAddPointModal(true);
  };

  const providerValue = {
    isSidebarOpen,
    toggleSidebar,
    showAddPointModal,
    setShowAddPointModal,
    handleAddPointButtonClick,
    libraries,
    defaultCenter,
  };

  return (
    <OpenContext.Provider value={providerValue}>
      {children}
    </OpenContext.Provider>
  );
};

export default OpenContextProvider;
