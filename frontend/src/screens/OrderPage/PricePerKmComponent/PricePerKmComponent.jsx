import { getPricePerKm } from "../../../utils/pricePerKm";
import { toEUR } from "../../../utils/formatCurrency";

import "./PricePerKmComponent.scss";

// Color thresholds are calibrated in EUR/km
const EUR_THRESHOLDS = { red: 1, blue: 1.2, yellow: 1.3 };

const PricePerKmComponent = ({ type, price, distance, currency }) => {
  let pricePerKm = 0;

  switch (type) {
    case "price":
    case "table":
    case "market-price":
      pricePerKm = getPricePerKm(parseFloat(price), distance);
      break;
    default:
      break;
  }

  // Convert to EUR only for color grading
  const pricePerKmEUR = currency === "EUR"
    ? parseFloat(pricePerKm)
    : toEUR(parseFloat(price) || 0, currency) / (distance || 1);

  const isEurComparable = !!currency; // always grade if we have a currency

  const getBackgroundColor = () => {
    const v = pricePerKmEUR;
    if (v < EUR_THRESHOLDS.red) return "#FF0000";
    if (v < EUR_THRESHOLDS.blue) return "blue";
    if (v < EUR_THRESHOLDS.yellow) return "rgb(234, 230, 15)";
    return "green";
  };

  const getTextColor = () => {
    const v = pricePerKmEUR;
    if (v < EUR_THRESHOLDS.red) return "white";
    if (v < EUR_THRESHOLDS.blue) return "white";
    if (v < EUR_THRESHOLDS.yellow) return "black";
    return "white";
  };

  return (
    <>
      <div
        className="order-details__priceperkm"
        style={{
          backgroundColor: getBackgroundColor(),
          color: getTextColor(),
        }}
      >
        <span className="order-details__priceperkm_text">
          {pricePerKm}
          {type === "price" || type === "market-price" ? " Eur/km" : null}
        </span>
      </div>
    </>
  );
};

export default PricePerKmComponent;
