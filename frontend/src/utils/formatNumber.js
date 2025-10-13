export const formatNumberForExcel = (value) => {
  if (value === null || value === undefined) return null; // Return null for missing values
  return parseFloat(value); // Ensure it's a numeric value
};
