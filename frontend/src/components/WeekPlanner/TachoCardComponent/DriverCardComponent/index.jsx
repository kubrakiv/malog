import React from "react";

import "./style.scss";

const DriverCardComponent = ({ data }) => {
  if (!data) {
    return <p>No data to show!</p>;
  }
  const calculateHours = (seconds) => {
    const hours = Math.floor(seconds / 3600); // Get full hours
    const minutes = Math.floor((seconds % 3600) / 60); // Get remaining minutes
    return `${hours} год ${minutes} хв`;
  };

  // Daily Driving Data
  const dailyLimit =
    data?.current_day?.driving?.regular.duration_limit +
    data?.current_day?.driving?.extra.duration_limit;
  const dailyDriven = data?.current_day?.driving?.regular.duration;
  const dailyRemaining = dailyLimit - dailyDriven;

  // Weekly Driving Data
  const weeklyLimit = data?.current_week.driving.duration_limit;
  const weeklyDriven = data?.current_week.driving.duration;
  const weeklyRemaining = weeklyLimit - weeklyDriven;

  // Previous Week Data
  const prevWeekDriving = data?.previous_week.driving.duration;
  const prevWeekResting = data?.previous_week.resting.duration;

  return (
    <div className="driver-kpi-card">
      <div className="driver-kpi-section">
        <h3 className="driver-kpi-title">День водія</h3>
        <div className="driver-kpi-stat">
          Залишилося проїхати:{" "}
          <span className="driver-kpi-value">
            {calculateHours(dailyRemaining)} год
          </span>
        </div>
        <progress
          className="driver-kpi-progress"
          value={dailyDriven}
          max={dailyLimit}
        ></progress>
        <p className="driver-kpi-stat">
          Уже проїдено:{" "}
          <span className="driver-kpi-value">
            {calculateHours(dailyDriven)} год
          </span>
        </p>
        <p className="driver-kpi-stat">
          Наступний денний відпочинок:{" "}
          <span className="driver-kpi-value">
            {new Date(data?.current_day?.resting.next_rest).toLocaleString()}
          </span>
        </p>
      </div>

      <div className="driver-kpi-section">
        <h3 className="driver-kpi-title">Тиждень водія</h3>
        <div className="driver-kpi-stat">
          Залишилося проїхати:{" "}
          <span className="driver-kpi-value">
            {calculateHours(weeklyRemaining)} год
          </span>
        </div>
        <progress
          className="driver-kpi-progress"
          value={weeklyDriven}
          max={weeklyLimit}
        ></progress>
        <p className="driver-kpi-stat">
          Уже проїдено:{" "}
          <span className="driver-kpi-value">
            {calculateHours(weeklyDriven)} год
          </span>
        </p>
        <p className="driver-kpi-stat">
          Наступний тижневий відпочинок:{" "}
          <span className="driver-kpi-value">
            {new Date(data?.current_week?.resting.next_rest).toLocaleString()}
          </span>
        </p>
      </div>

      <div className="driver-kpi-section">
        <h3 className="driver-kpi-title">Попередній тиждень водія</h3>
        <p className="driver-kpi-stat">
          Тривалість водіння:{" "}
          <span className="driver-kpi-value">
            {calculateHours(prevWeekDriving)} год
          </span>
        </p>
        <p className="driver-kpi-stat">
          Тривалість відпочинку:{" "}
          <span className="driver-kpi-value">
            {calculateHours(prevWeekResting)} год
          </span>
        </p>
      </div>
    </div>
  );
};

export default DriverCardComponent;
