import React from "react";
import { FaSearch, FaTimes } from "react-icons/fa";
import "./style.scss";

const SearchComponent = ({ search, setSearch, placeholder }) => {
  return (
    <div className="search-container">
      <div className="search-input-wrap">
        <FaSearch className="search-icon" aria-hidden="true" />
        <input
          type="text"
          className="input-search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={placeholder}
        />
        {search && (
          <button
            className="search-close-btn"
            onClick={() => setSearch("")}
            type="button"
            aria-label="Очистити пошук"
            title="Очистити"
          >
            <FaTimes />
          </button>
        )}
      </div>
    </div>
  );
};

export default SearchComponent;
