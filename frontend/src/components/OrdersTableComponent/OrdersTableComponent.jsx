import { useState, useEffect } from "react";

import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useConfirm } from "../../globalComponents/ConfirmModal/useConfirm";

import {
  deleteOrder,
  listOrders,
} from "../../features/orders/ordersOperations";
import { setPage } from "../../features/orders/ordersSlicers";
import { formattedTime } from "../../utils/formattedTime";
import { listTrucks } from "../../features/trucks/trucksOperations";
import { listDrivers } from "../../actions/driverActions";
import { listCustomers } from "../../features/customers/customersOperations";
import { transformDate, dayOfWeek } from "../../utils/formatDate";
import { findTrailer } from "../../utils/getTrailer";
import { extractRoute } from "../../utils/getRoute";
import { totalDistance } from "../../utils/getTotalDistance";
import { calculateOrderValue } from "../../utils/calculateOrderValues";

import OrderActionsComponent from "./OrderActionsComponent";
import InvoiceStatusComponent from "./InvoiceStatusComponent";
import PaginationComponent from "../PaginationComponent";

import { FaCheck, FaChevronDown, FaExclamationTriangle } from "react-icons/fa";
import { formatPrice, currencySymbol, formatAmount, fromEUR, toEUR } from "../../utils/formatCurrency";

import "./OrdersTableComponent.scss";

const isPresent = (value) => {
  if (value === 0) return true;
  if (value === null || value === undefined) return false;
  return String(value).trim() !== "";
};

const getMissingOrderFields = (order) => {
  const checks = [
    { label: "водій", missing: !isPresent(order.driver) },
    { label: "авто", missing: !isPresent(order.truck) },
    {
      label: "завдання",
      missing: !Array.isArray(order.tasks) || order.tasks.length === 0,
    },
    { label: "термін оплати", missing: !isPresent(order.payment_period) },
    { label: "тип оплати", missing: !isPresent(order.payment_type) },
    { label: "менеджер клієнта", missing: !isPresent(order.customer_manager) },
    { label: "валюта", missing: !isPresent(order.currency) },
    { label: "замовник", missing: !isPresent(order.customer) },
    {
      label: "тариф",
      missing: !Number.isFinite(parseFloat(order.price)) || parseFloat(order.price) <= 0,
    },
  ];

  return checks.filter((field) => field.missing).map((field) => field.label);
};

const OrdersLoadingSkeleton = () => (
  <div className="orders-skeleton" aria-label="Завантаження замовлень">
    {Array.from({ length: 6 }).map((_, index) => (
      <div className="orders-skeleton__card" key={index}>
        <div className="orders-skeleton__header">
          <span className="orders-skeleton__checkbox" />
          <span className="orders-skeleton__chip orders-skeleton__chip--wide" />
          <span className="orders-skeleton__chip" />
          <span className="orders-skeleton__chip" />
          <span className="orders-skeleton__line orders-skeleton__line--number" />
        </div>
        <div className="orders-skeleton__body">
          <div className="orders-skeleton__col orders-skeleton__col--route">
            <span className="orders-skeleton__title" />
            <div className="orders-skeleton__route-grid">
              <div>
                <span className="orders-skeleton__pill" />
                <span className="orders-skeleton__line orders-skeleton__line--long" />
                <span className="orders-skeleton__line orders-skeleton__line--medium" />
              </div>
              <div>
                <span className="orders-skeleton__pill" />
                <span className="orders-skeleton__line orders-skeleton__line--long" />
                <span className="orders-skeleton__line orders-skeleton__line--short" />
              </div>
            </div>
          </div>
          <div className="orders-skeleton__col">
            <span className="orders-skeleton__title" />
            <span className="orders-skeleton__line orders-skeleton__line--medium" />
            <span className="orders-skeleton__line orders-skeleton__line--long" />
            <span className="orders-skeleton__line orders-skeleton__line--short" />
          </div>
          <div className="orders-skeleton__col">
            <span className="orders-skeleton__title" />
            <span className="orders-skeleton__line orders-skeleton__line--long" />
            <span className="orders-skeleton__line orders-skeleton__line--medium" />
            <span className="orders-skeleton__line orders-skeleton__line--short" />
          </div>
          <div className="orders-skeleton__col">
            <span className="orders-skeleton__title" />
            <span className="orders-skeleton__line orders-skeleton__line--medium" />
            <span className="orders-skeleton__line orders-skeleton__line--short" />
          </div>
        </div>
        <div className="orders-skeleton__footer">
          <span className="orders-skeleton__line orders-skeleton__line--date" />
          <span className="orders-skeleton__line orders-skeleton__line--date" />
          <span className="orders-skeleton__line orders-skeleton__line--button" />
        </div>
      </div>
    ))}
  </div>
);

function OrdersTableComponent() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const confirm = useConfirm();

  const {
    data: ordersData,
    count,
    currentPage,
    pageSize,
    loading,
    error,
  } = useSelector((state) => state.ordersInfo.orders);

  const trucks = useSelector((state) => state.trucksInfo.trucks.data);

  const selectedDriver = useSelector(
    (state) => state.ordersInfo.selectedDriver
  );
  const selectedTruck = useSelector((state) => state.ordersInfo.selectedTruck);
  const selectedCustomer = useSelector(
    (state) => state.ordersInfo.selectedCustomer
  );

  const token = useSelector((state) => state.userLogin?.userInfo?.token);

  const [filters, setFilters] = useState({
    driver: "",
    truck: "",
    customer: "",
    start_date: null,
    end_date: null,
  });

  const [hoveredOrder, setHoveredOrder] = useState(null);
  const [selectedOrders, setSelectedOrders] = useState([]);

  const [expandedOrders, setExpandedOrders] = useState(new Set());
  const [costConfig, setCostConfig] = useState(null);
  const [recalculating, setRecalculating] = useState(new Set());

  const [activeStatus, setActiveStatus] = useState(null);
  const [activeCustomer, setActiveCustomer] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const [stats, setStats] = useState({ statuses: [], top_customers: [], categories: [] });

  const toggleExpand = (e, orderId) => {
    e.stopPropagation();
    setExpandedOrders((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  };

  useEffect(() => {
    dispatch(listTrucks());
    dispatch(listDrivers());
    dispatch(listCustomers());
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
    fetch("/api/route_calculator/cost-config/", { headers: authHeaders })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setCostConfig(data); })
      .catch(() => {});
    fetch("/api/orders/stats/", { headers: authHeaders })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setStats(data); })
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    const queryFilters = {};
    if (selectedDriver) queryFilters.driver = selectedDriver;
    if (selectedTruck) queryFilters.truck = selectedTruck;
    if (selectedCustomer) queryFilters.customer = selectedCustomer;
    if (activeStatus) queryFilters.status = activeStatus;
    if (activeCustomer) queryFilters.customer = activeCustomer;
    if (activeCategory) queryFilters.category = activeCategory;
    if (filters.start_date)
      queryFilters.start_date = filters.start_date.toISOString().split("T")[0];
    if (filters.end_date)
      queryFilters.end_date = filters.end_date.toISOString().split("T")[0];

    dispatch(
      listOrders({ page: currentPage, pageSize, filters: queryFilters })
    );
  }, [
    dispatch,
    currentPage,
    pageSize,
    selectedDriver,
    selectedTruck,
    selectedCustomer,
    activeStatus,
    activeCustomer,
    activeCategory,
    filters,
  ]);

  const handleMouseEnter = (order) => setHoveredOrder(order);
  const handleMouseLeave = () => setHoveredOrder(null);

  const handleRowDoubleClick = (order) => {
    navigate(`/orders/${order.number || order.id}`);
  };

  const handleCheckboxChange = (id) => {
    setSelectedOrders((prev) =>
      prev.includes(id) ? prev.filter((oid) => oid !== id) : [...prev, id]
    );
  };

  const handleDeleteSelectedOrders = async () => {
    if (selectedOrders.length === 0) {
      window.alert("Виберіть замовлення для видалення");
      return;
    }
    const confirmDelete = await confirm(
      "Are you sure you want to delete the selected orders?"
    );
    if (!confirmDelete) return;

    try {
      for (let orderId of selectedOrders) {
        dispatch(deleteOrder(orderId));
      }
      setSelectedOrders([]);
    } catch (error) {
      console.error("Error deleting orders:", error.message);
    }
  };

  const totalPages = Math.ceil(count / pageSize);

  const handleRecalculate = async (e, orderId) => {
    e.stopPropagation();
    setRecalculating((prev) => new Set(prev).add(orderId));
    try {
      const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`/api/order-statuses/${orderId}/recalculate-costs/`, {
        method: "POST",
        headers: authHeaders,
      });
      if (res.ok) {
        const queryFilters = {};
        if (selectedDriver) queryFilters.driver = selectedDriver;
        if (selectedTruck) queryFilters.truck = selectedTruck;
        if (selectedCustomer) queryFilters.customer = selectedCustomer;
        if (activeStatus) queryFilters.status = activeStatus;
        if (activeCustomer) queryFilters.customer = activeCustomer;
    if (activeCategory) queryFilters.category = activeCategory;
        dispatch(listOrders({ page: currentPage, pageSize, filters: queryFilters }));
      }
    } catch (err) {
      console.error("Recalculate failed:", err);
    }
    setRecalculating((prev) => {
      const next = new Set(prev);
      next.delete(orderId);
      return next;
    });
  };

  const calcCosts = (order) => {
    const dist = parseFloat(order.distance || 0);
    const truck = order.truck_info;
    const tp = costConfig?.truck_parameters;
    const fp = costConfig?.fuel_prices;
    const fuelCurrency = fp?.currency || "EUR";

    const dieselL = truck?.diesel_norm != null ? (dist / 100) * parseFloat(truck.diesel_norm) : 0;
    const adblueL = truck?.adblue_norm != null ? (dist / 100) * parseFloat(truck.adblue_norm) : 0;
    const tirePerKm = parseFloat(truck?.tire_cost_per_km || tp?.tire_cost_per_km || 0);
    const dieselPriceEUR = fp ? toEUR(parseFloat(fp.diesel_price_per_liter), fuelCurrency) : 0;
    const adblueEURPerL = fp ? toEUR(parseFloat(fp.adblue_price_per_liter), fuelCurrency) : 0;
    const dieselCostEUR = dieselL * dieselPriceEUR;
    const adblueEUR = adblueL * adblueEURPerL;
    const tireCostEUR = dist * tirePerKm;
    const directCostEUR = dieselCostEUR + adblueEUR + tireCostEUR;
    const directPerKm = dist ? directCostEUR / dist : 0;

    const tollsEUR = parseFloat(order.tolls || 0);
    const fixedPerKm = costConfig?.fixed_cost_per_km_eur ?? (tp ? parseFloat(tp.fixed_cost_per_km) : 0.481);
    const fixedCostEUR = dist * fixedPerKm;

    const totalCostEUR = directCostEUR + tollsEUR + fixedCostEUR;
    const totalPerKm = dist ? totalCostEUR / dist : 0;

    return {
      dist, fuelCurrency, fp, tp,
      dieselL, adblueL, tirePerKm,
      dieselPriceEUR, adblueEURPerL,
      dieselCostEUR, adblueEUR, tireCostEUR,
      directCostEUR, directPerKm,
      tollsEUR,
      fixedCostEUR, fixedPerKm,
      totalCostEUR, totalPerKm,
    };
  };

  return (
    <>
      <div className="orders-table-container">
        {/* ── Status tabs ─────────────────────────────────────────────────── */}
        {stats.statuses.length > 0 && (
          <div className="ord-tabs">
            <button
              className={`ord-tab${activeStatus === null ? " ord-tab--active" : ""}`}
              onClick={() => { setActiveStatus(null); setActiveCustomer(null); }}
            >
              Всі <span className="ord-tab__count">{stats.statuses.reduce((s, x) => s + x.count, 0)}</span>
            </button>
            {stats.statuses.map((s) => (
              <button
                key={s.name}
                className={`ord-tab${activeStatus === s.name ? " ord-tab--active" : ""}`}
                onClick={() => { setActiveStatus(s.name); setActiveCustomer(null); }}
              >
                {s.name} <span className="ord-tab__count">{s.count}</span>
              </button>
            ))}
          </div>
        )}

        {/* ── Top customers ───────────────────────────────────────────────── */}
        {stats.top_customers.length > 0 && (
          <div className="ord-customers">
            {stats.top_customers.map((c) => (
              <button
                key={c.name}
                className={`ord-customer-chip${activeCustomer === c.name ? " ord-customer-chip--active" : ""}`}
                onClick={() => setActiveCustomer((prev) => prev === c.name ? null : c.name)}
              >
                {c.name}
                <span className="ord-customer-chip__count">{c.count}</span>
              </button>
            ))}
          </div>
        )}

        {/* ── Categories ───────────────────────────────────────────────────── */}
        {stats.categories.length > 0 && (
          <div className="ord-categories">
            {stats.categories.map((c) => (
              <button
                key={c.id}
                className={`ord-category-chip${activeCategory === c.id ? " ord-category-chip--active" : ""}`}
                onClick={() => setActiveCategory((prev) => prev === c.id ? null : c.id)}
              >
                {c.name}
                <span className="ord-category-chip__count">{c.count}</span>
              </button>
            ))}
          </div>
        )}

        <OrderActionsComponent
          onDelete={handleDeleteSelectedOrders}
          onRefresh={() => {
            const queryFilters = {};
            if (selectedDriver) queryFilters.driver = selectedDriver;
            if (selectedTruck) queryFilters.truck = selectedTruck;
            if (selectedCustomer) queryFilters.customer = selectedCustomer;
            if (activeStatus) queryFilters.status = activeStatus;
            if (activeCustomer) queryFilters.customer = activeCustomer;
    if (activeCategory) queryFilters.category = activeCategory;
            return dispatch(listOrders({ page: currentPage, pageSize, filters: queryFilters }));
          }}
          selectedDriver={selectedDriver}
          selectedTruck={selectedTruck}
          selectedCustomer={selectedCustomer}
          startDate={filters.start_date}
          endDate={filters.end_date}
          onStartDateChange={(date) =>
            setFilters((prev) => ({ ...prev, start_date: date }))
          }
          onEndDateChange={(date) =>
            setFilters((prev) => ({ ...prev, end_date: date }))
          }
        />
        <div className="orders-table-scroll">
          {loading ? (
            <OrdersLoadingSkeleton />
          ) : error ? (
            <h4>{error}</h4>
          ) : (
            <div className="oc-list">
              {ordersData.map((order) => {
                const missingFields = getMissingOrderFields(order);
                const visibleMissing = missingFields.slice(0, 3).join(", ");
                const loadingTasks = order.tasks?.filter((t) => t.type === "Loading") || [];
                const borderTasks = order.tasks?.filter((t) => t.type === "Border Crossing") || [];
                const unloadingTasks = order.tasks?.filter((t) => t.type === "Unloading") || [];

                return (
              <div
                key={order.id}
                className={`oc${selectedOrders.includes(order.id) ? " oc--selected" : ""}`}
                onDoubleClick={() => handleRowDoubleClick(order)}
              >
                {/* Header */}
                <div className="oc__header">
                  <input
                    type="checkbox"
                    className="oc__checkbox"
                    checked={selectedOrders.includes(order.id)}
                    onChange={() => handleCheckboxChange(order.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="oc__statuses">
                    {order.current_status && (
                      <span className="oc__status-chip oc__status-chip--order">
                        {order.current_status.status}
                      </span>
                    )}
                    <InvoiceStatusComponent order={order} />
                    {order.category_info?.ukr && (
                      <span className="oc__status-chip oc__status-chip--category">
                        {order.category_info.ukr}
                      </span>
                    )}
                    {(() => {
                      const docStatus = order?.status_history?.find(
                        (s) => s.status === "documents_sent"
                      );
                      return docStatus ? (
                        <span className="oc__status-chip oc__status-chip--docs">
                          Документи: {transformDate(docStatus.started_at)}
                        </span>
                      ) : null;
                    })()}
                    {missingFields.length > 0 && (
                      <span
                        className="oc__status-chip oc__status-chip--missing"
                        title={`Не заповнено: ${missingFields.join(", ")}`}
                      >
                        <FaExclamationTriangle className="oc__missing-icon" />
                        <span>Немає: {visibleMissing}</span>
                        {missingFields.length > 3 && (
                          <span className="oc__missing-more">
                            +{missingFields.length - 3}
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                  <div className="oc__header-right">
                    <span className="oc__order-num">{order.number}</span>
                    {order.customer && (
                      <span className="oc__customer-name">{order.customer}</span>
                    )}
                    {order.platform && (
                      <span className="oc__platform">{order.platform}</span>
                    )}
                  </div>
                </div>

                {/* Body */}
                <div className="oc__body">
                  <div className="oc__col oc__col--route">
                      <div className="oc__col-title">Маршрут</div>
                      <div className="oc__route-cols">
                        <div className="oc__route-col">
                          <span className="oc__route-count oc__route-count--load">
                            Завантажень: {loadingTasks.length}
                          </span>
                          {loadingTasks.map((t) => (
                              <div key={t.id} className="oc__loc">
                                <span className="oc__dot oc__dot--load" />
                                <span className="oc__city">
                                  {t.point_details?.country_short?.toUpperCase()}
                                  {t.point_details?.postal_code
                                    ? `-${t.point_details.postal_code}`
                                    : ""}{" "}
                                  {t.point_details?.city}
                                </span>
                              </div>
                            ))}
                        </div>
                        <div className="oc__route-col">
                          <span className="oc__route-count oc__route-count--unload">
                            Розвантажень: {unloadingTasks.length}
                          </span>
                          {borderTasks.map((t) => (
                              <div key={t.id} className="oc__loc">
                                <span className="oc__dot oc__dot--border" />
                                <span className="oc__city">
                                  {t.point_details?.country_short?.toUpperCase()}
                                  {t.point_details?.postal_code
                                    ? `-${t.point_details.postal_code}`
                                    : ""}{" "}
                                  {t.point_details?.city}
                                </span>
                              </div>
                            ))}
                          {unloadingTasks.map((t) => (
                              <div key={t.id} className="oc__loc">
                                <span className="oc__dot oc__dot--unload" />
                                <span className="oc__city">
                                  {t.point_details?.country_short?.toUpperCase()}
                                  {t.point_details?.postal_code
                                    ? `-${t.point_details.postal_code}`
                                    : ""}{" "}
                                  {t.point_details?.city}
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>
                      {extractRoute(order) && (
                        <div className="oc__route-summary">{extractRoute(order)}</div>
                      )}
                      <div className="oc__route-distances">
                        <span><span className="oc__label">Відстань:</span> {totalDistance(order)} км</span>
                        {order.empty_distance > 0 && (
                          <span><span className="oc__label">Порожній:</span> {order.empty_distance} км</span>
                        )}
                      </div>
                    </div>

                  <div className="oc__col oc__col--order">
                    <div className="oc__col-title">Деталі замовлення</div>
                    <div className="oc__row">
                      <span className="oc__label">Замовник:</span>
                      <span
                        className="oc__value"
                        onMouseEnter={() => handleMouseEnter(order)}
                        onMouseLeave={handleMouseLeave}
                      >
                        {hoveredOrder?.id === order.id
                          ? order.customer_manager
                          : order.customer}
                      </span>
                    </div>
                    <div className="oc__row">
                      <span className="oc__label">№ зам. клієнта:</span>
                      <span className="oc__value">{order.order_number}</span>
                    </div>
                    <div className="oc__row">
                      <span className="oc__label">Менеджер:</span>
                      <span className="oc__value">{order.user?.full_name}</span>
                    </div>
                    <div className="oc__row">
                      <span className="oc__label">Оплата, дн:</span>
                      <span className="oc__value">{order.payment_period}</span>
                    </div>
                  </div>

                  <div className="oc__col oc__col--vehicle">
                    <div className="oc__col-title">Транспорт</div>
                    <div className="oc__row">
                      <span className="oc__label">Водій:</span>
                      <span className="oc__value oc__value--driver">{order.driver}</span>
                    </div>
                    <div className="oc__row">
                      <span className="oc__label">Авто:</span>
                      <span className="oc__value oc__value--plates">{order.truck}</span>
                    </div>
                    <div className="oc__row">
                      <span className="oc__label">Причіп:</span>
                      <span className="oc__value">{findTrailer(order.truck, trucks)}</span>
                    </div>
                  </div>

                  {(() => {
                    const sym = currencySymbol(order.currency);
                    const cur = order.currency || "EUR";
                    const price = parseFloat(order.market_price || order.price || 0);
                    const dist = totalDistance(order);
                    const pricePerKm = dist ? (price / dist).toFixed(2) : "0.00";
                    const pricePerKmEUR = cur === "EUR"
                      ? parseFloat(pricePerKm)
                      : toEUR(price, cur) / (dist || 1);
                    const kmBg = pricePerKmEUR < 1 ? "#FF0000"
                      : pricePerKmEUR < 1.2 ? "#1a56db"
                      : pricePerKmEUR < 1.3 ? "rgb(234,230,15)"
                      : "#15803d";
                    const kmFg = pricePerKmEUR >= 1.2 && pricePerKmEUR < 1.3 ? "#000" : "#fff";
                    const priceInEUR = toEUR(price, cur);
                    const totalCostEUR = order.cost_snapshot
                      ? order.cost_snapshot.total_cost_eur
                      : calcCosts(order).totalCostEUR;
                    const profitEUR = priceInEUR - totalCostEUR;
                    const profitNative = fromEUR(profitEUR, cur);
                    const profitPct = priceInEUR ? Math.round((profitEUR / priceInEUR) * 100) : 0;
                    const profitColor = profitEUR < 0 ? "red" : profitEUR < 100 ? "#1a56db" : "#15803d";
                    const pctColor = profitPct < 0 ? "red" : profitPct < 10 ? "#1a56db" : "#15803d";
                    return (
                      <div className="oc__col oc__col--finance">
                        <div className="oc__col-title">Фінанси</div>
                        <div className="oc__finance-line">
                          <span className="oc__label">Тариф:</span>
                          <span className="oc__finance-pair">
                            <span className="oc__value--price">{formatPrice(order.price, cur)}</span>
                            <span className="oc__fin-sep">|</span>
                            <span className="oc__km-badge" style={{ background: kmBg, color: kmFg }}>
                              {pricePerKm} {sym}/км
                            </span>
                          </span>
                        </div>
                        <div className="oc__finance-line">
                          <span className="oc__label">Прибуток:</span>
                          <span className="oc__finance-pair">
                            <span style={{ color: profitColor }}>{formatAmount(profitNative)} {sym}</span>
                            <span className="oc__fin-sep">|</span>
                            <span style={{ color: pctColor }}>{profitPct} %</span>
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Footer */}
                <div className="oc__footer">
                  <div className="oc__dates">
                    <span className="oc__date-item">
                      <span className="oc__label">Завантаження:</span>{" "}
                      <span className="oc__day-abbr">
                        {dayOfWeek(order.loading_end_date || order.loading_start_date)}
                      </span>{" "}
                      {order.loading_end_date
                        ? transformDate(order.loading_end_date)
                        : transformDate(order.loading_start_date)}{" "}
                      {order.loading_end_time ? (
                        formattedTime(order.loading_end_time)
                      ) : (
                        <FaCheck style={{ color: "red", fontSize: "10px" }} />
                      )}
                    </span>
                    <span className="oc__date-sep">·</span>
                    <span className="oc__date-item">
                      <span className="oc__label">Розвантаження:</span>{" "}
                      <span className="oc__day-abbr">
                        {dayOfWeek(order.unloading_end_date || order.unloading_start_date)}
                      </span>{" "}
                      {order.unloading_end_date
                        ? transformDate(order.unloading_end_date)
                        : transformDate(order.unloading_start_date)}{" "}
                      {order.unloading_end_time ? (
                        formattedTime(order.unloading_end_time)
                      ) : (
                        <FaCheck style={{ color: "red", fontSize: "10px" }} />
                      )}
                    </span>
                  </div>
                  {order.invoice && (
                    <div className="oc__invoice">
                      <span className="oc__label">Інвойс:</span>
                      <span>{order.invoice.number}</span>
                      <span>{transformDate(order.invoice.invoicing_date)}</span>
                    </div>
                  )}
                  <button
                    className="oc__expand-btn"
                    onClick={(e) => toggleExpand(e, order.id)}
                  >
                    Детальніше
                    <FaChevronDown
                      className={`oc__expand-icon${expandedOrders.has(order.id) ? " oc__expand-icon--up" : ""}`}
                    />
                  </button>
                </div>

                {/* Detail panel */}
                {expandedOrders.has(order.id) && (() => {
                  const sym = currencySymbol(order.currency);
                  const cur = order.currency || "EUR";
                  const snap = order.cost_snapshot;

                  let dist, fuelCurrency, fp, dieselL, adblueL, tirePerKm,
                    dieselCostEUR, adblueEUR, tireCostEUR,
                    directCostEUR, directPerKm,
                    tollsEUR, fixedCostEUR, fixedPerKm,
                    totalCostEUR, totalPerKm, snapshotCenters;

                  if (snap) {
                    dist = snap.dist;
                    fuelCurrency = snap.config.fuel_currency;
                    fp = { diesel_price_per_liter: snap.config.diesel_price_per_liter, adblue_price_per_liter: snap.config.adblue_price_per_liter };
                    dieselL = snap.direct.diesel_l;
                    adblueL = snap.direct.adblue_l;
                    tirePerKm = snap.config.tire_per_km;
                    dieselCostEUR = snap.direct.diesel_cost_eur;
                    adblueEUR = snap.direct.adblue_eur;
                    tireCostEUR = snap.direct.tire_cost_eur;
                    directCostEUR = snap.direct.total_eur;
                    directPerKm = dist ? directCostEUR / dist : 0;
                    tollsEUR = snap.tolls_eur;
                    fixedCostEUR = snap.fixed.total_eur;
                    fixedPerKm = dist ? fixedCostEUR / dist : 0;
                    totalCostEUR = snap.total_cost_eur;
                    totalPerKm = dist ? totalCostEUR / dist : 0;
                    snapshotCenters = snap.fixed.cost_centers;
                  } else {
                    const live = calcCosts(order);
                    ({ dist, fuelCurrency, fp, dieselL, adblueL, tirePerKm,
                       dieselCostEUR, adblueEUR, tireCostEUR,
                       directCostEUR, directPerKm,
                       tollsEUR, fixedCostEUR, fixedPerKm,
                       totalCostEUR, totalPerKm } = live);
                    snapshotCenters = null;
                  }

                  const price = parseFloat(order.market_price || order.price || 0);
                  const priceInEUR = toEUR(price, cur);
                  const profitEUR = priceInEUR - totalCostEUR;
                  const profitNative = fromEUR(profitEUR, cur);
                  const profitPct = priceInEUR ? Math.round((profitEUR / priceInEUR) * 100) : 0;

                  const startDate = order.loading_start_date;
                  const endDate = order.unloading_end_date || order.unloading_start_date;
                  const routeDays = startDate && endDate
                    ? Math.max(1, Math.round((new Date(endDate) - new Date(startDate)) / 86400000))
                    : null;

                  const profitColor = profitEUR < 0 ? "red" : profitEUR < 100 ? "#1a56db" : "#15803d";
                  const pctColor = profitPct < 0 ? "red" : profitPct < 10 ? "#1a56db" : "#15803d";

                  const dRow = (label, value, extra) => (
                    <div className="oc__detail-row">
                      <span className="oc__detail-label">{label}</span>
                      <span className="oc__detail-value">
                        {value}{extra && <><span className="oc__fin-sep">|</span>{extra}</>}
                      </span>
                    </div>
                  );
                  const sRow = (label, formula, amount) => (
                    <div className="oc__detail-row oc__detail-row--sub">
                      <span className="oc__detail-label">{label}</span>
                      <span className="oc__detail-formula">{formula}</span>
                      <span className="oc__detail-amount">{amount}</span>
                    </div>
                  );

                  const ccRows = snapshotCenters
                    ? snapshotCenters.map((c) => (
                        <div key={c.id} className="oc__detail-row oc__detail-row--sub">
                          <span className="oc__detail-label">{`↳ ${c.name}:`}</span>
                          <span className="oc__detail-formula"></span>
                          <span className="oc__detail-amount">
                            {formatPrice(fromEUR(c.cost_eur, cur), cur)}
                            <span className="oc__per-km"> | {fromEUR(c.per_km_eur, cur).toFixed(2)} {sym}/км</span>
                          </span>
                        </div>
                      ))
                    : (costConfig?.cost_centers ?? [])
                        .filter((c) => c.is_active)
                        .sort((a, b) => {
                          const R = { EUR: 1, UAH: 1 / 42, USD: 1 / 1.08 };
                          return parseFloat(b.monthly_amount) * (R[b.currency] ?? 1 / 42)
                               - parseFloat(a.monthly_amount) * (R[a.currency] ?? 1 / 42);
                        })
                        .map((c) => {
                          const CC_EUR = { EUR: 1, UAH: 1 / 42, USD: 1 / 1.08, CZK: 1 / 25.185, PLN: 1 / 4.25 };
                          const eurPerMonth = parseFloat(c.monthly_amount) * (CC_EUR[c.currency] ?? 1 / 42);
                          const units = costConfig?.truck_units ?? [];
                          let divisorKm;
                          if (c.truck_unit) {
                            const u = units.find((u) => u.id === c.truck_unit);
                            divisorKm = u ? u.planned_trucks * u.assumed_km : 1;
                          } else {
                            divisorKm = units.reduce((s, u) => s + u.planned_trucks * u.assumed_km, 0) || 1;
                          }
                          const centerPerKmEUR = eurPerMonth / divisorKm;
                          const centerCostEUR = centerPerKmEUR * dist;
                          return (
                            <div key={c.id} className="oc__detail-row oc__detail-row--sub">
                              <span className="oc__detail-label">{`↳ ${c.name}:`}</span>
                              <span className="oc__detail-formula"></span>
                              <span className="oc__detail-amount">
                                {formatPrice(fromEUR(centerCostEUR, cur), cur)}
                                <span className="oc__per-km"> | {fromEUR(centerPerKmEUR, cur).toFixed(2)} {sym}/км</span>
                              </span>
                            </div>
                          );
                        });

                  return (
                    <div className="oc__detail-panel">
                      {/* Snapshot badge row — spans all columns */}
                      <div className="oc__detail-snapshot-bar">
                        {snap ? (
                          <>
                            <span className="oc__snapshot-badge oc__snapshot-badge--frozen">
                              Зафіксовано: {new Date(snap.snapshotted_at).toLocaleString("uk-UA", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                            </span>
                            <button
                              className="oc__snapshot-recalc"
                              disabled={recalculating.has(order.id)}
                              onClick={(e) => handleRecalculate(e, order.id)}
                            >
                              {recalculating.has(order.id) ? "..." : "Перерахувати"}
                            </button>
                          </>
                        ) : (
                          <>
                            <span className="oc__snapshot-badge oc__snapshot-badge--live">
                              Розрахунок в реальному часі
                            </span>
                            <button
                              className="oc__snapshot-recalc"
                              disabled={recalculating.has(order.id)}
                              onClick={(e) => handleRecalculate(e, order.id)}
                            >
                              {recalculating.has(order.id) ? "..." : "Зафіксувати"}
                            </button>
                          </>
                        )}
                      </div>

                      {/* Column 1 — general */}
                      <div className="oc__detail-col">
                        {routeDays !== null && dRow("У рейсі:", `${routeDays} ${routeDays === 1 ? "день" : routeDays < 5 ? "дні" : "днів"}`)}
                        {dRow("Дорожні збори:", formatPrice(fromEUR(tollsEUR, cur), cur))}
                        {dRow("Ринкова ціна:", formatPrice(order.market_price || 0, cur))}
                        <div className="oc__detail-row oc__detail-row--total">
                          <span className="oc__detail-label">Витрати всього:</span>
                          <span className="oc__detail-value">
                            {formatPrice(fromEUR(totalCostEUR, cur), cur)}
                            <span className="oc__fin-sep">|</span>
                            <span>{fromEUR(totalPerKm, cur).toFixed(2)} {sym}/км</span>
                          </span>
                        </div>
                        <div className="oc__detail-row oc__detail-row--total">
                          <span className="oc__detail-label">Маржа:</span>
                          <span className="oc__detail-value">
                            <span style={{ color: profitColor }}>{formatAmount(profitNative)} {sym}</span>
                            <span className="oc__fin-sep">|</span>
                            <span style={{ color: pctColor }}>{profitPct} %</span>
                          </span>
                        </div>
                      </div>

                      {/* Column 2 — direct costs */}
                      <div className="oc__detail-col">
                        {dRow(
                          "Прямі витрати:",
                          formatPrice(fromEUR(directCostEUR, cur), cur),
                          <span>{fromEUR(directPerKm, cur).toFixed(2)} {sym}/км</span>
                        )}
                        {sRow(
                          "↳ Дизель:",
                          `${dieselL.toFixed(1)} л × ${fp ? parseFloat(fp.diesel_price_per_liter).toFixed(2) : "0.00"} ${currencySymbol(fuelCurrency)}/л`,
                          <>{formatPrice(fromEUR(dieselCostEUR, cur), cur)}<span className="oc__per-km"> | {dist ? fromEUR(dieselCostEUR / dist, cur).toFixed(2) : "0.00"} {sym}/км</span></>
                        )}
                        {sRow(
                          "↳ AdBlue:",
                          `${adblueL.toFixed(1)} л × ${fp ? parseFloat(fp.adblue_price_per_liter).toFixed(2) : "0.00"} ${currencySymbol(fuelCurrency)}/л`,
                          <>{formatPrice(fromEUR(adblueEUR, cur), cur)}<span className="oc__per-km"> | {dist ? fromEUR(adblueEUR / dist, cur).toFixed(2) : "0.00"} {sym}/км</span></>
                        )}
                        {sRow(
                          "↳ Шини:",
                          `${dist} км × ${tirePerKm.toFixed(4)} EUR/км`,
                          <>{formatPrice(fromEUR(tireCostEUR, cur), cur)}<span className="oc__per-km"> | {fromEUR(tirePerKm, cur).toFixed(2)} {sym}/км</span></>
                        )}
                      </div>

                      {/* Column 3 — fixed costs */}
                      <div className="oc__detail-col">
                        {dRow(
                          "Фіксовані витрати:",
                          formatPrice(fromEUR(fixedCostEUR, cur), cur),
                          <span>{fromEUR(fixedPerKm, cur).toFixed(2)} {sym}/км</span>
                        )}
                        {ccRows}
                      </div>
                    </div>
                  );
                })()}
              </div>
                );
              })}
            </div>
          )}
          {count > pageSize && (
            <PaginationComponent
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => dispatch(setPage(page))}
            />
          )}
        </div>
      </div>
    </>
  );
}

export default OrdersTableComponent;
