import { useState, useEffect, useRef, useMemo } from "react";
import { FaChevronDown, FaTimes } from "react-icons/fa";
import "./style.scss";

/**
 * Single-select dropdown with search.
 *
 * value      — selected string value (or "")
 * onChange   — (value: string) => void
 * options    — [{ label, value }]
 * placeholder — trigger label when nothing selected
 * clearLabel  — label for the "clear" option (default "Без вибору")
 */
const SearchableSelect = ({
  value = "",
  onChange,
  options = [],
  placeholder = "Виберіть…",
  clearLabel = "Без вибору",
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return term ? options.filter((o) => o.label.toLowerCase().includes(term)) : options;
  }, [options, search]);

  const selectedLabel = options.find((o) => String(o.value) === String(value))?.label;
  const isActive = value !== "" && value !== null && value !== undefined;

  const handleSelect = (val) => {
    onChange(val);
    setOpen(false);
    setSearch("");
  };

  return (
    <div className={`ss${open ? " ss--open" : ""}${isActive ? " ss--active" : ""}`} ref={ref}>
      <button
        type="button"
        className="ss__trigger"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="ss__label">{selectedLabel || placeholder}</span>
        {isActive ? (
          <FaTimes
            className="ss__clear-icon"
            onClick={(e) => { e.stopPropagation(); handleSelect(""); }}
            title="Скинути"
          />
        ) : (
          <FaChevronDown className={`ss__chevron${open ? " ss__chevron--open" : ""}`} />
        )}
      </button>

      {open && (
        <div className="ss__menu">
          <div className="ss__search-wrap">
            <input
              ref={inputRef}
              className="ss__search"
              type="text"
              placeholder="Пошук…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          <div className="ss__list">
            <button
              type="button"
              className={`ss__option${!isActive ? " ss__option--selected" : ""}`}
              onClick={() => handleSelect("")}
            >
              {clearLabel}
            </button>

            {filtered.length === 0 && (
              <span className="ss__empty">Нічого не знайдено</span>
            )}

            {filtered.map((o) => (
              <button
                key={o.value}
                type="button"
                className={`ss__option${String(value) === String(o.value) ? " ss__option--selected" : ""}`}
                onClick={() => handleSelect(String(o.value))}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
