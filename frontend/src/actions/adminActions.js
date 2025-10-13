import axios from "axios";

// Action types
export const PENDING_CLIENTS_REQUEST = "PENDING_CLIENTS_REQUEST";
export const PENDING_CLIENTS_SUCCESS = "PENDING_CLIENTS_SUCCESS";
export const PENDING_CLIENTS_FAIL = "PENDING_CLIENTS_FAIL";

export const APPROVE_CLIENT_REQUEST = "APPROVE_CLIENT_REQUEST";
export const APPROVE_CLIENT_SUCCESS = "APPROVE_CLIENT_SUCCESS";
export const APPROVE_CLIENT_FAIL = "APPROVE_CLIENT_FAIL";

export const REJECT_CLIENT_REQUEST = "REJECT_CLIENT_REQUEST";
export const REJECT_CLIENT_SUCCESS = "REJECT_CLIENT_SUCCESS";
export const REJECT_CLIENT_FAIL = "REJECT_CLIENT_FAIL";

// Action creators
export const listPendingClients = () => async (dispatch, getState) => {
  try {
    dispatch({ type: PENDING_CLIENTS_REQUEST });

    const {
      userLogin: { userInfo },
    } = getState();

    const config = {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userInfo.token}`,
      },
    };

    const { data } = await axios.get("/api/admin/pending-clients/", config);

    dispatch({
      type: PENDING_CLIENTS_SUCCESS,
      payload: data,
    });
  } catch (error) {
    dispatch({
      type: PENDING_CLIENTS_FAIL,
      payload:
        error.response && error.response.data.detail
          ? error.response.data.detail
          : error.message,
    });
  }
};

export const approveClient = (clientId) => async (dispatch, getState) => {
  try {
    dispatch({ type: APPROVE_CLIENT_REQUEST });

    const {
      userLogin: { userInfo },
    } = getState();

    const config = {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userInfo.token}`,
      },
    };

    const { data } = await axios.post(
      `/api/admin/approve-client/${clientId}/`,
      {},
      config
    );

    dispatch({
      type: APPROVE_CLIENT_SUCCESS,
      payload: data,
    });

    return data;
  } catch (error) {
    const errorMessage =
      error.response && error.response.data.message
        ? error.response.data.message
        : error.message;

    dispatch({
      type: APPROVE_CLIENT_FAIL,
      payload: errorMessage,
    });

    throw error;
  }
};

export const rejectClient =
  (clientId, reason) => async (dispatch, getState) => {
    try {
      dispatch({ type: REJECT_CLIENT_REQUEST });

      const {
        userLogin: { userInfo },
      } = getState();

      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userInfo.token}`,
        },
      };

      const { data } = await axios.post(
        `/api/admin/reject-client/${clientId}/`,
        { reason },
        config
      );

      dispatch({
        type: REJECT_CLIENT_SUCCESS,
        payload: data,
      });

      return data;
    } catch (error) {
      const errorMessage =
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message;

      dispatch({
        type: REJECT_CLIENT_FAIL,
        payload: errorMessage,
      });

      throw error;
    }
  };
