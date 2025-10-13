import { useCallback, useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useJsApiLoader } from "@react-google-maps/api";
import { getLatLng, getZipCode } from "use-places-autocomplete";
import {
  getCountry,
  getStreet,
  getStreetNumber,
  getCity,
} from "./address_functions";
import { setMapCurrentLocation } from "../../actions/mapActions";

import { transformSelectOptions } from "../../utils/transformers";
import {
  selectEditModePoint,
  selectSelectedPoint,
} from "../../features/points/pointsSelectors";
import { selectCustomers } from "../../features/customers/customersSelectors";
import {
  setEditModePoint,
  setSelectedPoint,
  setTabToggleMode,
} from "../../features/points/pointsSlice";
import { listCustomers } from "../../features/customers/customersOperations";
import { formFields } from "./pointFormFields";
import { POINT_CONSTANTS } from "../../constants/global";
import {
  createPoint,
  listPoints,
  updatePoint,
} from "../../features/points/pointsOperations";

import Map from "../Map";
import AddPointFooterComponent from "./AddPointFooterComponent/AddPointFooterComponent";
import AddPointAutocomplete from "./AddPointAutocomplete/AddPointAutocomplete";
import SelectComponent from "../../globalComponents/SelectComponent";
import InputComponent from "../../globalComponents/InputComponent";

import "./AddPoint.scss";

const { REACT_APP_API_KEY: API_KEY } = import.meta.env;

const AddPoint = ({
  initialPointData = null,
  setShowAddPointModal,
  onAddTask,
  onCloseModal,
}) => {
  const dispatch = useDispatch();

  const tabToggleMode = useSelector((state) => state.pointsInfo.tabToggleMode);
  const map = useSelector((state) => state.map);
  const defaultCenter = useSelector((state) => state.map.defaultCenter);
  const currentLocation = useSelector((state) => state.map.currentLocation);
  const editModePoint = useSelector(selectEditModePoint);
  const customers = useSelector(selectCustomers);
  const selectedPoint = useSelector(selectSelectedPoint);

  const customerOptions = transformSelectOptions(customers, "name");

  const [googleAddress, setGoogleAddress] = useState("");

  const [pointFields, setPointFields] = useState(() => {
    if (initialPointData) {
      return { ...initialPointData };
    }

    return Object.values(POINT_CONSTANTS).reduce((acc, item) => {
      acc[item] = "";
      return acc;
    }, {});
  });

  useEffect(() => {
    dispatch(listCustomers());
  }, []);

  const handlePointChange = (e) => {
    const { name, value } = e.target;
    setPointFields({ ...pointFields, [name]: value });
  };

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: API_KEY,
    libraries: map.libraries,
  });

  // Set selected point and center on map
  useEffect(() => {
    if (selectedPoint && Object.keys(selectedPoint).length > 0) {
      dispatch(
        setMapCurrentLocation({
          lat: parseFloat(selectedPoint.gps_latitude),
          lng: parseFloat(selectedPoint.gps_longitude),
        })
      );
      // setTitle(selectedPoint.title);
    } else {
      dispatch(
        setMapCurrentLocation({
          lat: parseFloat(defaultCenter.lat),
          lng: parseFloat(defaultCenter.lng),
        })
      );
    }
  }, [selectedPoint, defaultCenter, dispatch]);

  const onPlaceSelect = useCallback(
    (results) => {
      const { lat, lng } = getLatLng(results[0]);
      const zipCode = getZipCode(results[0], false);
      const coordinates = { lat, lng };
      const country = getCountry(results[0]);
      const city = getCity(results[0]);
      const street = getStreet(results[0]);
      const streetNumber = getStreetNumber(results[0]);

      // Update the pointFields state with the selected place data
      setPointFields((prevFields) => ({
        ...prevFields,
        gps_latitude: lat,
        gps_longitude: lng,
        postal_code: zipCode,
        country,
        city,
        street,
        street_number: streetNumber,
      }));

      // Update other states as necessary
      dispatch(setMapCurrentLocation(coordinates));
      setGoogleAddress(results[0].formatted_address);

      console.log(results[0], "Google Address Object");
      console.log("📍 Coordinates: ", coordinates);
    },
    [dispatch]
  );

  const handleFormSubmit = async (e, editModePoint, selectedPoint) => {
    e.preventDefault();

    const data = { ...pointFields };

    console.log("Point submit data", data);

    if (editModePoint) {
      try {
        dispatch(updatePoint({ ...data, id: selectedPoint.id }));

        setShowAddPointModal(false);
        dispatch(setSelectedPoint({}));
        dispatch(setEditModePoint(false));

        console.log("UPDATED POINT", data);
      } catch (error) {
        console.error("Error creating task:", error.message);
      }
    }

    if (!editModePoint) {
      try {
        dispatch(createPoint(data)).unwrap();

        dispatch(listPoints());
        dispatch(setTabToggleMode(!tabToggleMode));
        dispatch(setSelectedPoint(data));

        if (!onAddTask) {
          setShowAddPointModal(false);
        }

        console.log("CREATED POINT", data);
      } catch (error) {
        console.error("Error creating task:", error.message);
      }
    }
  };

  return (
    <>
      <form
        className="add-point-details__form"
        onSubmit={(e) => handleFormSubmit(e, editModePoint, selectedPoint)}
      >
        <div className="point-container">
          <div className="point-details">
            {!editModePoint && (
              <div className="add-point-details__content-row add-point-details__content-row__search">
                <AddPointAutocomplete
                  isLoaded={isLoaded}
                  onSelect={onPlaceSelect}
                />
              </div>
            )}

            {googleAddress && (
              <div className="add-point-details__content-row add-point-details__content-row__formatted-address">
                <div className="point-details__content-row-block">
                  {googleAddress}
                </div>
              </div>
            )}

            <div className="add-point-details__content">
              <div className="add-point-details__content-block">
                {formFields.map((item) => {
                  const { component, id, placeholder, type, title, label } =
                    item;

                  return (
                    <div key={id} className="add-point-details__content-row">
                      <div className="add-point-details__content-row-block">
                        {component === "select" && (
                          <SelectComponent
                            id={id}
                            name={id}
                            title={title}
                            label={label}
                            options={customerOptions}
                            value={pointFields[id]}
                            onChange={(e) => handlePointChange(e)}
                            widthStyle={"full-width"}
                          />
                        )}
                        {component === "input" && (
                          <InputComponent
                            id={id}
                            name={id}
                            title={title}
                            label={label}
                            type={type}
                            placeholder={placeholder}
                            value={pointFields[id]}
                            onChange={(e) => handlePointChange(e)}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="add-point-details__content-block">
                <div className="add-point-details__content-row">
                  <div className="add-point-details__content-row-block add-point-details__content-row-block-map">
                    {isLoaded ? (
                      <Map center={currentLocation || defaultCenter} />
                    ) : (
                      <h2>Loading...</h2>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <AddPointFooterComponent
              setShowAddPointModal={setShowAddPointModal}
              onCloseModal={onCloseModal}
            />
          </div>
        </div>
      </form>
    </>
  );
};

export default AddPoint;
