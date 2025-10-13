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
    <>
      <div className="point-container">
        <div className="point-details">
          <div className="point-details__content">
            <div className="point-details__content-block">
              <div className="point-details__content-row">
                <PointCustomerComponent customer={selectedPoint.customer} />
              </div>
              <div className="point-details__content-row">
                <PointCompanyComponent company={selectedPoint.company_name} />
              </div>
              <div className="point-details__content-row">
                <PointCountryComponent country={selectedPoint.country} />
              </div>
              <div className="point-details__content-row">
                <PointAddressComponent full_address={fullAddress} />
              </div>
              <div className="point-details__content-row">
                <PointGpsComponent
                  lat={selectedPoint.gps_latitude}
                  lng={selectedPoint.gps_longitude}
                />
              </div>
            </div>
            <div className="point-details__content-block">
              <div className="point-details__content-row">
                <div className="point-details__content-row-block point-details__content-row-block-map">
                  {isLoaded ? (
                    <Map center={currentLocation} />
                  ) : (
                    <h2>Loading...</h2>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PointPage;
