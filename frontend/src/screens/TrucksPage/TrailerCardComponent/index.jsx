import React from "react";
import { useSelector } from "react-redux";
import { FaSync, FaCalendarAlt, FaTachometerAlt, FaBarcode, FaTag, FaDollarSign } from "react-icons/fa";
import { transformDate } from "../../../utils/formatDate";
import { selectEditModeTrailer } from "../../../features/trailers/trailersSelectors";

import TrailerFooterComponent from "../TrailerFooterComponent";
import ManageTrailerComponent from "../ManageTrailerComponent";

import "./style.scss";

const FieldRow = ({ icon, label, value }) => (
  <div className="trailer-card__field">
    <span className="trailer-card__field-label">
      {icon && <span className="trailer-card__field-icon">{icon}</span>}
      {label}
    </span>
    <span className={value ? "trailer-card__field-value" : "trailer-card__field-value trailer-card__field-value--empty"}>
      {value || "—"}
    </span>
  </div>
);

const TrailerCardComponent = ({ trailer, onCloseModal }) => {
  const editModeTrailer = useSelector(selectEditModeTrailer);

  if (editModeTrailer) {
    return (
      <ManageTrailerComponent
        onEditMode={true}
        initialTrailerData={trailer}
        onCloseModal={onCloseModal}
      />
    );
  }

  const entryDate = trailer?.entry_date ? transformDate(trailer.entry_date) : null;
  const endDate = trailer?.end_date ? transformDate(trailer.end_date) : null;

  return (
    <div className="trailer-card">
      {/* Header */}
      <div className="trailer-card__header">
        <div className="trailer-card__header-main">
          <div className="trailer-card__brand">
            {trailer?.brand || "Причіп"}
          </div>
          <div className="trailer-card__header-badges">
            {trailer?.plates && (
              <span className="trailer-card__plate-badge">
                {trailer.plates}
              </span>
            )}
            {trailer?.sovtes_id && (
              <span className="trailer-card__sovtes-badge">
                <FaSync className="trailer-card__sovtes-icon" />
                Sovtes #{trailer.sovtes_id}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Fields grid */}
      <div className="trailer-card__body">
        <div className="trailer-card__section">
          <h4 className="trailer-card__section-title">Технічні дані</h4>
          <div className="trailer-card__grid">
            <FieldRow
              icon={<FaTag />}
              label="Рік випуску"
              value={trailer?.year}
            />
            <FieldRow
              icon={<FaBarcode />}
              label="VIN номер"
              value={trailer?.vin_code}
            />
          </div>
        </div>

        <div className="trailer-card__section">
          <h4 className="trailer-card__section-title">Експлуатація</h4>
          <div className="trailer-card__grid">
            <FieldRow
              icon={<FaCalendarAlt />}
              label="Дата введення"
              value={entryDate}
            />
            <FieldRow
              icon={<FaCalendarAlt />}
              label="Дата вибуття"
              value={endDate}
            />
            <FieldRow
              icon={<FaTachometerAlt />}
              label="Пробіг при введенні"
              value={trailer?.entry_mileage ? `${trailer.entry_mileage} км` : null}
            />
            <FieldRow
              icon={<FaDollarSign />}
              label="Ціна"
              value={trailer?.price}
            />
          </div>
        </div>
      </div>

      <TrailerFooterComponent onCloseModal={onCloseModal} />
    </div>
  );
};

export default TrailerCardComponent;
