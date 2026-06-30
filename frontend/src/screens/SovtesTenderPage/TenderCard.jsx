import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchTenderSteps,
  postPricequote,
  postBookmark,
  postNotInterested,
  postCancelPricequote,
  postRevivePricequote,
} from "./tendersService";

// ─── ISO alpha-3 → alpha-2 for flag icons ─────────────────────────────────────

const ISO3_TO_2 = {
  UKR: "ua", POL: "pl", DEU: "de", FRA: "fr", ITA: "it", ESP: "es",
  AUT: "at", HUN: "hu", ROU: "ro", CZE: "cz", SVK: "sk", BLR: "by",
  LTU: "lt", LVA: "lv", EST: "ee", GBR: "gb", NLD: "nl", BEL: "be",
  TUR: "tr", GEO: "ge", MDA: "md", BGR: "bg", SRB: "rs", HRV: "hr",
  SVN: "si", CHE: "ch", NOR: "no", SWE: "se", DNK: "dk", FIN: "fi",
  RUS: "ru", KAZ: "kz", ARM: "am", AZE: "az", LUX: "lu", PRT: "pt",
  GRC: "gr", CYP: "cy", IRL: "ie",
};

function isoToFlag(iso3) {
  if (!iso3) return null;
  return ISO3_TO_2[iso3.toUpperCase()] ?? null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toStr(val) {
  if (val === null || val === undefined) return null;
  if (typeof val === "object") {
    if ("date" in val || "time" in val) return [val.date, val.time].filter(Boolean).join(" ");
    return null;
  }
  return String(val);
}

function fmtPrice(val) {
  const n = parseFloat(val);
  if (isNaN(n)) return null;
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

// "YYYY-MM-DD" → "DD.MM.YYYY"
function fmtDate(dateStr) {
  if (!dateStr || dateStr === "0000-00-00") return null;
  const [y, m, d] = dateStr.split("-");
  return `${d}.${m}.${y}`;
}

// "YYYY-MM-DD HH:MM:SS" → "DD.MM.YYYY HH:MM:SS"
function fmtMoment(val) {
  if (!val) return "";
  const s = toStr(val);
  if (!s) return "";
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}:\d{2}:\d{2})/);
  if (m) return `${m[3]}.${m[2]}.${m[1]} ${m[4]}`;
  return s;
}

// "YYYY-MM-DD HH:MM:SS" → "DD.MM.YYYY HH:MM"
function fmtDeadline(val) {
  if (!val) return null;
  const s = toStr(val);
  if (!s) return null;
  const match = s.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}:\d{2})/);
  if (match) return `${match[3]}.${match[2]}.${match[1]} ${match[4]}`;
  return s;
}

// Suffix label shown after the amount (e.g. "7 500 грн"), dynamic per tender's currency
function currLabel(code) {
  switch ((code || "").toUpperCase()) {
    case "UAH": return "грн";
    case "EUR": return "EUR";
    case "USD": return "USD";
    default: return code || "";
  }
}

// ─── Status calculation ────────────────────────────────────────────────────────

function calcStatus(card) {
  const routestatus = card.routestatus;
  const winnerstatus = card.routetender?.winnerstatus;
  const minquote = card.minquote;
  const passed = card.tenderavailableuntilmoment_passed;

  const isRouteDisabled = routestatus === -1;
  const isIamWinner = winnerstatus === 2;
  const isTenderHaveWinner = winnerstatus === 1;
  const isTenderHaveNoWinner = winnerstatus === 0;

  const isLost = isRouteDisabled && isTenderHaveWinner && !isIamWinner;
  const isLosing = !minquote?.mine && !!minquote && !isLost && !passed;
  const isWinning = !!minquote?.mine && !!minquote && !isLost && !passed;
  const isNoBid = !minquote;
  const isWin = isIamWinner && !!minquote && isRouteDisabled;
  const isWinnerNotDetermined = isTenderHaveNoWinner && isRouteDisabled;
  const isWinnerNotDeterminedButFinished = isTenderHaveNoWinner && passed;
  const isBidDisabled = isWinning || isLost || isWin || isWinnerNotDetermined || passed;

  return {
    isLost, isLosing, isWinning, isNoBid, isWin,
    isWinnerNotDetermined, isWinnerNotDeterminedButFinished, isBidDisabled,
    passed,
  };
}

// ─── Location extraction ──────────────────────────────────────────────────────

function extractLocations(card) {
  const parts = card.routeparts || [];
  const loading = [];
  const unloading = [];

  parts.forEach((p) => {
    const rel = p.checkpoint_relation;
    if (!rel) return;
    const city = rel.town_relation?.title_ru || rel.town_relation?.title || "";
    const flag = isoToFlag(rel.country_relation?.iso_code);
    if (city) {
      const loc = { city, flag };
      if (p.workaction === 1) loading.push(loc);
      else if (p.workaction === 2) unloading.push(loc);
    }
  });

  return { loading, unloading };
}

// ─── Countdown timer ──────────────────────────────────────────────────────────

function CountdownTimer({ until }) {
  const [remaining, setRemaining] = useState(null);

  useEffect(() => {
    if (!until) return;
    const target = new Date(until.replace(" ", "T"));

    const tick = () => {
      const diff = target - Date.now();
      if (diff <= 0) { setRemaining(null); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining({ d, h, m, s });
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [until]);

  if (!remaining) return null;
  const p = (n) => String(n).padStart(2, "0");
  const isUrgent = remaining.d === 0 && remaining.h === 0;
  return (
    <span className={`tc-countdown${isUrgent ? " tc-countdown--urgent" : ""}`}>
      {remaining.d > 0 && <>{remaining.d} д </>}
      {p(remaining.h)}:{p(remaining.m)}:{p(remaining.s)}
    </span>
  );
}

// ─── Bid modal ────────────────────────────────────────────────────────────────

function BidModal({ card, steps, currency, onClose, onSuccess }) {
  const maxPrice = parseFloat(card.maxquotewithcommission) || 0;
  const stepVal = parseFloat(card.stepwithcommission) || 100;
  const priceOptions = steps?.length
    ? steps
    : Array.from({ length: 10 }, (_, i) => +(maxPrice - stepVal * i).toFixed(2)).filter((v) => v > 0);

  const [price, setPrice] = useState(priceOptions[0] ?? maxPrice);
  const [qty, setQty] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await postPricequote(card.periodic, price, qty);
      onSuccess?.();
      onClose();
    } catch (e) {
      setError(e?.response?.data?.error || "Помилка відправки ставки");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bid-modal-overlay" onClick={onClose}>
      <div className="bid-modal" onClick={(e) => e.stopPropagation()}>
        <div className="bid-modal__header">
          <strong>Зробити ставку</strong>
          <button className="bid-modal__close" onClick={onClose}>×</button>
        </div>
        <label className="bid-modal__label">
          Ставка за 1 рейс
          <select value={price} onChange={(e) => setPrice(Number(e.target.value))}>
            {priceOptions.map((p) => (
              <option key={p} value={p}>{p} {currLabel(currency)}</option>
            ))}
          </select>
        </label>
        <label className="bid-modal__label">
          Кількість рейсів
          <input type="number" min={1} value={qty} onChange={(e) => setQty(Number(e.target.value))} />
        </label>
        {error && <p className="bid-modal__error">{error}</p>}
        <div className="bid-modal__actions">
          <button onClick={onClose} className="tc-btn tc-btn--ghost">Скасувати</button>
          <button onClick={handleSubmit} disabled={submitting} className="tc-btn tc-btn--primary">
            {submitting ? "Відправка..." : "Підтвердити"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Pricequotes panel ────────────────────────────────────────────────────────

function PricequotesPanel({ card, cs, onClose }) {
  // card.response has isMine per bid; sort lowest price (best) first
  const raw = card.response ?? card.routeresponse_relation ?? [];
  const quotes = [...raw].sort(
    (a, b) => (a.pricequotewithcommission ?? 0) - (b.pricequotewithcommission ?? 0)
  );
  const totalCount = Math.round(parseFloat(card.routetender?.totalcount) || 1);

  return (
    <div className="bid-modal-overlay" onClick={onClose}>
      <div className="bid-modal bid-modal--wide" onClick={(e) => e.stopPropagation()}>
        <div className="bid-modal__header">
          <strong>Всі пропозиції: тендер № {card.periodic}</strong>
          <button className="bid-modal__close" onClick={onClose}>×</button>
        </div>
        {quotes.length === 0
          ? <p className="bid-modal__msg">Ставок немає</p>
          : (
            <table className="quotes-table">
              <thead>
                <tr>
                  <th></th>
                  <th>Ставка</th>
                  <th>Рейсів</th>
                  <th>Дата і час</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {quotes.map((q, i) => {
                  const price = q.pricequotewithcommission ?? q.pricequote ?? q.price ?? null;
                  const isMine = q.isMine ?? q.mine ?? false;
                  return (
                    <tr key={q.id ?? i} className={isMine ? "quotes-table__row--mine" : ""}>
                      <td className="quotes-table__num">{i + 1}</td>
                      <td className="quotes-table__price">{fmtPrice(price)}&nbsp;{cs}</td>
                      <td className="quotes-table__qty">1 / {totalCount}</td>
                      <td className="quotes-table__date">{fmtMoment(q.moment)}</td>
                      <td className="quotes-table__badge">
                        {isMine && <span className="quotes-mine-badge">Ваша</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )
        }
      </div>
    </div>
  );
}

// ─── Main TenderCard ──────────────────────────────────────────────────────────

export default function TenderCard({ card, onRefresh, onBookmark }) {
  const [expanded, setExpanded] = useState(false);
  const [bidModal, setBidModal] = useState(false);
  const [bidSteps, setBidSteps] = useState(null);
  const [showQuotes, setShowQuotes] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [copied, setCopied] = useState(false);
  const [localBookmarked, setLocalBookmarked] = useState(null); // null = not set yet

  const navigate = useNavigate();
  const status = calcStatus(card);
  const { loading: loadingLocs, unloading: unloadingLocs } = extractLocations(card);

  // ── Derived values ─────────────────────────────────────────────────────────

  const currency = (card.defaultcurrency || "UAH").toUpperCase();
  const cs = currLabel(currency);

  const maxPriceNum = parseFloat(card.maxquotewithcommission) || null;
  // currentminpricewithcommission updates on each new bid via socket → card refresh
  const currentMinPrice = parseFloat(card.routetender?.currentminpricewithcommission) || maxPriceNum;
  const currentMinPriceFmt = fmtPrice(currentMinPrice);

  const stepVal = parseFloat(card.stepwithcommission) || 0;
  const bidButtonPrice = currentMinPrice
    ? fmtPrice(Math.max(currentMinPrice - stepVal, 1))
    : null;

  const distance = card.distance || card.km || card.routetender?.km || null;
  const pricePerKm = distance && currentMinPrice
    ? (currentMinPrice / parseFloat(distance)).toFixed(2)
    : null;

  // totalcount = trip slots; card.response = bids with isMine (richer than routeresponse_relation)
  const trips = Math.round(parseFloat(card.routetender?.totalcount ?? 0) || 0);
  const totalBids = (card.response ?? card.routeresponse_relation ?? []).length;
  const hasBids = totalBids > 0;

  // minquote has pricequotewithcommission, not value
  const myBidNum = card.minquote?.mine
    ? parseFloat(card.minquote?.pricequotewithcommission ?? card.minquote?.value)
    : null;
  const myBidFmt = fmtPrice(myBidNum);

  const loadPart = card.routeparts?.find((p) => p.workaction === 1);
  const loadDate = loadPart?.date1 ? fmtDate(loadPart.date1) : null;
  const cargo =
    loadPart?.cargo ||
    card.cargo ||
    card.cargoname ||
    null;
  // routeparts[i].weight = "20.000" (string); cargoweight doesn't exist in this API
  const rawWeight = loadPart?.weight ?? loadPart?.cargoweight ?? card.cargoweight ?? card.weight ?? null;
  const weight = rawWeight != null ? parseFloat(rawWeight) || null : null;
  const loadingType = (() => {
    const fromPart =
      loadPart?.loadingtypeRelation?.title_ru ||
      loadPart?.loadingtypeRelation?.title ||
      loadPart?.loaderaction_relation?.title_ru ||
      loadPart?.loaderaction_relation?.title ||
      loadPart?.loadingtype_relation?.title_ru ||
      loadPart?.loadingtype_relation?.title ||
      null;
    if (fromPart) return fromPart;
    // card.chargetype = ["верхня"] — array of strings
    const ct = card.chargetype;
    if (Array.isArray(ct) && ct.length > 0) return ct.join(", ");
    if (ct && typeof ct === "string") return ct;
    return null;
  })();

  // card.cartype = ["тент"] (string array) takes priority over relation objects
  const cartypes = (() => {
    if (Array.isArray(card.cartype) && card.cartype.length > 0) {
      return card.cartype.map(String).filter(Boolean);
    }
    const arr = card.cartypeRelation ?? card.cartype_relation ?? card.cartypes ?? null;
    if (Array.isArray(arr)) {
      return arr.map((c) => {
        if (!c) return null;
        if (typeof c === "string") return c;
        return c.carTypeTitle || c.title_ru || c.title || c.name || null;
      }).filter(Boolean);
    }
    return [];
  })();

  const deadlineStr = fmtDeadline(card.tenderavailableuntilmoment) ?? fmtDeadline(card.tenderuntil);
  const countdownUntil = toStr(card.tenderavailableuntilmoment) ?? toStr(card.tenderuntil) ?? null;

  const payor =
    card.client_relation?.company_relation?.title_ru ||
    card.companydata?.title_ru ||
    null;

  const isBlind = card.blindtender;
  const hasMyBid = card.hasMyQuotes || !!myBidNum;

  const canBid =
    (!isBlind && !status.isBidDisabled) ||
    (isBlind && !hasMyBid && !status.isBidDisabled);

  const paymentTitle = card.paymenttypeRelation?.title || null;

  // ── Actions ───────────────────────────────────────────────────────────────

  const handleBidClick = async (e) => {
    e.stopPropagation();
    setActionLoading("bid");
    try {
      const steps = await fetchTenderSteps(card.periodic);
      setBidSteps(Array.isArray(steps) ? steps : null);
    } catch (_) {
      setBidSteps(null);
    } finally {
      setActionLoading(null);
    }
    setBidModal(true);
  };

  const handleBookmark = async (e) => {
    e.stopPropagation();
    setActionLoading("bookmark");
    try {
      await postBookmark({ route: card.periodic });
      // Optimistic update: mark as bookmarked immediately in local state and in parent list
      setLocalBookmarked(true);
      onBookmark?.(card.periodic);
      // Then give Sovtes ~800ms to propagate the contextstatus change before full re-fetch
      setTimeout(() => onRefresh?.(), 800);
    }
    catch (_) {} finally { setActionLoading(null); }
  };

  const handleHide = async (e) => {
    e.stopPropagation();
    setActionLoading("hide");
    try { await postNotInterested({ route: card.periodic }); onRefresh?.(); }
    catch (_) {} finally { setActionLoading(null); }
  };

  const handleCancelBid = async (e) => {
    e.stopPropagation();
    setActionLoading("cancel");
    try { await postCancelPricequote({ route: card.periodic }); onRefresh?.(); }
    catch (_) {} finally { setActionLoading(null); }
  };

  const handleReviveBid = async (e) => {
    e.stopPropagation();
    setActionLoading("revive");
    try { await postRevivePricequote({ route: card.periodic }); onRefresh?.(); }
    catch (_) {} finally { setActionLoading(null); }
  };

  const handleCopyNumber = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(String(card.periodic)).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const toggle = (e) => { e?.stopPropagation(); setExpanded((v) => !v); };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <div className={`tc ${expanded ? "tc--expanded" : ""}`}>

        {/* ── Body (5-column grid) ──────────────────────────────────────── */}
        <div className="tc__body">

          {/* Col 1: Route timeline (cities only) */}
          <div className="tc__route" onClick={toggle}>
            <div className="tc__timeline">
              {loadingLocs.map((loc, i) => (
                <div key={`l${i}`} className="tc__timeline-point">
                  <span className="tc__timeline-dot tc__timeline-dot--load" />
                  <span className="tc__timeline-city">
                    {loc.flag && <span className={`fi fi-${loc.flag}`} />}
                    {loc.city}
                  </span>
                </div>
              ))}
              {unloadingLocs.map((loc, i) => (
                <div key={`u${i}`} className="tc__timeline-point">
                  <span className="tc__timeline-dot tc__timeline-dot--unload" />
                  <span className="tc__timeline-city">
                    {loc.flag && <span className={`fi fi-${loc.flag}`} />}
                    {loc.city}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Col 2: Route meta (date, distance, cargo) */}
          <div className="tc__route-meta" onClick={toggle}>
            {loadDate && (
              <span className="tc__meta-row">
                <span className="tc__meta-label">Завантаження:</span> {loadDate}
              </span>
            )}
            {distance && (
              <span className="tc__meta-row">
                <span className="tc__meta-label">Відстань:</span>{" "}
                <strong>{distance} км</strong>
              </span>
            )}
            {cargo && (
              <span className="tc__meta-row">
                <span className="tc__meta-label">Вантаж:</span> {cargo}
              </span>
            )}
          </div>

          {/* Col 3: Cargo/vehicle details */}
          <div className="tc__details" onClick={toggle}>
            <span className="tc__detail-row">
              <span className="tc__detail-label">Тип авто:</span>{" "}
              {cartypes.length > 0 ? cartypes.join(", ") : <span className="tc__detail-na">не вказано</span>}
            </span>
            <span className="tc__detail-row">
              <span className="tc__detail-label">Тип завантаження:</span>{" "}
              {loadingType || <span className="tc__detail-na">не вказано</span>}
            </span>
            {weight != null && (
              <span className="tc__detail-row">
                <span className="tc__detail-label">Вага:</span> <strong>{weight} т</strong>
              </span>
            )}
          </div>

          {/* Col 3: Timing */}
          <div className="tc__timing" onClick={toggle}>
            <span className="tc__timing-label">Тендер:</span>
            {deadlineStr && <span className="tc__deadline">До {deadlineStr}</span>}
            {status.isWin && <span className="tc__timing-win">ви перемогли!</span>}
            {status.passed
              ? <span className="tc__timing-finished">Завершено</span>
              : <CountdownTimer until={countdownUntil} />
            }
          </div>

          {/* Col 4: Price + actions */}
          <div className="tc__action-col">

            {/* Price row: check/warning + current price + bid count | icons */}
            <div className="tc__price-header">
              <div className="tc__price-main">
                {status.isWin
                  ? (
                    <svg className="tc__win-check" width="17" height="17" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="11" fill="#22c55e"/>
                      <polyline points="7 12 10 15 17 8" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )
                  : hasBids && (
                    <svg className="tc__price-warn" width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" fill="#f97316" stroke="#f97316" strokeWidth="1"/>
                      <line x1="12" y1="9" x2="12" y2="13" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/>
                      <line x1="12" y1="17" x2="12.01" y2="17" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  )
                }
                {currentMinPriceFmt && (
                  <span className="tc__current-price">{currentMinPriceFmt}&nbsp;{cs}</span>
                )}
                {totalBids > 0 && (
                  <button
                    className="tc__proposals-badge"
                    onClick={(e) => { e.stopPropagation(); setShowQuotes(true); }}
                    title="Переглянути всі ставки"
                  >
                    {totalBids}
                  </button>
                )}
              </div>
              <div className="tc__icon-btns-vert">
                <button
                  className={`tc-icon-btn${(localBookmarked ?? card.bookmarked) ? " tc-icon-btn--active" : ""}`}
                  title="Відстежувати"
                  onClick={handleBookmark}
                  disabled={actionLoading === "bookmark"}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill={(localBookmarked ?? card.bookmarked) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                  </svg>
                </button>
                <button
                  className="tc-icon-btn"
                  title="Приховати"
                  onClick={handleHide}
                  disabled={actionLoading === "hide"}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            </div>

            {trips > 0 && <span className="tc__trips">Рейсів: {trips}</span>}
            {pricePerKm && (
              <span className="tc__price-per-km">Вартість за км: ~ {pricePerKm}&nbsp;{cs}</span>
            )}

            {/* Bid / blind bid / status */}
            {canBid && bidButtonPrice && (
              <button
                className="tc-bid-btn"
                onClick={handleBidClick}
                disabled={actionLoading === "bid"}
              >
                {actionLoading === "bid"
                  ? "..."
                  : <>{bidButtonPrice}&nbsp;{cs}&nbsp;<span className="tc-bid-btn__arrow">⊕</span></>
                }
              </button>
            )}

            {isBlind && hasMyBid && (
              <div className="tc__blind-actions">
                <button className="tc-btn tc-btn--warn tc-btn--sm" onClick={handleCancelBid} disabled={actionLoading === "cancel"}>
                  {actionLoading === "cancel" ? "..." : "Скасув."}
                </button>
                <button className="tc-btn tc-btn--ghost tc-btn--sm" onClick={handleReviveBid} disabled={actionLoading === "revive"}>
                  {actionLoading === "revive" ? "..." : "Відновити"}
                </button>
              </div>
            )}

            {status.isWin && (
              <button
                className="tc-routes-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/platforms/sovtes/${card.periodic}`);
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="16"/>
                  <line x1="8" y1="12" x2="16" y2="12"/>
                </svg>
                Маршрути ({trips})
              </button>
            )}
            {status.isLost && <span className="tc__status-badge tc__status-badge--lost">Не вибрано</span>}
            {status.isWinning && (
              <div className="tc-winning-badge">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                  <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/>
                  <rect x="2" y="13" width="4" height="9" rx="1" fill="currentColor"/>
                </svg>
                Ваша ставка краща
              </div>
            )}
            {status.isLosing && (
              <div className="tc-losing-badge">
                Є краща пропозиція
              </div>
            )}
            {status.isWinnerNotDeterminedButFinished && (
              <div className="tc-pending-decision">
                Очікується рішення замовника
              </div>
            )}
          </div>
        </div>

        {/* ── Footer row ───────────────────────────────────────────────── */}
        <div className="tc__footer">
          <div className="tc__footer-left">
            <span className="tc__tender-num">№ {card.periodic}</span>
            <button
              className={`tc__copy-btn${copied ? " tc__copy-btn--done" : ""}`}
              title="Скопіювати номер"
              onClick={handleCopyNumber}
            >
              {copied
                ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
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
          </div>
          <div className="tc__footer-right">
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

        {/* ── Expanded detail row ──────────────────────────────────────── */}
        {expanded && (
          <div className="tc__expanded-row">
          <div className="tc__expanded-left">
            {/* Route stops */}
            {(card.routeparts || []).map((part, idx) => {
              const rel = part.checkpoint_relation;
              if (!rel) return null;

              const isLoad = part.workaction === 1;
              const city    = rel.town_relation?.title_ru   || rel.town_relation?.title   || "";
              const region  = rel.region_relation?.title_ru || rel.region_relation?.title || "";
              const country = rel.country_relation?.title_ru|| rel.country_relation?.title|| "";
              const street  = rel.address || rel.street || rel.address_ru || "";
              const fullAddr = [street, city, region, country].filter(Boolean).join(", ");

              const dateStr  = fmtDate(part.date1);
              const rawTime  = part.timefrom || part.time1 || part.time || null;
              const timeStr  = rawTime ? String(rawTime).slice(0, 5) : null;

              const partCargo  = part.cargo || null;
              const partRawW   = part.weight ?? part.cargoweight ?? null;
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
                    <span className={`tc__stop-num-label`}>{idx + 1}</span>
                    <span className={`tc__stop-action tc__stop-action--${isLoad ? "load" : "unload"}`}>
                      {isLoad ? "Завантаження" : "Розвантаження"}
                    </span>
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
                      {partWeight != null && (
                        <span className="tc__stop-weight">Вага: {partWeight} т</span>
                      )}
                    </div>
                  )}

                  {isLoad && idx < (card.routeparts.length - 1) && distance && (
                    <div className="tc__stop-dist">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="2" x2="12" y2="22"/><polyline points="17 7 12 2 7 7"/><polyline points="17 17 12 22 7 17"/>
                      </svg>
                      {distance} км
                    </div>
                  )}
                </div>
              );
            })}

            {/* Extra info */}
            {(paymentTitle || myBidFmt) && (
              <div className="tc__expanded-extra">
                {paymentTitle && <span><strong>Оплата:</strong> {paymentTitle}</span>}
                {myBidFmt && <span><strong>Моя ставка:</strong> {myBidFmt}&nbsp;{cs}</span>}
              </div>
            )}
          </div>

            {/* Customer notes */}
            {card.remark && (
              <div className="tc__expanded-right">
                <div className="tc__notes-panel">
                  <div className="tc__notes-panel__header">
                    <svg className="tc__notes-panel__icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" fill="#e53935"/>
                      <line x1="12" y1="7" x2="12" y2="13" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
                      <line x1="12" y1="16.5" x2="12.01" y2="16.5" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"/>
                    </svg>
                    <strong className="tc__notes-panel__title">Примітки замовника</strong>
                  </div>
                  <p className="tc__notes-panel__text">{card.remark}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {bidModal && (
        <BidModal
          card={card}
          steps={bidSteps}
          currency={currency}
          onClose={() => setBidModal(false)}
          onSuccess={onRefresh}
        />
      )}
      {showQuotes && (
        <PricequotesPanel card={card} cs={cs} onClose={() => setShowQuotes(false)} />
      )}
    </>
  );
}
