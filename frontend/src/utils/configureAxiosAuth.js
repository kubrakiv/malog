import axios from "axios";

let axiosAuthConfigured = false;

const getStoredToken = () => {
  const storedUserInfo = localStorage.getItem("userInfo");

  if (!storedUserInfo) {
    return null;
  }

  try {
    const userInfo = JSON.parse(storedUserInfo);
    return userInfo?.token || userInfo?.access || null;
  } catch (error) {
    console.error("Failed to parse userInfo from localStorage", error);
    return null;
  }
};

export const configureAxiosAuth = () => {
  if (axiosAuthConfigured) {
    return;
  }

  axios.interceptors.request.use((config) => {
    const token = getStoredToken();

    if (token && !config.headers?.Authorization) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  });

  axiosAuthConfigured = true;
};
