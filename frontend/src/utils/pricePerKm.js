export const getPricePerKm = (amount, distance, currency, currency_rate) => {
  const pricePerKm =
    currency === "EUR" ? amount / distance : amount / distance / currency_rate;

  return pricePerKm.toFixed(2);
};
