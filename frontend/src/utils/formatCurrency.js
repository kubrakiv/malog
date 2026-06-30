// Exchange rates to EUR
const TO_EUR = {
  EUR: 1,
  CZK: 1 / 25.185,
  UAH: 1 / 42,
  USD: 1 / 1.08,
  PLN: 1 / 4.25,
};

const SYMBOLS = {
  EUR: "EUR",
  UAH: "грн",
  CZK: "Kč",
  USD: "USD",
  PLN: "zł",
};

/** Format a number with space thousands separator and 2 decimal places. */
export const formatAmount = (amount) => {
  const num = parseFloat(amount) || 0;
  const [integer, decimal] = num.toFixed(2).split(".");
  return `${integer.replace(/\B(?=(\d{3})+(?!\d))/g, " ")}.${decimal}`;
};

/** Return the display symbol for a currency code. */
export const currencySymbol = (currency) =>
  SYMBOLS[currency] || currency || "EUR";

/** Format amount with currency symbol: "39 600.00 грн" */
export const formatPrice = (amount, currency) =>
  `${formatAmount(amount)} ${currencySymbol(currency)}`;

/** Convert an amount in the given currency to EUR. */
export const toEUR = (amount, currency) => {
  const num = parseFloat(amount) || 0;
  const rate = TO_EUR[currency] ?? 1;
  return num * rate;
};

/** Convert a EUR amount to the target display currency. */
export const fromEUR = (eurAmount, currency) => {
  const num = parseFloat(eurAmount) || 0;
  const rate = TO_EUR[currency] ?? 1;
  return num / rate;
};
