import { useDispatch, useSelector } from "react-redux";
import { setMapCurrentLocationDelete } from "../../../actions/mapActions";
import {
  setEditModePoint,
  setSelectedPoint,
} from "../../../features/points/pointsSlice";
import { selectSelectedPoint } from "../../../features/points/pointsSelectors";

import AddPoint from "../AddPoint";
import GenericModalComponent from "../../../globalComponents/GenericModalComponent";

import "./AddPointModalComponent.scss";
import { getFullAddress } from "../../../utils/address";

const AddPointModalComponent = ({
  showAddPointModal,
  setShowAddPointModal,
}) => {
  const dispatch = useDispatch();

  const selectedPoint = useSelector(selectSelectedPoint);

  const handleCloseModal = () => {
    setShowAddPointModal(false);
    dispatch(setEditModePoint(false));
    dispatch(setSelectedPoint({}));
    dispatch(setMapCurrentLocationDelete());
  };

  return (
    <GenericModalComponent
      title={
        Object.keys(selectedPoint).length !== 0
          ? `Адреса: ${getFullAddress(selectedPoint)}`
          : "Додайте точку"
      }
      show={showAddPointModal}
      onClose={handleCloseModal}
      content={
        <AddPoint
          initialPointData={selectedPoint}
          setShowAddPointModal={setShowAddPointModal}
        />
      }
      header
    />
  );
};

export default AddPointModalComponent;
