import React from "react";
import {
  addMonths,
  addWeeks,
  getISOWeek,
  getISOWeekYear,
  startOfISOWeek,
} from "date-fns";
import { IoChevronBack, IoChevronForward } from "react-icons/io5";
import "./WeekSwitcherComponent.scss";

const WeekSwitcherComponent = ({
  year,
  week,
  handleWeekChange,
  handleYearChange,
}) => {
  const getWeekStartDate = (targetYear, targetWeek) => {
    const firstIsoWeek = startOfISOWeek(new Date(targetYear, 0, 4));
    return addWeeks(firstIsoWeek, targetWeek - 1);
  };

  const getTargetWeek = (targetDate) => ({
    week: getISOWeek(targetDate),
    year: getISOWeekYear(targetDate),
  });

  const currentWeekDate = getWeekStartDate(year, week);
  const previousMonth = getTargetWeek(addMonths(currentWeekDate, -1));
  const previousWeek = getTargetWeek(addWeeks(currentWeekDate, -1));
  const nextWeek = getTargetWeek(addWeeks(currentWeekDate, 1));
  const nextMonth = getTargetWeek(addMonths(currentWeekDate, 1));

  const goToWeek = ({ week: targetWeek, year: targetYear }) => {
    handleWeekChange(targetWeek, targetYear);
  };

  return (
    <div className="week-switcher">
      <button
        type="button"
        className="week-switcher__button week-switcher__button--month week-switcher__button--previous"
        onClick={() => goToWeek(previousMonth)}
        title="Попередній місяць"
      >
        <IoChevronBack />
        <IoChevronBack />
        <span className="week-switcher__button-text">
          <span className="week-switcher__button-week">{previousMonth.week}</span>
          <span className="week-switcher__button-label">міс.</span>
        </span>
      </button>

      <button
        type="button"
        className="week-switcher__button week-switcher__button--previous"
        onClick={() => goToWeek(previousWeek)}
        title="Попередній тиждень"
      >
        <IoChevronBack />
        <span className="week-switcher__button-text">
          <span className="week-switcher__button-week">{previousWeek.week}</span>
          <span className="week-switcher__button-label">тиж.</span>
        </span>
      </button>

      <div className="week-switcher__display">
        <div className="week-switcher__year">{year}</div>
        <div className="week-switcher__week">
          Тиждень <span className="week-switcher__week-number">{week}</span>
        </div>
      </div>

      <button
        type="button"
        className="week-switcher__button week-switcher__button--next"
        onClick={() => goToWeek(nextWeek)}
        title="Наступний тиждень"
      >
        <span className="week-switcher__button-text">
          <span className="week-switcher__button-week">{nextWeek.week}</span>
          <span className="week-switcher__button-label">тиж.</span>
        </span>
        <IoChevronForward />
      </button>

      <button
        type="button"
        className="week-switcher__button week-switcher__button--month week-switcher__button--next"
        onClick={() => goToWeek(nextMonth)}
        title="Наступний місяць"
      >
        <span className="week-switcher__button-text">
          <span className="week-switcher__button-week">{nextMonth.week}</span>
          <span className="week-switcher__button-label">міс.</span>
        </span>
        <IoChevronForward />
        <IoChevronForward />
      </button>
    </div>
  );
};

export default WeekSwitcherComponent;
