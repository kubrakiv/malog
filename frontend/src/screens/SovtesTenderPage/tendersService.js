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

export const postOfferAuto = (payload) =>
  axios.post(`${BASE}/offer-auto/`, payload).then((r) => r.data);

export const postSubscribeRoute = (payload) =>
  axios.post(`${BASE}/subscribe-route/`, payload).then((r) => r.data);

export const fetchTenderChildren = (tenderPeriodic) =>
  axios
    .get(`${BASE}/tender-children/`, { params: { tenderPeriodic } })
    .then((r) => r.data);

export const fetchRouteActions = (routes) =>
  axios
    .get(`${BASE}/route-actions/`, { params: { routes: routes.join(",") } })
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
