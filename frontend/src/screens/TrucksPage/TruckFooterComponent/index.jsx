import { useSelector, useDispatch } from "react-redux";

import { setEditModeTruck } from "../../../features/trucks/trucksSlice";
import { selectEditModeTruck } from "../../../features/trucks/trucksSelectors";

const TruckFooterComponent = ({ onCloseModal }) => {
  const dispatch = useDispatch();
  const editModeTruck = useSelector(selectEditModeTruck);

  const toggleEditMode = (e) => {
    e.preventDefault();
    dispatch(setEditModeTruck(!editModeTruck));
  };

  return (
    <>
      <div className="end-time__footer">
        <button
          title="Редагувати транспортний засіб"
          className="order-details__footer-btn order-details__footer-btn_edit"
          onClick={toggleEditMode}
          style={{ position: "absolute", left: "5px" }}
        >
          {!editModeTruck ? "Редагувати тягач" : "Завершити редагування"}
        </button>

        <button
          title="Закрити вікно"
          className="end-time__footer-btn end-time__footer-btn_close"
          onClick={() => {
            onCloseModal();
          }}
        >
          Закрити
        </button>
      </div>
    </>
  );
};

export default TruckFooterComponent;
