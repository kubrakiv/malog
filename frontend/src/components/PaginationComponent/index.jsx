import React from "react";
import "./style.scss";

function getPaginationRange(currentPage, totalPages, delta = 2) {
  const range = [];
  const left = Math.max(2, currentPage - delta);
  const right = Math.min(totalPages - 1, currentPage + delta);

  range.push(1);

  if (left > 2) {
    range.push("...");
  }

  for (let i = left; i <= right; i++) {
    range.push(i);
  }

  if (right < totalPages - 1) {
    range.push("...");
  }

  if (totalPages > 1) {
    range.push(totalPages);
  }

  return range;
}

const PaginationComponent = ({ currentPage, totalPages, onPageChange }) => {
  const paginationRange = getPaginationRange(currentPage, totalPages);

  return (
    <div className="pagination">
      {/* « Previous */}
      <button
        className="pagination-button"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
      >
        «
      </button>

      {/* Pages */}
      {paginationRange.map((page, idx) =>
        page === "..." ? (
          <span key={`dots-${idx}`} className="pagination-dots">
            ...
          </span>
        ) : (
          <button
            key={page}
            className={`pagination-button ${
              page === currentPage ? "active" : ""
            }`}
            onClick={() => onPageChange(page)}
          >
            {page}
          </button>
        )
      )}

      {/* » Next */}
      <button
        className="pagination-button"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
      >
        »
      </button>
    </div>
  );
};

export default PaginationComponent;
