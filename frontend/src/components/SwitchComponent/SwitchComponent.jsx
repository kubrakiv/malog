import "./SwitchComponent.scss";

const SwitchComponent = ({ isToggled, onToggle, title }) => {
  return (
    <div className="switch__container">
      <span className="switch__title">{title}</span>
      <label className="switch">
        <input
          className="switch__input"
          type="checkbox"
          checked={isToggled}
          onChange={() => onToggle()}
        />
        <span className="slider" title={title}></span>
      </label>
    </div>
  );
};

export default SwitchComponent;
