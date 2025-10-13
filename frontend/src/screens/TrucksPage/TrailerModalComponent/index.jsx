import { useDispatch, useSelector } from "react-redux";

import GenericModalComponent from "../../../globalComponents/GenericModalComponent";
import TrailerCardComponent from "../TrailerCardComponent";

import {
  setShowTrailerModal,
  setEditModeTrailer,
} from "../../../features/trailers/trailersSlice";

import {
  selectShowTrailerModal,
  selectSelectedTrailer,
} from "../../../features/trailers/trailersSelectors";

const TrailerModalComponent = () => {
  const dispatch = useDispatch();
  const showTrailerModal = useSelector(selectShowTrailerModal);
  const selectedTrailer = useSelector(selectSelectedTrailer);

  const handleCloseModal = () => {
    dispatch(setShowTrailerModal(false));
    dispatch(setEditModeTrailer(false));
  };

  return (
    <>
      <GenericModalComponent
        show={showTrailerModal}
        onClose={handleCloseModal}
        content={
          <TrailerCardComponent
            trailer={selectedTrailer}
            onCloseModal={handleCloseModal}
          />
        }
      />
    </>
  );
};

export default TrailerModalComponent;
