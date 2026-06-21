import { useState, useEffect, useRef } from "react";
import { FaChevronDown, FaTimes } from "react-icons/fa";
import "./style.scss";

const PlannerFilterDropdown = ({ label, value, options, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = options.find((o) => String(o.value) === String(value));
  const isActive = value !== null && value !== undefined && value !== "";

  const handleSelect = (val) => {
    onChange(val || null);
    setOpen(false);
  };

  return (
    <div className={`pf-drop${isActive ? " pf-drop--active" : ""}`} ref={ref}>
      <button
        className="pf-drop__trigger"
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        <span className="pf-drop__label">{label}</span>
        <span className="pf-drop__value">
          {selected ? selected.label : "Усі"}
        </span>
        <FaChevronDown
          className={`pf-drop__chevron${open ? " pf-drop__chevron--open" : ""}`}
        />
      </button>

      {isActive && (
        <button
          className="pf-drop__clear"
          onClick={() => onChange(null)}
          type="button"
          title="Скинути фільтр"
        >
          <FaTimes />
        </button>
      )}

      {open && (
        <div className="pf-drop__menu">
          <button
            className={`pf-drop__option${!isActive ? " pf-drop__option--selected" : ""}`}
            onClick={() => handleSelect(null)}
            type="button"
          >
            Усі
          </button>
          {options.map((o) => (
            <button
              key={o.value}
              className={`pf-drop__option${
                String(value) === String(o.value) ? " pf-drop__option--selected" : ""
              }`}
              onClick={() => handleSelect(o.value)}
              type="button"
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default PlannerFilterDropdown;
