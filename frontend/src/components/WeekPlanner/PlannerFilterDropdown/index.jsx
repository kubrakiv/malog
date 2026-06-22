import { useState, useEffect, useRef } from "react";
import { FaChevronDown, FaTimes } from "react-icons/fa";
import "./style.scss";

// Single-select mode: value is a scalar, onChange(scalar|null)
// Multi-select mode:  value is a Set,    onChange(Set)
const PlannerFilterDropdown = ({ label, value, options, onChange, multi = false }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Single-select helpers ──────────────────────────────────
  const selected = !multi
    ? options.find((o) => String(o.value) === String(value))
    : null;
  const isActive = multi
    ? value instanceof Set && value.size > 0
    : value !== null && value !== undefined && value !== "";

  const handleSingleSelect = (val) => {
    onChange(val || null);
    setOpen(false);
  };

  // ── Multi-select helpers ───────────────────────────────────
  const toggleOption = (val) => {
    const next = new Set(value);
    if (next.has(val)) next.delete(val);
    else next.add(val);
    onChange(next);
  };

  const multiLabel = () => {
    if (!value || value.size === 0) return "Усі";
    if (value.size === 1) {
      const v = [...value][0];
      return options.find((o) => String(o.value) === String(v))?.label ?? "1 обрано";
    }
    return `${value.size} обрано`;
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
          {multi ? multiLabel() : (selected ? selected.label : "Усі")}
        </span>
        <FaChevronDown
          className={`pf-drop__chevron${open ? " pf-drop__chevron--open" : ""}`}
        />
      </button>

      {isActive && (
        <button
          className="pf-drop__clear"
          onClick={() => onChange(multi ? new Set() : null)}
          type="button"
          title="Скинути фільтр"
        >
          <FaTimes />
        </button>
      )}

      {open && (
        <div className="pf-drop__menu">
          {!multi && (
            <button
              className={`pf-drop__option${!isActive ? " pf-drop__option--selected" : ""}`}
              onClick={() => handleSingleSelect(null)}
              type="button"
            >
              Усі
            </button>
          )}
          {options.map((o) => {
            const strVal = String(o.value);
            const checked = multi ? (value instanceof Set && value.has(strVal)) : String(value) === strVal;
            return multi ? (
              <label key={o.value} className="pf-drop__option pf-drop__option--check">
                <input
                  type="checkbox"
                  className="pf-drop__checkbox"
                  checked={checked}
                  onChange={() => toggleOption(strVal)}
                />
                {o.label}
              </label>
            ) : (
              <button
                key={o.value}
                className={`pf-drop__option${checked ? " pf-drop__option--selected" : ""}`}
                onClick={() => handleSingleSelect(o.value)}
                type="button"
              >
                {o.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PlannerFilterDropdown;
