import { useSelector } from "react-redux";
import { totalDistance } from "../../utils/getTotalDistance";
import { getTotalCostData } from "../../utils/calculateOrderValues";

import "./style.scss";

const ProfitComponent = ({ order, type = null }) => {
  if (!order || !totalDistance(order)) return null;

  const distance = totalDistance(order);
  const price = parseFloat(order.market_price || order.price || 0);
  const currency = order.currency || "EUR";
  const exchangeRate = 25.185;

  // Convert price to EUR if needed
  const priceInEUR = currency === "CZK" ? price / exchangeRate : price;

  const { totalCost } = getTotalCostData(order);

  // Profit calculation
  const profitValue = parseFloat((priceInEUR - totalCost).toFixed(0));
  const profitPercent = parseFloat(
    ((profitValue / totalCost) * 100).toFixed(0)
  );

  const getBackgroundColor = () => {
    if (profitValue < 0) return "#FF0000"; // red
    if (profitValue >= 100) return "green"; // green
    return "blue"; // for 0 to 99
  };

  const getTextColor = () => {
    if (profitValue < 0) return "red"; // red
    if (profitValue >= 100) return "green"; // green
    return "blue"; // for 0 to 99
  };

  const getProfitColor = (value) => {
    if (value < 0) return "red";
    if (value >= 0 && value < 100) return "blue";
    return "green";
  };

  const getPercentColor = (value) => {
    if (value < 0) return "red";
    if (value >= 0 && value < 10) return "blue";
    return "green";
  };

  return (
    <div className="order-details__profit">
      {type === "percent" && (
        <span
          style={{
            textAlign: "left",
            paddingLeft: "5px",
            color: getPercentColor(profitPercent),
          }}
        >
          {profitPercent}%
        </span>
      )}
      {type === "value-percent" && (
        <div className="order-details__profit">
          <span
            style={{
              textAlign: "right",
              paddingRight: "5px",
              color: getBackgroundColor(),
            }}
          >
            {profitValue < 0 ? "" : "+"}
            {profitValue} EUR
          </span>
          <span>|</span>
          <span
            style={{
              textAlign: "left",
              paddingLeft: "5px",
              color: getPercentColor(profitPercent),
            }}
          >
            {profitPercent}%
          </span>
        </div>
      )}
      {type === "value" && (
        <span
          style={{
            textAlign: "right",
            paddingRight: "5px",
            color: getProfitColor(profitValue),
          }}
        >
          {profitValue}
        </span>
      )}
    </div>
  );
};

export default ProfitComponent;
