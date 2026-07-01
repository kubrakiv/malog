import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import {
  setSelectedDriver,
  setSelectedTruck,
  setSelectedCustomer,
} from "../../../features/orders/ordersSlicers";
import {
  previewRoute,
  createRoute,
} from "../../../features/orderImport/orderImportOperations";

import {
  FaCalendarAlt,
  FaFileAlt,
  FaPlus,
  FaSyncAlt,
  FaTimes,
  FaTrash,
  FaTruckMoving,
  FaUserCog,
  FaUsers,
} from "react-icons/fa";
import {
  Building2,
  CalendarDays,
  Hash,
  MapPin,
  Package,
  Plus,
  Route,
  RouteIcon,
  Wallet,
  Weight,
  X,
} from "lucide-react";
import { selectTrucks } from "../../../features/trucks/trucksSelectors";
import { transformSelectOptions } from "../../../utils/transformers";

import SelectComponent from "../../../globalComponents/SelectComponent";

import "./style.scss";

const FALLBACK_SUBTITLE = "Перевірте дані маршруту перед створенням замовлення";

const formatDate = (rawDate) => {
  if (!rawDate) return "—";
  if (/^\d{2}\.\d{2}\.\d{4}$/.test(rawDate)) return rawDate;

  const parsed = new Date(rawDate);
  if (Number.isNaN(parsed.getTime())) return rawDate;

  const day = String(parsed.getDate()).padStart(2, "0");
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const year = parsed.getFullYear();
  return `${day}.${month}.${year}`;
};

const splitRouteTitle = (routeTitle = "") => {
  const parts = String(routeTitle)
    .split(/\s[-–]\s/)
    .map((item) => item.trim())
    .filter(Boolean);

  return {
    origin: parts[0] || "—",
    destination: parts[parts.length - 1] || "—",
  };
};

const normalizePoint = (point, fallback = "—") => {
  if (!point) return fallback;
  return String(point).trim() || fallback;
};

const Modal = ({ children, onClose }) => {
  return (
    <div className="order-actions__preview-overlay" onClick={onClose}>
      <div
        className="order-actions__preview-modal"
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};

const ModalHeader = ({ onClose }) => {
  return (
    <div className="order-actions__modal-header">
      <div className="order-actions__modal-success-icon" aria-hidden="true">
        <RouteIcon size={24} strokeWidth={2.2} />
      </div>
      <div className="order-actions__modal-header-copy">
        <h3 className="order-actions__preview-title">Маршрут успішно отримано</h3>
        <p className="order-actions__preview-subtitle">{FALLBACK_SUBTITLE}</p>
      </div>
      <button
        type="button"
        className="order-actions__modal-close"
        onClick={onClose}
        aria-label="Закрити вікно"
      >
        <X size={22} />
      </button>
    </div>
  );
};

const RoutePreview = ({ origin, destination }) => {
  return (
    <div className="order-actions__route-preview">
      <p className="order-actions__route-preview-label">Маршрут</p>
      <div className="order-actions__route-preview-content">
        <span className="order-actions__route-point">
          <span className="order-actions__dot order-actions__dot--green" />
          {origin}
        </span>
        <span className="order-actions__route-arrow" aria-hidden="true">
          →
        </span>
        <span className="order-actions__route-point">
          {destination}
          <span className="order-actions__dot order-actions__dot--orange" />
        </span>
      </div>
    </div>
  );
};

const InfoCard = ({ icon: Icon, label, value }) => {
  return (
    <div className="order-actions__info-card">
      <div className="order-actions__info-icon-wrap" aria-hidden="true">
        <Icon size={22} strokeWidth={2} />
      </div>
      <div>
        <p className="order-actions__info-label">{label}</p>
        <p className="order-actions__info-value">{value || "—"}</p>
      </div>
    </div>
  );
};

const InfoGrid = ({ items }) => {
  return (
    <div className="order-actions__info-grid">
      {items.map((item) => (
        <InfoCard
          key={item.label}
          icon={item.icon}
          label={item.label}
          value={item.value}
        />
      ))}
    </div>
  );
};

const RouteTimeline = ({
  originPoint,
  transitPoint,
  destinationPoint,
  distance,
}) => {
  return (
    <div className="order-actions__route-timeline-card">
      <div className="order-actions__timeline-left">
        <div className="order-actions__timeline-item">
          <span className="order-actions__timeline-dot order-actions__timeline-dot--green" />
          <div>
            <p className="order-actions__timeline-main">{originPoint}</p>
          </div>
        </div>
        <div className="order-actions__timeline-line" aria-hidden="true" />
        <div className="order-actions__timeline-item">
          <span className="order-actions__timeline-dot order-actions__timeline-dot--blue" />
          <div>
            <p className="order-actions__timeline-main">{transitPoint}</p>
            <p className="order-actions__timeline-sub">Транзитна точка</p>
          </div>
        </div>
        <div className="order-actions__timeline-line" aria-hidden="true" />
        <div className="order-actions__timeline-item">
          <span className="order-actions__timeline-dot order-actions__timeline-dot--orange" />
          <div>
            <p className="order-actions__timeline-main">{destinationPoint}</p>
          </div>
        </div>
      </div>

      <div className="order-actions__timeline-right">
        <div className="order-actions__timeline-summary-row">
          <span className="order-actions__timeline-summary-label">Відстань:</span>
          <span className="order-actions__timeline-summary-value">{distance}</span>
        </div>
      </div>
    </div>
  );
};

const ModalFooter = ({ isBusy, onCancel, onConfirm }) => {
  return (
    <div className="order-actions__preview-actions">
      <button
        type="button"
        className="order-actions__preview-cancel"
        onClick={onCancel}
        disabled={isBusy}
      >
        Скасувати
      </button>
      <button
        type="button"
        className="order-actions__preview-confirm"
        onClick={onConfirm}
        disabled={isBusy}
      >
        <Plus size={20} />
        <span>{isBusy ? "Створення..." : "Створити маршрут"}</span>
      </button>
    </div>
  );
};

const OrderActionsComponent = ({
  onDelete,
  onRefresh,
  selectedDriver,
  selectedTruck,
  selectedCustomer,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const trucks = useSelector(selectTrucks);
  const drivers = useSelector((state) => state.driversInfo.drivers.data);
  const customers = useSelector((state) => state.customersInfo.customers.data);

  const driverOptions = transformSelectOptions(drivers, "full_name");
  const truckOptions = transformSelectOptions(trucks, "plates");
  const customerOptions = transformSelectOptions(customers, "name");

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDriverShow, setIsDriverShow] = useState(false);
  const [isTruckShow, setIsTruckShow] = useState(false);
  const [isCustomerShow, setIsCustomerShow] = useState(false);
  const [isCalendarShow, setIsCalendarShow] = useState(false);
  const [sovtesRouteNumber, setSovtesRouteNumber] = useState("");
  const [isCreatingSovtesRoute, setIsCreatingSovtesRoute] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isFetchingPreview, setIsFetchingPreview] = useState(false);

  const handleDriverSelect = () => {
    setIsDriverShow(!isDriverShow);
    if (selectedDriver) {
      dispatch(setSelectedDriver(""));
    }
  };

  const handleTruckSelect = () => {
    setIsTruckShow(!isTruckShow);
    if (selectedTruck) {
      dispatch(setSelectedTruck(""));
    }
  };

  const handleCustomerSelect = () => {
    setIsCustomerShow(!isCustomerShow);
    if (selectedCustomer) {
      dispatch(setSelectedCustomer(""));
    }
  };

  const handleCalendarSelect = () => {
    setIsCalendarShow(!isCalendarShow);
    if (!isCalendarShow) {
      onStartDateChange(null);
    }
  };

  const handleRefresh = async () => {
    if (!onRefresh || isRefreshing) return;
    setIsRefreshing(true);
    await onRefresh();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const handleAddOrderButtonClick = () => {
    navigate("/orders/add/");
  };

  const handleCreateSovtesRoute = async (event) => {
    event.preventDefault();
    const routeId = sovtesRouteNumber.trim();

    if (!routeId) {
      toast.error("Вкажіть номер маршруту Sovtes");
      return;
    }

    setIsFetchingPreview(true);
    try {
      const response = await dispatch(
        previewRoute({ routeId, platform: "sovtes" }),
      ).unwrap();
      setPreviewData(response);
      setIsPreviewOpen(true);
    } catch (error) {
      toast.error(error?.error || "Не вдалося створити маршрут");
    } finally {
      setIsFetchingPreview(false);
    }
  };

  const handleConfirmCreate = async () => {
    if (!previewData?.order) {
      toast.error("Дані маршруту відсутні");
      return;
    }

    setIsCreatingSovtesRoute(true);
    try {
      const response = await dispatch(
        createRoute({
          order: previewData.order,
          platform: "sovtes",
        }),
      ).unwrap();
      toast.success(response.message || "Маршрут створено");
      setIsPreviewOpen(false);
      setPreviewData(null);
      setSovtesRouteNumber("");
      if (onRefresh) await onRefresh();
    } catch (error) {
      toast.error(error?.error || "Не вдалося створити маршрут");
    } finally {
      setIsCreatingSovtesRoute(false);
    }
  };

  const handleCancelPreview = () => {
    if (isCreatingSovtesRoute) return;
    setIsPreviewOpen(false);
    setPreviewData(null);
  };

  const summary = previewData?.summary || {};

  const routeFromTitle = splitRouteTitle(summary.route_title);
  const loadingPoint = normalizePoint(summary.loading_points?.[0], routeFromTitle.origin);
  const transitPoint = normalizePoint(summary.loading_points?.[1], "UA Львів");
  const unloadingPoint = normalizePoint(
    summary.unloading_points?.[0],
    routeFromTitle.destination,
  );

  const infoCards = [
    {
      label: "Номер",
      value: summary.periodic || "5722-02-24",
      icon: Hash,
    },
    {
      label: "Платник",
      value: summary.payor || "GUDLEIFR s.r.o.",
      icon: Building2,
    },
    {
      label: "Відстань",
      value:
        summary.distance !== null && summary.distance !== undefined
          ? `${summary.distance} км`
          : "4313.68 км",
      icon: Route,
    },
    {
      label: "Бюджет",
      value:
        summary.budget !== null && summary.budget !== undefined
          ? `${summary.budget} ${summary.currency || ""}`.trim()
          : "3500 EUR",
      icon: Wallet,
    },
    {
      label: "Вантаж",
      value: summary.cargo || "ТНП",
      icon: Package,
    },
    {
      label: "Вага",
      value:
        summary.weight !== null && summary.weight !== undefined
          ? `${summary.weight} т`
          : "22 т",
      icon: Weight,
    },
    {
      label: "Точок",
      value: summary.points_count ?? "4",
      icon: MapPin,
    },
    {
      label: "Період",
      value: `${formatDate(summary.start_date)} – ${formatDate(summary.end_date)}`,
      icon: CalendarDays,
    },
  ];

  return (
    <>
      <div className="order-actions">
        <form
          className="order-actions__sovtes-route-form"
          onSubmit={handleCreateSovtesRoute}
        >
          <input
            className="order-actions__sovtes-route-input"
            type="text"
            value={sovtesRouteNumber}
            onChange={(event) => setSovtesRouteNumber(event.target.value)}
            placeholder="18359-06-26"
            aria-label="Номер маршруту Sovtes"
          />
          <button
            className="order-actions__create-sovtes-route-btn"
            type="submit"
            title="+створити маршрут"
            disabled={isCreatingSovtesRoute || isFetchingPreview}
          >
            <FaPlus />
            <span>
              {isFetchingPreview
                ? "Отримання..."
                : isCreatingSovtesRoute
                  ? "Створення..."
                  : "створити маршрут"}
            </span>
          </button>
        </form>
        <button
          className="order-actions__add-order-btn"
          onClick={handleAddOrderButtonClick}
          title="Додати маршрут"
        >
          <FaFileAlt />
        </button>
        <button
          className={`order-actions__refresh-btn${isRefreshing ? " order-actions__refresh-btn--spinning" : ""}`}
          onClick={handleRefresh}
          title="Оновити"
          disabled={isRefreshing}
        >
          <FaSyncAlt />
        </button>
        <button
          className="order-actions__find-driver-btn"
          onClick={handleDriverSelect}
          title="Вибрати водія"
        >
          <FaUserCog />
        </button>
        {isDriverShow && (
          <div className="order-actions__find-driver-select">
            <SelectComponent
              title="Виберіть водія"
              type="text"
              value={selectedDriver || ""}
              onChange={(e) => dispatch(setSelectedDriver(e.target.value))}
              options={driverOptions}
            />
          </div>
        )}
        <button
          className="order-actions__find-truck-btn"
          onClick={handleTruckSelect}
          title="Вибрати тягач"
        >
          <FaTruckMoving />
        </button>
        {isTruckShow && (
          <div className="order-actions__find-driver-select">
            <SelectComponent
              title="Виберіть тягач"
              type="text"
              value={selectedTruck || ""}
              onChange={(e) => dispatch(setSelectedTruck(e.target.value))}
              options={truckOptions}
              className="styled-select-component"
            />
          </div>
        )}
        {selectedTruck && (
          <button
            className="order-actions__clear-btn"
            onClick={() => dispatch(setSelectedTruck(""))}
            title="Відмінити"
          >
            <FaTimes />
          </button>
        )}
        <button
          className="order-actions__calendar-btn"
          onClick={handleCalendarSelect}
          title="Вибрати період"
        >
          <FaCalendarAlt />
        </button>
        {isCalendarShow && (
          <div className="order-actions__date-filter">
            <DatePicker
              selected={startDate}
              onChange={onStartDateChange}
              placeholderText="Select Start Date"
              className="date-picker styled-date-picker"
              dateFormat="dd.MM.yyyy"
              isClearable
            />
            <DatePicker
              selected={endDate}
              onChange={onEndDateChange}
              placeholderText="Select End Date"
              className="date-picker styled-date-picker"
              dateFormat="dd.MM.yyyy"
              isClearable
            />
          </div>
        )}
        <button
          className="order-actions__find-customer-btn"
          onClick={handleCustomerSelect}
          title="Вибрати замовника"
        >
          <FaUsers />
        </button>
        {isCustomerShow && (
          <div className="order-actions__find-customer-select">
            <SelectComponent
              title="Виберіть замовника"
              type="text"
              value={selectedCustomer || ""}
              onChange={(e) => dispatch(setSelectedCustomer(e.target.value))}
              options={customerOptions}
              className="styled-select-component"
            />
          </div>
        )}
        <button
          className="order-actions__delete-order-btn"
          onClick={onDelete}
          title="Видалити маршрут"
        >
          <FaTrash />
        </button>
      </div>

      {isPreviewOpen && (
        <Modal onClose={handleCancelPreview}>
          <ModalHeader onClose={handleCancelPreview} />
          <RoutePreview
            origin={routeFromTitle.origin}
            destination={routeFromTitle.destination}
          />
          <InfoGrid items={infoCards} />
          <RouteTimeline
            originPoint={loadingPoint}
            transitPoint={transitPoint}
            destinationPoint={unloadingPoint}
            distance={
              summary.distance !== null && summary.distance !== undefined
                ? `${summary.distance} км`
                : "—"
            }
          />
          <ModalFooter
            isBusy={isCreatingSovtesRoute}
            onCancel={handleCancelPreview}
            onConfirm={handleConfirmCreate}
          />
        </Modal>
      )}
    </>
  );
};

export default OrderActionsComponent;
