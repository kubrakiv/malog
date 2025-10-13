import { setDriverId } from "../actions/mapActions";

const { REACT_APP_API_KEY_RUPTELA } = import.meta.env;

export const getTruckDriverId = async (truck, dispatch) => {
  if (!truck) return null;

  const objectId = truck.gps_id;
  const apiKeyRuptela = REACT_APP_API_KEY_RUPTELA;
  const url = `https://api.fm-track.com/object-coordinates-stream?version=1&object_id=${objectId}&api_key=${apiKeyRuptela}`;

  return new Promise((resolve, reject) => {
    const eventSource = new EventSource(url);

    eventSource.onmessage = function (event) {
      console.log("New message:", event.data);
      const data = JSON.parse(event.data);

      // Extract driver ID
      const driverId = data.device_inputs.first_driver_id;
      console.log("Extracted driver ID:", driverId);

      dispatch(setDriverId(driverId));

      resolve(driverId);
      eventSource.close();
    };

    eventSource.onerror = function (error) {
      console.error("EventSource failed:", error);
      reject(error);
      eventSource.close();
    };
  });
};
