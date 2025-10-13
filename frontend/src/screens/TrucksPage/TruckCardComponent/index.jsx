import { useSelector } from "react-redux";
import { useState } from "react";
import getTruckDetails from "./truckDetailsConfig";
import getTrailerDetails from "../TrailerCardComponent/trailerDetailsConfig";

import { selectEditModeTruck } from "../../../features/trucks/trucksSelectors";

import TruckFooterComponent from "../TruckFooterComponent";
import ManageTruckComponent from "../ManageTruckComponent";

import driverImagePlaceholder from "../../../img/driver_placeholder.jpg";

import "./style.scss";

const { REACT_APP_PROXY: BASE_URL } = import.meta.env;

const TruckCardComponent = ({ truck, closeModal }) => {
  const [selectedTab, setSelectedTab] = useState("basic");
  const { basicDetails, normsDetails } = getTruckDetails(truck);
  const trailerDetails = getTrailerDetails(truck?.trailer_details);

  const editModeTruck = useSelector(selectEditModeTruck);

  return (
    <>
      <div className="truck-card-container">
        <div className="truck-card-details">
          <div className="truck-card-details__content">
            <div className="truck-card-details__content-block">
              <h3 className="truck-card-details__title">Тягач</h3>
              {!editModeTruck && (
                <>
                  <div className="truck-card-details__tabs">
                    <button
                      className={`truck-card-details__tab ${
                        selectedTab === "basic" ? "active" : ""
                      }`}
                      onClick={() => setSelectedTab("basic")}
                    >
                      Базові параметри
                    </button>
                    <button
                      className={`truck-card-details__tab ${
                        selectedTab === "norms" ? "active" : ""
                      }`}
                      onClick={() => setSelectedTab("norms")}
                    >
                      Норми
                    </button>
                  </div>

                  <div className="truck-card-details__content-row-block">
                    {(selectedTab === "basic"
                      ? basicDetails
                      : normsDetails
                    ).map((detail) => (
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
                </>
              )}

              {editModeTruck && (
                <ManageTruckComponent
                  onEditMode={editModeTruck}
                  initialTruckData={truck}
                  onCloseModal={closeModal}
                  activeTab={selectedTab}
                  setActiveTab={setSelectedTab}
                />
              )}
            </div>
            <div className="truck-card-details__content-block">
              <h3 className="truck-card-details__title">Причіп</h3>
              {trailerDetails && (
                <div className="truck-card-details__content-row-block">
                  {trailerDetails.map((detail) => (
                    <div
                      className="truck-card-details__content-row-block_position"
                      key={detail?.id}
                    >
                      <div className="truck-card-details__content-row-block-title">
                        {detail?.title}
                      </div>
                      <div className="truck-card-details__content-row-block-value">
                        {detail?.value || "None"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {
                <>
                  <h3 className="truck-card-details__title">Водій</h3>
                  <div className="truck-card-details__content-row-block">
                    {truck && (
                      <div className="truck-card-details__content-row-block_position">
                        <div className="truck-card-details__content-row-block-title">
                          {truck.driver_details?.full_name}
                        </div>
                        <div className="truck-card-details__content-row-block-value">
                          {truck.driver_details?.position}
                        </div>
                        <div className="truck-card-details__content-row-block-value">
                          {truck.driver_details?.phone_number}
                        </div>
                        <div className="truck-card-details__content-row-block-value">
                          {truck.driver_details?.email}
                        </div>
                        <div className="truck-card-details__content-row-block-value">
                          {truck.driver_details?.started_work}
                        </div>
                        <img
                          src={
                            truck.driver_details?.image
                              ? `${BASE_URL}${truck.driver_details?.image}`
                              : driverImagePlaceholder
                          }
                          alt=""
                        />
                      </div>
                    )}
                  </div>
                </>
              }
            </div>
          </div>
          <TruckFooterComponent onCloseModal={closeModal} />
        </div>
      </div>
    </>
  );
};

export default TruckCardComponent;
