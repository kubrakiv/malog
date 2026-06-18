import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import cn from "classnames";
import { FaLink, FaSync, FaSearch, FaTimes, FaLayerGroup, FaChevronDown, FaHistory } from "react-icons/fa";

import {
  createTruck,
  updateTruck,
} from "../../../features/trucks/trucksOperations";

import {
  setEditModeTruck,
  setSelectedTruck,
} from "../../../features/trucks/trucksSlice";

import {
  fetchSovtesTrucks,
  resyncSovtesTruck,
  linkSovtesTruck,
} from "../../../features/sovtesFleet/sovtesFleetOperations";
import { listTrucks } from "../../../features/trucks/trucksOperations";
import {
  listTruckUnits,
  assignTruckUnit,
  getTruckUnitHistory,
} from "../../../features/truckUnits/truckUnitsOperations";

import { TRUCK_CONSTANTS } from "../../../constants/global";
import { formFields } from "./truckFormFields.jsx";
import { formatDateForInput } from "../../../utils/formatDate";

import ManageTruckFooterComponent from "../ManageTruckFooterComponent";
import InputComponent from "../../../globalComponents/InputComponent";

import "./style.scss";

const _extractStr = (val) => {
  if (val == null) return "";
  if (typeof val === "object")
    return val.title_ru || val.title || val.name || String(val.id ?? "");
  return String(val);
};

const _getPlates = (v) =>
  _extractStr(v.number || v.carNumber || v.govNumber || v.plates) || "—";

const _getBrand = (v) =>
  _extractStr(v.make || v.brandTitle || v.brand) || "";

const _normalizePlate = (p) =>
  String(p || "").replace(/[\s-]/g, "").toUpperCase();

// Inline Sovtes section rendered inside the edit modal
const SovtesSection = ({ truck, onResyncSuccess }) => {
  const dispatch = useDispatch();
  const sovtesTrucks = useSelector((s) => s.sovtesFleetInfo?.trucks || []);
  const syncingIds = useSelector((s) => s.sovtesFleetInfo?.syncingIds || []);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [chosenSovtesId, setChosenSovtesId] = useState(null);
  const [fetchedOnce, setFetchedOnce] = useState(false);

  const isLinked = Boolean(truck.sovtes_id);
  const isSyncing = syncingIds.includes(String(truck.sovtes_id));

  // Once trucks load from Sovtes, auto-select the plate match if nothing is chosen yet
  useEffect(() => {
    if (!pickerOpen || chosenSovtesId) return;
    const unsynced = sovtesTrucks.filter((t) => !t.already_synced);
    const match = findPlateMatch(unsynced);
    if (match) setChosenSovtesId(match.id);
  }, [sovtesTrucks, pickerOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const findPlateMatch = (list) => {
    const localPlate = _normalizePlate(truck.plates);
    if (!localPlate) return null;
    return list.find(
      (t) => _normalizePlate(_getPlates(t)) === localPlate
    ) || null;
  };

  const openPicker = () => {
    const unsynced = sovtesTrucks.filter((t) => !t.already_synced);
    const match = findPlateMatch(unsynced);
    if (match) setChosenSovtesId(match.id);
    else setChosenSovtesId(null);

    if (!fetchedOnce) {
      dispatch(fetchSovtesTrucks());
      setFetchedOnce(true);
    }
    setPickerOpen(true);
    setQuery("");
  };

  const handleResync = async () => {
    // Find the Sovtes vehicle by sovtes_id in the fetched list,
    // or build a minimal object the backend can use (just needs id).
    const sovtesVehicle = sovtesTrucks.find(
      (t) => String(t.id) === String(truck.sovtes_id)
    ) || { id: truck.sovtes_id };

    const result = await dispatch(resyncSovtesTruck(sovtesVehicle));
    if (resyncSovtesTruck.fulfilled.match(result)) {
      onResyncSuccess(result.payload);
      dispatch(listTrucks());
    }
  };

  const handleLinkConfirm = async () => {
    if (!chosenSovtesId) return;
    const sovtesVehicle = sovtesTrucks.find(
      (t) => String(t.id) === String(chosenSovtesId)
    );
    if (!sovtesVehicle) return;

    const result = await dispatch(
      linkSovtesTruck({ ...sovtesVehicle, local_truck_id: truck.id })
    );
    if (linkSovtesTruck.fulfilled.match(result)) {
      onResyncSuccess(result.payload);
      dispatch(listTrucks());
      setPickerOpen(false);
    }
  };

  const unsyncedSovtes = sovtesTrucks.filter((t) => !t.already_synced);

  const localPlateNorm = _normalizePlate(truck.plates);
  const isPlateMatch = (t) =>
    localPlateNorm && _normalizePlate(_getPlates(t)) === localPlateNorm;

  const filtered = unsyncedSovtes
    .filter((t) => {
      if (!query) return true;
      const q = query.toLowerCase();
      return (
        _getPlates(t).toLowerCase().includes(q) ||
        _getBrand(t).toLowerCase().includes(q) ||
        _extractStr(t.model).toLowerCase().includes(q)
      );
    })
    // Plate matches bubble to top
    .sort((a, b) => (isPlateMatch(b) ? 1 : 0) - (isPlateMatch(a) ? 1 : 0));

  return (
    <div className="truck-sovtes-section">
      {isLinked ? (
        <div className="truck-sovtes-section__linked">
          <span className="truck-sovtes-section__badge">
            <FaSync />
            Sovtes&nbsp;
            <span className="truck-sovtes-section__badge-id">
              #{truck.sovtes_id}
            </span>
          </span>
          <button
            type="button"
            className="truck-sovtes-section__resync-btn"
            onClick={handleResync}
            disabled={isSyncing}
            title="Оновити дані з Sovtes"
          >
            {isSyncing
              ? <FaSync className="truck-sovtes-section__spinner" />
              : <FaSync />}
            {isSyncing ? "Оновлення…" : "Оновити з Sovtes"}
          </button>
        </div>
      ) : (
        <div className="truck-sovtes-section__unlinked">
          {!pickerOpen ? (
            <button
              type="button"
              className="truck-sovtes-section__link-btn"
              onClick={openPicker}
            >
              <FaLink />
              Прив'язати до Sovtes
            </button>
          ) : (
            <div className="truck-sovtes-section__picker">
              <div className="truck-sovtes-section__picker-header">
                <span>Оберіть тягач зі Sovtes</span>
                <button
                  type="button"
                  className="truck-sovtes-section__picker-close"
                  onClick={() => setPickerOpen(false)}
                  aria-label="Закрити"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="truck-sovtes-section__picker-search">
                <FaSearch className="truck-sovtes-section__search-icon" />
                <input
                  type="text"
                  placeholder="Пошук за номером, маркою…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="truck-sovtes-section__search-input"
                  autoFocus
                />
              </div>

              <div className="truck-sovtes-section__picker-list">
                {filtered.length === 0 && (
                  <p className="truck-sovtes-section__picker-empty">
                    {unsyncedSovtes.length === 0
                      ? "Немає доступних тягачів у Sovtes"
                      : "Нічого не знайдено"}
                  </p>
                )}
                {filtered.map((t) => {
                  const matched = isPlateMatch(t);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      className={cn(
                        "truck-sovtes-section__picker-option",
                        chosenSovtesId === t.id && "truck-sovtes-section__picker-option--selected",
                        matched && "truck-sovtes-section__picker-option--match"
                      )}
                      onClick={() => setChosenSovtesId(t.id)}
                    >
                      <span className="truck-sovtes-section__picker-plates-row">
                        <span className="truck-sovtes-section__picker-plates">
                          {_getPlates(t)}
                        </span>
                        {matched && (
                          <span className="truck-sovtes-section__picker-match-badge">
                            збіг за номером
                          </span>
                        )}
                      </span>
                      <span className="truck-sovtes-section__picker-meta">
                        {[_getBrand(t), _extractStr(t.model)]
                          .filter(Boolean)
                          .join(" ")}
                        {t.vin ? ` · ${t.vin}` : ""}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="truck-sovtes-section__picker-actions">
                <button
                  type="button"
                  className="truck-sovtes-section__picker-cancel"
                  onClick={() => setPickerOpen(false)}
                >
                  Скасувати
                </button>
                <button
                  type="button"
                  className="truck-sovtes-section__picker-confirm"
                  onClick={handleLinkConfirm}
                  disabled={!chosenSovtesId}
                >
                  <FaLink />
                  Прив'язати
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Unit (Колона) section ────────────────────────────────────────────────────

const UnitSection = ({ truck, onUnitChange }) => {
  const dispatch = useDispatch();
  const units = useSelector((s) => s.truckUnitsInfo?.units || []);
  const assigning = useSelector((s) => s.truckUnitsInfo?.assigning || false);
  const history = useSelector((s) => s.truckUnitsInfo?.history?.[truck.id] || []);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedUnitId, setSelectedUnitId] = useState(truck.current_unit?.id ?? null);

  useEffect(() => {
    if (!units.length) dispatch(listTruckUnits());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setSelectedUnitId(truck.current_unit?.id ?? null);
  }, [truck.id, truck.current_unit?.id]);

  const handleSave = async () => {
    const result = await dispatch(assignTruckUnit({ truck_id: truck.id, unit_id: selectedUnitId }));
    if (assignTruckUnit.fulfilled.match(result)) {
      dispatch(listTrucks());
      onUnitChange(selectedUnitId
        ? units.find((u) => u.id === selectedUnitId) || null
        : null
      );
      setPickerOpen(false);
    }
  };

  const handleOpenHistory = () => {
    dispatch(getTruckUnitHistory(truck.id));
    setHistoryOpen((v) => !v);
  };

  const formatDate = (iso) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("uk-UA", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const currentUnit = units.find((u) => u.id === truck.current_unit?.id);
  const isDirty = selectedUnitId !== (truck.current_unit?.id ?? null);

  return (
    <div className="truck-unit-section">
      <div className="truck-unit-section__row">
        <span className="truck-unit-section__label">
          <FaLayerGroup className="truck-unit-section__label-icon" />
          Колона
        </span>

        {!pickerOpen ? (
          <div className="truck-unit-section__current">
            {currentUnit ? (
              <span className="truck-unit-section__unit-badge">{currentUnit.name}</span>
            ) : (
              <span className="truck-unit-section__unit-empty">не призначено</span>
            )}
            <button
              type="button"
              className="truck-unit-section__change-btn"
              onClick={() => setPickerOpen(true)}
            >
              <FaChevronDown />
              Змінити
            </button>
            <button
              type="button"
              className="truck-unit-section__history-btn"
              onClick={handleOpenHistory}
              title="Історія переміщень"
            >
              <FaHistory />
            </button>
          </div>
        ) : (
          <div className="truck-unit-section__picker">
            <select
              className="truck-unit-section__select"
              value={selectedUnitId ?? ""}
              onChange={(e) => setSelectedUnitId(e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">— без колони —</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
            <div className="truck-unit-section__picker-actions">
              <button
                type="button"
                className="truck-unit-section__picker-cancel"
                onClick={() => { setPickerOpen(false); setSelectedUnitId(truck.current_unit?.id ?? null); }}
              >
                Скасувати
              </button>
              <button
                type="button"
                className="truck-unit-section__picker-save"
                onClick={handleSave}
                disabled={!isDirty || assigning}
              >
                {assigning ? <FaSync className="truck-unit-section__spinner" /> : null}
                {assigning ? "Збереження…" : "Зберегти"}
              </button>
            </div>
          </div>
        )}
      </div>

      {historyOpen && (
        <div className="truck-unit-section__history">
          {history.length === 0 ? (
            <p className="truck-unit-section__history-empty">Немає записів про переміщення</p>
          ) : (
            <table className="truck-unit-section__history-table">
              <thead>
                <tr>
                  <th>Колона</th>
                  <th>Початок</th>
                  <th>Кінець</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.id} className={h.is_active ? "truck-unit-section__history-row--active" : ""}>
                    <td>{h.unit_name}</td>
                    <td>{formatDate(h.start_date)}</td>
                    <td>{h.is_active ? <span className="truck-unit-section__history-now">зараз</span> : formatDate(h.end_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

const ManageTruckComponent = ({
  onCloseModal,
  onEditMode,
  initialTruckData = null,
  activeTab: propActiveTab,
  setActiveTab: propSetActiveTab,
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  // Local state for activeTab if not provided as prop
  const [localActiveTab, setLocalActiveTab] = useState("basic");

  // Use either props or local state
  const activeTab = propActiveTab || localActiveTab;
  const setActiveTab = propSetActiveTab || setLocalActiveTab;

  const [truckLimitCheck, setTruckLimitCheck] = useState({
    canAddTruck: true,
    currentTruckCount: 0,
    truckLimit: 0,
    planName: "",
    loading: true,
  });

  const [truckFields, setTruckFields] = useState(() => {
    if (initialTruckData?.id) {
      return { ...initialTruckData };
    }
    return Object.values(TRUCK_CONSTANTS).reduce((acc, item) => {
      acc[item] = "";
      return acc;
    }, {});
  });

  // Re-populate form when a different truck is selected (modal content stays mounted)
  useEffect(() => {
    if (initialTruckData?.id) {
      setTruckFields({ ...initialTruckData });
    }
  }, [initialTruckData?.id]);

  // Check truck limits when creating new truck
  useEffect(() => {
    if (!initialTruckData && userInfo?.token) {
      const checkTruckLimit = async () => {
        try {
          const config = {
            headers: {
              Authorization: `Bearer ${userInfo.token}`,
            },
          };
          const response = await axios.get(
            "/api/subscriptions/check-truck-limit/",
            config,
          );
          setTruckLimitCheck({
            canAddTruck: response.data.can_add_truck,
            currentTruckCount: response.data.current_truck_count,
            truckLimit: response.data.truck_limit,
            planName: response.data.plan,
            loading: false,
          });
        } catch (error) {
          console.error("Error checking truck limit:", error);
          setTruckLimitCheck((prev) => ({ ...prev, loading: false }));
        }
      };

      checkTruckLimit();
    } else {
      setTruckLimitCheck((prev) => ({ ...prev, loading: false }));
    }
  }, [initialTruckData, userInfo]);

  const handleTruckChange = (e) => {
    const { name, value } = e.target;
    setTruckFields((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();

    // Check truck limit for new truck creation
    if (!initialTruckData && !truckLimitCheck.canAddTruck) {
      navigate("/subscription-plans");
      return;
    }

    let data = {};
    Object.keys(truckFields).forEach((key) => {
      data[key] = truckFields[key];
    });

    if (initialTruckData) {
      dispatch(updateTruck(data));
      dispatch(setSelectedTruck(data));
      dispatch(setEditModeTruck(false));
    } else {
      dispatch(createTruck(data));
      onCloseModal();
    }
  };

  return (
    <>
      <form className="add-truck__form" onSubmit={(e) => handleFormSubmit(e)}>
        <div className="truck-card-container">
          <div className="truck-card-details">
            <div className="add-truck__content">
              <div className="add-truck__content-block">
                <h3 className="add-truck__title">
                  {initialTruckData
                    ? "Редагувати автомобіль"
                    : "Додати автомобіль"}
                </h3>

                {/* Sovtes link / resync */}
                {initialTruckData && (
                  <SovtesSection
                    truck={truckFields}
                    onResyncSuccess={(updated) =>
                      setTruckFields((prev) => ({ ...prev, ...updated }))
                    }
                  />
                )}

                {/* Колона (unit) assignment */}
                {initialTruckData && (
                  <UnitSection
                    truck={truckFields}
                    onUnitChange={(unit) =>
                      setTruckFields((prev) => ({ ...prev, current_unit: unit }))
                    }
                  />
                )}

                {/* Subscription limit warning */}
                {!initialTruckData && !truckLimitCheck.loading && (
                  <div
                    className={`subscription-info ${
                      !truckLimitCheck.canAddTruck
                        ? "subscription-limit-reached"
                        : ""
                    }`}
                  >
                    <div className="truck-count-info">
                      <strong>
                        Автомобілі: {truckLimitCheck.currentTruckCount} /{" "}
                        {truckLimitCheck.truckLimit === -1
                          ? "∞"
                          : truckLimitCheck.truckLimit}
                      </strong>
                      <span className="plan-name">
                        {truckLimitCheck.planName}
                      </span>
                    </div>
                    {/* Visual progress bar */}
                    {truckLimitCheck.truckLimit !== -1 && (
                      <div className="truck-limit-progress">
                        <div
                          className="truck-limit-progress-bar"
                          style={{
                            width: `${Math.min(
                              100,
                              (truckLimitCheck.currentTruckCount /
                                truckLimitCheck.truckLimit) *
                                100,
                            )}%`,
                            backgroundColor: truckLimitCheck.canAddTruck
                              ? "$sidebarcolor"
                              : "#dc3545",
                          }}
                        ></div>
                      </div>
                    )}
                    {!truckLimitCheck.canAddTruck && (
                      <div className="limit-warning">
                        <p>
                          Ви досягли обмеження в кількості автомобілів у
                          поточному плані
                        </p>
                        <button
                          type="button"
                          className="upgrade-link"
                          onClick={() => navigate("/subscription-plans")}
                        >
                          Upgrade Plan
                        </button>
                      </div>
                    )}
                  </div>
                )}
                <div className="truck-card-details__tabs">
                  <button
                    className={cn(
                      "truck-card-details__tab",
                      activeTab === "basic" && "active",
                    )}
                    type="button"
                    onClick={() => setActiveTab("basic")}
                  >
                    Базові параметри
                  </button>
                  <button
                    className={cn(
                      "truck-card-details__tab",
                      activeTab === "norms" && "active",
                    )}
                    type="button"
                    onClick={() => setActiveTab("norms")}
                  >
                    Норми
                  </button>
                </div>

                <div className="add-truck__content-row">
                  {formFields[activeTab]
                    ? formFields[activeTab].map((fields) => (
                        <div
                          className={cn(
                            "add-truck__content-row-block",
                            initialTruckData !== null &&
                              "add-truck__content-row-block_edit-mode",
                          )}
                          key={`fields-row-${fields[0].id}`}
                        >
                          {fields.map((field) => (
                            <div key={field.id}>
                              <InputComponent
                                label={field.title}
                                id={field.id}
                                type={field.type}
                                name={field.id}
                                title={field.title}
                                placeholder={field.placeholder}
                                icon={field.icon}
                                value={
                                  field.type !== "date"
                                    ? truckFields[field.id]
                                    : formatDateForInput(truckFields[field.id])
                                }
                                onChange={handleTruckChange}
                              />
                            </div>
                          ))}
                        </div>
                      ))
                    : // Fallback if activeTab isn't valid
                      formFields["basic"] &&
                      formFields["basic"].map((fields) => (
                        <div
                          className={cn(
                            "add-truck__content-row-block",
                            initialTruckData !== null &&
                              "add-truck__content-row-block_edit-mode",
                          )}
                          key={`fields-row-${fields[0].id}`}
                        >
                          {fields.map((field) => (
                            <div key={field.id}>
                              <InputComponent
                                label={field.title}
                                id={field.id}
                                type={field.type}
                                name={field.id}
                                title={field.title}
                                placeholder={field.placeholder}
                                value={
                                  field.type !== "date"
                                    ? truckFields[field.id]
                                    : formatDateForInput(truckFields[field.id])
                                }
                                onChange={handleTruckChange}
                              />
                            </div>
                          ))}
                        </div>
                      ))}
                </div>
              </div>
            </div>
            <ManageTruckFooterComponent
              onCloseModal={onCloseModal}
              canAddTruck={
                initialTruckData ? true : truckLimitCheck.canAddTruck
              }
              saveLabel={initialTruckData ? "Оновити тягач" : "Записати"}
            />
          </div>
        </div>
      </form>
    </>
  );
};

export default ManageTruckComponent;
