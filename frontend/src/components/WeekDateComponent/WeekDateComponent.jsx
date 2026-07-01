import React from "react";

const dayNames = ["НД", "ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ"];
const monthNames = [
  "Січ",
  "Лют",
  "Бер",
  "Кві",
  "Тра",
  "Чер",
  "Лип",
  "Сер",
  "Вер",
  "Жов",
  "Лис",
  "Гру",
];

const WeekDateComponent = ({ date }) => {
  const [year, month, day] = date.split("-").map(Number);
  const dayDate = new Date(year, month - 1, day);
  const compactDate = `${dayNames[dayDate.getDay()]} ${day} ${
    monthNames[month - 1]
  } ${String(year).slice(-2)}`;

  return (
    <div className="week-header__day-container_date-item">
      <span className="week-header__day-container_date-item__compact">
        {compactDate}
      </span>
    </div>
  );
};

export default WeekDateComponent;
