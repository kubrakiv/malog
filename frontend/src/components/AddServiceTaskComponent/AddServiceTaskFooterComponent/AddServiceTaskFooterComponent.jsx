import { useDispatch } from "react-redux";

import "./AddServiceTaskFooterComponent.scss";

const AddServiceTaskFooterComponent = ({ onCloseModal }) => {
  const dispatch = useDispatch();

  return (
    <>
      <div className="add-task-details__footer">
        <button
          title="Save Order"
          className="add-task-details__footer-btn add-task-details__footer-btn_save"
          type="submit"
        >
          Записати
        </button>
        <button
          type="button"
          title="Close Order"
          className="add-task-details__footer-btn add-task-details__footer-btn_close"
          onClick={onCloseModal}
        >
          Закрити
        </button>
      </div>
    </>
  );
};

export default AddServiceTaskFooterComponent;
