import { useDispatch } from "react-redux";
import { setMapCurrentLocationDelete } from "../../../actions/mapActions";
import {
  setEditModePoint,
  setSelectedPoint,
} from "../../../features/points/pointsSlice";

import "./AddPointFooterComponent.scss";

const AddPointFooterComponent = ({ setShowAddPointModal, onCloseModal }) => {
  const dispatch = useDispatch();

  const handleClearCurrentLocation = () => {
    dispatch(setMapCurrentLocationDelete());
  };

  return (
    <>
      <div className="add-point-details__footer">
        <button
          className="add-point-details__footer-btn add-point-details__footer-btn_save"
          type="submit"
        >
          Записати
        </button>
        <button
          className="add-point-details__footer-btn add-point-details__footer-btn_close"
          onClick={(e) => {
            e.preventDefault();
            onCloseModal && onCloseModal();
            setShowAddPointModal(false);
            dispatch(setSelectedPoint({}));
            dispatch(setEditModePoint(false));
            handleClearCurrentLocation();
          }}
        >
          <div>Закрити</div>
        </button>
      </div>
    </>
  );
};

export default AddPointFooterComponent;
