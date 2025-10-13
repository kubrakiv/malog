import React from "react";
import { IoChevronBack, IoChevronForward } from "react-icons/io5";
import "./WeekSwitcherComponent.scss";

const WeekSwitcherComponent = ({
  year,
  week,
  handleWeekChange,
  handleYearChange,
}) => {
  const currentYear = new Date().getFullYear();
  const isFirstWeek = week <= 1;
  const isLastWeek = week >= 52;

  return (
    <div className="week-switcher">
      <button
        type="button"
        className="week-switcher__button"
        onClick={() => handleWeekChange(week - 1)}
        disabled={isFirstWeek}
        title="Previous week"
      >
        <IoChevronBack />
      </button>

      <div className="week-switcher__display">
        <div className="week-switcher__year">{year}</div>
        <div className="week-switcher__week">
          Week: <span className="week-switcher__week-number">{week}</span>
        </div>
      </div>

      <button
        type="button"
        className="week-switcher__button"
        onClick={() => handleWeekChange(week + 1)}
        disabled={isLastWeek}
        title="Next week"
      >
        <IoChevronForward />
      </button>
    </div>
  );
};

export default WeekSwitcherComponent;
