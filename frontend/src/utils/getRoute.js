export const extractRoute = (data) => {
  if (!data.tasks || data.tasks.length === 0) {
    return "No tasks";
  }

  // Extract country codes and ensure they are unique
  const routeArray = data.tasks
    .map((task) => task?.point_details?.country_short)
    .filter((value, index, self) => self.indexOf(value) === index);

  // If all tasks are in the same country, return 'COUNTRY-CODE-COUNTRY-CODE'
  if (routeArray.length === 1) {
    return `${routeArray[0]}-${routeArray[0]}`;
  }

  // Otherwise, join the unique country codes with a dash
  const route = routeArray.join("-");
  return route;
};
