export const calculateOrderValue = (order, column) => {
  const distance = parseFloat(order.distance);
  const tolls = parseFloat(order.tolls);
  // const price = parseFloat(order.price);
  const orderPrice = parseFloat(order.market_price || order.price || 0);
  const distanceCost = distance * 0.435;

  const currency = order.currency || "EUR";
  const exchangeRate = 25.185;

  const price = currency === "CZK" ? orderPrice / exchangeRate : orderPrice;

  const isValid = (value) =>
    !isNaN(value) && value !== null && value !== undefined;

  switch (column) {
    case "Direct Costs, EUR":
      return isValid(distanceCost) ? distanceCost.toFixed(0) : "";
    case "Tolls, EUR":
      return isValid(tolls) ? tolls.toFixed(0) : "";
    case "Маржа, EUR":
      if (!isValid(price) || !isValid(distanceCost) || !isValid(tolls))
        return "";
      return Math.round(price - (distanceCost + tolls)).toFixed(0);
    case "Маржа, %":
      if (
        !isValid(price) ||
        price === 0 ||
        !isValid(distanceCost) ||
        !isValid(tolls)
      )
        return "";
      const marginPercent = Math.round(
        ((price - (distanceCost + tolls)) / price) * 100
      );
      return marginPercent.toFixed(0);
    default:
      return "";
  }
};

export const getTotalCostData = (order) => {
  const distance = parseFloat(order?.distance || 0);
  if (!distance || isNaN(distance)) {
    return { totalCost: 0, costPerKm: 0 };
  }

  const tolls = parseFloat(order?.tolls || 0) || 0;
  const directCostPerKm = 0.435;
  const plannedMarginPerKm = 0.481;

  const directCosts = directCostPerKm * distance;
  const plannedMargin = plannedMarginPerKm * distance;

  const totalCost = directCosts + tolls + plannedMargin;
  const costPerKm = totalCost / distance;

  return {
    totalCost: parseFloat(totalCost.toFixed(2)),
    costPerKm: parseFloat(costPerKm.toFixed(2)),
  };
};
