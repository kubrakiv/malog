import React from "react";
import InputComponent from "../../globalComponents/InputComponent";
import { FaSearch } from "react-icons/fa";
import "./style.scss";

const SearchOrderComponent = ({ orderNumber, setOrderNumber, onSearch }) => {
  return (
    <div className="search-order-container">
      <div className="search-label">Пошук</div>
      <div className="search-input-wrapper">
        <InputComponent
          type="text"
          placeholder="Введіть номер замовлення..."
          value={orderNumber}
          onChange={(e) => setOrderNumber(e.target.value)}
          style="form-field__input-order-search"
        />
      </div>
      <button type="button" onClick={onSearch} className="search-button">
        <FaSearch size={16} />
      </button>
    </div>
  );
};

export default SearchOrderComponent;
