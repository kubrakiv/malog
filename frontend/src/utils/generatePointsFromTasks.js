// export const generatePointsFromTasks = (tasks) => {
//   if (!tasks || tasks.length === 0) return [];

//   return tasks
//     .map((task, index) => {
//       const lat = parseFloat(task.point_details?.gps_latitude);
//       const lng = parseFloat(task.point_details?.gps_longitude);

//       if (isNaN(lat) || isNaN(lng)) return null;

//       return {
//         taskId: task.id,
//         lat,
//         lng,
//         type: task.type.toLowerCase(),
//         label: `${task.type}: ${task.point_details?.city || task.title}`,
//       };
//     })
//     .filter(Boolean); // Remove nulls
// };

import { DELIVERY_CONSTANTS } from "../constants/global";
const { START, LOADING, UNLOADING, CUSTOMS, BORDER_CROSSING } = DELIVERY_CONSTANTS;

const ROUTE_POINT_TYPES = [LOADING, CUSTOMS, BORDER_CROSSING, UNLOADING];

const taskDateTime = (task) => {
  if (!task?.start_date) return Number.MAX_SAFE_INTEGER;
  const value = new Date(`${task.start_date}T${task.start_time || "00:00:00"}`).getTime();
  return Number.isNaN(value) ? Number.MAX_SAFE_INTEGER : value;
};

export const generatePointsFromTasks = (tasks) => {
  if (!tasks || tasks.length === 0) return [];

  const startPoints = tasks
    .filter((task) => task.type === START)
    .sort((a, b) => taskDateTime(a) - taskDateTime(b));

  const routePoints = tasks
    .filter((task) => ROUTE_POINT_TYPES.includes(task.type))
    .sort((a, b) => taskDateTime(a) - taskDateTime(b) || (a.id || 0) - (b.id || 0));

  const orderedTasks = [...startPoints, ...routePoints];

  // Map to points
  return orderedTasks
    .map((task) => {
      const lat = parseFloat(task.point_details?.gps_latitude);
      const lng = parseFloat(task.point_details?.gps_longitude);

      if (isNaN(lat) || isNaN(lng)) return null;

      return {
        taskId: task.id,
        lat,
        lng,
        type: task.type,
        label: `${task.type_uk || task.type}: ${task.point_details?.city || task.title}`,
        start_date: task.start_date,
        start_time: task.start_time,
        end_date: task.end_date,
        end_time: task.end_time,
        type_uk: task.type_uk,
      };
    })
    .filter(Boolean);
};
