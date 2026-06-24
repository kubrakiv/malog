import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useJsApiLoader } from "@react-google-maps/api";
import { setMapCurrentLocation } from "../../actions/mapActions";
import { getFullAddress } from "../../utils/address";

import Map from "../../components/Map";
// import PointHeaderComponent from "./PointHeaderComponent/PointHeaderComponent";
import PointCustomerComponent from "./PointCustomerComponent/PointCustomerComponent";
import PointCompanyComponent from "./PointCompanyComponent/PointCompanyComponent";
import PointGpsComponent from "./PointGpsComponent/PointGpsComponent";
import PointCountryComponent from "./PointCountryComponent/PointCountryComponent";
import PointAddressComponent from "./PointAddressComponent/PointAddressComponent";

import "./PointPage.scss";

const { REACT_APP_API_KEY: API_KEY } = import.meta.env;

const PointPage = ({ selectedPoint }) => {
  const dispatch = useDispatch();
  const map = useSelector((state) => state.map);
  const currentLocation = useSelector((state) => state.map.currentLocation);

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: API_KEY,
    libraries: map.libraries,
  });

  useEffect(() => {
    const { gps_latitude, gps_longitude } = selectedPoint;
    dispatch(
      setMapCurrentLocation({
        lat: parseFloat(gps_latitude),
        lng: parseFloat(gps_longitude),
      })
    );
  }, [selectedPoint, dispatch]);

  const fullAddress = useMemo(
    () => getFullAddress(selectedPoint),
    [selectedPoint]
  );

  return (
    <div className="point-container">
      <div className="point-details">
        <div className="point-details__content">
          {/* Left: info fields */}
          <div className="point-details__content-block">
            <PointCustomerComponent customer={selectedPoint.customer} />
            <PointCompanyComponent company={selectedPoint.company_name} />
            <PointCountryComponent country={selectedPoint.country} />
            <PointAddressComponent full_address={fullAddress} />
            <PointGpsComponent
              lat={selectedPoint.gps_latitude}
              lng={selectedPoint.gps_longitude}
            />
          </div>
          {/* Right: map */}
          <div className="point-details__content-block" style={{ padding: 0, overflow: "hidden" }}>
            {isLoaded ? (
              <Map center={currentLocation} />
            ) : (
              <div style={{ padding: "1rem", color: "#9bb5ba" }}>Завантаження карти...</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PointPage;
