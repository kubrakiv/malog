export const getRouteTitle = (tasks) => {
  if (tasks?.length > 0) {
    return tasks
      .map(
        (task) =>
          `${task.point_details.country_short}-${task.point_details.postal_code} ${task.point_details.city}`
      )
      .join(" - ");
  }
  return "Маршрут";
};

export const getRouteNoOrderTasks = (tasks) => {
  const routeTitles = tasks.map((task) => task.title);
  return routeTitles.join(" - ");
};
