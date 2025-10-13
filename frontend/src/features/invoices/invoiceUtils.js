import { formatDateForInput, calculateDueDate } from "../../utils/formatDate";

// Utility function to normalize values for comparison
export const normalizeValue = (value) => {
  if (value === null || value === undefined) return null; // Differentiate null/undefined
  return String(value).trim(); // Ensure consistent string comparison
};

const formatDateForComparison = (date) => {
  if (!date) return null; // Return null if the date is undefined or null
  return new Date(date.trim()).toISOString().split("T")[0];
};

// Function to calculate if an invoice needs updating based on an order
export const compareInvoiceWithOrder = (order, invoice) => {
  if (order && invoice) {
    const priceMatches =
      parseFloat(order.price).toFixed(2) ===
      parseFloat(invoice.price).toFixed(2);

    const vatMatches =
      (order.vat ? (order.price * 0.21).toFixed(2) : "0.00") ===
      parseFloat(invoice.vat).toFixed(2);

    const currencyMatches =
      normalizeValue(order.currency) === normalizeValue(invoice.currency);

    const customerMatches =
      normalizeValue(order.customer) === normalizeValue(invoice.customer);

    const invoicingDateMatches =
      formatDateForInput(order.unloading_end_date) ===
      formatDateForInput(invoice.invoicing_date);

    const vatDateMatches =
      formatDateForInput(order.unloading_end_date) ===
      formatDateForInput(invoice.vat_date);

    const dueDateMatches =
      calculateDueDate(order.unloading_end_date, order.payment_period) ===
      invoice.due_date;

    const truckMatches =
      normalizeValue(order.truck) === normalizeValue(invoice.truck);

    const trailerMatches =
      normalizeValue(order.trailer) === normalizeValue(invoice.trailer);

    const loadingDateMatches =
      formatDateForComparison(order.loading_end_date) ===
      formatDateForComparison(invoice.loading_date);

    const unloadingDateMatches =
      formatDateForComparison(order.unloading_end_date) ===
      formatDateForComparison(invoice.unloading_date);

    // const serviceNameMatches =
    //   normalizeValue(order.service_name) ===
    //   normalizeValue(invoice.service_name);

    console.log({
      priceMatches,
      vatMatches,
      currencyMatches,
      customerMatches,
      invoicingDateMatches,
      vatDateMatches,
      dueDateMatches,
      truckMatches,
      trailerMatches,
      loadingDateMatches,
      unloadingDateMatches,
      // serviceNameMatches,
    });
    return !(
      (
        priceMatches &&
        vatMatches &&
        currencyMatches &&
        customerMatches &&
        invoicingDateMatches &&
        vatDateMatches &&
        dueDateMatches &&
        truckMatches &&
        trailerMatches &&
        loadingDateMatches &&
        unloadingDateMatches
      )
      // serviceNameMatches
    );
  }
  return false; // Default to no update needed if order or invoice is missing
};

export const renderRouteTitle = (order) => {
  if (!order.tasks) return "";

  const loadingPoints = order.tasks
    .filter((task) => task.type === "Loading")
    .map(
      (task) =>
        `${task.point_details?.country_short}-${task.point_details?.postal_code} ${task.point_details?.city}`
    )
    .join(", ");

  const unloadingPoints = order.tasks
    .filter((task) => task.type === "Unloading")
    .map(
      (task) =>
        `${task.point_details?.country_short}-${task.point_details?.postal_code} ${task.point_details?.city}`
    )
    .join(", ");

  return `${loadingPoints} - ${unloadingPoints}`;
};

export const totalPrice = (vat, price) => {
  const isVatApplicable = typeof vat === "boolean" ? vat : parseInt(vat) !== 0;
  const priceFloat = parseFloat(price);

  if (isNaN(priceFloat)) return 0;

  return isVatApplicable
    ? (priceFloat + priceFloat * 0.21).toFixed(2)
    : priceFloat.toFixed(2);
};

export const formatNumber = (num) => {
  if (isNaN(num) || num === null || num === undefined) return "N/A";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
    .format(num)
    .replace(/,/g, " "); // Replace commas with spaces
};
