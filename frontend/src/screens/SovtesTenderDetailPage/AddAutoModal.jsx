import { useState, useEffect } from "react";
import axios from "axios";
import { postOfferAuto } from "../SovtesTenderPage/tendersService";
import "./style.scss";

function parseDate(dateStr) {
  if (!dateStr || dateStr === "0000-00-00") return "";
  return dateStr; // already YYYY-MM-DD for <input type="date">
}

function parseTime(timeStr) {
  if (!timeStr || timeStr === "00:00:00") return "";
  return timeStr.slice(0, 5); // HH:MM for <input type="time">
}

function RouteStops({ routeparts, stopDates, onChangeDates }) {
  if (!routeparts?.length) return null;
  return (
    <div className="aam-stops">
      <div className="aam-stops__title">Пункти маршруту</div>
      {routeparts.map((part, idx) => {
        const isLoad = part.workaction === 1;
        const rel = part.checkpoint_relation;
        const country = rel?.country_relation?.title_ru || "";
        const region  = rel?.region_relation?.title_ru  || "";
        const city    = rel?.town_relation?.title_ru    || "";
        const street  = rel?.address || rel?.street     || "";
        const address = [country, region, city, street].filter(Boolean).join(", ");
        const { date, time } = stopDates[idx] ?? { date: "", time: "" };

        return (
          <div key={idx} className="aam-stop">
            <div className="aam-stop__num">{idx + 1}</div>
            <div className="aam-stop__body">
              <div className="aam-stop__top">
                <span className={`aam-stop__icon aam-stop__icon--${isLoad ? "load" : "unload"}`}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                    {isLoad
                      ? <path d="M12 2L6 8h4v8h4V8h4L12 2z"/>
                      : <path d="M12 22l6-6h-4V8H8v8H4l8 6z"/>
                    }
                  </svg>
                </span>
                <span className="aam-stop__type">{isLoad ? "Завантаження" : "Розвантаження"}</span>
              </div>
              {address && <div className="aam-stop__address">{address}</div>}
              <div className="aam-stop__datetime">
                <div className="aam-stop__field">
                  <label className="aam-stop__label">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2"/>
                      <line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/>
                      <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    Дата
                  </label>
                  <input
                    type="date"
                    className="aam-stop__input"
                    value={date}
                    onChange={(e) => onChangeDates(idx, "date", e.target.value)}
                  />
                </div>
                <div className="aam-stop__field">
                  <label className="aam-stop__label">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="9"/>
                      <polyline points="12 7 12 12 15 15"/>
                    </svg>
                    Час
                  </label>
                  <input
                    type="time"
                    className="aam-stop__input"
                    value={time}
                    onChange={(e) => onChangeDates(idx, "time", e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function AddAutoModal({ route, routeparts, onClose, onSuccess }) {
  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [stopDates, setStopDates] = useState(
    (routeparts ?? []).map((p) => ({
      id: p.id ?? null,
      date: parseDate(p.date1),
      time: parseTime(p.time1),
    }))
  );

  useEffect(() => {
    axios
      .get("/api/trucks/")
      .then((r) => {
        const withSovtes = (r.data || []).filter((t) => t.sovtes_id);
        setTrucks(withSovtes);
        if (withSovtes.length === 1) setSelectedId(withSovtes[0].id);
      })
      .catch(() => setError("Не вдалося завантажити список авто"))
      .finally(() => setLoading(false));
  }, []);

  const selected = trucks.find((t) => t.id === selectedId) ?? null;
  const truckLabel = (t) => [t.brand, t.plates].filter(Boolean).join(" – ");
  const truckOptionLabel = (t) => {
    const parts = [t.plates].filter(Boolean);
    if (t.trailer_details?.plates) parts.push(t.trailer_details.plates);
    if (t.driver_details?.full_name) parts.push(t.driver_details.full_name);
    return parts.join(" / ");
  };

  const handleChangeDates = (idx, field, value) => {
    setStopDates((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s))
    );
  };

  const handleSubmit = async () => {
    if (!selected?.sovtes_id) { setError("Оберіть автомобіль"); return; }
    setSubmitting(true);
    setError(null);
    try {
      await postOfferAuto({
        route,
        car: selected.sovtes_id,
        driver: selected.driver_details?.sovtes_id ?? null,
        trailer: selected.trailer_details?.sovtes_id ?? null,
        routepartsDates: Object.fromEntries(
          stopDates
            .filter((s) => s.id && s.date)
            .map((s) => [s.id, s.date])
        ),
      });
      onSuccess?.({
        truck: selected,
        driver: selected.driver_details ?? null,
        trailer: selected.trailer_details ?? null,
      });
      onClose();
    } catch (e) {
      setError(e?.response?.data?.error || "Помилка відправки");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="aam-overlay" onClick={onClose}>
      <div className="aam-modal" onClick={(e) => e.stopPropagation()}>

        <div className="aam-modal__header">
          <strong>Додати авто</strong>
          <button className="aam-modal__close" onClick={onClose}>×</button>
        </div>

        <div className="aam-modal__body">
          <p className="aam-modal__route">Маршрут: <strong>№ {route}</strong></p>

          {/* Truck selector */}
          <div className="aam-field">
            <label className="aam-field__label">
              Автомобіль <span className="aam-field__req">*</span>
            </label>
            {loading ? (
              <div className="aam-field__loading">Завантаження...</div>
            ) : trucks.length === 0 ? (
              <div className="aam-field__empty">
                Немає авто з прив'язаним Sovtes ID. Перевірте налаштування автопарку.
              </div>
            ) : (
              <select
                className="aam-field__select"
                value={selectedId ?? ""}
                onChange={(e) => setSelectedId(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">— оберіть авто —</option>
                {trucks.map((t) => (
                  <option key={t.id} value={t.id}>{truckOptionLabel(t)}</option>
                ))}
              </select>
            )}
          </div>

          {/* Truck Sovtes badge */}
          {selected && (
            <div className="aam-info-row">
              <span className="aam-info-row__label">Автомобіль</span>
              <span className="aam-info-row__value">
                {truckLabel(selected)}
                <span className="aam-info-row__badge aam-info-row__badge--ok">Sovtes ✓</span>
              </span>
            </div>
          )}

          {/* Linked driver */}
          {selected && (
            <div className="aam-info-row">
              <span className="aam-info-row__label">Водій</span>
              <span className="aam-info-row__value">
                {selected.driver_details ? (
                  <>
                    {selected.driver_details.full_name}
                    {selected.driver_details.sovtes_id
                      ? <span className="aam-info-row__badge aam-info-row__badge--ok">Sovtes ✓</span>
                      : <span className="aam-info-row__badge aam-info-row__badge--warn">без Sovtes ID</span>
                    }
                  </>
                ) : (
                  <span className="aam-info-row__na">не призначено</span>
                )}
              </span>
            </div>
          )}

          {/* Linked trailer */}
          {selected && (
            <div className="aam-info-row">
              <span className="aam-info-row__label">Причіп</span>
              <span className="aam-info-row__value">
                {selected.trailer_details ? (
                  <>
                    {selected.trailer_details.plates}
                    {selected.trailer_details.sovtes_id
                      ? <span className="aam-info-row__badge aam-info-row__badge--ok">Sovtes ✓</span>
                      : <span className="aam-info-row__badge aam-info-row__badge--warn">без Sovtes ID</span>
                    }
                  </>
                ) : (
                  <span className="aam-info-row__na">без причепа</span>
                )}
              </span>
            </div>
          )}

          {/* Route stops — below vehicle section, with editable dates */}
          <RouteStops
            routeparts={routeparts}
            stopDates={stopDates}
            onChangeDates={handleChangeDates}
          />

          {error && <p className="aam-modal__error">{error}</p>}
        </div>

        <div className="aam-modal__footer">
          <button className="aam-btn aam-btn--ghost" onClick={onClose} disabled={submitting}>
            Скасувати
          </button>
          <button
            className="aam-btn aam-btn--primary"
            onClick={handleSubmit}
            disabled={submitting || loading || !selected?.sovtes_id}
          >
            {submitting ? "Відправка..." : "Підтвердити"}
          </button>
        </div>

      </div>
    </div>
  );
}
