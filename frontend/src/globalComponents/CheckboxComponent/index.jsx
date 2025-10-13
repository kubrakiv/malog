import "./style.scss";

const CheckboxComponent = ({
  id,
  name,
  checked,
  onChange,
  autoFocus,
  label,
  type,
}) => {
  return (
    <div className="checkbox-container">
      <input
        id={id}
        name={name}
        type={type}
        checked={checked || false}
        onChange={onChange}
        autoFocus={autoFocus}
      />
      {label && <label className="upload-documents__form-title">{label}</label>}
    </div>
  );
};

export default CheckboxComponent;
