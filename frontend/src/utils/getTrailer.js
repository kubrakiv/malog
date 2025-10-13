export const findTrailer = (truckPlates, trucks) => {
  if (!truckPlates || !trucks) return "";
  const truckInfo = trucks.find((item) => item.plates === truckPlates);

  return truckInfo?.trailer || "";
};
