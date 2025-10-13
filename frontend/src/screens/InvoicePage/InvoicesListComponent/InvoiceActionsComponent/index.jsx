import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import {
  FaCalendarAlt,
  FaCopy,
  FaFileAlt,
  FaFolder,
  FaTimes,
  FaTrash,
  FaTruckMoving,
  FaUserCog,
  FaFileExcel,
} from "react-icons/fa";

import SelectComponent from "../../../../globalComponents/SelectComponent";

import "./style.scss";

const InvoiceActionsComponent = ({
  onExcelDownload,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [isDriverShow, setIsDriverShow] = useState(false);
  const [isTruckShow, setIsTruckShow] = useState(false);
  const [isCalendarShow, setIsCalendarShow] = useState(true);

  const handleCalendarSelect = () => {
    setIsCalendarShow(!isCalendarShow);
    if (!isCalendarShow) {
      onStartDateChange(null);
    }
  };

  return (
    <>
      <div className="order-actions order-details">
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
              placeholderText="Початкова дата"
              className="date-picker styled-date-picker"
              dateFormat="dd.MM.yyyy"
              isClearable
            />
            <DatePicker
              selected={endDate}
              onChange={onEndDateChange}
              placeholderText="Кінцева дата"
              className="date-picker styled-date-picker"
              dateFormat="dd.MM.yyyy"
              isClearable
            />
          </div>
        )}
        <button
          className="invoices-actions__download-excel-btn"
          onClick={onExcelDownload}
          title="Експорт в Excel"
        >
          <FaFileExcel />
        </button>
      </div>
    </>
  );
};

export default InvoiceActionsComponent;
