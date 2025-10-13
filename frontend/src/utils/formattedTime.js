export const formattedTime = (time) => {
  return time?.slice(0, 5);
};

export const extractTime = (dateTimeString) => {
  const timePart = dateTimeString.split("T")[1];
  return timePart ? timePart.slice(0, 5) : "";
};
