// import axios from "axios";

// export const getCsrfToken = async () => {
//     const { data } = await axios.get(`/api/csrf-token/`);

//     axios.defaults.headers.common["X-CSRFToken"] = data.csrfToken;
// };

import axios from "axios";

let cachedToken = null;

export const getCsrfToken = async () => {
  if (cachedToken) return cachedToken;
  const { data } = await axios.get("/api/csrf-token/", {
    withCredentials: true,
  });
  cachedToken = data.csrfToken;
  // Better: set per-request via interceptor and only for unsafe methods.
  axios.defaults.headers.common["X-CSRFToken"] = cachedToken;
  return cachedToken;
};
