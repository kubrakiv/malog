export const totalDistance = (order) => {
  const distance = Number(order.distance) || 0;
  const emptyDistance = Number(order.empty_distance) || 0;
  return distance + emptyDistance;
};
