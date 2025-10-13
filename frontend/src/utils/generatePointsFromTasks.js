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
const { START, LOADING, UNLOADING } = DELIVERY_CONSTANTS;

export const generatePointsFromTasks = (tasks) => {
  if (!tasks || tasks.length === 0) return [];

  // Separate tasks by type
  const startPoints = tasks.filter((task) => task.type === START);
  const loadingPoints = tasks
    .filter((task) => task.type === LOADING)
    .sort(
      (a, b) =>
        new Date(`${a.start_date}T${a.start_time}`) -
        new Date(`${b.start_date}T${b.start_time}`)
    );
  const unloadingPoints = tasks
    .filter((task) => task.type === UNLOADING)
    .sort(
      (a, b) =>
        new Date(`${a.start_date}T${a.start_time}`) -
        new Date(`${b.start_date}T${b.start_time}`)
    );

  // Combine in desired order
  const orderedTasks = [...startPoints, ...loadingPoints, ...unloadingPoints];

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
        label: `${task.type}: ${task.point_details?.city || task.title}`,
        start_date: task.start_date,
        start_time: task.start_time,
        end_date: task.end_date,
        end_time: task.end_time,
      };
    })
    .filter(Boolean);
};
