import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import driverImagePlaceholder from "../../img/driver_placeholder.jpg";
import cn from "classnames";

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

import { FaPencilAlt, FaPlus, FaRegTrashAlt, FaSync } from "react-icons/fa";
import { setShowSovtesSyncModal } from "../../features/sovtesFleet/sovtesFleetSlice";

import "./DriversComponent.scss";
import { selectDrivers } from "../../features/drivers/driversSelectors";

const { REACT_APP_API_BASE_URL: BASE_URL } = import.meta.env;

const DriversComponent = ({ embedded = false }) => {
  const dispatch = useDispatch();
  const drivers = useSelector(selectDrivers);
  const navigate = useNavigate();
  const location = useLocation();

  const fromOnboarding = location.state?.fromOnboarding;
  const addDriver = location.state?.addDriver || fromOnboarding;

  const [selectedDriver, setLocalSelectedDriver] = useState({});
  const [search, setSearch] = useState("");
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [selectedDrivers, setSelectedDrivers] = useState([]);
  const [showContinueOnboarding, setShowContinueOnboarding] = useState(false);
  const [editDriverProfileMode, setEditDriverProfileMode] = useState(false);

  const handleCheckboxChange = (driverID) => {
    setSelectedDrivers((prev) =>
      prev.includes(driverID) ? prev.filter((id) => id !== driverID) : [...prev, driverID]
    );
  };

  useEffect(() => {
    dispatch(listDrivers());
  }, [dispatch]);

  useEffect(() => {
    if (fromOnboarding && drivers && drivers.length > 0) {
      setShowContinueOnboarding(true);
    }
  }, [fromOnboarding, drivers]);

  useEffect(() => {
    if (addDriver) {
      dispatch(setShowAddDriverModal(true));
      if (history.replaceState) {
        const newState = { ...location.state };
        delete newState.addDriver;
        history.replaceState({ ...newState }, document.title);
      }
    }
  }, [addDriver, dispatch]);

  const handleEditProfileMode = () => {
    if (selectedDrivers.length !== 1) return;
    setLocalSelectedDriver(drivers.find((d) => d.profile === selectedDrivers[0]));
    setEditDriverProfileMode(true);
    setShowDriverModal(true);
  };

  const handleRowDoubleClick = (e, driver) => {
    e.stopPropagation();
    dispatch(setSelectedDriver(driver));
    dispatch(setShowDriverModal(true));
  };

  const handleAddDriverButton = () => {
    setLocalSelectedDriver({});
    dispatch(setShowAddDriverModal(true));
  };

  const handleDeleteSelectedDrivers = () => {
    if (selectedDrivers.length === 0) return;
    if (!window.confirm("Are you sure you want to delete selected drivers?")) return;
    try {
      for (let driverId of selectedDrivers) {
        dispatch(deleteDriver(driverId));
      }
      setSelectedDrivers([]);
    } catch (error) {
      console.error("Error deleting drivers:", error.message);
    }
  };

  const handleDriverUpdate = (driverId, driverData) => {
    dispatch(updateDriver({ driverId, dataToUpdate: driverData })).then((result) => {
      if (result.meta.requestStatus === "fulfilled") {
        dispatch(listDrivers());
      }
    });
  };

  const handleModalClose = () => {
    setShowDriverModal(false);
  };

  const filteredDrivers = (drivers ?? []).filter((item) => {
    const q = search.toLowerCase();
    return q === "" || item.full_name.toLowerCase().includes(q);
  });

  return (
    <>
      <AddDriverModalComponent />
      <DriverModalComponent />

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
            setSelectedDriver={setLocalSelectedDriver}
            setEditDriverProfileMode={setEditDriverProfileMode}
            handleEditProfileMode={handleEditProfileMode}
            handleDriverUpdate={handleDriverUpdate}
          />
        }
        header
      />

      <div className={embedded ? undefined : "drivers-page"}>
        {!embedded && showContinueOnboarding && (
          <div className="drivers-page__onboarding-banner">
            <div>
              <p className="drivers-page__banner-eyebrow">Онбординг</p>
              <h3>Потрібно завершити крок з водіями</h3>
              <p>Додайте або виберіть водіїв, щоб продовжити налаштування.</p>
            </div>
            <button
              className="drivers-page__banner-btn"
              onClick={() => navigate("/onboarding", { state: { fromDrivers: true, currentStep: 2 } })}
              type="button"
            >
              Продовжити онбординг
            </button>
          </div>
        )}

        {!embedded && (
          <div className="drivers-page__hero">
            <h2 className="drivers-page__title">
              Водії
              <span
                className="drivers-page__info-badge"
                data-tooltip="Переглядайте, шукайте та керуйте водіями у зручному інтерфейсі."
              >
                i
              </span>
            </h2>
            <div className="drivers-page__actions">
              <span className="drivers-page__count-chip">
                {drivers?.length ?? 0} водіїв
              </span>
            </div>
          </div>
        )}

        <div className="fleet-toolbar">
          <div className="fleet-toolbar__search">
            <SearchComponent search={search} setSearch={setSearch} placeholder="пошук водія" />
          </div>
          <div className="fleet-toolbar__sep" />
          <div className="fleet-toolbar__group">
            <button
              className="fleet-toolbar__btn fleet-toolbar__btn--add"
              title="Додати водія"
              onClick={handleAddDriverButton}
              type="button"
            >
              <FaPlus />
            </button>
            <button
              className="fleet-toolbar__btn fleet-toolbar__btn--delete"
              title="Видалити вибраних"
              onClick={handleDeleteSelectedDrivers}
              disabled={selectedDrivers.length === 0}
              type="button"
            >
              <FaRegTrashAlt />
            </button>
          </div>
          <div className="fleet-toolbar__sep" />
          <div className="fleet-toolbar__group">
            <button
              className="fleet-toolbar__btn fleet-toolbar__btn--edit"
              title="Редагувати водія"
              onClick={handleEditProfileMode}
              disabled={selectedDrivers.length !== 1}
              type="button"
            >
              <FaPencilAlt />
            </button>
          </div>
          <div className="fleet-toolbar__sep" />
          <div className="fleet-toolbar__group">
            <button
              className="fleet-toolbar__btn fleet-toolbar__btn--sovtes"
              title="Синхронізація зі Sovtes"
              onClick={() => dispatch(setShowSovtesSyncModal({ show: true, tab: "drivers" }))}
              type="button"
            >
              <FaSync />
            </button>
          </div>
          {selectedDrivers.length > 0 && (
            <span className="fleet-toolbar__badge">{selectedDrivers.length} обрано</span>
          )}
        </div>

        <div className="drivers-page__table-card">
          <div className="table-container drivers-page__table-wrap">
            <table className="drivers-table">
              <thead className="drivers-table__header">
                <tr className="drivers-table__head-row">
                  <th className="drivers-table__head-th">#</th>
                  <th className="drivers-table__head-th">Фото</th>
                  <th className="drivers-table__head-th">Повне ім'я</th>
                  <th className="drivers-table__head-th">Номер телефону</th>
                  <th className="drivers-table__head-th">Посада</th>
                  <th className="drivers-table__head-th">Автомобіль</th>
                  <th className="drivers-table__head-th"></th>
                </tr>
              </thead>
              <tbody className="drivers-table__body">
                {filteredDrivers.map((driver, index) => (
                  <tr
                    key={driver.profile}
                    className={cn("drivers-table__body-row", {
                      "drivers-table__body-row_active": selectedDrivers.includes(driver.profile),
                    })}
                    onDoubleClick={(e) => handleRowDoubleClick(e, driver)}
                    onClick={() => handleCheckboxChange(driver.profile)}
                  >
                    <td className="drivers-table__body-td">{index + 1}</td>
                    <td className="drivers-table__body-td drivers-table__body-td_image">
                      <img
                        src={driver.image ? `${BASE_URL}${driver.image}` : driverImagePlaceholder}
                        alt=""
                      />
                    </td>
                    <td className="drivers-table__body-td">{driver.full_name}</td>
                    <td className="drivers-table__body-td">{driver.phone_number}</td>
                    <td className="drivers-table__body-td">{driver.position}</td>
                    <td className="drivers-table__body-td">{driver.trucks?.[0]?.plates}</td>
                    <td className="drivers-table__body-td">
                      <input
                        type="checkbox"
                        className="drivers-table__checkbox"
                        checked={selectedDrivers.includes(driver.profile)}
                        onChange={() => handleCheckboxChange(driver.profile)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

export default DriversComponent;
