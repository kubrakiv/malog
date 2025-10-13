import React from "react";
import { useSelector } from "react-redux";
import getTrailerDetails from "./trailerDetailsConfig";
import { selectEditModeTrailer } from "../../../features/trailers/trailersSelectors";

import TrailerFooterComponent from "../TrailerFooterComponent";
import ManageTrailerComponent from "../ManageTrailerComponent";

const TrailerCardComponent = ({ trailer, onCloseModal }) => {
  const trailerDetails = getTrailerDetails(trailer);
  const editModeTrailer = useSelector(selectEditModeTrailer);

  return (
    <>
      <div className="truck-card-container">
        <div className="truck-card-details">
          <div className="truck-card-details__content">
            <div className="truck-card-details__content-block">
              <h3 className="truck-card-details__title">Причіп</h3>
              {!editModeTrailer && (
                <div className="truck-card-details__content-row-block">
                  {trailerDetails.map((detail) => (
                    <div
                      className="truck-card-details__content-row-block_position"
                      key={detail.id}
                    >
                      <div className="truck-card-details__content-row-block-title">
                        {detail.title}
                      </div>
                      <div className="truck-card-details__content-row-block-value">
                        {detail.value || "None"}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {editModeTrailer && (
                <ManageTrailerComponent
                  onEditMode={editModeTrailer}
                  initialTrailerData={trailer}
                  onCloseModal={onCloseModal}
                />
              )}
            </div>
          </div>
          <TrailerFooterComponent onCloseModal={onCloseModal} />
        </div>
      </div>
    </>
  );
};

export default TrailerCardComponent;
