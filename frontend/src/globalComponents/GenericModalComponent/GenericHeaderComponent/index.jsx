import GenericModalCloseComponent from "../GenericModalCloseComponent/GenericModalCloseComponent";

const GenericHeaderComponent = ({ title, onClose }) => {
  return (
    <>
      <div className="generic-modal__header">
        <div className="generic-modal__header-block">{title && title}</div>
        <GenericModalCloseComponent onClose={onClose} />
      </div>
    </>
  );
};

export default GenericHeaderComponent;
