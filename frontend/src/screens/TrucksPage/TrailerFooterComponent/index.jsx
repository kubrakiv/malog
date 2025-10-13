import { useSelector, useDispatch } from "react-redux";

import { selectEditModeTrailer } from "../../../features/trailers/trailersSelectors";
import { setEditModeTrailer } from "../../../features/trailers/trailersSlice";

const TrailerFooterComponent = ({ onCloseModal }) => {
  const dispatch = useDispatch();
  const editModeTrailer = useSelector(selectEditModeTrailer);

  const toggleEditMode = (e) => {
    e.preventDefault();
    dispatch(setEditModeTrailer(!editModeTrailer));
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
          {!editModeTrailer ? "Редагувати причіп" : "Завершити редагування"}
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

export default TrailerFooterComponent;
