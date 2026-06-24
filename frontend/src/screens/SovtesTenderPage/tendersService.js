import axios from "axios";

const BASE = "/api/sovtes";

export const fetchTenderGroups = () =>
  axios.get(`${BASE}/tender-groups/`).then((r) => r.data);

export const fetchCurrentTenders = () =>
  axios.get(`${BASE}/current-tenders/`).then((r) => r.data);

export const fetchMyTenders = () =>
  axios.get(`${BASE}/my-tenders/`).then((r) => r.data);

export const fetchBasicDetails = (periodicIds) =>
  axios
    .get(`${BASE}/basic-details/`, { params: { routes: periodicIds.join(",") } })
    .then((r) => r.data);

export const fetchNotInterested = () =>
  axios.get(`${BASE}/not-interested/`).then((r) => r.data);

export const fetchCompleteRoutes = (page, perPage = 10) =>
  axios
    .get(`${BASE}/complete-routes/`, { params: { page, perPage } })
    .then((r) => r.data);

export const fetchTenderSteps = (route) =>
  axios
    .get(`${BASE}/tender-steps/`, { params: { route } })
    .then((r) => r.data);

export const fetchPricequotes = (route) =>
  axios
    .get(`${BASE}/pricequotes/`, { params: { route } })
    .then((r) => r.data);

export const postPricequote = (route, pricequote, loadquote) =>
  axios
    .post(`${BASE}/offer-price/`, { route, pricequote, loadquote })
    .then((r) => r.data);

export const postBookmark = (payload) =>
  axios.post(`${BASE}/bookmark/`, payload).then((r) => r.data);

export const postNotInterested = (payload) =>
  axios.post(`${BASE}/not-interested/`, payload).then((r) => r.data);

export const postCancelPricequote = (payload) =>
  axios.post(`${BASE}/cancel-pricequote/`, payload).then((r) => r.data);

export const postRevivePricequote = (payload) =>
  axios.post(`${BASE}/revive-pricequote/`, payload).then((r) => r.data);
