import { useEffect, useState } from "react";
import {
  fetchTenderSteps,
  fetchPricequotes,
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
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function fmtDate(dateStr) {
  if (!dateStr || dateStr === "0000-00-00") return null;
  const [y, m, d] = dateStr.split("-");
  return `${d}.${m}.${String(y).slice(2)}`;
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
    const date = fmtDate(p.date1);
    if (city) {
      const loc = { city, flag, date };
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
  return (
    <span className="tc-countdown">
      {remaining.d > 0 && <>{remaining.d} д </>}
      {p(remaining.h)} : {p(remaining.m)} : {p(remaining.s)}
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
              <option key={p} value={p}>{p} {currency}</option>
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

function PricequotesPanel({ card, onClose }) {
  const [quotes, setQuotes] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPricequotes(card.periodic)
      .then((d) => setQuotes(Array.isArray(d) ? d : d?.data || []))
      .catch(() => setError("Не вдалося завантажити пропозиції"))
      .finally(() => setLoading(false));
  }, [card.periodic]);

  return (
    <div className="bid-modal-overlay" onClick={onClose}>
      <div className="bid-modal" onClick={(e) => e.stopPropagation()}>
        <div className="bid-modal__header">
          <strong>Всі ставки — #{card.periodic}</strong>
          <button className="bid-modal__close" onClick={onClose}>×</button>
        </div>
        {loading && <p className="bid-modal__msg">Завантаження...</p>}
        {error && <p className="bid-modal__error">{error}</p>}
        {quotes && (
          <div className="quotes-list">
            {quotes.length === 0 ? (
              <p className="bid-modal__msg">Ставок немає</p>
            ) : (
              quotes.map((q, i) => (
                <div key={i} className={`quote-item ${q.mine ? "quote-item--mine" : ""}`}>
                  <span className="quote-item__price">{fmtPrice(q.pricequotewithcommission)} UAH</span>
                  <span className="quote-item__qty">{q.loadquote} рейс(ів)</span>
                  <span className="quote-item__date">{toStr(q.moment) ?? q.moment}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main TenderCard ──────────────────────────────────────────────────────────

export default function TenderCard({ card, onRefresh }) {
  const [expanded, setExpanded] = useState(false);
  const [bidModal, setBidModal] = useState(false);
  const [bidSteps, setBidSteps] = useState(null);
  const [showQuotes, setShowQuotes] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  const status = calcStatus(card);
  const { loading: loadingLocs, unloading: unloadingLocs } = extractLocations(card);

  // ── Derived values ────────────────────────────────────────────────────────────

  const payor =
    card.client_relation?.company_relation?.title_ru ||
    card.companydata?.title_ru ||
    "—";

  const currency = (card.defaultcurrency || "UAH").toUpperCase();

  const maxPriceNum = parseFloat(card.maxquotewithcommission) || null;
  const minPriceNum = parseFloat(card.routetender?.currentminpricewithcommission) || null;
  const myBidNum = card.minquote?.mine ? parseFloat(card.minquote?.value) : null;

  const maxPriceFmt = fmtPrice(maxPriceNum);
  const minPriceFmt = fmtPrice(minPriceNum);
  const myBidFmt = fmtPrice(myBidNum);

  const priceDiff = maxPriceNum && minPriceNum && minPriceNum !== maxPriceNum
    ? Math.round(minPriceNum - maxPriceNum)
    : null;

  const trips = parseFloat(card.routetender?.totalcount ?? 0) || 0;
  const proposals = Array.isArray(card.routeresponse_relation)
    ? card.routeresponse_relation.length
    : 0;

  const expiresAt = toStr(card.tenderuntil) ?? toStr(card.tenderavailableuntilmoment) ?? null;

  const isBlind = card.blindtender;
  const isFreeForAll = card.freeforall;
  const hasMyBid = card.hasMyQuotes || !!myBidNum;

  const cartypes = Array.isArray(card.cartypeRelation)
    ? card.cartypeRelation
        .map((c) => {
          if (!c) return null;
          if (typeof c === "string") return c;
          if (typeof c !== "object") return String(c);
          // try every common Sovtes field path
          return (
            c.title_ru || c.title || c.name ||
            c.cartype_relation?.title_ru || c.cartype_relation?.title ||
            c.cartypeRelation?.title_ru || c.cartypeRelation?.title ||
            null
          );
        })
        .filter(Boolean)
    : [];

  const cargo = card.routeparts?.find((p) => p.workaction === 1)?.cargo || null;

  const paymentTitle = card.paymenttypeRelation?.title || null;

  // Min price dot color
  const minDotCls = status.isWinning
    ? "tc-dot--winning"
    : status.isLosing
    ? "tc-dot--losing"
    : "tc-dot--neutral";

  // ── Actions ───────────────────────────────────────────────────────────────────

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
    try { await postBookmark({ route: card.periodic }); onRefresh?.(); }
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

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <>
      <div className={`tc ${expanded ? "tc--expanded" : ""}`}>

        {/* ── Left: route info ─────────────────────────────────────────────── */}
        <div className="tc__left" onClick={() => setExpanded((v) => !v)}>
          {/* Number row */}
          <div className="tc__number-row">
            <span className="tc__number">№ {card.periodic}</span>
            <span className="tc__id">{card.id}</span>
          </div>

          {/* Route timeline */}
          <div className="tc__timeline">
            {loadingLocs.map((loc, i) => (
              <div key={`l${i}`} className="tc__timeline-point tc__timeline-point--load">
                <span className="tc__timeline-dot tc__timeline-dot--load" />
                <span className="tc__timeline-city">
                  {loc.flag && <span className={`fi fi-${loc.flag}`} />}
                  {loc.city}
                </span>
                {loc.date && <span className="tc__timeline-date">{loc.date}</span>}
              </div>
            ))}
            {unloadingLocs.map((loc, i) => (
              <div key={`u${i}`} className="tc__timeline-point tc__timeline-point--unload">
                <span className="tc__timeline-dot tc__timeline-dot--unload" />
                <span className="tc__timeline-city">
                  {loc.flag && <span className={`fi fi-${loc.flag}`} />}
                  {loc.city}
                </span>
                {loc.date && <span className="tc__timeline-date">{loc.date}</span>}
              </div>
            ))}
          </div>

          {/* Cargo info */}
          <div className="tc__cargo-info">
            {cartypes.length > 0 && (
              <span className="tc__cargo-row">
                <span className="tc__cargo-label">Тип авто:</span> {cartypes.join(", ")}
              </span>
            )}
            {cargo && (
              <span className="tc__cargo-row">
                <span className="tc__cargo-label">Вантаж:</span> {cargo}
              </span>
            )}
          </div>
        </div>

        {/* ── Center: tender details ───────────────────────────────────────── */}
        <div className="tc__center" onClick={() => setExpanded((v) => !v)}>
          {/* Type badge */}
          <div className="tc__type-row">
            {isFreeForAll && <span className="tc__type-badge tc__type-badge--open">Відкритий тендер</span>}
            {isBlind && <span className="tc__type-badge tc__type-badge--blind">Закритий тендер</span>}
            {!isFreeForAll && !isBlind && <span className="tc__type-badge">Тендер</span>}
          </div>

          {/* Deadline */}
          {expiresAt && (
            <span className="tc__deadline">До {expiresAt}</span>
          )}

          {/* Countdown */}
          <CountdownTimer until={toStr(card.tenderavailableuntilmoment) ?? expiresAt} />

          {/* Stats */}
          <div className="tc__stats">
            <div className="tc__stat">
              <span className="tc__stat-num">{trips}</span>
              <span className="tc__stat-label">Рейсів</span>
            </div>
            {proposals > 0 && (
              <div className="tc__stat">
                <span className="tc__stat-num">{proposals}</span>
                <span className="tc__stat-label">Пропозицій</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Right: price + actions ───────────────────────────────────────── */}
        <div className="tc__right">
          {/* Price block (top) */}
          <div className="tc__price-block" onClick={() => setExpanded((v) => !v)}>
            {maxPriceFmt && (
              <div className="tc__price-row">
                <span className="tc__price-start">₴&nbsp;{maxPriceFmt}</span>
                {minPriceFmt ? (
                  <>
                    <span className="tc__price-arrow">→</span>
                    <span className={`tc-dot ${minDotCls}`} />
                    <span className="tc__price-min">₴&nbsp;{minPriceFmt}</span>
                  </>
                ) : (
                  <span className="tc__price-no-bids">Немає пропозицій</span>
                )}
              </div>
            )}
            {myBidFmt && (
              <div className="tc__my-bid">Моя ставка: ₴&nbsp;{myBidFmt}</div>
            )}
            {priceDiff !== null && (
              <span className={`tc__diff-badge ${priceDiff < 0 ? "tc__diff-badge--positive" : "tc__diff-badge--negative"}`}>
                {priceDiff > 0 ? "+" : ""}{fmtPrice(priceDiff)}
              </span>
            )}
          </div>

          {/* Actions (bottom) */}
          <div className="tc__actions">
            {/* Bid button */}
            {((!isBlind && !status.isBidDisabled) || (isBlind && !hasMyBid && !status.isBidDisabled)) && (
              <button className="tc-btn tc-btn--primary tc-btn--sm" onClick={handleBidClick} disabled={actionLoading === "bid"}>
                {actionLoading === "bid" ? "..." : "Ставка"}
              </button>
            )}
            {isBlind && hasMyBid && (
              <>
                <button className="tc-btn tc-btn--warn tc-btn--sm" onClick={handleCancelBid} disabled={actionLoading === "cancel"}>
                  {actionLoading === "cancel" ? "..." : "Скасув."}
                </button>
                <button className="tc-btn tc-btn--ghost tc-btn--sm" onClick={handleReviveBid} disabled={actionLoading === "revive"}>
                  {actionLoading === "revive" ? "..." : "Відновити"}
                </button>
              </>
            )}

            {/* View quotes */}
            {proposals > 0 && (
              <button className="tc-icon-btn" title="Всі ставки" onClick={(e) => { e.stopPropagation(); setShowQuotes(true); }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              </button>
            )}

            {/* Bookmark */}
            <button className="tc-icon-btn" title="Відстежувати" onClick={handleBookmark} disabled={actionLoading === "bookmark"}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            </button>

            {/* Hide */}
            <button className="tc-icon-btn tc-icon-btn--danger" title="Приховати" onClick={handleHide} disabled={actionLoading === "hide"}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>

            {/* Expand */}
            <button className="tc-icon-btn" title="Деталі" onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {expanded ? <polyline points="18 15 12 9 6 15"/> : <polyline points="6 9 12 15 18 9"/>}
              </svg>
            </button>
          </div>
        </div>

        {/* ── Expanded detail row ─────────────────────────────────────────── */}
        {expanded && (
          <div className="tc__expanded-row">
            {card.routetender?.title_ru && (
              <p><strong>Маршрут:</strong> {card.routetender.title_ru}</p>
            )}
            {paymentTitle && <p><strong>Оплата:</strong> {paymentTitle}</p>}
            {card.routetender?.terms && <p><strong>Умови:</strong> {card.routetender.terms}</p>}
            {card.remark && <p><strong>Примітка:</strong> {card.remark}</p>}
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
        <PricequotesPanel card={card} onClose={() => setShowQuotes(false)} />
      )}
    </>
  );
}
