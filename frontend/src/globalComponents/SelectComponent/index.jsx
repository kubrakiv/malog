import { v4 as uuidv4 } from "uuid";
import "./style.scss";

const SelectComponent = ({
  title,
  id,
  name,
  value,
  onChange,
  options,
  autoFocus,
  label,
  disabled = null,
  marginBottomStyle = null,
  marginStyle = null,
  widthStyle = null,
}) => {
  return (
    <div
      className={`select-component select-component__${widthStyle} ${marginStyle}`}
    >
      {label && (
        <label htmlFor={id} className="select-component__form-title">
          {label}
        </label>
      )}
      <select
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        className={`form-field__select ${marginBottomStyle} ${widthStyle}`}
        autoFocus={autoFocus}
        disabled={disabled}
        aria-label={label || title}
      >
        <option value="">{title}</option>
        {options.map((item) => (
          <option key={item.id || uuidv4()} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default SelectComponent;
