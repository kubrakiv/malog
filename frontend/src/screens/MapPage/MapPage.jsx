import React, { useState, useCallback, useContext } from "react";
import { useJsApiLoader } from "@react-google-maps/api";
import Map from "../../components/Map";
import Autocomplete from "../../components/Autocomplete/Autocomplete";
import OpenContext from "../../components/OpenContext";

const { REACT_APP_API_KEY: API_KEY } = import.meta.env;

const defaultCenter = {
  lat: 50.45351890994319,
  lng: 30.47004033415339,
};

const MapPage = () => {
  const { libraries } = useContext(OpenContext);
  const [center, setCenter] = useState(defaultCenter);
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: API_KEY,
    libraries: libraries,
  });

  const onPlaceSelect = useCallback((coordinates) => {
    setCenter(coordinates);
  }, []);

  return (
    <div className="map-container">
      <div className="address-search-container">
        <Autocomplete isLoaded={isLoaded} onSelect={onPlaceSelect} />
      </div>
      {isLoaded ? <Map center={center} /> : <h2>Loading...</h2>}
    </div>
  );
};

export default MapPage;
