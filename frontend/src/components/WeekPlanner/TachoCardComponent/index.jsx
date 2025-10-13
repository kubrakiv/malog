import { useState } from "react";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import cn from "classnames";
import { BsFillPersonVcardFill } from "react-icons/bs";

import { selectTrucks } from "../../../features/trucks/trucksSelectors";
import { fetchDriverCurrentTimeAnalysis } from "../../../services/driverTimeAnalysisService";

import drivers from "../../../services/drivers.json";
import DriverCardComponent from "./DriverCardComponent";

import "./style.scss";

const TachoCardComponent = ({ style = "tacho-card", truckId }) => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [driverAnalysis, setDriverAnalysis] = useState(null);
  const [driverData, setDriverData] = useState(null);
  const [isLoading, setIsLoading] = useState(false); // Track loading state

  const trucks = useSelector(selectTrucks);

  const handleShowTachoData = () => {
    // togglePopup();
    setIsLoading(true); // Start loading before fetching data
    const truck = trucks.find((truck) => truck.id === truckId);

    const fetchDriverData = async () => {
      try {
        const driver = drivers.find(
          (driver) =>
            driver.last_name.toLowerCase() ===
            truck.driver_details.last_name.toLowerCase()
        );
        setDriverData(driver);

        // Fetch driver analysis data
        const driverTachoData = await fetchDriverCurrentTimeAnalysis(driver.id);
        setDriverAnalysis(driverTachoData);
      } catch (error) {
        console.error("Error fetching driver data or analysis:", error);
        setDriverData(null);
        setDriverAnalysis(null);
      } finally {
        setIsLoading(false); // Data fetching complete
        setIsPopupOpen(true); // Open the popup after loading
      }
    };

    fetchDriverData();
  };

  const togglePopup = () => {
    setIsPopupOpen(!isPopupOpen);
  };

  return (
    <>
      <button
        title="Показати дані тахографа"
        type="button"
        className={cn("plus-btn", {
          "plus-btn__tacho-card": style,
        })}
        onClick={handleShowTachoData}
      >
        <BsFillPersonVcardFill />
      </button>
      {isPopupOpen && (
        <div className="popup-card">
          <div className="popup-content">
            {isLoading ? (
              <p>Loading...</p>
            ) : driverData ? (
              <>
                <h2>{`${driverData.first_name} ${driverData.last_name}`}</h2>
                {driverAnalysis ? (
                  <DriverCardComponent data={driverAnalysis} />
                ) : (
                  <p>No data to show!</p>
                )}
              </>
            ) : (
              <p>Driver information not found!</p>
            )}
            <button onClick={togglePopup} className="close-popup-btn">
              Close
            </button>
          </div>
        </div>
      )}
      {isPopupOpen && (
        <div className="popup-backdrop" onClick={togglePopup}></div>
      )}
    </>
  );
};

export default TachoCardComponent;
