const UA_DAYS = ["НД", "ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ"];

export const dayOfWeek = (dateString) => {
  if (!dateString) return "";
  return UA_DAYS[new Date(dateString).getDay()];
};

export const transformDateFormat = (dateString) => {
  if (!dateString) {
    return null;
  }

  // Split the date string into year, month, and day
  const parts = dateString.split("-");

  // Rearrange the parts to form the desired format
  const transformedDate = `${parts[2]}.${parts[1]}.${parts[0]}`;

  return transformedDate;
};

export const transformDate = (dateString) => {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are zero-indexed
  const year = date.getFullYear();

  return `${day}.${month}.${year}`;
};

export const calculateDueDate = (unloadingEndDate, paymentPeriod) => {
  // Parse the unloading end date
  const date = new Date(unloadingEndDate);

  // Add the payment period (in days) to the date
  date.setDate(date.getDate() + paymentPeriod);

  // Format as YYYY-MM-DD for Django
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are zero-indexed
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export const formatDateForInput = (value) => {
  return value?.split("T")[0];
};

export const calcAge = (birthDate) => {
  if (!birthDate) return null;
  const today = new Date();
  const dob = new Date(birthDate);
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
};

export const calcTenure = (startedWork) => {
  if (!startedWork) return null;
  const today = new Date();
  const start = new Date(startedWork);
  let years = today.getFullYear() - start.getFullYear();
  let months = today.getMonth() - start.getMonth();
  if (months < 0) { years--; months += 12; }
  if (years === 0 && months === 0) return "< 1 міс.";
  const parts = [];
  if (years > 0) parts.push(`${years} р.`);
  if (months > 0) parts.push(`${months} міс.`);
  return parts.join(" ");
};
