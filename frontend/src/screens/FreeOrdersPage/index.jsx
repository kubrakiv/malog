import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { getFreeOrders, createRoute } from "../../features/orderImport/orderImportOperations";
import { parseTenders } from "../../utils/getTenderDetails";
import AddAutoModal from "../SovtesTenderDetailPage/AddAutoModal";
import toast from "react-hot-toast";
import "../SovtesTenderPage/style.scss";
import "../SovtesTenderDetailPage/style.scss";
import "./style.scss";

const PAGE_SIZE = 10;

// singleRoute uses `checkpoint` shape; AddAutoModal expects `checkpoint_relation`
function normalizeRoutepart(p) {
  return {
    ...p,
    checkpoint_relation: {
      address: p.checkpoint?.address,
      town_relation: { title_ru: p.checkpoint?.town?.title_ru },
      region_relation: { title_ru: p.checkpoint?.town?.region?.title_ru },
      country_relation: { title_ru: p.checkpoint?.town?.country?.title_ru },
    },
  };
}

function fmtDate(dateStr) {
  if (!dateStr || dateStr === "N/A") return null;
  const m = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}.${m[2]}.${m[1]}` : dateStr;
}

function fmtPrice(num) {
  if (!num) return null;
  return Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function FreeOrderCard({ order, onAssign }) {
  const [addAutoOpen, setAddAutoOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(order.periodic).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const toggle = (e) => { e?.stopPropagation(); setExpanded((v) => !v); };

  const cs         = order.currency === "EUR" ? "€" : order.currency === "USD" ? "$" : "₴";
  const price      = fmtPrice(order.price);
  const kmprice    = order.kmprice ? parseFloat(order.kmprice).toFixed(2) : null;
  const loadDate   = fmtDate(order.pickup);
  const unloadDate = fmtDate(order.delivery);
  const distance   = order.distance && order.distance !== "N/A" ? order.distance : null;
  const originFlag = order.origin.country?.toLowerCase();
  const destFlag   = order.destination.country?.toLowerCase();

  return (
    <div className="crc">
      <div className="crc__body">

        {/* Col 1: Route */}
        <div className="crc__route">
          <div className="crc__loc">
            <span className="crc__dot crc__dot--load" />
            <span className="crc__city">
              {originFlag && <span className={`fi fi-${originFlag}`} />}
              {order.origin.city}
            </span>
          </div>
          <div className="crc__loc">
            <span className="crc__dot crc__dot--unload" />
            <span className="crc__city">
              {destFlag && <span className={`fi fi-${destFlag}`} />}
              {order.destination.city}
            </span>
          </div>
        </div>

        {/* Col 2: Meta */}
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
          {order.cargo && (
            <span className="crc__meta-row">
              <span className="crc__meta-label">Вантаж:</span> {order.cargo}
            </span>
          )}
        </div>

        {/* Col 3: Details */}
        <div className="crc__details">
          <span className="crc__detail-row">
            <span className="crc__detail-label">Тип авто:</span>{" "}
            {order.type && order.type !== "N/A" ? order.type : <span className="crc__na">не вказано</span>}
          </span>
          <span className="crc__detail-row">
            <span className="crc__detail-label">Тип завантаження:</span>{" "}
            {order.loadType || <span className="crc__na">не вказано</span>}
          </span>
          {order.weight && (
            <span className="crc__detail-row">
              <span className="crc__detail-label">Вага:</span>{" "}
              <strong>{order.weight}</strong>
            </span>
          )}
        </div>

        {/* Col 4: Actions */}
        <div className="crc__actions-col">
          {price && <div className="crc__price">{cs}{price}</div>}
          {kmprice && <div className="crc__kmprice">{cs}{kmprice} / км</div>}
          <div className="crc__status-text">Маршрут забронований для вас згідно тендера.</div>
          <div className="crc__btns">
            <button
              className="crc__btn crc__btn--primary"
              onClick={() => { onAssign(order.id); }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="1" y="3" width="15" height="13" rx="1"/>
                <path d="M16 8h5l2 4v4h-7V8z"/>
                <circle cx="5.5" cy="18.5" r="2.5"/>
                <circle cx="18.5" cy="18.5" r="2.5"/>
              </svg>
              Додати авто
              <span className="crc__btn-arrow">→</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="tc__footer">
        <div className="tc__footer-left">
          <span className="tc__tender-num">№ {order.periodic}</span>
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
          {order.payor && (
            <>
              <span className="tc__footer-sep">|</span>
              <span className="tc__footer-company">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
                {order.payor}
              </span>
              <span className="tc__footer-sep">|</span>
              <span className="tc__footer-payor">
                <span className="tc__footer-payor-label">Платник:</span> {order.payor}
              </span>
            </>
          )}
          {order.tenderParent && (
            <>
              <span className="tc__footer-sep">|</span>
              <Link
                className="fo-tender-ref-link"
                to={`/platforms/sovtes/${order.tenderParent}`}
                onClick={(e) => e.stopPropagation()}
              >
                ↑↓ Для вас згідно тендера №{order.tenderParent}
              </Link>
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

      {expanded && (
        <div className="tc__expanded-row">
          {(order.routeParts || []).map((p, i) => {
            const isLoad = p.workaction === 1;
            const chk = p.checkpoint || {};
            const town = chk.town || {};
            const city = town.title_ru || "";
            const region = town.region?.title_ru || "";
            const country = town.country?.title_ru || "";
            const countryCode = town.country?.domainname?.toLowerCase();
            const street = chk.address || "";
            const fullAddr = [street, city, region, country].filter(Boolean).join(", ");
            const dateStr = fmtDate(p.date1);
            const rawTime = p.time1 || null;
            const timeStr = rawTime ? String(rawTime).slice(0, 5).replace("00:00", "") || null : null;
            const cargo = p.cargo || null;
            const rawW = p.weight ?? p.cargoweight ?? null;
            const weight = rawW != null ? parseFloat(rawW) || null : null;
            return (
              <div key={i} className="tc__stop">
                <div className="tc__stop-header">
                  <span className={`tc__stop-badge tc__stop-badge--${isLoad ? "load" : "unload"}`}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      {isLoad
                        ? <><line x1="12" y1="5" x2="12" y2="19"/><polyline points="5 12 12 19 19 12"/></>
                        : <><line x1="12" y1="19" x2="12" y2="5"/><polyline points="19 12 12 5 5 12"/></>
                      }
                    </svg>
                  </span>
                  <span className="tc__stop-num-label">{i + 1}</span>
                  <span className={`tc__stop-action tc__stop-action--${isLoad ? "load" : "unload"}`}>
                    {isLoad ? "Завантаження" : "Розвантаження"}
                  </span>
                  {countryCode && <span className={`fi fi-${countryCode}`} />}
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
                {isLoad && (cargo || weight != null) && (
                  <div className="tc__stop-cargo">
                    {cargo && (
                      <span className="tc__stop-cargo-name">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                        </svg>
                        {cargo}
                      </span>
                    )}
                    {weight != null && <span className="tc__stop-weight">Вага: {weight} т</span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {addAutoOpen && (
        <AddAutoModal
          route={order.periodic}
          routeparts={(order.routeParts || []).map(normalizeRoutepart)}
          onClose={() => setAddAutoOpen(false)}
          onSuccess={() => { setAddAutoOpen(false); onAssign(order.id); }}
        />
      )}
    </div>
  );
}

export default function FreeOrdersPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [parsedOrders, setParsedOrders] = useState([]);
  const [assigningId, setAssigningId] = useState(null);
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [sortBy, setSortBy] = useState("date");
  const [filters, setFilters] = useState({
    originCountry: "",
    destCountry:   "",
    dateFrom:      "",
    dateTo:        "",
  });

  const freeOrders = useSelector((state) => state.sovtesInfo.freeOrders);
  const { loading } = freeOrders;

  useEffect(() => {
    dispatch(getFreeOrders());
  }, [dispatch]);

  useEffect(() => {
    if (freeOrders?.data?.length > 0) {
      setParsedOrders(parseTenders(freeOrders.data));
    }
  }, [freeOrders]);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [selectedCompany, filters, sortBy]);

  const getRawOrder = (id) => (freeOrders.data || []).find((o) => o.id === id);

  const handleRefresh = () => dispatch(getFreeOrders());

  const handleVehicleAssigned = (tenderId, vehicle) => {
    setAssigningId(null);
    const rawOrder = getRawOrder(tenderId);
    if (!rawOrder) return;
    dispatch(createRoute({
      order: rawOrder.details,
      platform: "sovtes",
      truck_plates: vehicle?.truck?.plates ?? null,
      driver_name: vehicle?.driver?.full_name ?? null,
    }))
      .unwrap()
      .then((response) => {
        toast.success(response.message || "Маршрут додано в систему!");
        navigate("/orders");
      })
      .catch((err) => {
        toast.error(err.error || "Помилка при створенні маршруту");
      });
  };

  // Company chip counts
  const companyCounts = useMemo(() => {
    const counts = {};
    parsedOrders.forEach((o) => {
      if (o.payor) counts[o.payor] = (counts[o.payor] || 0) + 1;
    });
    return counts;
  }, [parsedOrders]);

  const companies = Object.keys(companyCounts).sort((a, b) => companyCounts[b] - companyCounts[a]);

  // Filter options
  const originCountries = [...new Set(parsedOrders.map((o) => o.origin.country).filter(Boolean))].sort();
  const destCountries   = [...new Set(parsedOrders.map((o) => o.destination.country).filter(Boolean))].sort();

  // Apply filters + sort
  const filtered = useMemo(() => {
    let list = parsedOrders.filter((o) => {
      if (selectedCompany && o.payor !== selectedCompany) return false;
      if (filters.originCountry && o.origin.country !== filters.originCountry) return false;
      if (filters.destCountry   && o.destination.country !== filters.destCountry) return false;
      if (filters.dateFrom) {
        const d = (o.pickup || "").slice(0, 10);
        if (d && d < filters.dateFrom) return false;
      }
      if (filters.dateTo) {
        const d = (o.pickup || "").slice(0, 10);
        if (d && d > filters.dateTo) return false;
      }
      return true;
    });

    if (sortBy === "date") {
      list = [...list].sort((a, b) => (a.pickup || "") < (b.pickup || "") ? -1 : 1);
    } else if (sortBy === "price_desc") {
      list = [...list].sort((a, b) => (b.price || 0) - (a.price || 0));
    } else if (sortBy === "price_asc") {
      list = [...list].sort((a, b) => (a.price || 0) - (b.price || 0));
    }

    return list;
  }, [parsedOrders, selectedCompany, filters, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const hasActiveFilters = selectedCompany || Object.values(filters).some(Boolean);

  const clearFilters = () => {
    setSelectedCompany(null);
    setFilters({ originCountry: "", destCountry: "", dateFrom: "", dateTo: "" });
  };

  const assigningOrder = assigningId ? parsedOrders.find((o) => o.id === assigningId) : null;

  if (loading && parsedOrders.length === 0) {
    return (
      <div className="tenders-container">
        <p className="tenders-loading">Завантаження...</p>
      </div>
    );
  }

  return (
    <div className="tenders-container">

      {/* Filter bar */}
      <div className="tenders-filter-bar">
        <div className="tenders-filter-chips">
          {originCountries.map((c) => (
            <button
              key={`o-${c}`}
              className={`filter-chip ${filters.originCountry === c ? "filter-chip--active" : ""}`}
              onClick={() => setFilters((f) => ({ ...f, originCountry: f.originCountry === c ? "" : c }))}
            >
              <span className={`fi fi-${c.toLowerCase()}`} style={{ marginRight: 4 }} />
              {c}
            </button>
          ))}
        </div>

        <div className="tenders-filter-controls">
          <button
            className={`tenders-all-filters-btn ${showFilters ? "tenders-all-filters-btn--active" : ""}`}
            onClick={() => setShowFilters((v) => !v)}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
            </svg>
            Всі фільтри
            {hasActiveFilters && <span className="tenders-all-filters-btn__dot" />}
          </button>
          {hasActiveFilters && (
            <button className="filter-chip filter-chip--clear" onClick={clearFilters}>
              Скинути
            </button>
          )}
        </div>
      </div>

      {/* Company chips */}
      {companies.length > 0 && (
        <div className="tenders-company-chips">
          {companies.map((co) => (
            <button
              key={co}
              className={`company-chip ${selectedCompany === co ? "company-chip--active" : ""}`}
              onClick={() => setSelectedCompany((v) => (v === co ? null : co))}
            >
              {co}&nbsp;({companyCounts[co]})
            </button>
          ))}
        </div>
      )}

      {/* Detailed filters */}
      {showFilters && (
        <div className="tenders-detailed-filters">
          {destCountries.length > 0 && (
            <label>
              Напрямок (розвантаження)
              <select
                value={filters.destCountry}
                onChange={(e) => setFilters((f) => ({ ...f, destCountry: e.target.value }))}
              >
                <option value="">Всі</option>
                {destCountries.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
          )}
          <label>
            Дата завантаження від
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))}
            />
          </label>
          <label>
            Дата завантаження до
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))}
            />
          </label>
        </div>
      )}

      {/* Sort bar */}
      <div className="tenders-sort-bar">
        <span className="tenders-count">{filtered.length} маршрутів</span>
        <div className="tenders-sort-right">
          <select
            className="tenders-sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="date">Сортувати по даті завантаження</option>
            <option value="price_desc">Ціна: від більшої</option>
            <option value="price_asc">Ціна: від меншої</option>
          </select>
          <button className="tenders-refresh-btn" onClick={handleRefresh} title="Оновити">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="23 4 23 10 17 10"/>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
            Оновити
          </button>
        </div>
      </div>

      {/* Card list */}
      <div className="tenders-list">
        {paged.length === 0 ? (
          <p className="tenders-empty">Немає вільних маршрутів</p>
        ) : (
          paged.map((order) => (
            <FreeOrderCard key={order.id} order={order} onAssign={setAssigningId} />
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="tenders-pagination">
          <button
            className="pagination-btn"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >←</button>
          <span className="pagination-info">{page} / {totalPages}</span>
          <button
            className="pagination-btn"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >→</button>
        </div>
      )}

      {/* Assign vehicle modal */}
      {assigningOrder && (
        <AddAutoModal
          route={assigningOrder.periodic}
          routeparts={assigningOrder.routeParts.map(normalizeRoutepart)}
          onClose={() => setAssigningId(null)}
          onSuccess={(vehicle) => handleVehicleAssigned(assigningId, vehicle)}
        />
      )}
    </div>
  );
}
