import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  FaTimes,
  FaSync,
  FaCheck,
  FaTruck,
  FaTrailer,
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
} from "../../../features/sovtesFleet/sovtesFleetOperations";
import {
  setShowSovtesSyncModal,
  clearSovtesFleetError,
} from "../../../features/sovtesFleet/sovtesFleetSlice";
import { listTrucks } from "../../../features/trucks/trucksOperations";
import { listTrailers } from "../../../features/trailers/trailersOperations";
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

// Picker shown when user clicks "Зв'язати" — lets them pick a local unlinked vehicle
const LinkPicker = ({ sovtesVehicle, localItems, onConfirm, onCancel, loading }) => {
  const [query, setQuery] = useState("");
  const [chosenId, setChosenId] = useState(null);

  const filtered = localItems.filter((item) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      (item.plates || "").toLowerCase().includes(q) ||
      (item.brand || "").toLowerCase().includes(q) ||
      (item.model || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="sovtes-modal__link-picker">
      <p className="sovtes-modal__link-picker-hint">
        Оберіть існуючий запис для прив'язки до Sovtes&nbsp;
        <strong>{getPlates(sovtesVehicle)}</strong>:
      </p>

      <div className="sovtes-modal__link-search">
        <FaSearch className="sovtes-modal__link-search-icon" />
        <input
          type="text"
          placeholder="Пошук за номером, маркою, моделлю…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="sovtes-modal__link-search-input"
          autoFocus
        />
      </div>

      <div className="sovtes-modal__link-list">
        {filtered.length === 0 && (
          <p className="sovtes-modal__link-empty">
            {localItems.length === 0
              ? "Немає незв'язаного транспорту"
              : "Нічого не знайдено"}
          </p>
        )}
        {filtered.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`sovtes-modal__link-option${chosenId === item.id ? " sovtes-modal__link-option--selected" : ""}`}
            onClick={() => setChosenId(item.id)}
          >
            <span className="sovtes-modal__link-option-plates">
              {item.plates || "—"}
            </span>
            <span className="sovtes-modal__link-option-meta">
              {[item.brand, item.model].filter(Boolean).join(" ") || "—"}
              {item.vin_code ? ` · ${item.vin_code}` : ""}
            </span>
          </button>
        ))}
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
  const { trucks, trailers, loading, syncingIds, resyncingAll, error } =
    useSelector((state) => state.sovtesFleetInfo);

  const localTrucks = useSelector((s) => s.trucksInfo?.trucks?.data || []);
  const localTrailers = useSelector((s) => s.trailersInfo?.trailers?.data || []);

  const [activeTab, setActiveTab] = useState("trucks");
  const [expandedId, setExpandedId] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [addingAll, setAddingAll] = useState(false);
  const [linkingId, setLinkingId] = useState(null); // sovtes vehicle.id being linked

  const items = activeTab === "trucks" ? trucks : trailers;
  const unsyncedItems = items.filter((v) => !v.already_synced);
  const syncedItems = items.filter((v) => v.already_synced);

  const unlinkedLocal =
    activeTab === "trucks"
      ? localTrucks.filter((t) => !t.sovtes_id)
      : localTrailers.filter((t) => !t.sovtes_id);

  useEffect(() => {
    setExpandedId(null);
    setSelectedIds(new Set());
    setLinkingId(null);
    if (activeTab === "trucks") {
      dispatch(fetchSovtesTrucks());
    } else {
      dispatch(fetchSovtesTrailers());
    }
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
    else dispatch(listTrailers());
  };

  const syncOne = async (vehicle) => {
    const action = activeTab === "trucks" ? syncSovtesTruck : syncSovtesTrailer;
    const result = await dispatch(action(vehicle));
    if (action.fulfilled.match(result)) refreshLocal();
  };

  const handleResync = async (e, vehicle) => {
    e.stopPropagation();
    const action = activeTab === "trucks" ? resyncSovtesTruck : resyncSovtesTrailer;
    const result = await dispatch(action(vehicle));
    if (action.fulfilled.match(result)) refreshLocal();
  };

  const handleResyncAll = async () => {
    const action =
      activeTab === "trucks" ? resyncAllSovtesTrucks : resyncAllSovtesTrailers;
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

    const action = activeTab === "trucks" ? linkSovtesTruck : linkSovtesTrailer;
    const idKey = activeTab === "trucks" ? "local_truck_id" : "local_trailer_id";
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
        </div>

        {/* Toolbar */}
        {!loading && !error && items.length > 0 && (
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
              <p>Немає транспорту у Sovtes</p>
            </div>
          )}

          {!loading && !error && items.length > 0 && (
            <div className="sovtes-modal__list">
              {items.map((vehicle) => {
                const syncing = isSyncing(vehicle.id);
                const synced = vehicle.already_synced;
                const expanded = expandedId === vehicle.id;
                const selected = selectedIds.has(vehicle.id);
                const isLinking = linkingId === vehicle.id;

                const plates = getPlates(vehicle);
                const brand = getBrand(vehicle);
                const model = extractStr(vehicle.model);
                const vin = extractStr(vehicle.vin || vehicle.vin_code) || "—";
                const year = extractStr(vehicle.year_of_manufact ?? vehicle.year) || "—";

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
                          {vin !== "—" && <span className="sovtes-modal__item-vin">VIN: {vin}</span>}
                          {year !== "—" && <span>{year}</span>}
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
