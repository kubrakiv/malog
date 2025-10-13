import { useDispatch, useSelector } from "react-redux";
import { setMapCurrentLocationDelete } from "../../actions/mapActions";
import { selectSelectedPoint } from "../../features/points/pointsSelectors";
import { setSelectedPoint } from "../../features/points/pointsSlice";

import PointPage from "../../screens/PointPage/PointPage";
import GenericModalComponent from "../../globalComponents/GenericModalComponent";

import "./style.scss";
import { getFullAddress } from "../../utils/address";

const PointModalComponent = ({
  showPointModal,
  setShowPointModal,
  footer = true,
  header = true,
}) => {
  const dispatch = useDispatch();

  const selectedPoint = useSelector(selectSelectedPoint);

  const handleModalClose = () => {
    setShowPointModal(false);
    dispatch(setSelectedPoint({}));
    dispatch(setMapCurrentLocationDelete());
  };
  return (
    <GenericModalComponent
      title={`Адреса: ${getFullAddress(selectedPoint)}` || "Точка"}
      show={showPointModal}
      onClose={handleModalClose}
      content={<PointPage selectedPoint={selectedPoint} />}
      header={header}
      footer={footer}
    />
  );
};

export default PointModalComponent;
