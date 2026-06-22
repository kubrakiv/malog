import { useState, useEffect, useRef } from "react";
import { FaChevronDown } from "react-icons/fa";
import "./style.scss";

/**
 * value    — array of selected string values
 * onChange — (newArray) => void
 * options  — [{ label, value }]
 * placeholder — shown when nothing selected
 */
const MultiSelectDropdown = ({ value = [], onChange, options = [], placeholder = "Виберіть…" }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggle = (val) => {
    const v = String(val);
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  };

  const label = () => {
    if (value.length === 0) return placeholder;
    if (value.length === 1) {
      return options.find((o) => String(o.value) === value[0])?.label ?? "1 обрано";
    }
    return `${value.length} обрано`;
  };

  return (
    <div className={`msd${open ? " msd--open" : ""}${value.length > 0 ? " msd--active" : ""}`} ref={ref}>
      <button
        type="button"
        className="msd__trigger"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="msd__label">{label()}</span>
        <FaChevronDown className={`msd__chevron${open ? " msd__chevron--open" : ""}`} />
      </button>

      {open && (
        <div className="msd__menu">
          {options.length === 0 && (
            <span className="msd__empty">Немає варіантів</span>
          )}
          {options.map((o) => {
            const checked = value.includes(String(o.value));
            return (
              <label key={o.value} className={`msd__option${checked ? " msd__option--checked" : ""}`}>
                <input
                  type="checkbox"
                  className="msd__checkbox"
                  checked={checked}
                  onChange={() => toggle(o.value)}
                />
                {o.label}
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MultiSelectDropdown;
