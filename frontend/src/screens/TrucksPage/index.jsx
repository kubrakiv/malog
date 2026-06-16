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

  const activeCount =
    activeTab === "trucks" ? (trucks?.length ?? 0) : (trailers?.length ?? 0);

  return (
    <div className="trucks-page">
      {showContinueOnboarding && (
        <div className="trucks-page__onboarding-banner">
          <div>
            <p className="trucks-page__banner-eyebrow">Онбординг</p>
            <h3>Потрібно завершити крок з транспортом</h3>
            <p>Додайте тягач або причіп, щоб перейти до наступного кроку.</p>
          </div>
          <button
            className="trucks-page__banner-btn"
            onClick={handleContinueOnboarding}
            type="button"
          >
            Продовжити онбординг
          </button>
        </div>
      )}

      <div className="trucks-page__hero">
        <div>
          <p className="trucks-page__eyebrow">Тенантний довідник</p>
          <h2 className="trucks-page__title">Транспорт</h2>
          <p className="trucks-page__subtitle">
            Керуйте тягачами та причепами в єдиному інтерфейсі з швидким
            редагуванням та пошуком.
          </p>
        </div>

        <div className="trucks-page__actions">
          <div className="trucks-page__actions-top">
            <div className="trucks-page__count-chip">{activeCount} записів</div>
            <div className="trucks-page__tab-group">
              <button
                className={`trucks-page__tab-btn ${
                  activeTab === "trucks" ? "trucks-page__tab-btn--active" : ""
                }`}
                onClick={() => setActiveTab("trucks")}
                type="button"
              >
                Тягачі
              </button>
              <button
                className={`trucks-page__tab-btn ${
                  activeTab === "trailers" ? "trucks-page__tab-btn--active" : ""
                }`}
                onClick={() => setActiveTab("trailers")}
                type="button"
              >
                Причіпи
              </button>
            </div>
          </div>

          <div id="fleet-hero-tools" className="trucks-page__hero-tools" />
        </div>
      </div>

      <div className="trucks-page__content">
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
      </div>
    </div>
  );
};

export default TrucksPage;
