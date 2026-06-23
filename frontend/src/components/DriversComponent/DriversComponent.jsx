import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import driverImagePlaceholder from "../../img/driver_placeholder.jpg";
import cn from "classnames";

import {
  setShowAddDriverModal,
} from "../../features/drivers/driversSlice";
import {
  listDrivers,
  deleteDriver,
  updateDriver,
} from "../../features/drivers/driversOperations";
import {
  listTruckUnits,
  assignDriverUnit,
} from "../../features/truckUnits/truckUnitsOperations";
import { calcAge, calcTenure } from "../../utils/formatDate";

import GenericModalComponent from "../../globalComponents/GenericModalComponent";
import SearchableSelect from "../../globalComponents/SearchableSelect";
import EditDriverComponent from "./EditDriverComponent/EditDriverComponent";
import AddDriverModalComponent from "./AddDriverModalComponent";
import DriverModalComponent from "./DriverModalComponent";
import SearchComponent from "../../globalComponents/SearchComponent";

import {
  FaChevronDown,
  FaChevronRight,
  FaLayerGroup,
  FaPencilAlt,
  FaPlus,
  FaRegTrashAlt,
  FaSave,
  FaSync,
  FaTimes,
} from "react-icons/fa";
import { setShowSovtesSyncModal } from "../../features/sovtesFleet/sovtesFleetSlice";

import "./DriversComponent.scss";
import { selectDrivers } from "../../features/drivers/driversSelectors";

const UNGROUPED_KEY = "__ungrouped__";

const DriversComponent = ({ embedded = false }) => {
  const dispatch = useDispatch();
  const drivers = useSelector(selectDrivers);
  const units = useSelector((state) => state.truckUnitsInfo.units);
  const navigate = useNavigate();
  const location = useLocation();

  const fromOnboarding = location.state?.fromOnboarding;
  const addDriver = location.state?.addDriver || fromOnboarding;

  const [selectedLocalDriver, setLocalSelectedDriver] = useState({});
  const [search, setSearch] = useState("");
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [selectedDrivers, setSelectedDrivers] = useState([]);
  const [showContinueOnboarding, setShowContinueOnboarding] = useState(false);
  const [editDriverProfileMode, setEditDriverProfileMode] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState({});

  // Unit assign mode
  const [assignUnitMode, setAssignUnitMode] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState("");

  useEffect(() => {
    dispatch(listDrivers());
  }, [dispatch]);

  useEffect(() => {
    if (units.length === 0) dispatch(listTruckUnits());
  }, []);

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

  const unitOptions = [
    { label: "Без колони", value: "__clear__" },
    ...units.map((u) => ({ label: u.name, value: String(u.id) })),
  ];

  const filteredDrivers = useMemo(() => {
    const q = search.toLowerCase();
    return (drivers ?? []).filter(
      (d) => !q || (d.full_name || "").toLowerCase().includes(q)
    );
  }, [drivers, search]);

  const groups = useMemo(() => {
    const map = {};
    filteredDrivers.forEach((driver) => {
      const key = driver.current_unit ? String(driver.current_unit.id) : UNGROUPED_KEY;
      const label = driver.current_unit ? driver.current_unit.name : "Без колони";
      if (!map[key]) map[key] = { label, drivers: [] };
      map[key].drivers.push(driver);
    });
    return Object.entries(map).sort(([a], [b]) => {
      if (a === UNGROUPED_KEY) return 1;
      if (b === UNGROUPED_KEY) return -1;
      return map[a].label.localeCompare(map[b].label);
    });
  }, [filteredDrivers]);

  const toggleGroup = (key) =>
    setCollapsedGroups((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleCheckboxChange = (driverID) => {
    setSelectedDrivers((prev) =>
      prev.includes(driverID) ? prev.filter((id) => id !== driverID) : [...prev, driverID]
    );
  };

  const handleEditProfileMode = () => {
    if (selectedDrivers.length !== 1) return;
    setLocalSelectedDriver(drivers.find((d) => d.profile === selectedDrivers[0]));
    setEditDriverProfileMode(true);
    setShowDriverModal(true);
  };

  const handleRowDoubleClick = (e, driver) => {
    e.stopPropagation();
    setLocalSelectedDriver(driver);
    setShowDriverModal(true);
  };

  const handleAddDriverButton = () => {
    setLocalSelectedDriver({});
    dispatch(setShowAddDriverModal(true));
  };

  const handleDeleteSelectedDrivers = () => {
    if (selectedDrivers.length === 0) return;
    if (!window.confirm("Видалити вибраних водіїв?")) return;
    for (const driverId of selectedDrivers) dispatch(deleteDriver(driverId));
    setSelectedDrivers([]);
  };

  const handleDriverUpdate = (driverId, driverData) =>
    dispatch(updateDriver({ driverId, dataToUpdate: driverData })).then((result) => {
      if (result.meta.requestStatus === "fulfilled") dispatch(listDrivers());
    });

  const handleModalClose = () => setShowDriverModal(false);

  // ── Unit assign mode ──────────────────────────────────────────
  const handleEnterAssignUnit = () => {
    if (selectedDrivers.length !== 1) return;
    const driver = drivers.find((d) => d.profile === selectedDrivers[0]);
    setSelectedUnit(driver?.current_unit ? String(driver.current_unit.id) : "");
    setAssignUnitMode(true);
  };

  const handleSaveAssignUnit = async () => {
    const driver_id = selectedDrivers[0];
    const unit_id = selectedUnit === "__clear__" || selectedUnit === ""
      ? null
      : Number(selectedUnit);
    await dispatch(assignDriverUnit({ driver_id, unit_id }));
    dispatch(listDrivers());
    setAssignUnitMode(false);
    setSelectedUnit("");
    setSelectedDrivers([]);
  };

  const handleCancelAssignUnit = () => {
    setAssignUnitMode(false);
    setSelectedUnit("");
  };

  return (
    <>
      <AddDriverModalComponent />
      <DriverModalComponent />

      <GenericModalComponent
        title={
          editDriverProfileMode
            ? `Редагування водія: ${selectedLocalDriver.full_name}`
            : `Водій: ${selectedLocalDriver.full_name}`
        }
        show={showDriverModal}
        onClose={handleModalClose}
        content={
          <EditDriverComponent
            setShowDriverModal={setShowDriverModal}
            showDriverModal={showDriverModal}
            selectedDriver={selectedLocalDriver}
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

            {!assignUnitMode ? (
              <button
                className="fleet-toolbar__btn fleet-toolbar__btn--assign"
                title="Прив'язати до колони"
                onClick={handleEnterAssignUnit}
                disabled={selectedDrivers.length !== 1}
                type="button"
              >
                <FaLayerGroup />
              </button>
            ) : (
              <>
                <button
                  className="fleet-toolbar__btn fleet-toolbar__btn--save"
                  title="Зберегти колону"
                  onClick={handleSaveAssignUnit}
                  type="button"
                >
                  <FaSave />
                </button>
                <button
                  className="fleet-toolbar__btn fleet-toolbar__btn--cancel"
                  title="Скасувати"
                  onClick={handleCancelAssignUnit}
                  type="button"
                >
                  <FaTimes />
                </button>
              </>
            )}
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

        {/* Unit assign bar */}
        {assignUnitMode && (
          <div className="drivers-assign-bar">
            <span className="drivers-assign-bar__title">Прив'язати до колони:</span>
            <div className="drivers-assign-bar__select">
              <SearchableSelect
                value={selectedUnit}
                onChange={setSelectedUnit}
                options={unitOptions}
                placeholder="Виберіть колону…"
                clearLabel="Без колони"
              />
            </div>
          </div>
        )}

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
                  <th className="drivers-table__head-th">Вік</th>
                  <th className="drivers-table__head-th">Стаж</th>
                  <th className="drivers-table__head-th">Автомобіль</th>
                  <th className="drivers-table__head-th">Колона</th>
                  <th className="drivers-table__head-th"></th>
                </tr>
              </thead>
              {groups.map(([groupKey, { label, drivers: groupDrivers }]) => (
                <tbody key={groupKey}>
                  <tr
                    className="drivers-table__group-row"
                    onClick={() => toggleGroup(groupKey)}
                  >
                    <td className="drivers-table__group-cell" colSpan={10}>
                      <span className="drivers-table__group-icon">
                        {collapsedGroups[groupKey] ? <FaChevronRight /> : <FaChevronDown />}
                      </span>
                      <span className="drivers-table__group-label">{label}</span>
                      <span className="drivers-table__group-count">{groupDrivers.length}</span>
                    </td>
                  </tr>

                  {!collapsedGroups[groupKey] && groupDrivers.map((driver, index) => {
                    const isSelected = selectedDrivers.includes(driver.profile);
                    const isAssigning = assignUnitMode && isSelected;
                    return (
                      <tr
                        key={driver.profile}
                        className={cn("drivers-table__body-row", {
                          "drivers-table__body-row_active": isSelected,
                        })}
                        onDoubleClick={(e) => handleRowDoubleClick(e, driver)}
                        onClick={() => handleCheckboxChange(driver.profile)}
                      >
                        <td className="drivers-table__body-td">{index + 1}</td>
                        <td className="drivers-table__body-td drivers-table__body-td_image">
                          <img src={driver.image || driverImagePlaceholder} alt="" />
                        </td>
                        <td className="drivers-table__body-td">{driver.full_name}</td>
                        <td className="drivers-table__body-td">{driver.phone_number}</td>
                        <td className="drivers-table__body-td">{driver.position}</td>
                        <td className="drivers-table__body-td drivers-table__body-td--meta">
                          {calcAge(driver.birth_date) != null
                            ? <span className="drivers-table__meta-chip">{calcAge(driver.birth_date)} р.</span>
                            : <span className="drivers-table__unit-empty">—</span>}
                        </td>
                        <td className="drivers-table__body-td drivers-table__body-td--meta">
                          {calcTenure(driver.started_work) != null
                            ? <span className="drivers-table__meta-chip">{calcTenure(driver.started_work)}</span>
                            : <span className="drivers-table__unit-empty">—</span>}
                        </td>
                        <td className="drivers-table__body-td">{driver.trucks?.[0]?.plates}</td>
                        <td className="drivers-table__body-td">
                          {isAssigning ? (
                            <div style={{ minWidth: 180 }} onClick={(e) => e.stopPropagation()}>
                              <SearchableSelect
                                value={selectedUnit}
                                onChange={setSelectedUnit}
                                options={unitOptions}
                                placeholder="Виберіть колону…"
                                clearLabel="Без колони"
                              />
                            </div>
                          ) : driver.current_unit ? (
                            <span className="drivers-table__unit-badge">
                              {driver.current_unit.name}
                            </span>
                          ) : (
                            <span className="drivers-table__unit-empty">—</span>
                          )}
                        </td>
                        <td className="drivers-table__body-td">
                          <input
                            type="checkbox"
                            className="drivers-table__checkbox"
                            checked={isSelected}
                            onChange={() => handleCheckboxChange(driver.profile)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              ))}
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

export default DriversComponent;
