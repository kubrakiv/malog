import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  fetchBasicDetails,
  fetchTenderChildren,
  fetchRouteActions,
} from "../SovtesTenderPage/tendersService";
import { useSovtesEvents } from "../../contexts/SovtesRealtimeContext";
import { postSubscribeRoute } from "../SovtesTenderPage/tendersService";
import AddAutoModal from "./AddAutoModal";
import axios from "axios";
import toast from "react-hot-toast";
import "./style.scss";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ISO3_TO_2 = {
  UKR: "ua", POL: "pl", DEU: "de", FRA: "fr", ITA: "it", ESP: "es",
  AUT: "at", HUN: "hu", ROU: "ro", CZE: "cz", SVK: "sk", BLR: "by",
  LTU: "lt", LVA: "lv", EST: "ee", GBR: "gb", NLD: "nl", BEL: "be",
};

function isoToFlag(iso3) {
  return iso3 ? (ISO3_TO_2[iso3.toUpperCase()] ?? null) : null;
}

function fmtPrice(val) {
  const n = parseFloat(val);
  if (isNaN(n) || n === 0) return null;
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function fmtDate(dateStr) {
  if (!dateStr || dateStr === "0000-00-00") return null;
  const [y, m, d] = dateStr.split("-");
  return `${d}.${m}.${y}`;
}

function fmtDeadline(val) {
  if (!val) return null;
  const s = typeof val === "object" ? [val.date, val.time].filter(Boolean).join(" ") : String(val);
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}:\d{2})/);
  return m ? `${m[3]}.${m[2]}.${m[1]} ${m[4]}` : s;
}

function currSym(code) {
  switch ((code || "UAH").toUpperCase()) {
    case "UAH": return "₴";
    case "EUR": return "€";
    case "USD": return "$";
    default: return code || "";
  }
}

function extractCities(card) {
  const loads = [], unloads = [];
  (card.routeparts || []).forEach((p) => {
    const rel = p.checkpoint_relation;
    if (!rel) return;
    const city = rel.town_relation?.title_ru || rel.town_relation?.title || "";
    const flag = isoToFlag(rel.country_relation?.iso_code);
    if (city) {
      if (p.workaction === 1) loads.push({ city, flag });
      else if (p.workaction === 2) unloads.push({ city, flag });
    }
  });
  return { loads, unloads };
}

function routeTitle(card) {
  const { loads, unloads } = extractCities(card);
  const from = loads[0]?.city || "";
  const to = unloads[unloads.length - 1]?.city || "";
  return from && to ? `${from} → ${to}` : from || to || `Маршрут ${card.periodic}`;
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function TenderSidebar({ card, cs }) {
  const winnerstatus = card.routetender?.winnerstatus;
  const passed = card.tenderavailableuntilmoment_passed;
  const isWin = winnerstatus === 2 && !!card.minquote;
  const isLost = card.routestatus === -1 && winnerstatus === 1 && !isWin;
  const isWaiting = !isWin && !isLost && winnerstatus === 0 && passed;
  const deadline = fmtDeadline(card.tenderavailableuntilmoment);
  const bestPrice = fmtPrice(card.routetender?.currentminpricewithcommission);
  const startPrice = fmtPrice(card.maxquotewithcommission);
  const step = fmtPrice(card.stepwithcommission);
  const trips = Math.round(parseFloat(card.routetender?.totalcount) || 0);
  const totalBids = (card.response ?? card.routeresponse_relation ?? []).length;
  const payment = card.paymenttypeRelation?.title || null;

  return (
    <aside className="std-sidebar">
      {isWin && <div className="std-sidebar__win">Ви перемогли</div>}
      {isLost && <div className="std-sidebar__lost">Не вибрано</div>}
      {isWaiting && <div className="std-sidebar__waiting">Очікуємо рішення</div>}

      <div className="std-sidebar__section">
        <div className="std-sidebar__section-title">Тендер</div>
        {deadline && <div className="std-sidebar__row-plain">До {deadline}</div>}
        {passed && <div className="std-sidebar__finished">Завершено</div>}
      </div>

      <div className="std-sidebar__stats">
        {totalBids > 0 && (
          <div className="std-sidebar__stat">
            <span className="std-sidebar__stat-label">Всі пропозиції</span>
            <span className="std-sidebar__stat-value">{totalBids}</span>
          </div>
        )}
        {bestPrice && (
          <div className="std-sidebar__stat">
            <span className="std-sidebar__stat-label">Найнижча ставка</span>
            <span className="std-sidebar__stat-value">{cs}{bestPrice}</span>
          </div>
        )}
        {startPrice && (
          <div className="std-sidebar__stat">
            <span className="std-sidebar__stat-label">Стартова ціна</span>
            <span className="std-sidebar__stat-value">{cs}{startPrice}</span>
          </div>
        )}
        {trips > 0 && (
          <div className="std-sidebar__stat">
            <span className="std-sidebar__stat-label">Замовлення</span>
            <span className="std-sidebar__stat-value">
              {trips}&nbsp;рейс{trips > 1 ? "и" : ""}
            </span>
          </div>
        )}
        {payment && (
          <div className="std-sidebar__stat">
            <span className="std-sidebar__stat-label">Метод оплати</span>
            <span className="std-sidebar__stat-value">{payment}</span>
          </div>
        )}
        {step && (
          <div className="std-sidebar__stat">
            <span className="std-sidebar__stat-label">Крок</span>
            <span className="std-sidebar__stat-value">{cs}{step}</span>
          </div>
        )}
      </div>
    </aside>
  );
}

// ─── Tab: Деталі ──────────────────────────────────────────────────────────────

function DetailsTab({ card, cs }) {
  const parts = card.routeparts || [];
  const distance = card.distance || null;

  return (
    <div className="std-tab-panel">
      {parts.map((part, idx) => {
        const rel = part.checkpoint_relation;
        if (!rel) return null;
        const isLoad = part.workaction === 1;
        const city = rel.town_relation?.title_ru || rel.town_relation?.title || "";
        const region = rel.region_relation?.title_ru || "";
        const country = rel.country_relation?.title_ru || "";
        const street = rel.address || "";
        const fullAddr = [street, city, region, country].filter(Boolean).join(", ");
        const flag = isoToFlag(rel.country_relation?.iso_code);
        const dateStr = fmtDate(part.date1);
        const timeStr = (part.time1 || "").slice(0, 5).replace("00:00", "") || null;
        const rawW = part.weight ?? part.cargoweight ?? null;
        const weight = rawW != null ? parseFloat(rawW) || null : null;

        return (
          <div key={idx} className="std-stop">
            <div className="std-stop__badge-col">
              <span className={`std-stop__badge std-stop__badge--${isLoad ? "load" : "unload"}`} />
              {idx < parts.length - 1 && <span className="std-stop__line" />}
            </div>
            <div className="std-stop__body">
              <div className="std-stop__header">
                <span className="std-stop__action">{isLoad ? "Завантаження" : "Розвантаження"}</span>
                {dateStr && <span className="std-stop__date">{dateStr}</span>}
                {timeStr && <span className="std-stop__time">{timeStr}</span>}
              </div>
              <div className="std-stop__city">
                {flag && <span className={`fi fi-${flag}`} />} {city}
              </div>
              {fullAddr && <div className="std-stop__addr">{fullAddr}</div>}
              {isLoad && (part.cargo || weight) && (
                <div className="std-stop__cargo">
                  {part.cargo && <span>{part.cargo}</span>}
                  {weight && <span>Вага: {weight} т</span>}
                </div>
              )}
              {isLoad && idx < parts.length - 1 && distance && (
                <div className="std-stop__dist">↕ {distance} км</div>
              )}
            </div>
          </div>
        );
      })}
      {card.remark && (
        <div className="std-tab-panel__remark">
          <strong>Примітка:</strong> {card.remark}
        </div>
      )}
    </div>
  );
}

// ─── Child route card ─────────────────────────────────────────────────────────

function AssignedVehicle({ vehicle }) {
  const { truck, driver, trailer } = vehicle;
  return (
    <>
      <div className="crc__vehicle-row">
        <svg className="crc__vehicle-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="1" y="3" width="15" height="13" rx="1"/>
          <path d="M16 8h5l2 4v4h-7V8z"/>
          <circle cx="5.5" cy="18.5" r="2.5"/>
          <circle cx="18.5" cy="18.5" r="2.5"/>
        </svg>
        <span className="fi fi-ua" />
        <span className="crc__vehicle-plates">{truck.plates}</span>
      </div>
      {trailer && (
        <div className="crc__vehicle-row">
          <svg className="crc__vehicle-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="2" y="7" width="18" height="11" rx="1"/>
            <circle cx="6" cy="20" r="2"/>
            <circle cx="18" cy="20" r="2"/>
            <path d="M20 10h2v4h-2"/>
          </svg>
          <span className="fi fi-ua" />
          <span className="crc__vehicle-plates">{trailer.plates}</span>
        </div>
      )}
      {driver && (
        <>
          <div className="crc__vehicle-row">
            <svg className="crc__vehicle-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            <span className="crc__vehicle-name">{driver.full_name}</span>
          </div>
          {driver.phone_number && (
            <div className="crc__vehicle-row">
              <svg className="crc__vehicle-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.38 2 2 0 0 1 3.59 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.56a16 16 0 0 0 6 6l.92-.92a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
              <span className="crc__vehicle-phone">{driver.phone_number}</span>
            </div>
          )}
        </>
      )}
    </>
  );
}

function SubscribeModal({ card, onClose, onSuccess }) {
  const loadPart = (card.routeparts || []).find((p) => p.workaction === 1);
  const rel = loadPart?.checkpoint_relation;
  const address = [
    rel?.address,
    rel?.town_relation?.title_ru,
    rel?.region_relation?.title_ru,
    rel?.country_relation?.title_ru,
  ].filter(Boolean).join(", ");

  const resp = card.routeresponse_relation?.[0];
  const driver  = resp?.driver_relation  ?? null;
  const car     = resp?.car_relation     ?? null;
  const trailer = resp?.trailer_relation ?? null;

  const price   = fmtPrice(card.budget);
  const kmprice = card.kmprice ? parseFloat(card.kmprice).toFixed(2) : null;
  const payment = card.paymenttypeRelation?.title || null;
  const nds     = card.nds === 1 ? " з ПДВ" : "";

  const [date, setDate] = useState(
    loadPart?.date1 && loadPart.date1 !== "0000-00-00" ? loadPart.date1 : ""
  );
  const [time, setTime] = useState(
    loadPart?.time1 && loadPart.time1 !== "00:00:00"
      ? loadPart.time1.slice(0, 5) : ""
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    if (!date) return;
    setSubmitting(true);
    setError(null);
    try {
      const routepartsDates = {};
      const routepartsTimes = {};
      (card.routeparts || []).forEach((p) => {
        if (!p.id) return;
        if (p.workaction === 1) {
          routepartsDates[p.id] = date;
          routepartsTimes[p.id] = time ? (time.length === 5 ? `${time}:00` : time) : "00:00:00";
        } else {
          if (p.date1 && p.date1 !== "0000-00-00") routepartsDates[p.id] = p.date1;
          routepartsTimes[p.id] = p.time1 || "00:00:00";
        }
      });
      await postSubscribeRoute({ route: card.periodic, routepartsDates, routepartsTimes });
      onSuccess?.();
      onClose();
    } catch (e) {
      setError(e?.response?.data?.error || "Помилка відправки");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="aam-overlay" onClick={onClose}>
      <div className="sub-modal" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="sub-modal__header">
          <button className="aam-modal__close" onClick={onClose}>×</button>
        </div>

        <div className="sub-modal__body">
          {/* Status + location */}
          <div className="sub-modal__top">
            <div className="sub-modal__subtitle">Підпишіться на виконання рейсу.</div>
            {address && (
              <div className="sub-modal__address">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                {address}
              </div>
            )}
          </div>

          {/* Date / time form */}
          <div className="sub-modal__section">
            <div className="sub-modal__section-title">Укажіть заплановану дату та час завантаження</div>
            <div className="aam-field">
              <label className="aam-field__label">Дата завантаження</label>
              <input type="date" className="aam-field__select" value={date}
                onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="aam-field">
              <label className="aam-field__label">Час завантаження</label>
              <input type="time" className="aam-field__select" value={time}
                onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>

          {/* Submit */}
          <button
            className="aam-btn aam-btn--primary sub-modal__submit"
            onClick={handleSubmit}
            disabled={submitting || !date}
          >
            {submitting ? "Відправка..." : "Підписатися на виконання маршруту"}
          </button>
          {error && <p className="aam-modal__error">{error}</p>}

          {/* Price info */}
          {(price || kmprice || payment) && (
            <div className="sub-modal__prices">
              {price    && <div className="sub-modal__price-row"><span>Ціна за рейс</span><span>₴{price}</span></div>}
              {kmprice  && <div className="sub-modal__price-row"><span>Ціна за км</span><span>₴{kmprice}</span></div>}
              {payment  && <div className="sub-modal__price-row"><span>Метод оплати</span><span>{payment}{nds}</span></div>}
            </div>
          )}

          {/* Vehicle summary */}
          {(driver || car?.number || trailer?.number) && (
            <div className="sub-modal__vehicle-summary">
              {driver && (
                <div className="sub-modal__vs-row">
                  <span className="sub-modal__vs-label">Водій</span>
                  <span className="sub-modal__vs-value">
                    {[driver.lastname, driver.firstname].filter(Boolean).join(" ")}
                    {driver.maincellphone && (
                      <span className="sub-modal__vs-sub">{driver.maincellphone}</span>
                    )}
                  </span>
                </div>
              )}
              {car?.number && (
                <div className="sub-modal__vs-row">
                  <span className="sub-modal__vs-label">Авто</span>
                  <span className="sub-modal__vs-value">
                    <span className="fi fi-ua" />
                    <span className="sub-modal__card-plates">{car.number}</span>
                    {car.make_relation?.title_ru && <span>{car.make_relation.title_ru}</span>}
                  </span>
                </div>
              )}
              {trailer?.number && (
                <div className="sub-modal__vs-row">
                  <span className="sub-modal__vs-label">Причіп</span>
                  <span className="sub-modal__vs-value">
                    <span className="fi fi-ua" />
                    <span className="sub-modal__card-plates">{trailer.number}</span>
                    {trailer.model && <span>{trailer.model}</span>}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function vehicleFromResponse(resp) {
  if (!resp) return null;
  const car = resp.car_relation;
  const trailer = resp.trailer_relation;
  const driver = resp.driver_relation;
  if (!car?.number) return null;
  return {
    truck: { plates: car.number },
    trailer: trailer?.number ? { plates: trailer.number } : null,
    driver: driver
      ? {
          full_name: [driver.firstname, driver.lastname].filter(Boolean).join(" "),
          phone_number: driver.maincellphone || null,
        }
      : null,
  };
}

function ChildRouteCard({ card, actions, parentPeriodic, cs, onRefresh }) {
  const navigate = useNavigate();
  const [addAutoOpen, setAddAutoOpen] = useState(false);
  const [subscribeOpen, setSubscribeOpen] = useState(false);
  const [assignedVehicle, setAssignedVehicle] = useState(null);
  const [liveActions, setLiveActions] = useState(null);
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [creating, setCreating] = useState(false);

  const handleCreateOrder = async (e) => {
    e.stopPropagation();
    setCreating(true);
    try {
      const { data } = await axios.post("/api/import/routes/", {
        routeId: card.periodic,
        platform: "sovtes",
      });
      toast.success(data.message || "Маршрут додано в систему!");
      navigate("/orders");
    } catch (err) {
      toast.error(err.response?.data?.error || "Помилка створення маршруту");
    } finally {
      setCreating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(card.periodic).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const toggle = (e) => { e?.stopPropagation(); setExpanded((v) => !v); };

  // Re-fetch route actions when Pusher fires an event for this specific route
  const handleRealtimeEvent = useCallback((event) => {
    const periodicStr = String(card.periodic);
    const idStr = String(card.id);
    const match =
      (event.periodic != null && String(event.periodic) === periodicStr) ||
      (event.route_id  != null && String(event.route_id)  === idStr) ||
      (event.route     != null && String(event.route)     === periodicStr) ||
      (event.id        != null && String(event.id)        === idStr);
    if (!match) return;
    fetchRouteActions([card.periodic])
      .then((acts) => { if (acts?.[card.periodic]) setLiveActions(acts[card.periodic]); })
      .catch(() => {});
  }, [card.periodic, card.id]);

  useSovtesEvents(handleRealtimeEvent);

  // Prefer data already on the card (from API), fall back to optimistic state
  const displayVehicle =
    vehicleFromResponse(card.routeresponse_relation?.[0]) ?? assignedVehicle;

  const effectiveActions = liveActions ?? actions;
  const { loads, unloads } = extractCities(card);
  const loadPart = (card.routeparts || []).find((p) => p.workaction === 1);
  const loadDate = fmtDate(loadPart?.date1);
  const unloadPart = (card.routeparts || []).find((p) => p.workaction === 2);
  const unloadDate = fmtDate(unloadPart?.date1);

  const cargo = loadPart?.cargo || card.cargo || null;
  const rawW = loadPart?.weight ?? loadPart?.cargoweight ?? null;
  const weight = rawW != null ? parseFloat(rawW) || null : null;

  const cartypes = (() => {
    if (Array.isArray(card.cartype) && card.cartype.length > 0) return card.cartype.map(String).filter(Boolean);
    const arr = card.cartypeRelation ?? null;
    if (Array.isArray(arr)) return arr.map((c) => c?.carTypeTitle || c?.title || null).filter(Boolean);
    return [];
  })();

  const loadingType = (() => {
    const ct = card.chargetype;
    if (Array.isArray(ct) && ct.length > 0) return ct.join(", ");
    if (ct && typeof ct === "string") return ct;
    return null;
  })();

  const price = fmtPrice(card.budget);
  const kmprice = card.kmprice ? parseFloat(card.kmprice).toFixed(2) : null;
  const distance = card.distance || null;

  const statusText = effectiveActions?.status?.drawroutestatus || null;
  const actionBtns = (effectiveActions?.actions || []).filter(
    (btn) => btn.text !== "Відмовитися"
  );

  const contextTitle = card.context?.title || null;
  const tenderParent = card.context?.tenderparent || card.tenderparent || parentPeriodic;

  const payor = card.payorcompanyRelation?.title_ru || card.companydata?.title_ru || null;

  return (
    <div className="crc">
      <div className="crc__body">
        {/* Route */}
        <div className="crc__route">
          {loads.map((loc, i) => (
            <div key={`l${i}`} className="crc__loc">
              <span className="crc__dot crc__dot--load" />
              <span className="crc__city">
                {loc.flag && <span className={`fi fi-${loc.flag}`} />}
                {loc.city}
              </span>
            </div>
          ))}
          {unloads.map((loc, i) => (
            <div key={`u${i}`} className="crc__loc">
              <span className="crc__dot crc__dot--unload" />
              <span className="crc__city">
                {loc.flag && <span className={`fi fi-${loc.flag}`} />}
                {loc.city}
              </span>
            </div>
          ))}
        </div>

        {/* Meta */}
        <div className="crc__meta">
          {loadDate && (
            <span className="crc__meta-row">
              <span className="crc__meta-label">Завантаження:</span> {loadDate}
            </span>
          )}
          {unloadDate && (
            <span className="crc__meta-row">
              <span className="crc__meta-label">Розвантаження:</span> {unloadDate}
            </span>
          )}
          {distance && (
            <span className="crc__meta-row">
              <span className="crc__meta-label">Відстань:</span>{" "}
              <strong>{distance} км</strong>
            </span>
          )}
          {cargo && (
            <span className="crc__meta-row">
              <span className="crc__meta-label">Вантаж:</span> {cargo}
            </span>
          )}
        </div>

        {/* Vehicle info OR details */}
        {displayVehicle ? (
          <div className="crc__vehicle">
            <AssignedVehicle vehicle={displayVehicle} />
          </div>
        ) : (
        <div className="crc__details">
          <span className="crc__detail-row">
            <span className="crc__detail-label">Тип авто:</span>{" "}
            {cartypes.length > 0 ? cartypes.join(", ") : <span className="crc__na">не вказано</span>}
          </span>
          <span className="crc__detail-row">
            <span className="crc__detail-label">Тип завантаження:</span>{" "}
            {loadingType || <span className="crc__na">не вказано</span>}
          </span>
          {weight && (
            <span className="crc__detail-row">
              <span className="crc__detail-label">Вага:</span>{" "}
              <strong>{weight} т</strong>
            </span>
          )}
        </div>
        )}

        {/* Status + actions */}
        <div className="crc__actions-col">
          {!displayVehicle && price && (
            <div className="crc__price">{cs}{price}</div>
          )}
          {!displayVehicle && kmprice && (
            <div className="crc__kmprice">{cs}{kmprice} / км</div>
          )}
          {statusText && <div className="crc__status-text">{statusText}</div>}
          <div className="crc__btns">
            {actionBtns.map((btn, i) => {
              const isOfferAuto   = btn.endpoint === "offerAuto";
              const isSubscribe   = btn.text?.includes("Підписат");
              return (
                <button
                  key={i}
                  className={`crc__btn${i === 0 ? " crc__btn--primary" : " crc__btn--ghost"}`}
                  onClick={() => {
                    if (isOfferAuto) setAddAutoOpen(true);
                    else if (isSubscribe) setSubscribeOpen(true);
                  }}
                >
                  {isOfferAuto && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="1" y="3" width="15" height="13" rx="1"/>
                      <path d="M16 8h5l2 4v4h-7V8z"/>
                      <circle cx="5.5" cy="18.5" r="2.5"/>
                      <circle cx="18.5" cy="18.5" r="2.5"/>
                    </svg>
                  )}
                  {btn.text}
                  {i === 0 && <span className="crc__btn-arrow">→</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="tc__footer">
        <div className="tc__footer-left">
          <span className="tc__tender-num">№ {card.periodic}</span>
          <button
            className={`tc__copy-btn${copied ? " tc__copy-btn--done" : ""}`}
            title="Скопіювати номер"
            onClick={handleCopy}
          >
            {copied
              ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            }
          </button>
          {payor && (
            <>
              <span className="tc__footer-sep">|</span>
              <span className="tc__footer-company">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
                {payor}
              </span>
              <span className="tc__footer-sep">|</span>
              <span className="tc__footer-payor">
                <span className="tc__footer-payor-label">Платник:</span> {payor}
              </span>
            </>
          )}
          {tenderParent && (
            <>
              <span className="tc__footer-sep">|</span>
              <Link
                className="fo-tender-ref-link"
                to={`/platforms/sovtes/${tenderParent}`}
                onClick={(e) => e.stopPropagation()}
              >
                ↑↓ Для вас згідно тендера №{tenderParent}
              </Link>
            </>
          )}
        </div>
        <div className="tc__footer-right">
          <button
            className="tc__expand-btn tc__expand-btn--create"
            onClick={handleCreateOrder}
            disabled={creating}
          >
            {creating ? "Створення..." : "Створити маршрут"}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
          <button className="tc__expand-btn" onClick={toggle}>
            Детальніше
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              {expanded
                ? <polyline points="18 15 12 9 6 15"/>
                : <polyline points="6 9 12 15 18 9"/>
              }
            </svg>
          </button>
        </div>
      </div>

      {expanded && (
        <div className="tc__expanded-row">
          {(card.routeparts || []).map((part, idx) => {
            const rel = part.checkpoint_relation;
            if (!rel) return null;
            const isLoad = part.workaction === 1;
            const city    = rel.town_relation?.title_ru   || rel.town_relation?.title   || "";
            const region  = rel.region_relation?.title_ru || rel.region_relation?.title || "";
            const country = rel.country_relation?.title_ru|| rel.country_relation?.title|| "";
            const street  = rel.address || "";
            const fullAddr = [street, city, region, country].filter(Boolean).join(", ");
            const flag = isoToFlag(rel.country_relation?.iso_code);
            const dateStr = fmtDate(part.date1);
            const rawTime = part.timefrom || part.time1 || null;
            const timeStr = rawTime ? String(rawTime).slice(0, 5).replace("00:00", "") || null : null;
            const partCargo = part.cargo || null;
            const partRawW = part.weight ?? part.cargoweight ?? null;
            const partWeight = partRawW != null ? parseFloat(partRawW) || null : null;
            return (
              <div key={idx} className="tc__stop">
                <div className="tc__stop-header">
                  <span className={`tc__stop-badge tc__stop-badge--${isLoad ? "load" : "unload"}`}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      {isLoad
                        ? <><line x1="12" y1="5" x2="12" y2="19"/><polyline points="5 12 12 19 19 12"/></>
                        : <><line x1="12" y1="19" x2="12" y2="5"/><polyline points="19 12 12 5 5 12"/></>
                      }
                    </svg>
                  </span>
                  <span className="tc__stop-num-label">{idx + 1}</span>
                  <span className={`tc__stop-action tc__stop-action--${isLoad ? "load" : "unload"}`}>
                    {isLoad ? "Завантаження" : "Розвантаження"}
                  </span>
                  {flag && <span className={`fi fi-${flag}`} />}
                  {dateStr && (
                    <span className="tc__stop-date">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                      {dateStr}
                    </span>
                  )}
                  {timeStr && (
                    <span className="tc__stop-time">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                      </svg>
                      {timeStr}
                    </span>
                  )}
                </div>
                {fullAddr && <div className="tc__stop-address">{fullAddr}</div>}
                {isLoad && (partCargo || partWeight != null) && (
                  <div className="tc__stop-cargo">
                    {partCargo && (
                      <span className="tc__stop-cargo-name">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                        </svg>
                        {partCargo}
                      </span>
                    )}
                    {partWeight != null && <span className="tc__stop-weight">Вага: {partWeight} т</span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {addAutoOpen && (
        <AddAutoModal
          route={card.periodic}
          routeparts={card.routeparts || []}
          onClose={() => setAddAutoOpen(false)}
          onSuccess={(vehicleData) => { setAddAutoOpen(false); setAssignedVehicle(vehicleData); onRefresh?.(); }}
        />
      )}

      {subscribeOpen && (
        <SubscribeModal
          card={card}
          onClose={() => setSubscribeOpen(false)}
          onSuccess={() => { setSubscribeOpen(false); onRefresh?.(); }}
        />
      )}
    </div>
  );
}

// ─── Tab: Маршрути ────────────────────────────────────────────────────────────

function RoutesTab({ parentPeriodic, parentCs, onRefresh }) {
  const [children, setChildren] = useState(null);
  const [actions, setActions] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTenderChildren(parentPeriodic)
      .then(async (stubs) => {
        if (!stubs || stubs.length === 0) {
          setChildren([]);
          return;
        }
        const periodics = stubs.map((s) => s.periodic).filter(Boolean);
        const [cards, acts] = await Promise.all([
          fetchBasicDetails(periodics),
          fetchRouteActions(periodics),
        ]);
        setChildren(Array.isArray(cards) ? cards : []);
        setActions(acts || {});
      })
      .catch(() => setError("Не вдалося завантажити маршрути"))
      .finally(() => setLoading(false));
  }, [parentPeriodic]);

  if (loading) return <div className="std-tab-panel std-tab-panel--center">Завантаження...</div>;
  if (error) return <div className="std-tab-panel std-tab-panel--center std-tab-panel--error">{error}</div>;
  if (!children || children.length === 0) {
    return (
      <div className="std-tab-panel std-tab-panel--center">
        Маршрути ще не створені для цього тендеру.
      </div>
    );
  }

  return (
    <div className="std-tab-panel std-tab-panel--routes">
      {children.map((card) => (
        <ChildRouteCard
          key={card.periodic}
          card={card}
          actions={actions[card.periodic]}
          parentPeriodic={parentPeriodic}
          cs={parentCs}
          onRefresh={onRefresh}
        />
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const TABS = [
  { key: "routes", label: "Маршрути" },
  { key: "details", label: "Деталі" },
];

export default function SovtesTenderDetailPage() {
  const { periodic } = useParams();
  const navigate = useNavigate();
  const [card, setCard] = useState(null);
  const [childCount, setChildCount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("routes");

  useEffect(() => {
    Promise.all([
      fetchBasicDetails([periodic]),
      fetchTenderChildren(periodic),
    ])
      .then(([items, children]) => {
        setCard(Array.isArray(items) ? (items[0] ?? null) : null);
        setChildCount(Array.isArray(children) ? children.length : 0);
      })
      .catch(() => setError("Не вдалося завантажити тендер"))
      .finally(() => setLoading(false));
  }, [periodic]);

  if (loading) return <div className="std-page std-page--center">Завантаження...</div>;
  if (error || !card) return <div className="std-page std-page--center">{error || "Тендер не знайдено"}</div>;

  const currency = (card.defaultcurrency || "UAH").toUpperCase();
  const cs = currSym(currency);
  const title = routeTitle(card);
  const payor = card.client_relation?.company_relation?.title_ru || card.companydata?.title_ru || null;

  return (
    <div className="std-page">
      {/* Breadcrumb */}
      <div className="std-breadcrumb">
        <button className="std-breadcrumb__back" onClick={() => navigate("/platforms/sovtes")}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <button className="std-breadcrumb__link" onClick={() => navigate("/platforms/sovtes")}>
          Тендери
        </button>
        <span className="std-breadcrumb__sep">/</span>
        <span className="std-breadcrumb__current">№ {periodic}</span>
      </div>

      {/* Header */}
      {payor && (
        <div className="std-header">
          <div className="std-header__left">
            <div className="std-header__company">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              {payor}
            </div>
            <div className="std-header__payor">
              <span className="std-header__payor-label">Платник</span> {payor}
            </div>
          </div>
        </div>
      )}

      {/* Title */}
      <h1 className="std-title">{title}</h1>

      {/* Tabs + content */}
      <div className="std-layout">
        <div className="std-main">
          <div className="std-tabs">
            {TABS.map((t) => (
              <button
                key={t.key}
                className={`std-tab${activeTab === t.key ? " std-tab--active" : ""}`}
                onClick={() => setActiveTab(t.key)}
              >
                {t.label}
                {t.key === "routes" && childCount != null && childCount > 0 && (
                  <span className="std-tab__badge">{childCount}</span>
                )}
              </button>
            ))}
          </div>

          {activeTab === "details" && <DetailsTab card={card} cs={cs} />}
          {activeTab === "routes" && (
            <RoutesTab
              parentPeriodic={periodic}
              parentCs={cs}
              onRefresh={() => window.location.reload()}
            />
          )}
        </div>

        <TenderSidebar card={card} cs={cs} />
      </div>
    </div>
  );
}
