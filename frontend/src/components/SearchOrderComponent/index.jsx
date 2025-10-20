import React from "react";
import InputComponent from "../../globalComponents/InputComponent";
import { FaSearch } from "react-icons/fa";
import "./style.scss";

const SearchOrderComponent = ({ orderNumber, setOrderNumber, onSearch }) => {
  // Handle Enter key press to search
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      onSearch();
    }
  };

  return (
    <div className="search-order-container">
      <div className="search-input-wrapper">
        <FaSearch className="search-icon" size={16} />
        <InputComponent
          type="text"
          placeholder="Пошук замовлення по номеру..."
          value={orderNumber}
          onChange={(e) => setOrderNumber(e.target.value)}
          onKeyDown={handleKeyDown}
          style="form-field__input-order-search"
        />
      </div>
    </div>
  );
};

export default SearchOrderComponent;
