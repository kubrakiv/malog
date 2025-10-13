import React from "react";
import { FaRegWindowClose } from "react-icons/fa";
import "./style.scss";

const SearchComponent = ({ search, setSearch, placeholder }) => {
  return (
    <div className="search-container">
      <div className="search-title">Пошук:</div>
      <input
        type="text"
        className="input-search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={placeholder}
      />
      <div className="search-close-btn" onClick={() => setSearch("")}>
        ✖️
      </div>
    </div>
  );
};

export default SearchComponent;
