import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { selectTrucks } from "../../features/trucks/trucksSelectors";
import { selectTrailers } from "../../features/trailers/trailersSelectors";
import { listTrucks } from "../../features/trucks/trucksOperations";
import { listTrailers } from "../../features/trailers/trailersOperations";
import { listDrivers } from "../../actions/driverActions";
import { setShowAddTruckModal } from "../../features/trucks/trucksSlice";
import TrucksTableComponent from "./TrucksTableComponent";
import TrailersTableComponent from "./TrailersTableComponent";
import "./style.scss";

const TrucksPage = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  const trucks = useSelector(selectTrucks);
  const trailers = useSelector(selectTrailers);
  const drivers = useSelector((state) => state.driversInfo.drivers.data);

  const [activeTab, setActiveTab] = useState("trucks");
  const [showContinueOnboarding, setShowContinueOnboarding] = useState(false);

  // Open AddTruckModal if coming from onboarding
  useEffect(() => {
    dispatch(listTrucks());
    dispatch(listTrailers());
    dispatch(listDrivers());

    if (
      location.state &&
      location.state.fromOnboarding &&
      location.state.addTruck
    ) {
      dispatch(setShowAddTruckModal(true));

      // Clear the location state after using it to prevent it from persisting
      if (history.replaceState) {
        const newState = { ...location.state };
        delete newState.addTruck;
        history.replaceState({ ...newState }, document.title);
      }
    }
  }, []);

  // Show "Continue onboarding" button if from onboarding and at least one truck exists
  useEffect(() => {
    if (
      location.state &&
      location.state.fromOnboarding &&
      trucks &&
      trucks.length > 0
    ) {
      setShowContinueOnboarding(true);
    }
  }, [location.state, trucks]);

  const handleContinueOnboarding = () => {
    navigate("/onboarding", { state: { fromTrucks: true } });
  };

  return (
    <>
      <div className="trucks-page">
        <div className="trucks-page__header">
          <h3
            className={`trucks-page__title ${
              activeTab === "trucks" ? "active" : ""
            }`}
            onClick={() => setActiveTab("trucks")}
          >
            Тягачі
          </h3>
          <h3
            className={`trucks-page__title ${
              activeTab === "trailers" ? "active" : ""
            }`}
            onClick={() => setActiveTab("trailers")}
          >
            Причіпи
          </h3>
        </div>
        {showContinueOnboarding && (
          <div style={{ textAlign: "center", margin: "1.5rem 0" }}>
            <button className="btn-primary" onClick={handleContinueOnboarding}>
              Продовжити онбординг
            </button>
          </div>
        )}
      </div>
      {activeTab === "trucks" && (
        <TrucksTableComponent
          trucks={trucks}
          trailers={trailers}
          drivers={drivers}
        />
      )}
      {activeTab === "trailers" && (
        <TrailersTableComponent trailers={trailers} />
      )}
    </>
  );
};

export default TrucksPage;
