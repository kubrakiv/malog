import "./style.scss";

const InputComponent = ({
  id,
  name,
  value,
  placeholder,
  onChange,
  onKeyDown,
  autoFocus,
  label,
  multiple,
  type,
  required,
  style = null,
  error = null,
  helperText = null,
  icon = null, // Added icon prop
}) => {
  return (
    <div className="input-component">
      {label && (
        <label className="input-component__form-title">
          {icon && <span className="input-icon">{icon}</span>}
          {label}
        </label>
      )}
      <div className="input-wrapper">
        <input
          multiple={multiple}
          id={id}
          name={name}
          type={type}
          placeholder={placeholder}
          className={`${style ? style : "form-field__input form-select-mb5"} ${
            error ? "error" : ""
          }`}
          value={value || ""}
          onChange={onChange}
          onKeyDown={onKeyDown}
          autoFocus={autoFocus}
          required={required}
        />
      </div>
      {error && <span className="input-error-text">{error}</span>}
      {helperText && !error && (
        <span className="input-helper-text">{helperText}</span>
      )}
    </div>
  );
};

export default InputComponent;
