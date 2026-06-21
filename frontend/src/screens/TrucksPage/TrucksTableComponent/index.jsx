import { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  FaCheck,
  FaChevronDown,
  FaChevronRight,
  FaLayerGroup,
  FaLink,
  FaPencilAlt,
  FaPlus,
  FaRegTrashAlt,
  FaSave,
  FaSync,
  FaTimes,
} from "react-icons/fa";
import cn from "classnames";
import axios from "axios";

import { transformSelectOptions } from "../../../utils/transformers";
import SelectComponent from "../../../globalComponents/SelectComponent";
import SearchComponent from "../../../globalComponents/SearchComponent";
import TruckModalComponent from "../TruckModalComponent";
import AddTruckModalComponent from "../AddTruckModalComponent";

import {
  deleteTruck,
  listTrucks,
  updateTruckTrailerAndDriver,
} from "../../../features/trucks/trucksOperations";
import {
  assignTruckUnit,
  listTruckUnits,
} from "../../../features/truckUnits/truckUnitsOperations";

import { selectSelectedTruck } from "../../../features/trucks/trucksSelectors";
import {
  setEditModeTruck,
  setShowAddTruckModal,
  setShowTruckModal,
  setSelectedTruck,
} from "../../../features/trucks/trucksSlice";

import { setShowSovtesSyncModal } from "../../../features/sovtesFleet/sovtesFleetSlice";

import "./style.scss";

const SyncBadge = ({ sovtesId }) => {
  if (sovtesId) {
    return (
      <span className="fleet-sync-badge fleet-sync-badge--sovtes">
        <FaSync />
        Sovtes
      </span>
    );
  }
  return (
    <span className="fleet-sync-badge fleet-sync-badge--manual">Вручну</span>
  );
};

const UNGROUPED_KEY = "__ungrouped__";

const TrucksTableComponent = ({ trucks, trailers, drivers }) => {
  const dispatch = useDispatch();
  const selectedTruck = useSelector(selectSelectedTruck);
  const userInfo = useSelector((state) => state.userLogin.userInfo);

  const trailerOptions = transformSelectOptions(trailers, "plates");
  const driverOptions = transformSelectOptions(drivers, "full_name");

  const units = useSelector((state) => state.truckUnitsInfo.units);

  const [search, setSearch] = useState("");
  const [selectedTrucks, setSelectedTrucks] = useState([]);
  const [assignMode, setAssignMode] = useState(false);
  const [selectedTrailer, setSelectedTrailer] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [selectedLogist, setSelectedLogist] = useState(null);
  const [logists, setLogists] = useState([]);
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const [bulkAssignMode, setBulkAssignMode] = useState(false);
  const [bulkUnit, setBulkUnit] = useState("");
  const [bulkLogist, setBulkLogist] = useState("");

  useEffect(() => {
    const fetchLogists = async () => {
      try {
        const token = userInfo?.token;
        const { data } = await axios.get("/api/users/logists/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setLogists(data);
      } catch (_) {}
    };
    fetchLogists();
  }, [userInfo]);

  useEffect(() => {
    if (units.length === 0) dispatch(listTruckUnits());
  }, []);

  const logistOptions = logists.map((l) => ({
    label: l.full_name || l.username,
    value: l.id,
  }));

  const unitOptions = [
    { label: "Без колони", value: "__clear__" },
    ...units.map((u) => ({ label: u.name, value: String(u.id) })),
  ];

  const filteredTrucks = useMemo(() => {
    const term = search.toLowerCase();
    if (!term) return trucks;
    return trucks.filter(
      (t) =>
        t.plates?.toLowerCase().includes(term) ||
        t.brand?.toLowerCase().includes(term)
    );
  }, [trucks, search]);

  const groups = useMemo(() => {
    const map = {};
    filteredTrucks.forEach((truck) => {
      const key = truck.current_unit ? String(truck.current_unit.id) : UNGROUPED_KEY;
      const label = truck.current_unit ? truck.current_unit.name : "Без колони";
      if (!map[key]) map[key] = { label, trucks: [] };
      map[key].trucks.push(truck);
    });
    const ordered = Object.entries(map).sort(([a], [b]) => {
      if (a === UNGROUPED_KEY) return 1;
      if (b === UNGROUPED_KEY) return -1;
      return map[a].label.localeCompare(map[b].label);
    });
    return ordered;
  }, [filteredTrucks]);

  const toggleGroup = (key) => {
    setCollapsedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCheckBoxChange = (truckID) => {
    setSelectedTrucks((prev) =>
      prev.includes(truckID)
        ? prev.filter((id) => id !== truckID)
        : [...prev, truckID]
    );
  };

  const handleRowDoubleClick = (e, truck) => {
    e.stopPropagation();
    dispatch(setEditModeTruck(true));
    dispatch(setShowTruckModal(true));
    dispatch(setSelectedTruck(truck));
  };

  const handleAssignMode = () => {
    if (selectedTrucks.length !== 1) return;
    const truck = trucks.find((t) => t.id === selectedTrucks[0]);
    dispatch(setSelectedTruck(truck.id));
    setSelectedTrailer(truck.trailer || null);
    setSelectedDriver(truck.driver_details?.full_name || null);
    setSelectedLogist(truck.logist_details ? truck.logist || null : null);
    setAssignMode(true);
  };

  const handleSaveAssignment = () => {
    const updatedData = {
      id: selectedTruck,
      trailer: selectedTrailer,
      driver: selectedDriver,
      logist: selectedLogist,
    };
    dispatch(updateTruckTrailerAndDriver(updatedData));
    setAssignMode(false);
    setSelectedTrucks([]);
    setSelectedTrailer(null);
    setSelectedDriver(null);
    setSelectedLogist(null);
  };

  const handleCancelAssignment = () => {
    setAssignMode(false);
    setSelectedTrailer(null);
    setSelectedDriver(null);
    setSelectedLogist(null);
  };

  const handleBulkApply = async () => {
    const dispatches = [];
    for (const truckId of selectedTrucks) {
      if (bulkUnit !== "") {
        const unit_id = bulkUnit === "__clear__" ? null : Number(bulkUnit);
        dispatches.push(dispatch(assignTruckUnit({ truck_id: truckId, unit_id })));
      }
      if (bulkLogist !== "") {
        const logist = bulkLogist === "__clear__" ? null : bulkLogist;
        dispatches.push(dispatch(updateTruckTrailerAndDriver({ id: truckId, logist })));
      }
    }
    await Promise.all(dispatches);
    dispatch(listTrucks());
    setBulkAssignMode(false);
    setBulkUnit("");
    setBulkLogist("");
    setSelectedTrucks([]);
  };

  const handleBulkCancel = () => {
    setBulkAssignMode(false);
    setBulkUnit("");
    setBulkLogist("");
  };

  const handleAddTruckButton = () => {
    dispatch(setEditModeTruck(false));
    dispatch(setShowAddTruckModal(true));
  };

  const handleEditSelected = () => {
    const truck = trucks.find((t) => t.id === selectedTrucks[0]);
    if (!truck) return;
    dispatch(setEditModeTruck(true));
    dispatch(setShowTruckModal(true));
    dispatch(setSelectedTruck(truck));
  };

  const handleDeleteSelectedTrucks = () => {
    if (selectedTrucks.length === 0) {
      window.alert("Виберіть автомобіль для видалення");
      return;
    }
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this truck?"
    );
    if (!confirmDelete) return;

    try {
      for (let truckID of selectedTrucks) {
        dispatch(deleteTruck(truckID));
      }
      setSelectedTrucks([]);
      dispatch(listTrucks());
    } catch (error) {
      console.error("Error deleting trucks:", error.message);
    }
  };


  let globalIndex = 0;

  return (
    <>
      <TruckModalComponent selectedTruck={selectedTruck} />
      <AddTruckModalComponent />
      <div className="fleet-panel">
        {/* ── Action toolbar ── */}
        <div className="fleet-toolbar">
          <div className="fleet-toolbar__search">
            <SearchComponent
              search={search}
              setSearch={setSearch}
              placeholder="пошук авто"
            />
          </div>

          <div className="fleet-toolbar__sep" />

          <div className="fleet-toolbar__group">
            <button
              className="fleet-toolbar__btn fleet-toolbar__btn--add"
              title="Додати автомобіль"
              onClick={handleAddTruckButton}
              type="button"
            >
              <FaPlus />
            </button>
            {["admin", "client_admin", "system_admin"].includes(userInfo?.role) && (
              <button
                className="fleet-toolbar__btn fleet-toolbar__btn--delete"
                title="Видалити вибрані"
                onClick={handleDeleteSelectedTrucks}
                type="button"
              >
                <FaRegTrashAlt />
              </button>
            )}
          </div>

          <div className="fleet-toolbar__sep" />

          <div className="fleet-toolbar__group">
            <button
              className="fleet-toolbar__btn fleet-toolbar__btn--edit"
              title="Редагувати автомобіль"
              onClick={handleEditSelected}
              disabled={selectedTrucks.length !== 1}
              type="button"
            >
              <FaPencilAlt />
            </button>
            {!assignMode ? (
              <button
                className="fleet-toolbar__btn fleet-toolbar__btn--assign"
                title="Прив'язати водія, причіп, логіста"
                onClick={handleAssignMode}
                disabled={selectedTrucks.length !== 1}
                type="button"
              >
                <FaLink />
              </button>
            ) : (
              <>
                <button
                  className="fleet-toolbar__btn fleet-toolbar__btn--save"
                  title="Зберегти прив'язку"
                  onClick={handleSaveAssignment}
                  type="button"
                >
                  <FaSave />
                </button>
                <button
                  className="fleet-toolbar__btn fleet-toolbar__btn--cancel"
                  title="Скасувати"
                  onClick={handleCancelAssignment}
                  type="button"
                >
                  <FaTimes />
                </button>
              </>
            )}
            {!assignMode && !bulkAssignMode && selectedTrucks.length >= 2 && (
              <button
                className="fleet-toolbar__btn fleet-toolbar__btn--bulk"
                title="Масове призначення колони та логіста"
                onClick={() => setBulkAssignMode(true)}
                type="button"
              >
                <FaLayerGroup />
              </button>
            )}
          </div>

          <div className="fleet-toolbar__sep" />

          <div className="fleet-toolbar__group">
            <button
              className="fleet-toolbar__btn fleet-toolbar__btn--sovtes"
              title="Синхронізація зі Sovtes"
              onClick={() => dispatch(setShowSovtesSyncModal({ show: true, tab: "trucks" }))}
              type="button"
            >
              <FaSync />
            </button>
          </div>

          {selectedTrucks.length > 0 && (
            <span className="fleet-toolbar__badge">
              {selectedTrucks.length} обрано
            </span>
          )}
        </div>

        {bulkAssignMode && (
          <div className="bulk-assign-bar">
            <span className="bulk-assign-bar__title">
              Вибрано: {selectedTrucks.length} тягачів
            </span>
            <div className="bulk-assign-bar__fields">
              <div className="bulk-assign-bar__field">
                <label className="bulk-assign-bar__label">Колона</label>
                <SelectComponent
                  options={[{ label: "Не змінювати", value: "" }, ...unitOptions]}
                  value={bulkUnit}
                  onChange={(e) => setBulkUnit(e.target.value)}
                  placeholder="Не змінювати"
                />
              </div>
              <div className="bulk-assign-bar__field">
                <label className="bulk-assign-bar__label">Логіст</label>
                <SelectComponent
                  options={[
                    { label: "Не змінювати", value: "" },
                    { label: "Без логіста", value: "__clear__" },
                    ...logistOptions,
                  ]}
                  value={bulkLogist}
                  onChange={(e) => setBulkLogist(e.target.value)}
                  placeholder="Не змінювати"
                />
              </div>
            </div>
            <div className="bulk-assign-bar__actions">
              <button
                className="fleet-toolbar__btn fleet-toolbar__btn--save"
                title="Застосувати"
                onClick={handleBulkApply}
                disabled={bulkUnit === "" && bulkLogist === ""}
                type="button"
              >
                <FaSave />
              </button>
              <button
                className="fleet-toolbar__btn fleet-toolbar__btn--cancel"
                title="Скасувати"
                onClick={handleBulkCancel}
                type="button"
              >
                <FaTimes />
              </button>
            </div>
          </div>
        )}

        <div className="fleet-panel__table-card">
          <div className="table-container fleet-panel__table-wrap">
            <table className="trucks-table">
              <thead className="trucks-table__header">
                <tr className="trucks-table__head-row">
                  <th className="trucks-table__head-th">ID</th>
                  <th className="trucks-table__head-th">Марка</th>
                  <th className="trucks-table__head-th">Номер авто</th>
                  <th className="trucks-table__head-th">Причіп</th>
                  <th className="trucks-table__head-th">Водій</th>
                  <th className="trucks-table__head-th">Логіст</th>
                  <th className="trucks-table__head-th">Колона</th>
                  <th className="trucks-table__head-th">Рік випуску</th>
                  <th className="trucks-table__head-th">VIN</th>
                  <th className="trucks-table__head-th">GPS ID</th>
                  <th className="trucks-table__head-th">Джерело</th>
                  <th className="trucks-table__head-th"></th>
                </tr>
              </thead>
              <tbody className="trucks-table__body">
                {groups.map(([groupKey, { label, trucks: groupTrucks }]) => {
                  const isCollapsed = !!collapsedGroups[groupKey];
                  return [
                    <tr
                      key={`group-${groupKey}`}
                      className="trucks-table__group-row"
                      onClick={() => toggleGroup(groupKey)}
                    >
                      <td
                        className="trucks-table__group-cell"
                        colSpan={12}
                      >
                        <span className="trucks-table__group-icon">
                          {isCollapsed ? <FaChevronRight /> : <FaChevronDown />}
                        </span>
                        <span className="trucks-table__group-label">{label}</span>
                        <span className="trucks-table__group-count">
                          {groupTrucks.length}
                        </span>
                      </td>
                    </tr>,
                    ...(!isCollapsed
                      ? groupTrucks.map((truck) => {
                          const rowNum = ++globalIndex;
                          return (
                            <tr
                              key={truck.id}
                              className={cn("trucks-table__body-row", {
                                "trucks-table__body-row_active":
                                  selectedTrucks.includes(truck.id),
                              })}
                              onDoubleClick={(e) => handleRowDoubleClick(e, truck)}
                            >
                              <td className="trucks-table__body-td">{rowNum}</td>
                              <td className="trucks-table__body-td">
                                {truck.brand} {truck.model}
                              </td>
                              <td className="trucks-table__body-td">{truck.plates}</td>
                              <td className="trucks-table__body-td">
                                {assignMode && truck.id === selectedTruck ? (
                                  <SelectComponent
                                    options={[
                                      { label: "Без причіпу", value: "" },
                                      ...trailerOptions,
                                    ]}
                                    placeholder="Виберіть причіп"
                                    title="Виберіть причіп"
                                    value={selectedTrailer || ""}
                                    onChange={(e) => setSelectedTrailer(e.target.value)}
                                  />
                                ) : (
                                  truck.trailer
                                )}
                              </td>
                              <td className="trucks-table__body-td">
                                {assignMode && truck.id === selectedTruck ? (
                                  <SelectComponent
                                    options={[
                                      { label: "Без водія", value: "" },
                                      ...driverOptions,
                                    ]}
                                    placeholder="Виберіть водія"
                                    title="Виберіть водія"
                                    value={selectedDriver || ""}
                                    onChange={(e) => setSelectedDriver(e.target.value)}
                                  />
                                ) : (
                                  truck.driver_details?.full_name
                                )}
                              </td>
                              <td className="trucks-table__body-td">
                                {assignMode && truck.id === selectedTruck ? (
                                  <SelectComponent
                                    options={[
                                      { label: "Без логіста", value: "" },
                                      ...logistOptions,
                                    ]}
                                    placeholder="Виберіть логіста"
                                    title="Виберіть логіста"
                                    value={selectedLogist || ""}
                                    onChange={(e) =>
                                      setSelectedLogist(e.target.value || null)
                                    }
                                  />
                                ) : truck.logist_details ? (
                                  <span className="trucks-table__logist-badge">
                                    {truck.logist_details.full_name ||
                                      truck.logist_details.username}
                                  </span>
                                ) : (
                                  <span className="trucks-table__unit-empty">—</span>
                                )}
                              </td>
                              <td className="trucks-table__body-td">
                                {truck.current_unit ? (
                                  <span className="trucks-table__unit-badge">
                                    {truck.current_unit.name}
                                  </span>
                                ) : (
                                  <span className="trucks-table__unit-empty">—</span>
                                )}
                              </td>
                              <td className="trucks-table__body-td">{truck.year}</td>
                              <td className="trucks-table__body-td">{truck.vin_code}</td>
                              <td className="trucks-table__body-td">
                                {truck.gps_id ? (
                                  <FaCheck style={{ color: "green" }} />
                                ) : (
                                  <FaCheck style={{ color: "red" }} />
                                )}
                              </td>
                              <td className="trucks-table__body-td">
                                <SyncBadge sovtesId={truck.sovtes_id} />
                              </td>
                              <td className="trucks-table__body-td">
                                <input
                                  type="checkbox"
                                  className="trucks-table__checkbox"
                                  checked={selectedTrucks.includes(truck.id)}
                                  onChange={() => handleCheckBoxChange(truck.id)}
                                />
                              </td>
                            </tr>
                          );
                        })
                      : []),
                  ];
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

export default TrucksTableComponent;
