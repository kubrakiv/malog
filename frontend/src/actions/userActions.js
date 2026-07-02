import axios from "axios";
import { listDrivers } from "../features/drivers/driversOperations";

export const USER_LOGIN_REQUEST = "USER_LOGIN_REQUEST";
export const USER_LOGIN_SUCCESS = "USER_LOGIN_SUCCESS";
export const USER_LOGIN_FAIL = "USER_LOGIN_FAIL";

export const USER_LOGOUT = "USER_LOGOUT";

export const USER_REGISTER_REQUEST = "USER_REGISTER_REQUEST";
export const USER_REGISTER_SUCCESS = "USER_REGISTER_SUCCESS";
export const USER_REGISTER_FAIL = "USER_REGISTER_FAIL";

export const CLIENT_REGISTER_REQUEST = "CLIENT_REGISTER_REQUEST";
export const CLIENT_REGISTER_SUCCESS = "CLIENT_REGISTER_SUCCESS";
export const CLIENT_REGISTER_FAIL = "CLIENT_REGISTER_FAIL";

export const USER_DETAILS_REQUEST = "USER_DETAILS_REQUEST";
export const USER_DETAILS_SUCCESS = "USER_DETAILS_SUCCESS";
export const USER_DETAILS_FAIL = "USER_DETAILS_FAIL";
export const USER_DETAILS_RESET = "USER_DETAILS_RESET";

export const USER_UPDATE_PROFILE_REQUEST = "USER_UPDATE_PROFILE_REQUEST";
export const USER_UPDATE_PROFILE_SUCCESS = "USER_UPDATE_PROFILE_SUCCESS";
export const USER_UPDATE_PROFILE_RESET = "USER_UPDATE_PROFILE_RESET";
export const USER_UPDATE_PROFILE_FAIL = "USER_UPDATE_PROFILE_FAIL";

export const USER_LIST_REQUEST = "USER_LIST_REQUEST";
export const USER_LIST_SUCCESS = "USER_LIST_SUCCESS";
export const USER_LIST_FAIL = "USER_LIST_FAIL";
export const USER_LIST_RESET = "USER_LIST_RESET";

export const USER_DELETE_REQUEST = "USER_DELETE_REQUEST";
export const USER_DELETE_SUCCESS = "USER_DELETE_SUCCESS";
export const USER_DELETE_FAIL = "USER_DELETE_FAIL";

export const USER_UPDATE_REQUEST = "USER_UPDATE_REQUEST";
export const USER_UPDATE_SUCCESS = "USER_UPDATE_SUCCESS";
export const USER_UPDATE_FAIL = "USER_UPDATE_FAIL";
export const USER_UPDATE_RESET = "USER_UPDATE_RESET";

export const login = (email, password) => async (dispatch) => {
  try {
    dispatch({ type: USER_LOGIN_REQUEST });
    const config = {
      headers: {
        "Content-Type": "application/json",
      },
    };
    const { data } = await axios.post(
      "/api/users/login/",
      { username: email, password: password },
      config
    );
    dispatch({ type: USER_LOGIN_SUCCESS, payload: data });
    localStorage.setItem("userInfo", JSON.stringify(data));
  } catch (error) {
    let errorMessage = error.message;
    let errorCode = null;

    console.log("Login error response:", error.response);
    console.log("Login error response data:", error.response?.data);

    if (error.response && error.response.data) {
      const errorData = error.response.data;
      if (errorData.detail) {
        errorMessage = errorData.detail;
      }
      if (errorData.error_code) {
        // Handle both string and array formats
        errorCode = Array.isArray(errorData.error_code)
          ? errorData.error_code[0]
          : errorData.error_code;
      }
    }

    console.log("Dispatching error message:", errorMessage);
    console.log("Dispatching error code:", errorCode);

    dispatch({
      type: USER_LOGIN_FAIL,
      payload: errorMessage,
      errorCode: errorCode,
    });
  }
};

export const logout = () => async (dispatch, getState) => {
  const { userInfo } = getState().userLogin;

  if (userInfo?.token && userInfo?.session_id) {
    try {
      await axios.post(
        '/api/users/logout/',
        { session_id: userInfo.session_id },
        { headers: { Authorization: `Bearer ${userInfo.token}`, 'Content-Type': 'application/json' } },
      );
    } catch (_) {
      // proceed with local logout regardless
    }
  }

  localStorage.removeItem("userInfo");
  dispatch({ type: USER_LOGOUT });
  dispatch({ type: USER_DETAILS_RESET });
  dispatch({ type: USER_LIST_RESET });
};

export const register = (user) => async (dispatch) => {
  try {
    dispatch({ type: USER_REGISTER_REQUEST });
    const config = {
      headers: {
        "Content-Type": "application/json",
      },
    };

    const { data } = await axios.post("/api/users/register/", user, config);
    dispatch({ type: USER_REGISTER_SUCCESS, payload: data });
    // Fetch and update driver list after successful registration
    await dispatch(listDrivers()); // Call listDrivers here
    // dispatch({ type: USER_LIST_SUCCESS, payload: data }); // FIXME check if this works when I register new driver
  } catch (error) {
    dispatch({
      type: USER_REGISTER_FAIL,
      payload:
        error.response && error.response.data.detail
          ? error.response.data.detail
          : error.message,
    });
  }
};

// Admin create user action with authentication
export const adminCreateUser = (user) => async (dispatch, getState) => {
  try {
    dispatch({ type: USER_REGISTER_REQUEST });

    const {
      userLogin: { userInfo },
    } = getState();

    const config = {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userInfo.token}`,
      },
    };

    const { data } = await axios.post("/api/users/register/", user, config);
    dispatch({ type: USER_REGISTER_SUCCESS, payload: data });
    // Optionally refresh user list after successful creation
    await dispatch(listUsers());
  } catch (error) {
    dispatch({
      type: USER_REGISTER_FAIL,
      payload:
        error.response && error.response.data.detail
          ? error.response.data.detail
          : error.message,
    });
  }
};

export const registerClient = (registrationData) => async (dispatch) => {
  try {
    dispatch({ type: CLIENT_REGISTER_REQUEST });

    const config = {
      headers: {
        "Content-Type": "application/json",
      },
    };

    const { data } = await axios.post(
      "/api/users/register-client/",
      registrationData,
      config
    );

    dispatch({ type: CLIENT_REGISTER_SUCCESS, payload: data });

    // Auto-login the user after successful registration
    if (data.token) {
      dispatch({ type: USER_LOGIN_SUCCESS, payload: data });
      localStorage.setItem("userInfo", JSON.stringify(data));
    }

    return { success: true, data };
  } catch (error) {
    const errorMessage =
      error.response && error.response.data.detail
        ? error.response.data.detail
        : error.message;

    dispatch({
      type: CLIENT_REGISTER_FAIL,
      payload: errorMessage,
    });

    // Return error details for form handling
    if (error.response && error.response.data) {
      return {
        success: false,
        message: errorMessage,
        errors: error.response.data.errors || {},
      };
    }

    return { success: false, message: errorMessage };
  }
};

export const getUserDetails = (id) => async (dispatch, getState) => {
  try {
    dispatch({ type: USER_DETAILS_REQUEST });

    const {
      userLogin: { userInfo },
    } = getState();

    const config = {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userInfo.token}`,
      },
    };
    const { data } = await axios.get(`/api/users/${id}/`, config);
    dispatch({ type: USER_DETAILS_SUCCESS, payload: data });
  } catch (error) {
    dispatch({
      type: USER_DETAILS_FAIL,
      payload:
        error.response && error.response.data.detail
          ? error.response.data.detail
          : error.message,
    });
  }
};

export const updateUserProfile = (user) => async (dispatch, getState) => {
  try {
    dispatch({ type: USER_UPDATE_PROFILE_REQUEST });

    const {
      userLogin: { userInfo },
    } = getState();

    const config = {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userInfo.token}`,
      },
    };
    console.log("userUpdateProfileData", user);
    const { data } = await axios.put(
      `/api/users/profile/update/`,
      user,
      config
    );
    dispatch({ type: USER_UPDATE_PROFILE_SUCCESS, payload: data });
    dispatch({ type: USER_LOGIN_SUCCESS, payload: data });
    localStorage.setItem("userInfo", JSON.stringify(data));
  } catch (error) {
    dispatch({
      type: USER_UPDATE_PROFILE_FAIL,
      payload:
        error.response && error.response.data.detail
          ? error.response.data.detail
          : error.message,
    });
  }
};

export const listUsers = () => async (dispatch, getState) => {
  try {
    dispatch({ type: USER_LIST_REQUEST });

    const {
      userLogin: { userInfo },
    } = getState();

    const config = {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userInfo.token}`,
      },
    };
    const { data } = await axios.get(`/api/users/`, config);

    dispatch({ type: USER_LIST_SUCCESS, payload: data });
  } catch (error) {
    dispatch({
      type: USER_LIST_FAIL,
      payload:
        error.response && error.response.data.detail
          ? error.response.data.detail
          : error.message,
    });
  }
};

export const deleteUser = (id) => async (dispatch, getState) => {
  try {
    dispatch({ type: USER_DELETE_REQUEST });

    const {
      userLogin: { userInfo },
    } = getState();

    const config = {
      headers: {
        Authorization: `Bearer ${userInfo.token}`,
      },
    };
    await axios.delete(`/api/users/delete/${id}/`, config);

    dispatch({ type: USER_DELETE_SUCCESS });
  } catch (error) {
    dispatch({
      type: USER_DELETE_FAIL,
      payload:
        error.response && error.response.data.detail
          ? error.response.data.detail
          : error.message,
    });
  }
};

export const updateUser = (user) => async (dispatch, getState) => {
  try {
    dispatch({ type: USER_UPDATE_REQUEST });

    const {
      userLogin: { userInfo },
    } = getState();

    const config = {
      headers: {
        Authorization: `Bearer ${userInfo.token}`,
      },
    };
    const { data } = await axios.put(
      `/api/users/update/${user.id}/`,
      user,
      config
    );

    dispatch({ type: USER_UPDATE_SUCCESS });
    dispatch({ type: USER_DETAILS_SUCCESS, payload: data });
  } catch (error) {
    dispatch({
      type: USER_UPDATE_FAIL,
      payload:
        error.response && error.response.data.detail
          ? error.response.data.detail
          : error.message,
    });
  }
};
