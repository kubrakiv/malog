import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import cn from "classnames";
import { FaLink, FaSync, FaSearch, FaTimes } from "react-icons/fa";

import {
  createTrailer,
  updateTrailer,
} from "../../../features/trailers/trailersOperations";
import { listTrailers } from "../../../features/trailers/trailersOperations";

import {
  setEditModeTrailer,
  setSelectedTrailer,
} from "../../../features/trailers/trailersSlice";

import {
  fetchSovtesTrailers,
  resyncSovtesTrailer,
  linkSovtesTrailer,
} from "../../../features/sovtesFleet/sovtesFleetOperations";

import { formFields } from "./trailerFormFields.jsx";
import { formatDateForInput } from "../../../utils/formatDate";

import ManageTrailerFooterComponent from "../ManageTrailerFooterComponent";
import InputComponent from "../../../globalComponents/InputComponent";

import "./style.scss";

import { TRAILER_CONSTANTS } from "../../../constants/global";

// ─── Sovtes helpers ───────────────────────────────────────────────────────────

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

// ─── Inline Sovtes section ────────────────────────────────────────────────────

const SovtesSection = ({ trailer, onResyncSuccess }) => {
  const dispatch = useDispatch();
  const sovtesTrailers = useSelector((s) => s.sovtesFleetInfo?.trailers || []);
  const syncingIds = useSelector((s) => s.sovtesFleetInfo?.syncingIds || []);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [chosenSovtesId, setChosenSovtesId] = useState(null);
  const [fetchedOnce, setFetchedOnce] = useState(false);

  const isLinked = Boolean(trailer.sovtes_id);
  const isSyncing = syncingIds.includes(String(trailer.sovtes_id));

  const findPlateMatch = (list) => {
    const localPlate = _normalizePlate(trailer.plates);
    if (!localPlate) return null;
    return list.find((t) => _normalizePlate(_getPlates(t)) === localPlate) || null;
  };

  const openPicker = () => {
    const unsynced = sovtesTrailers.filter((t) => !t.already_synced);
    const match = findPlateMatch(unsynced);
    setChosenSovtesId(match ? match.id : null);

    if (!fetchedOnce) {
      dispatch(fetchSovtesTrailers());
      setFetchedOnce(true);
    }
    setPickerOpen(true);
    setQuery("");
  };

  // Auto-select plate match once trailers load from Sovtes
  useEffect(() => {
    if (!pickerOpen || chosenSovtesId) return;
    const unsynced = sovtesTrailers.filter((t) => !t.already_synced);
    const match = findPlateMatch(unsynced);
    if (match) setChosenSovtesId(match.id);
  }, [sovtesTrailers, pickerOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleResync = async () => {
    const sovtesVehicle =
      sovtesTrailers.find((t) => String(t.id) === String(trailer.sovtes_id)) ||
      { id: trailer.sovtes_id };

    const result = await dispatch(resyncSovtesTrailer(sovtesVehicle));
    if (resyncSovtesTrailer.fulfilled.match(result)) {
      onResyncSuccess(result.payload);
      dispatch(listTrailers());
    }
  };

  const handleLinkConfirm = async () => {
    if (!chosenSovtesId) return;
    const sovtesVehicle = sovtesTrailers.find(
      (t) => String(t.id) === String(chosenSovtesId)
    );
    if (!sovtesVehicle) return;

    const result = await dispatch(
      linkSovtesTrailer({ ...sovtesVehicle, local_trailer_id: trailer.id })
    );
    if (linkSovtesTrailer.fulfilled.match(result)) {
      onResyncSuccess(result.payload);
      dispatch(listTrailers());
      setPickerOpen(false);
    }
  };

  const unsyncedSovtes = sovtesTrailers.filter((t) => !t.already_synced);
  const localPlateNorm = _normalizePlate(trailer.plates);
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
    .sort((a, b) => (isPlateMatch(b) ? 1 : 0) - (isPlateMatch(a) ? 1 : 0));

  return (
    <div className="trailer-sovtes-section">
      {isLinked ? (
        <div className="trailer-sovtes-section__linked">
          <span className="trailer-sovtes-section__badge">
            <FaSync />
            Sovtes&nbsp;
            <span className="trailer-sovtes-section__badge-id">
              #{trailer.sovtes_id}
            </span>
          </span>
          <button
            type="button"
            className="trailer-sovtes-section__resync-btn"
            onClick={handleResync}
            disabled={isSyncing}
            title="Оновити дані з Sovtes"
          >
            {isSyncing
              ? <FaSync className="trailer-sovtes-section__spinner" />
              : <FaSync />}
            {isSyncing ? "Оновлення…" : "Оновити з Sovtes"}
          </button>
        </div>
      ) : (
        <div className="trailer-sovtes-section__unlinked">
          {!pickerOpen ? (
            <button
              type="button"
              className="trailer-sovtes-section__link-btn"
              onClick={openPicker}
            >
              <FaLink />
              Прив'язати до Sovtes
            </button>
          ) : (
            <div className="trailer-sovtes-section__picker">
              <div className="trailer-sovtes-section__picker-header">
                <span>Оберіть причіп зі Sovtes</span>
                <button
                  type="button"
                  className="trailer-sovtes-section__picker-close"
                  onClick={() => setPickerOpen(false)}
                  aria-label="Закрити"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="trailer-sovtes-section__picker-search">
                <FaSearch className="trailer-sovtes-section__search-icon" />
                <input
                  type="text"
                  placeholder="Пошук за номером, маркою…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="trailer-sovtes-section__search-input"
                  autoFocus
                />
              </div>

              <div className="trailer-sovtes-section__picker-list">
                {filtered.length === 0 && (
                  <p className="trailer-sovtes-section__picker-empty">
                    {unsyncedSovtes.length === 0
                      ? "Немає доступних причепів у Sovtes"
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
                        "trailer-sovtes-section__picker-option",
                        chosenSovtesId === t.id &&
                          "trailer-sovtes-section__picker-option--selected",
                        matched &&
                          "trailer-sovtes-section__picker-option--match"
                      )}
                      onClick={() => setChosenSovtesId(t.id)}
                    >
                      <span className="trailer-sovtes-section__picker-plates-row">
                        <span className="trailer-sovtes-section__picker-plates">
                          {_getPlates(t)}
                        </span>
                        {matched && (
                          <span className="trailer-sovtes-section__picker-match-badge">
                            збіг за номером
                          </span>
                        )}
                      </span>
                      <span className="trailer-sovtes-section__picker-meta">
                        {[_getBrand(t), _extractStr(t.model)]
                          .filter(Boolean)
                          .join(" ")}
                        {t.vin ? ` · ${t.vin}` : ""}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="trailer-sovtes-section__picker-actions">
                <button
                  type="button"
                  className="trailer-sovtes-section__picker-cancel"
                  onClick={() => setPickerOpen(false)}
                >
                  Скасувати
                </button>
                <button
                  type="button"
                  className="trailer-sovtes-section__picker-confirm"
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

// ─── Main component ───────────────────────────────────────────────────────────

const ManageTrailerComponent = ({
  onCloseModal,
  onEditMode,
  initialTrailerData = null,
}) => {
  const dispatch = useDispatch();

  const [trailerFields, setTrailerFields] = useState(() => {
    if (initialTrailerData?.id) return { ...initialTrailerData };
    return Object.values(TRAILER_CONSTANTS).reduce((acc, item) => {
      acc[item] = "";
      return acc;
    }, {});
  });

  // Re-populate form when a different trailer is selected
  useEffect(() => {
    if (initialTrailerData?.id) {
      setTrailerFields({ ...initialTrailerData });
    }
  }, [initialTrailerData?.id]);

  const handleTrailerChange = (e) => {
    const { name, value } = e.target;
    setTrailerFields((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const data = { ...trailerFields };

    if (initialTrailerData) {
      dispatch(updateTrailer(data));
      dispatch(setSelectedTrailer(data));
      dispatch(setEditModeTrailer(false));
    } else {
      dispatch(createTrailer(data));
      onCloseModal();
    }
  };

  return (
    <>
      <form className="add-trailer__form" onSubmit={handleFormSubmit}>
        <div className="truck-card-container">
          <div className="truck-card-details">
            <div className="add-trailer__content">
              <div className="add-trailer__content-block">
                {!onEditMode && (
                  <h3 className="add-trailer__title">
                    {initialTrailerData ? "Редагувати причіп" : "Додати причіп"}
                  </h3>
                )}

                {/* Sovtes link / resync */}
                {initialTrailerData && (
                  <SovtesSection
                    trailer={trailerFields}
                    onResyncSuccess={(updated) =>
                      setTrailerFields((prev) => ({ ...prev, ...updated }))
                    }
                  />
                )}

                <div className="add-trailer__content-row">
                  {formFields.map((fields) => (
                    <div
                      className={cn(
                        "add-trailer__content-row-block",
                        initialTrailerData !== null &&
                          "add-trailer__content-row-block_edit-mode"
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
                                ? trailerFields[field.id]
                                : formatDateForInput(trailerFields[field.id])
                            }
                            onChange={handleTrailerChange}
                          />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {!initialTrailerData && (
              <ManageTrailerFooterComponent onCloseModal={onCloseModal} />
            )}
            {initialTrailerData && (
              <div className="edit-trailer__footer">
                <button
                  className="end-time__footer-btn end-time__footer-btn_save"
                  type="submit"
                >
                  Оновити причіп
                </button>
              </div>
            )}
          </div>
        </div>
      </form>
    </>
  );
};

export default ManageTrailerComponent;
