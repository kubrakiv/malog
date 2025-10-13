import {
  PENDING_CLIENTS_REQUEST,
  PENDING_CLIENTS_SUCCESS,
  PENDING_CLIENTS_FAIL,
  APPROVE_CLIENT_REQUEST,
  APPROVE_CLIENT_SUCCESS,
  APPROVE_CLIENT_FAIL,
  REJECT_CLIENT_REQUEST,
  REJECT_CLIENT_SUCCESS,
  REJECT_CLIENT_FAIL,
} from "../actions/adminActions";

export const pendingClientsReducer = (state = { clients: [] }, action) => {
  switch (action.type) {
    case PENDING_CLIENTS_REQUEST:
      return { loading: true, clients: [] };
    case PENDING_CLIENTS_SUCCESS:
      return { loading: false, clients: action.payload };
    case PENDING_CLIENTS_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};

export const approveClientReducer = (state = {}, action) => {
  switch (action.type) {
    case APPROVE_CLIENT_REQUEST:
      return { loading: true };
    case APPROVE_CLIENT_SUCCESS:
      return { loading: false, success: true, data: action.payload };
    case APPROVE_CLIENT_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};

export const rejectClientReducer = (state = {}, action) => {
  switch (action.type) {
    case REJECT_CLIENT_REQUEST:
      return { loading: true };
    case REJECT_CLIENT_SUCCESS:
      return { loading: false, success: true, data: action.payload };
    case REJECT_CLIENT_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};
