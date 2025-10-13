import { setTruckCurrentLocation } from "../actions/mapActions";

const { REACT_APP_API_KEY_RUPTELA } = import.meta.env;

export const getTruckLocation = async (truck, dispatch) => {
  if (!truck) return null;

  const objectId = truck.gps_id;
  const apiKeyRuptela = REACT_APP_API_KEY_RUPTELA;
  const url = `https://api.fm-track.com/object-coordinates-stream?version=1&object_id=${objectId}&api_key=${apiKeyRuptela}`;

  return new Promise((resolve, reject) => {
    const eventSource = new EventSource(url);

    eventSource.onmessage = function (event) {
      const data = JSON.parse(event.data);
      const latitude = data.position.latitude;
      const longitude = data.position.longitude;

      const location = { lat: latitude, lng: longitude };
      dispatch(setTruckCurrentLocation(location));

      resolve(location);
      eventSource.close();
    };

    eventSource.onerror = function (error) {
      console.error("EventSource failed:", error);
      reject(error);
      eventSource.close();
    };
  });
};
