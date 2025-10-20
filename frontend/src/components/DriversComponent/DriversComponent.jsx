import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import driverImagePlaceholder from "../../img/driver_placeholder.jpg";
import cn from "classnames";

// Redux
import {
  setShowAddDriverModal,
  setSelectedDriver,
} from "../../features/drivers/driversSlice";
import {
  listDrivers,
  deleteDriver,
  updateDriver,
} from "../../features/drivers/driversOperations";

import GenericModalComponent from "../../globalComponents/GenericModalComponent";
import EditDriverComponent from "./EditDriverComponent/EditDriverComponent";
import AddDriverModalComponent from "./AddDriverModalComponent";
import DriverModalComponent from "./DriverModalComponent";
import SearchComponent from "../../globalComponents/SearchComponent";

import { FaPencilAlt, FaPlus, FaRegTrashAlt } from "react-icons/fa";

import "./DriversComponent.scss";
import { selectDrivers } from "../../features/drivers/driversSelectors";

// const { REACT_APP_PROXY: BASE_URL } = import.meta.env;
const { REACT_APP_API_BASE_URL: BASE_URL } = import.meta.env;

const DriversComponent = () => {
  const dispatch = useDispatch();
  // Use the new Redux state structure
  const drivers = useSelector(selectDrivers);
  const navigate = useNavigate();
  const location = useLocation();

  // Check if coming from onboarding wizard and should show add driver form
  const fromOnboarding = location.state?.fromOnboarding;
  const addDriver = location.state?.addDriver || fromOnboarding;
  const onboardingNextStep = location.state?.nextStep;

  const [selectedDriver, setSelectedDriver] = useState({});
  const [search, setSearch] = useState("");
  const [showDriverModal, setShowDriverModal] = useState(false);

  const [selectedDrivers, setSelectedDrivers] = useState([]);
  const [showContinueOnboarding, setShowContinueOnboarding] = useState(false);

  // All edit mode hooks
  const [editDriverProfileMode, setEditDriverProfileMode] = useState(false);

  const handleCheckboxChange = (driverID) => {
    setSelectedDrivers((prevSelectedDrivers) => {
      if (prevSelectedDrivers.includes(driverID)) {
        return prevSelectedDrivers.filter((id) => id !== driverID);
      } else {
        return [...prevSelectedDrivers, driverID];
      }
    });
  };

  useEffect(() => {
    dispatch(listDrivers());
  }, [dispatch]);

  // Check if we should show the continue onboarding button
  useEffect(() => {
    if (fromOnboarding && drivers && drivers.length > 0) {
      setShowContinueOnboarding(true);
    }
  }, [fromOnboarding, drivers]);

  // Auto-show add driver modal when coming from onboarding wizard
  useEffect(() => {
    if (addDriver) {
      // Open the modal instead of navigating
      dispatch(setShowAddDriverModal(true));

      // Clear the location state after using it to prevent it from persisting
      if (history.replaceState) {
        const newState = { ...location.state };
        delete newState.addDriver;
        history.replaceState({ ...newState }, document.title);
      }
    }
  }, [addDriver, dispatch]);

  console.log("Drivers", drivers);

  const handleEditProfileMode = (e) => {
    e.preventDefault();

    if (selectedDrivers.length === 0) {
      window.alert("Виберіть водія для редагування");
    } else if (selectedDrivers.length > 1) {
      window.alert("Виберіть лише одного водія для редагування");
    }
    if (selectedDrivers.length === 1) {
      setSelectedDriver(
        drivers.find((driver) => driver.profile === selectedDrivers[0])
      );
      setEditDriverProfileMode(true);
      setShowDriverModal(true);
    }
  };

  const handleRowDoubleClick = (e, driver) => {
    e.stopPropagation();
    dispatch(setSelectedDriver(driver));
    dispatch(setShowDriverModal(true));
  };

  const handleAddDriverButton = (e) => {
    e.stopPropagation();
    setSelectedDriver({});
    console.log("Add driver button clicked");
    // Open the modal instead of navigating
    dispatch(setShowAddDriverModal(true));
  };

  const handleDeleteSelectedDrivers = () => {
    console.log("Delete selected drivers", selectedDrivers);
    if (selectedDrivers.length === 0) {
      window.alert("Виберіть водія для видалення");
      return;
    }
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this driver?"
    );
    if (!confirmDelete) {
      return;
    }

    if (confirmDelete) {
      console.log("Delete selected drivers", selectedDrivers);
      try {
        for (let driverId of selectedDrivers) {
          dispatch(deleteDriver(driverId));
        }
        setSelectedDrivers([]);
      } catch (error) {
        console.error("Error deleting drivers:", error.message);
      }
    }
  };

  const handleDriverUpdate = (driverId, driverData) => {
    console.log("Updating driver:", driverId, driverData);
    // Use our new Redux Toolkit updateDriver action
    dispatch(updateDriver({ driverId, dataToUpdate: driverData })).then(
      (result) => {
        if (result.meta.requestStatus === "fulfilled") {
          console.log("Driver updated successfully:", result.payload);
          // Refresh the list after update
          dispatch(listDrivers());
        } else if (result.meta.requestStatus === "rejected") {
          console.error("Failed to update driver:", result.payload);
        }
      }
    );
  };

  const handleModalClose = () => {
    setShowDriverModal(false);
  };

  return (
    <>
      {/* Add Driver Modal */}
      {/* Include the driver modal components */}
      <AddDriverModalComponent />
      <DriverModalComponent />

      {/* View/Edit Driver Modal */}
      <GenericModalComponent
        title={
          editDriverProfileMode
            ? `Редагування водія: ${selectedDriver.full_name}`
            : `Водій: ${selectedDriver.full_name}`
        }
        show={showDriverModal}
        onClose={handleModalClose}
        content={
          <EditDriverComponent
            setShowDriverModal={setShowDriverModal}
            showDriverModal={showDriverModal}
            selectedDriver={selectedDriver}
            editDriverProfileMode={editDriverProfileMode}
            setSelectedDriver={setSelectedDriver}
            setEditDriverProfileMode={setEditDriverProfileMode}
            handleEditProfileMode={handleEditProfileMode}
            handleDriverUpdate={handleDriverUpdate}
          />
        }
        header
      />
      <div className="drivers-container">
        {showContinueOnboarding && (
          <div style={{ textAlign: "center", margin: "1.5rem 0" }}>
            <button
              className="btn-primary"
              onClick={() =>
                navigate("/onboarding", {
                  state: { fromDrivers: true, currentStep: 2 },
                })
              }
            >
              Продовжити онбординг
            </button>
          </div>
        )}
        <div className="drivers-header-block">
          <h2 className="drivers-table__name">Мої водії</h2>
          <div className="drivers-header-block__buttons-container">
            <button
              className="drivers-header-block__add-driver-btn"
              title="Додати водія"
              onClick={handleAddDriverButton}
            >
              <FaPlus />
            </button>
            <button
              className="drivers-header-block__delete-driver-btn"
              title="Видалити вибраних водіїв"
              onClick={handleDeleteSelectedDrivers}
            >
              <FaRegTrashAlt />
            </button>
            <button
              className="drivers-header-block__edit-driver-btn"
              title="Редагувати водія"
              onClick={handleEditProfileMode}
            >
              <FaPencilAlt />
            </button>
            {/* TODO: Add this buttons block to globalComponents */}
          </div>
        </div>
        <SearchComponent
          search={search}
          setSearch={setSearch}
          placeholder={"Введіть ім'я або прізвище водія"}
        />
        <div className="table-container">
          <table className="drivers-table">
            <thead className="drivers-table__header">
              <tr className="drivers-table__head-row">
                <th className="drivers-table__head-th">ID</th>
                <th className="drivers-table__head-th">Фото</th>
                <th className="drivers-table__head-th">Повне ім'я</th>
                <th className="drivers-table__head-th">Номер телефону</th>
                <th className="drivers-table__head-th">Посада</th>
                <th className="drivers-table__head-th">Автомобіль</th>
                <th className="drivers-table__head-th"></th>
              </tr>
            </thead>
            <tbody data-link="row" className="drivers-table__body">
              {drivers &&
                drivers
                  .filter((item) => {
                    const searchTerm = search.toLowerCase();
                    return (
                      searchTerm === "" ||
                      item.full_name.toLowerCase().includes(searchTerm)
                    );
                  })
                  .map((driver, index) => (
                    <tr
                      key={driver.profile}
                      className={cn("drivers-table__body-row", {
                        "drivers-table__body-row_active":
                          selectedDrivers.includes(driver.profile),
                      })}
                      onDoubleClick={(e) => handleRowDoubleClick(e, driver)}
                    >
                      <td className="drivers-table__body-td">{index + 1}</td>
                      <td className="drivers-table__body-td drivers-table__body-td_image">
                        <img
                          src={
                            driver.image
                              ? `${BASE_URL}${driver.image}`
                              : driverImagePlaceholder
                          }
                          alt=""
                        />
                      </td>
                      <td className="drivers-table__body-td">
                        {driver.full_name}
                      </td>
                      <td className="drivers-table__body-td">
                        {driver.phone_number}
                      </td>
                      <td className="drivers-table__body-td">
                        {driver.position}
                      </td>
                      <td className="drivers-table__body-td">
                        {driver.trucks && driver?.trucks[0]?.plates}
                      </td>
                      <td className="drivers-table__body-td">
                        <input
                          type="checkbox"
                          className="drivers-table__checkbox"
                          checked={selectedDrivers.includes(driver.profile)}
                          onChange={() => {
                            handleCheckboxChange(driver.profile);
                          }}
                        />
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default DriversComponent;
