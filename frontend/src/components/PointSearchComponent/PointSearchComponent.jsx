import React from "react";
import { FaRegWindowClose } from "react-icons/fa";
import "./PointSearchComponent.scss";

const PointSearchComponent = ({ search, setSearch }) => {
    return (
        <div className="point-search-container">
            <div className="point-search-title">Пошук</div>
            <input
                type="text"
                className="input-point-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="По індексу, місту, назві компанії"
            />
            <div
                className="point-search-close-btn"
                onClick={() => setSearch("")}
            >
                <FaRegWindowClose />
            </div>
        </div>
    );
};

export default PointSearchComponent;
