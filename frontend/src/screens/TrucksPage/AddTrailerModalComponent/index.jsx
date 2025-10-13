import { useDispatch, useSelector } from "react-redux";
import { selectShowAddTrailerModal } from "../../../features/trailers/trailersSelectors";
import { setShowAddTrailerModal } from "../../../features/trailers/trailersSlice";
import GenericModalComponent from "../../../globalComponents/GenericModalComponent";
import ManageTrailerComponent from "../ManageTrailerComponent";

const AddTrailerModalComponent = () => {
  const dispatch = useDispatch();
  const showAddTrailerModal = useSelector(selectShowAddTrailerModal);

  const handleCloseModal = () => {
    dispatch(setShowAddTrailerModal(false));
  };

  return (
    <>
      <GenericModalComponent
        show={showAddTrailerModal}
        onClose={handleCloseModal}
        content={<ManageTrailerComponent onCloseModal={handleCloseModal} />}
      />
    </>
  );
};

export default AddTrailerModalComponent;
