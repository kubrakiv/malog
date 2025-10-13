import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { selectTrucks } from "../../features/trucks/trucksSelectors";
import { selectTrailers } from "../../features/trailers/trailersSelectors";
import { listTrucks } from "../../features/trucks/trucksOperations";
import { listTrailers } from "../../features/trailers/trailersOperations";
import { listDrivers } from "../../actions/driverActions";

import TrucksTableComponent from "./TrucksTableComponent";
import TrailersTableComponent from "./TrailersTableComponent";

import "./style.scss";

const TrucksPage = () => {
  const dispatch = useDispatch();

  const trucks = useSelector(selectTrucks);
  const trailers = useSelector(selectTrailers);
  const drivers = useSelector((state) => state.driversInfo.drivers.data);

  const [activeTab, setActiveTab] = useState("trucks");

  useEffect(() => {
    dispatch(listTrucks());
    dispatch(listTrailers());
    dispatch(listDrivers());
  }, []);

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
