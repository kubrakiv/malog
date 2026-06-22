import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  FaTimes,
  FaSync,
  FaCheck,
  FaTruck,
  FaTrailer,
  FaUser,
  FaChevronDown,
  FaChevronUp,
  FaLink,
  FaSearch,
} from "react-icons/fa";
import {
  fetchSovtesTrucks,
  fetchSovtesTrailers,
  syncSovtesTruck,
  resyncSovtesTruck,
  syncSovtesTrailer,
  resyncSovtesTrailer,
  linkSovtesTruck,
  linkSovtesTrailer,
  resyncAllSovtesTrucks,
  resyncAllSovtesTrailers,
  fetchSovtesDrivers,
  syncSovtesDriver,
  resyncSovtesDriver,
  linkSovtesDriver,
  resyncAllSovtesDrivers,
} from "../../../features/sovtesFleet/sovtesFleetOperations";
import {
  setShowSovtesSyncModal,
  clearSovtesFleetError,
} from "../../../features/sovtesFleet/sovtesFleetSlice";
import { listTrucks } from "../../../features/trucks/trucksOperations";
import { listTrailers } from "../../../features/trailers/trailersOperations";
import { listDrivers } from "../../../features/drivers/driversOperations";
import "./style.scss";

const extractStr = (val) => {
  if (val == null) return "";
  if (typeof val === "object") {
    return val.title_ru || val.title || val.name || String(val.id ?? "");
  }
  return String(val);
};

const FieldValue = ({ val }) => {
  if (val == null || val === "") return <span className="sovtes-modal__detail-empty">—</span>;
  if (Array.isArray(val)) {
    return <span>{val.map((v) => extractStr(v)).filter(Boolean).join(", ") || "—"}</span>;
  }
  if (typeof val === "object") {
    const label = val.title_ru || val.title || val.name;
    const id = val.id != null ? `(ID: ${val.id})` : "";
    return <span>{[label, id].filter(Boolean).join(" ") || JSON.stringify(val)}</span>;
  }
  return <span>{String(val)}</span>;
};

const VehicleDetails = ({ vehicle }) => {
  const skip = new Set(["already_synced"]);
  const entries = Object.entries(vehicle).filter(([k]) => !skip.has(k));
  return (
    <div className="sovtes-modal__details">
      <div className="sovtes-modal__details-grid">
        {entries.map(([key, val]) => (
          <div key={key} className="sovtes-modal__details-row">
            <span className="sovtes-modal__details-key">{key}</span>
            <span className="sovtes-modal__details-val"><FieldValue val={val} /></span>
          </div>
        ))}
      </div>
    </div>
  );
};

const getPlates = (v) =>
  extractStr(v.number || v.carNumber || v.govNumber || v.stateNumber || v.plates || v.registrationNumber) || "—";

const getBrand = (v) =>
  extractStr(v.brandTitle || v.brand || v.make) || "—";

const getDriverName = (v) => {
  const last = extractStr(v.lastname || v.lastName || v.last_name);
  const first = extractStr(v.firstname || v.firstName || v.first_name);
  const patronymic = extractStr(v.patronymic || v.middleName || v.middle_name);
  const fromParts = [last, first, patronymic].filter(Boolean).join(" ");
  return fromParts || extractStr(v.fullName || v.full_name || v.name) || "—";
};

// Picker shown when user clicks "Зв'язати" — lets them pick a local unlinked item
const LinkPicker = ({ sovtesVehicle, localItems, onConfirm, onCancel, loading, isDriverTab }) => {
  const [query, setQuery] = useState("");
  const [chosenId, setChosenId] = useState(null);

  const filtered = localItems.filter((item) => {
    if (!query) return true;
    const q = query.toLowerCase();
    if (isDriverTab) {
      return (
        (item.full_name || "").toLowerCase().includes(q) ||
        (item.phone_number || "").toLowerCase().includes(q)
      );
    }
    return (
      (item.plates || "").toLowerCase().includes(q) ||
      (item.brand || "").toLowerCase().includes(q) ||
      (item.model || "").toLowerCase().includes(q)
    );
  });

  const sovtesLabel = isDriverTab ? getDriverName(sovtesVehicle) : getPlates(sovtesVehicle);
  const emptyMsg = isDriverTab ? "Немає незв'язаних водіїв" : "Немає незв'язаного транспорту";
  const searchPlaceholder = isDriverTab
    ? "Пошук за ім'ям, телефоном…"
    : "Пошук за номером, маркою, моделлю…";

  return (
    <div className="sovtes-modal__link-picker">
      <p className="sovtes-modal__link-picker-hint">
        Оберіть існуючий запис для прив'язки до Sovtes&nbsp;
        <strong>{sovtesLabel}</strong>:
      </p>

      <div className="sovtes-modal__link-search">
        <FaSearch className="sovtes-modal__link-search-icon" />
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="sovtes-modal__link-search-input"
          autoFocus
        />
      </div>

      <div className="sovtes-modal__link-list">
        {filtered.length === 0 && (
          <p className="sovtes-modal__link-empty">
            {localItems.length === 0 ? emptyMsg : "Нічого не знайдено"}
          </p>
        )}
        {filtered.map((item) => {
          const itemId = isDriverTab ? item.profile : item.id;
          return (
            <button
              key={itemId}
              type="button"
              className={`sovtes-modal__link-option${chosenId === itemId ? " sovtes-modal__link-option--selected" : ""}`}
              onClick={() => setChosenId(itemId)}
            >
              {isDriverTab ? (
                <>
                  <span className="sovtes-modal__link-option-plates">{item.full_name || "—"}</span>
                  <span className="sovtes-modal__link-option-meta">{item.phone_number || ""}</span>
                </>
              ) : (
                <>
                  <span className="sovtes-modal__link-option-plates">{item.plates || "—"}</span>
                  <span className="sovtes-modal__link-option-meta">
                    {[item.brand, item.model].filter(Boolean).join(" ") || "—"}
                    {item.vin_code ? ` · ${item.vin_code}` : ""}
                  </span>
                </>
              )}
            </button>
          );
        })}
      </div>

      <div className="sovtes-modal__link-actions">
        <button
          type="button"
          className="sovtes-modal__link-cancel"
          onClick={onCancel}
          disabled={loading}
        >
          Скасувати
        </button>
        <button
          type="button"
          className="sovtes-modal__link-confirm"
          onClick={() => onConfirm(chosenId)}
          disabled={!chosenId || loading}
        >
          {loading ? <FaSync className="sovtes-modal__spinner" /> : <FaLink />}
          {loading ? "Прив'язуємо…" : "Прив'язати"}
        </button>
      </div>
    </div>
  );
};

const SovtesSyncModal = () => {
  const dispatch = useDispatch();
  const { trucks, trailers, drivers, loading, syncingIds, resyncingAll, error, modalInitialTab } =
    useSelector((state) => state.sovtesFleetInfo);

  const localTrucks = useSelector((s) => s.trucksInfo?.trucks?.data || []);
  const localTrailers = useSelector((s) => s.trailersInfo?.trailers?.data || []);
  const localDrivers = useSelector((s) => s.driversInfo?.drivers?.data || []);

  const [activeTab, setActiveTab] = useState(modalInitialTab ?? "trucks");
  const [expandedId, setExpandedId] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [addingAll, setAddingAll] = useState(false);
  const [linkingId, setLinkingId] = useState(null);
  const [search, setSearch] = useState("");

  const isDriverTab = activeTab === "drivers";
  const items = activeTab === "trucks" ? trucks : activeTab === "trailers" ? trailers : drivers;

  const filteredItems = search.trim() === "" ? items : items.filter((v) => {
    const q = search.toLowerCase();
    if (isDriverTab) {
      return (
        getDriverName(v).toLowerCase().includes(q) ||
        extractStr(v.maincellphone || v.phone || v.phoneNumber || v.phone_number).toLowerCase().includes(q)
      );
    }
    return (
      getPlates(v).toLowerCase().includes(q) ||
      getBrand(v).toLowerCase().includes(q) ||
      extractStr(v.model).toLowerCase().includes(q) ||
      extractStr(v.vin || v.vin_code).toLowerCase().includes(q)
    );
  });

  const unsyncedItems = filteredItems.filter((v) => !v.already_synced);
  const syncedItems = filteredItems.filter((v) => v.already_synced);

  const unlinkedLocal = isDriverTab
    ? localDrivers.filter((d) => !d.sovtes_id)
    : activeTab === "trucks"
      ? localTrucks.filter((t) => !t.sovtes_id)
      : localTrailers.filter((t) => !t.sovtes_id);

  useEffect(() => {
    setExpandedId(null);
    setSelectedIds(new Set());
    setLinkingId(null);
    setSearch("");
    if (activeTab === "trucks") dispatch(fetchSovtesTrucks());
    else if (activeTab === "trailers") dispatch(fetchSovtesTrailers());
    else dispatch(fetchSovtesDrivers());
  }, [activeTab, dispatch]);

  const handleClose = () => dispatch(setShowSovtesSyncModal(false));

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const isAllSelected =
    unsyncedItems.length > 0 &&
    unsyncedItems.every((v) => selectedIds.has(v.id));

  const toggleSelectAll = () => {
    setSelectedIds(isAllSelected ? new Set() : new Set(unsyncedItems.map((v) => v.id)));
  };

  const refreshLocal = () => {
    if (activeTab === "trucks") dispatch(listTrucks());
    else if (activeTab === "trailers") dispatch(listTrailers());
    else dispatch(listDrivers());
  };

  const syncOne = async (vehicle) => {
    const action = isDriverTab ? syncSovtesDriver
      : activeTab === "trucks" ? syncSovtesTruck : syncSovtesTrailer;
    const result = await dispatch(action(vehicle));
    if (action.fulfilled.match(result)) refreshLocal();
  };

  const handleResync = async (e, vehicle) => {
    e.stopPropagation();
    const action = isDriverTab ? resyncSovtesDriver
      : activeTab === "trucks" ? resyncSovtesTruck : resyncSovtesTrailer;
    const result = await dispatch(action(vehicle));
    if (action.fulfilled.match(result)) refreshLocal();
  };

  const handleResyncAll = async () => {
    const action = isDriverTab ? resyncAllSovtesDrivers
      : activeTab === "trucks" ? resyncAllSovtesTrucks : resyncAllSovtesTrailers;
    const result = await dispatch(action());
    if (action.fulfilled.match(result)) refreshLocal();
  };

  const handleSyncOne = (e, vehicle) => {
    e.stopPropagation();
    syncOne(vehicle);
  };

  const handleAddSelected = async () => {
    const toSync = items.filter((v) => !v.already_synced && selectedIds.has(v.id));
    if (!toSync.length) return;
    setAddingAll(true);
    for (const vehicle of toSync) await syncOne(vehicle);
    setSelectedIds(new Set());
    setAddingAll(false);
  };

  const handleLinkOpen = (e, vehicle) => {
    e.stopPropagation();
    setLinkingId(vehicle.id);
    setExpandedId(vehicle.id);
  };

  const handleLinkConfirm = async (localId) => {
    const vehicle = items.find((v) => v.id === linkingId);
    if (!vehicle || !localId) return;

    let action, idKey;
    if (isDriverTab) {
      action = linkSovtesDriver;
      idKey = "local_driver_id";
    } else if (activeTab === "trucks") {
      action = linkSovtesTruck;
      idKey = "local_truck_id";
    } else {
      action = linkSovtesTrailer;
      idKey = "local_trailer_id";
    }

    const result = await dispatch(action({ ...vehicle, [idKey]: localId }));
    if (action.fulfilled.match(result)) {
      refreshLocal();
      setLinkingId(null);
    }
  };

  const isSyncing = (id) => syncingIds.includes(String(id));

  return (
    <div className="sovtes-modal__overlay" onClick={handleClose}>
      <div className="sovtes-modal" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="sovtes-modal__header">
          <div className="sovtes-modal__header-text">
            <p className="sovtes-modal__eyebrow">Sovtes</p>
            <h2 className="sovtes-modal__title">Синхронізація транспорту</h2>
          </div>
          <button
            className="sovtes-modal__close"
            onClick={handleClose}
            type="button"
            aria-label="Закрити"
          >
            <FaTimes />
          </button>
        </div>

        {/* Tabs */}
        <div className="sovtes-modal__tabs">
          <button
            className={`sovtes-modal__tab${activeTab === "trucks" ? " sovtes-modal__tab--active" : ""}`}
            onClick={() => { dispatch(clearSovtesFleetError()); setActiveTab("trucks"); }}
            type="button"
          >
            <FaTruck /><span>Тягачі</span>
          </button>
          <button
            className={`sovtes-modal__tab${activeTab === "trailers" ? " sovtes-modal__tab--active" : ""}`}
            onClick={() => { dispatch(clearSovtesFleetError()); setActiveTab("trailers"); }}
            type="button"
          >
            <FaTrailer /><span>Причепи</span>
          </button>
          <button
            className={`sovtes-modal__tab${activeTab === "drivers" ? " sovtes-modal__tab--active" : ""}`}
            onClick={() => { dispatch(clearSovtesFleetError()); setActiveTab("drivers"); }}
            type="button"
          >
            <FaUser /><span>Водії</span>
          </button>
        </div>

        {/* Search */}
        {!loading && !error && items.length > 0 && (
          <div className="sovtes-modal__search">
            <FaSearch className="sovtes-modal__search-icon" />
            <input
              type="text"
              className="sovtes-modal__search-input"
              placeholder={isDriverTab ? "Пошук за ім'ям водія, телефоном…" : "Пошук за номером, маркою, моделлю, VIN…"}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        )}

        {/* Toolbar */}
        {!loading && !error && filteredItems.length > 0 && (
          <div className="sovtes-modal__toolbar">
            {/* Select-all for unsynced */}
            {unsyncedItems.length > 0 ? (
              <label className="sovtes-modal__select-all">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={toggleSelectAll}
                />
                <span>{isAllSelected ? "Зняти все" : "Вибрати все"}</span>
              </label>
            ) : (
              <span />
            )}

            <div className="sovtes-modal__toolbar-actions">
              {/* Resync all synced */}
              {syncedItems.length > 0 && (
                <button
                  className="sovtes-modal__resync-all-btn"
                  onClick={handleResyncAll}
                  disabled={resyncingAll}
                  type="button"
                  title="Оновити всі синхронізовані з Sovtes"
                >
                  {resyncingAll
                    ? <FaSync className="sovtes-modal__spinner" />
                    : <FaSync />}
                  {resyncingAll
                    ? "Оновлення…"
                    : `Оновити всі (${syncedItems.length})`}
                </button>
              )}

              {/* Add selected */}
              {unsyncedItems.length > 0 && (
                <button
                  className="sovtes-modal__add-selected-btn"
                  onClick={handleAddSelected}
                  disabled={selectedIds.size === 0 || addingAll}
                  type="button"
                >
                  {addingAll
                    ? <FaSync className="sovtes-modal__spinner" />
                    : <FaCheck />}
                  {addingAll
                    ? "Додаємо…"
                    : selectedIds.size > 0
                      ? `Додати вибрані (${selectedIds.size})`
                      : "Додати вибрані"}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Body */}
        <div className="sovtes-modal__body">
          {loading && (
            <div className="sovtes-modal__state">
              <FaSync className="sovtes-modal__spinner" />
              <p>Завантаження зі Sovtes…</p>
            </div>
          )}

          {error && !loading && (
            <div className="sovtes-modal__state sovtes-modal__state--error">
              <p>Помилка: {error}</p>
            </div>
          )}

          {!loading && !error && items.length === 0 && (
            <div className="sovtes-modal__state">
              <p>{isDriverTab ? "Немає водіїв у Sovtes" : "Немає транспорту у Sovtes"}</p>
            </div>
          )}

          {!loading && !error && items.length > 0 && filteredItems.length === 0 && (
            <div className="sovtes-modal__state">
              <p>Нічого не знайдено</p>
            </div>
          )}

          {!loading && !error && filteredItems.length > 0 && (
            <div className="sovtes-modal__list">
              {filteredItems.map((vehicle) => {
                const syncing = isSyncing(vehicle.id);
                const synced = vehicle.already_synced;
                const expanded = expandedId === vehicle.id;
                const selected = selectedIds.has(vehicle.id);
                const isLinking = linkingId === vehicle.id;

                const plates = isDriverTab ? getDriverName(vehicle) : getPlates(vehicle);
                const brand = isDriverTab
                  ? (extractStr(vehicle.maincellphone || vehicle.phone || vehicle.phoneNumber || vehicle.phone_number) || "")
                  : getBrand(vehicle);
                const model = isDriverTab ? "" : extractStr(vehicle.model);
                const vin = isDriverTab ? "" : (extractStr(vehicle.vin || vehicle.vin_code) || "—");
                const year = isDriverTab ? "" : (extractStr(vehicle.year_of_manufact ?? vehicle.year) || "—");

                return (
                  <div
                    key={vehicle.id}
                    className={[
                      "sovtes-modal__item",
                      synced ? "sovtes-modal__item--synced" : "",
                      selected ? "sovtes-modal__item--selected" : "",
                      expanded ? "sovtes-modal__item--expanded" : "",
                    ].join(" ")}
                  >
                    <div className="sovtes-modal__item-row">
                      {/* Checkbox (unsynced only) */}
                      {!synced ? (
                        <label
                          className="sovtes-modal__checkbox-wrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => toggleSelect(vehicle.id)}
                          />
                        </label>
                      ) : (
                        <span className="sovtes-modal__checkbox-placeholder" />
                      )}

                      {/* Info */}
                      <div
                        className="sovtes-modal__item-info"
                        onClick={() => {
                          if (isLinking) return;
                          setExpandedId(expanded ? null : vehicle.id);
                        }}
                      >
                        <div className="sovtes-modal__item-plates">{plates}</div>
                        <div className="sovtes-modal__item-details">
                          <span>{brand}{model ? ` ${model}` : ""}</span>
                          {vin && vin !== "—" && <span className="sovtes-modal__item-vin">VIN: {vin}</span>}
                          {year && year !== "—" && <span>{year}</span>}
                          <span className="sovtes-modal__item-id">ID: {vehicle.id}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="sovtes-modal__item-action">
                        {synced ? (
                          <div className="sovtes-modal__synced-actions">
                            <span className="sovtes-modal__badge sovtes-modal__badge--synced">
                              <FaCheck />Синхронізовано
                            </span>
                            <button
                              className="sovtes-modal__resync-btn"
                              onClick={(e) => handleResync(e, vehicle)}
                              disabled={isSyncing(vehicle.id)}
                              type="button"
                              title="Оновити дані з Sovtes"
                            >
                              {isSyncing(vehicle.id)
                                ? <FaSync className="sovtes-modal__spinner" />
                                : <FaSync />}
                            </button>
                          </div>
                        ) : (
                          <div className="sovtes-modal__unsynced-actions">
                            <button
                              className="sovtes-modal__sync-btn"
                              onClick={(e) => handleSyncOne(e, vehicle)}
                              disabled={syncing || addingAll || isLinking}
                              type="button"
                            >
                              {syncing
                                ? <FaSync className="sovtes-modal__spinner" />
                                : <FaSync />}
                              {syncing ? "Додаємо…" : "Додати"}
                            </button>
                            <button
                              className={`sovtes-modal__link-btn${isLinking ? " sovtes-modal__link-btn--active" : ""}`}
                              onClick={(e) =>
                                isLinking
                                  ? (e.stopPropagation(), setLinkingId(null))
                                  : handleLinkOpen(e, vehicle)
                              }
                              disabled={syncing || addingAll}
                              type="button"
                              title="Прив'язати до існуючого запису"
                            >
                              <FaLink />
                              {isLinking ? "Скасувати" : "Прив'язати"}
                            </button>
                          </div>
                        )}
                        <button
                          className="sovtes-modal__expand-btn"
                          onClick={() => {
                            if (isLinking) setLinkingId(null);
                            setExpandedId(expanded && !isLinking ? null : vehicle.id);
                          }}
                          type="button"
                          aria-label="Деталі"
                        >
                          {expanded ? <FaChevronUp /> : <FaChevronDown />}
                        </button>
                      </div>
                    </div>

                    {/* Expanded area: link picker or raw details */}
                    {expanded && (
                      isLinking ? (
                        <LinkPicker
                          sovtesVehicle={vehicle}
                          localItems={unlinkedLocal}
                          onConfirm={handleLinkConfirm}
                          onCancel={() => setLinkingId(null)}
                          loading={isSyncing(vehicle.id)}
                          isDriverTab={isDriverTab}
                        />
                      ) : (
                        <VehicleDetails vehicle={vehicle} />
                      )
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SovtesSyncModal;
