import { useDispatch } from "react-redux";
import { setShowEndTimeModal } from "../../../features/planner/plannerSlice";

import "./EndTimeFooterComponent.scss";

const EndTimeFooterComponent = () => {
  const dispatch = useDispatch();
  return (
    <>
      <div className="end-time__footer">
        <button
          title="Save Date and Time"
          className="end-time__footer-btn end-time__footer-btn_save"
          type="submit"
        >
          Записати
        </button>
        <button
          title="Close Window"
          className="end-time__footer-btn end-time__footer-btn_close"
          onClick={(e) => {
            e.preventDefault();
            dispatch(setShowEndTimeModal(false));
          }}
        >
          Закрити
        </button>
      </div>
    </>
  );
};

export default EndTimeFooterComponent;
