export const getPricePerKm = (amount, distance) => {
  if (!distance || distance === 0) return "0.00";
  return ((parseFloat(amount) || 0) / distance).toFixed(2);
};
