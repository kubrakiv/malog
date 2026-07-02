import React, { useEffect, useRef } from "react";
import InputComponent from "../../globalComponents/InputComponent";
import { FaSearch } from "react-icons/fa";
import "./style.scss";

const SearchOrderComponent = ({
  orderNumber,
  setOrderNumber,
  onSearch,
  searchResults = [],
  showResults = false,
  onSelectOrder,
}) => {
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        onSelectOrder?.(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onSelectOrder]);

  // Handle Enter key press to search
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      onSearch();
    }
  };

  return (
    <div className="search-order-container" ref={wrapperRef}>
      <div className="search-input-wrapper">
        <FaSearch className="search-icon" size={16} onClick={onSearch} />
        <InputComponent
          type="text"
          placeholder="Пошук замовлення по номеру..."
          value={orderNumber}
          onChange={(e) => setOrderNumber(e.target.value)}
          onKeyDown={handleKeyDown}
          style="form-field__input-order-search"
        />

        {showResults && (
          <div className="search-results-dropdown">
            {searchResults.length > 0 ? (
              searchResults.map((order) => (
                <button
                  type="button"
                  key={order.id}
                  className="search-result-item"
                  onClick={() => onSelectOrder?.(order)}
                >
                  <div className="result-title-row">
                    <span className="result-order-number">
                      {order.order_number || "-"}
                    </span>
                    <span className="result-system-number">#{order.number}</span>
                  </div>
                  <div className="result-meta">
                    <span>{order.truck || "Без авто"}</span>
                    <span>{order.driver || "Без водія"}</span>
                  </div>
                  <div className="result-meta result-route">
                    <span>{order.route || "Маршрут не вказано"}</span>
                  </div>
                  <div className="result-meta result-dates">
                    <span>{order.loading_start_date || "-"}</span>
                    <span>{order.unloading_end_date || "-"}</span>
                  </div>
                </button>
              ))
            ) : (
              <div className="search-empty">Нічого не знайдено</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchOrderComponent;
