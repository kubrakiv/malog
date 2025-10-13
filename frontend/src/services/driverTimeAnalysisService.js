const { REACT_APP_API_KEY_RUPTELA } = import.meta.env;
import axios from "axios";

export const fetchDriverCurrentTimeAnalysis = async (driverId) => {
  const apiKey = REACT_APP_API_KEY_RUPTELA;
  const url = `/api/fm-track/drivers/${driverId}/current-time-analysis?version=1&api_key=${apiKey}`;
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error("Error fetching driver analysis:", error);
    throw error;
  }
};
