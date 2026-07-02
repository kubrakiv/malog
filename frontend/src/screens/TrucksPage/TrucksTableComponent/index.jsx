import { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useConfirm } from "../../../globalComponents/ConfirmModal/useConfirm";
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
  FaSort,
  FaSync,
  FaTimes,
} from "react-icons/fa";
import cn from "classnames";
import axios from "axios";
import toast from "react-hot-toast";

import { transformSelectOptions } from "../../../utils/transformers";
import SelectComponent from "../../../globalComponents/SelectComponent";
import MultiSelectDropdown from "../../../globalComponents/MultiSelectDropdown";
import SearchableSelect from "../../../globalComponents/SearchableSelect";
import SearchComponent from "../../../globalComponents/SearchComponent";
import TruckModalComponent from "../TruckModalComponent";
import AddTruckModalComponent from "../AddTruckModalComponent";

import {
  deleteTruck,
  listTrucks,
  reorderTrucks,
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
const ORDER_ALLOWED_ROLES = new Set(["logist", "client_admin"]);

const TrucksTableComponent = ({ trucks, trailers, drivers }) => {
  const dispatch = useDispatch();
  const confirm = useConfirm();
  const selectedTruck = useSelector(selectSelectedTruck);
  const userInfo = useSelector((state) => state.userLogin.userInfo);
  const canManageTruckOrder = ORDER_ALLOWED_ROLES.has(userInfo?.role);

  const trailerOptions = transformSelectOptions(trailers, "plates");
  const driverOptions = transformSelectOptions(drivers, "full_name");

  const units = useSelector((state) => state.truckUnitsInfo.units);

  const [search, setSearch] = useState("");
  const [selectedTrucks, setSelectedTrucks] = useState([]);
  const [assignMode, setAssignMode] = useState(false);
  const [selectedTrailer, setSelectedTrailer] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [selectedLogists, setSelectedLogists] = useState([]);
  const [logists, setLogists] = useState([]);
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const [bulkAssignMode, setBulkAssignMode] = useState(false);
  const [bulkUnit, setBulkUnit] = useState("");
  const [bulkLogists, setBulkLogists] = useState([]);
  const [isOrderMode, setIsOrderMode] = useState(false);
  const [pendingGroupOrder, setPendingGroupOrder] = useState({});
  const [draggingTruckId, setDraggingTruckId] = useState(null);

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

  const orderedTrucks = useMemo(() => {
    return [...trucks].sort((a, b) => {
      const aOrder = Number.isInteger(a.manual_order)
        ? a.manual_order
        : Number.MAX_SAFE_INTEGER;
      const bOrder = Number.isInteger(b.manual_order)
        ? b.manual_order
        : Number.MAX_SAFE_INTEGER;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return a.id - b.id;
    });
  }, [trucks]);

  const filteredTrucks = useMemo(() => {
    const term = search.toLowerCase();
    if (!term) return orderedTrucks;
    return orderedTrucks.filter(
      (t) =>
        t.plates?.toLowerCase().includes(term) ||
        t.brand?.toLowerCase().includes(term),
    );
  }, [orderedTrucks, search]);

  const groups = useMemo(() => {
    const map = {};
    filteredTrucks.forEach((truck) => {
      const key = truck.current_unit
        ? String(truck.current_unit.id)
        : UNGROUPED_KEY;
      const label = truck.current_unit ? truck.current_unit.name : "Без колони";
      if (!map[key]) map[key] = { label, trucks: [] };
      map[key].trucks.push(truck);
    });

    const sortByManualOrder = (a, b) => {
      const aOrder = Number.isInteger(a.manual_order)
        ? a.manual_order
        : Number.MAX_SAFE_INTEGER;
      const bOrder = Number.isInteger(b.manual_order)
        ? b.manual_order
        : Number.MAX_SAFE_INTEGER;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return a.id - b.id;
    };

    Object.entries(map).forEach(([key, group]) => {
      const pending = pendingGroupOrder[key];
      if (isOrderMode && Array.isArray(pending) && pending.length > 0) {
        const position = new Map(pending.map((id, index) => [id, index]));
        group.trucks.sort((a, b) => {
          const aPos = position.has(a.id)
            ? position.get(a.id)
            : Number.MAX_SAFE_INTEGER;
          const bPos = position.has(b.id)
            ? position.get(b.id)
            : Number.MAX_SAFE_INTEGER;
          if (aPos !== bPos) return aPos - bPos;
          return sortByManualOrder(a, b);
        });
      } else {
        group.trucks.sort(sortByManualOrder);
      }
    });

    const ordered = Object.entries(map).sort(([a], [b]) => {
      if (a === UNGROUPED_KEY) return 1;
      if (b === UNGROUPED_KEY) return -1;
      return map[a].label.localeCompare(map[b].label);
    });
    return ordered;
  }, [filteredTrucks, isOrderMode, pendingGroupOrder]);

  const toggleGroup = (key) => {
    setCollapsedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCheckBoxChange = (truckID) => {
    setSelectedTrucks((prev) =>
      prev.includes(truckID)
        ? prev.filter((id) => id !== truckID)
        : [...prev, truckID],
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
    setSelectedLogists(
      Array.isArray(truck.logist) ? truck.logist.map(String) : [],
    );
    setAssignMode(true);
  };

  const handleSaveAssignment = () => {
    const updatedData = {
      id: selectedTruck,
      trailer: selectedTrailer,
      driver: selectedDriver,
      logist: selectedLogists,
    };
    dispatch(updateTruckTrailerAndDriver(updatedData));
    setAssignMode(false);
    setSelectedTrucks([]);
    setSelectedTrailer(null);
    setSelectedDriver(null);
    setSelectedLogists([]);
  };

  const handleCancelAssignment = () => {
    setAssignMode(false);
    setSelectedTrailer(null);
    setSelectedDriver(null);
    setSelectedLogists([]);
  };

  const handleBulkApply = async () => {
    const dispatches = [];
    for (const truckId of selectedTrucks) {
      if (bulkUnit !== "") {
        const unit_id = bulkUnit === "__clear__" ? null : Number(bulkUnit);
        dispatches.push(
          dispatch(assignTruckUnit({ truck_id: truckId, unit_id })),
        );
      }
      if (bulkLogists.length > 0) {
        dispatches.push(
          dispatch(
            updateTruckTrailerAndDriver({ id: truckId, logist: bulkLogists }),
          ),
        );
      }
    }
    await Promise.all(dispatches);
    dispatch(listTrucks());
    setBulkAssignMode(false);
    setBulkUnit("");
    setBulkLogists([]);
    setSelectedTrucks([]);
  };

  const handleBulkCancel = () => {
    setBulkAssignMode(false);
    setBulkUnit("");
    setBulkLogists([]);
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

  const handleDeleteSelectedTrucks = async () => {
    if (selectedTrucks.length === 0) {
      window.alert("Виберіть автомобіль для видалення");
      return;
    }
    const confirmDelete = await confirm(
      "Are you sure you want to delete this truck?",
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

  const handleStartOrderMode = () => {
    if (assignMode || bulkAssignMode) {
      toast.error("Завершіть поточне редагування перед сортуванням");
      return;
    }
    if (search.trim()) {
      toast.error("Очистіть пошук перед зміною порядку");
      return;
    }

    const snapshot = {};
    groups.forEach(([groupKey, group]) => {
      snapshot[groupKey] = group.trucks.map((truck) => truck.id);
    });
    setPendingGroupOrder(snapshot);
    setSelectedTrucks([]);
    setIsOrderMode(true);
  };

  const handleCancelOrderMode = () => {
    setIsOrderMode(false);
    setPendingGroupOrder({});
    setDraggingTruckId(null);
  };

  const handleSaveOrderMode = async () => {
    const entries = Object.entries(pendingGroupOrder);
    if (entries.length === 0) {
      handleCancelOrderMode();
      return;
    }

    try {
      for (const [groupKey, ids] of entries) {
        if (!Array.isArray(ids) || ids.length === 0) continue;
        await dispatch(
          reorderTrucks({
            orderedTruckIds: ids,
            unitId: groupKey === UNGROUPED_KEY ? null : Number(groupKey),
          }),
        ).unwrap();
      }
      toast.success("Порядок тягачів збережено");
      setIsOrderMode(false);
      setPendingGroupOrder({});
      setDraggingTruckId(null);
      dispatch(listTrucks());
    } catch (error) {
      toast.error(error?.error || "Не вдалося зберегти порядок");
    }
  };

  const handleRowDragStart = (event, groupKey, truckId) => {
    if (!isOrderMode) return;
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData(
      "text/plain",
      JSON.stringify({ groupKey, truckId }),
    );
    setDraggingTruckId(truckId);
  };

  const handleRowDragOver = (event) => {
    if (!isOrderMode) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  };

  const handleRowDrop = (event, groupKey, targetTruckId) => {
    if (!isOrderMode) return;
    event.preventDefault();

    let payload;
    try {
      payload = JSON.parse(event.dataTransfer.getData("text/plain"));
    } catch (_) {
      payload = null;
    }

    const sourceTruckId = payload?.truckId;
    const sourceGroupKey = payload?.groupKey;
    if (!sourceTruckId || String(sourceGroupKey) !== String(groupKey)) return;
    if (sourceTruckId === targetTruckId) return;

    const current = pendingGroupOrder[groupKey] || [];
    const fromIndex = current.indexOf(sourceTruckId);
    const toIndex = current.indexOf(targetTruckId);
    if (fromIndex < 0 || toIndex < 0) return;

    const next = [...current];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    setPendingGroupOrder((prev) => ({ ...prev, [groupKey]: next }));
  };

  const handleRowDragEnd = () => {
    setDraggingTruckId(null);
  };

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
            {["admin", "client_admin", "system_admin"].includes(
              userInfo?.role,
            ) && (
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
            {!isOrderMode ? (
              <button
                className="fleet-toolbar__btn fleet-toolbar__btn--reorder"
                title="Увімкнути ручне сортування в межах колони"
                onClick={handleStartOrderMode}
                disabled={!canManageTruckOrder}
                type="button"
              >
                <FaSort />
              </button>
            ) : (
              <>
                <button
                  className="fleet-toolbar__btn fleet-toolbar__btn--save"
                  title="Зберегти порядок"
                  onClick={handleSaveOrderMode}
                  type="button"
                >
                  <FaSave />
                </button>
                <button
                  className="fleet-toolbar__btn fleet-toolbar__btn--cancel"
                  title="Скасувати сортування"
                  onClick={handleCancelOrderMode}
                  type="button"
                >
                  <FaTimes />
                </button>
              </>
            )}
            <button
              className="fleet-toolbar__btn fleet-toolbar__btn--edit"
              title="Редагувати автомобіль"
              onClick={handleEditSelected}
              disabled={selectedTrucks.length !== 1 || isOrderMode}
              type="button"
            >
              <FaPencilAlt />
            </button>
            {!assignMode ? (
              <button
                className="fleet-toolbar__btn fleet-toolbar__btn--assign"
                title="Прив'язати водія, причіп, логіста"
                onClick={handleAssignMode}
                disabled={selectedTrucks.length !== 1 || isOrderMode}
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
            {!assignMode &&
              !bulkAssignMode &&
              selectedTrucks.length >= 2 &&
              !isOrderMode && (
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
              onClick={() =>
                dispatch(setShowSovtesSyncModal({ show: true, tab: "trucks" }))
              }
              disabled={isOrderMode}
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
                  options={[
                    { label: "Не змінювати", value: "" },
                    ...unitOptions,
                  ]}
                  value={bulkUnit}
                  onChange={(e) => setBulkUnit(e.target.value)}
                  placeholder="Не змінювати"
                />
              </div>
              <div className="bulk-assign-bar__field">
                <label className="bulk-assign-bar__label">Логіст</label>
                <MultiSelectDropdown
                  options={logistOptions}
                  value={bulkLogists}
                  onChange={setBulkLogists}
                  placeholder="Виберіть логістів"
                />
              </div>
            </div>
            <div className="bulk-assign-bar__actions">
              <button
                className="fleet-toolbar__btn fleet-toolbar__btn--save"
                title="Застосувати"
                onClick={handleBulkApply}
                disabled={bulkUnit === "" && bulkLogists.length === 0}
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
                  <th className="trucks-table__head-th">Рік випуску</th>
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
                      <td className="trucks-table__group-cell" colSpan={10}>
                        <span className="trucks-table__group-icon">
                          {isCollapsed ? <FaChevronRight /> : <FaChevronDown />}
                        </span>
                        <span className="trucks-table__group-label">
                          {label}
                        </span>
                        <span className="trucks-table__group-count">
                          {groupTrucks.length}
                        </span>
                      </td>
                    </tr>,
                    ...(!isCollapsed
                      ? groupTrucks.map((truck, index) => {
                          const rowNum = index + 1;
                          return (
                            <tr
                              key={truck.id}
                              className={cn("trucks-table__body-row", {
                                "trucks-table__body-row_alt": index % 2 === 1,
                                "trucks-table__body-row_active":
                                  selectedTrucks.includes(truck.id),
                                "trucks-table__body-row_dragging":
                                  isOrderMode && draggingTruckId === truck.id,
                                "trucks-table__body-row_order-mode":
                                  isOrderMode,
                              })}
                              onDoubleClick={(e) => {
                                if (!isOrderMode)
                                  handleRowDoubleClick(e, truck);
                              }}
                              draggable={isOrderMode}
                              onDragStart={(event) =>
                                handleRowDragStart(event, groupKey, truck.id)
                              }
                              onDragOver={handleRowDragOver}
                              onDrop={(event) =>
                                handleRowDrop(event, groupKey, truck.id)
                              }
                              onDragEnd={handleRowDragEnd}
                            >
                              <td className="trucks-table__body-td">
                                {rowNum}
                              </td>
                              <td className="trucks-table__body-td">
                                {truck.brand} {truck.model}
                              </td>
                              <td className="trucks-table__body-td">
                                {truck.plates}
                              </td>
                              <td className="trucks-table__body-td">
                                {assignMode && truck.id === selectedTruck ? (
                                  <SearchableSelect
                                    options={trailerOptions}
                                    value={selectedTrailer || ""}
                                    onChange={setSelectedTrailer}
                                    menuPlacement="auto"
                                    maxMenuHeight={260}
                                    placeholder="Виберіть причіп"
                                    clearLabel="Без причіпу"
                                  />
                                ) : (
                                  truck.trailer
                                )}
                              </td>
                              <td className="trucks-table__body-td">
                                {assignMode && truck.id === selectedTruck ? (
                                  <SearchableSelect
                                    options={driverOptions}
                                    value={selectedDriver || ""}
                                    onChange={setSelectedDriver}
                                    menuPlacement="auto"
                                    maxMenuHeight={260}
                                    placeholder="Виберіть водія"
                                    clearLabel="Без водія"
                                  />
                                ) : (
                                  truck.driver_details?.full_name
                                )}
                              </td>
                              <td className="trucks-table__body-td">
                                {assignMode && truck.id === selectedTruck ? (
                                  <MultiSelectDropdown
                                    options={logistOptions}
                                    value={selectedLogists}
                                    onChange={setSelectedLogists}
                                    placeholder="Виберіть логіста"
                                  />
                                ) : truck.logist_details?.length > 0 ? (
                                  <div className="trucks-table__logist-list">
                                    {truck.logist_details.map((l) => (
                                      <span
                                        key={l.profile}
                                        className="trucks-table__logist-badge"
                                      >
                                        {l.full_name || l.username}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="trucks-table__unit-empty">
                                    —
                                  </span>
                                )}
                              </td>
                              <td className="trucks-table__body-td">
                                {truck.year}
                              </td>
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
                                  disabled={isOrderMode}
                                  onChange={() =>
                                    handleCheckBoxChange(truck.id)
                                  }
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
