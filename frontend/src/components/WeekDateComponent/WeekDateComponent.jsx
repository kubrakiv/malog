import React from "react";

const WeekDateComponent = ({ day, date }) => {
    const [year, month, d] = date.split("-");
    return (
        <div className="week-header__day-container_date-item">
            <div className="week-header__day-container_date-item__name">
                {day}
            </div>
            <div className="week-header__day-container_date-item__date">
                {d}.{month}.{year}
            </div>
        </div>
    );
};

export default WeekDateComponent;
