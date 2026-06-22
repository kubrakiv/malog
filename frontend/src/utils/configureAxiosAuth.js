import axios from "axios";

let axiosAuthConfigured = false;

const getStoredUserInfo = () => {
  const raw = localStorage.getItem("userInfo");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const configureAxiosAuth = () => {
  if (axiosAuthConfigured) {
    return;
  }

  axios.interceptors.request.use((config) => {
    const userInfo = getStoredUserInfo();

    if (userInfo) {
      const token = userInfo.token || userInfo.access;
      if (token && !config.headers?.Authorization) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }

      if (userInfo.session_id && !config.headers?.["X-Session-Id"]) {
        config.headers = config.headers || {};
        config.headers["X-Session-Id"] = userInfo.session_id;
      }
    }

    return config;
  });

  axiosAuthConfigured = true;
};
