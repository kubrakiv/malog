export const SET_MAP_CURRENT_LOCATION = "SET_MAP_CURRENT_LOCATION";
export const SET_MAP_CURRENT_LOCATION_DELETE =
  "SET_MAP_CURRENT_LOCATION_DELETE";
export const SET_TRUCK_CURRENT_LOCATION = "SET_TRUCK_CURRENT_LOCATION";
export const SET_TRUCK_DETAILS = "SET_TRUCK_DETAILS";
export const SET_DRIVER_ID = "SET_DRIVER_ID";
export const SET_TRUCK_TO_NEXT_TASK = "SET_TRUCK_TO_NEXT_TASK";

export const setTruckToNextTask = (truckToNextTask) => ({
  type: SET_TRUCK_TO_NEXT_TASK,
  truckToNextTask,
});

export const setMapCurrentLocation = (location) => ({
  type: SET_MAP_CURRENT_LOCATION,
  location,
});

export const setMapCurrentLocationDelete = () => ({
  type: SET_MAP_CURRENT_LOCATION_DELETE,
});

export const setTruckCurrentLocation = (location) => ({
  type: SET_TRUCK_CURRENT_LOCATION,
  location,
});

export const setTruckDetails = (truck) => ({
  type: SET_TRUCK_DETAILS,
  truck,
});

export const setDriverId = (driverId) => ({
  type: SET_DRIVER_ID,
  driverId,
});
