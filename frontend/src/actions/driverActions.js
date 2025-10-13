import axios from "axios";

export const SET_DRIVER_LIST_DATA = "SET_DRIVER_LIST_DATA";
export const SET_DRIVER_DETAILS_DATA = "SET_DRIVER_DETAILS_DATA";
export const SET_UPDATE_DRIVER_DATA = "SET_UPDATE_DRIVER_DATA";
export const SET_DELETE_DRIVER_DATA = "SET_DELETE_DRIVER_DATA";
export const SET_UPDATE_DRIVERS_LIST = "SET_UPDATE_DRIVERS_LIST";

export const listDrivers = () => async (dispatch) => {
  try {
    const { data } = await axios.get("/api/driver-profiles/");
    dispatch(setDriverListData(data));
  } catch (error) {
    console.error(error);
  }
};

export const getDriverDetails = (id) => async (dispatch) => {
  try {
    const { data } = await axios.get(`/api/driver-profiles/${id}/`);
    dispatch(setDriverListData(data));
  } catch (error) {
    console.error(error);
  }
};

export const updateDriver =
  (dataToUpdate, driverId) => async (dispatch, getState) => {
    try {
      const {
        userLogin: { userInfo },
      } = getState();

      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userInfo.token}`,
        },
      };
      const { data } = await axios.put(
        `/api/driver-profiles/update/${driverId}/`,
        dataToUpdate,
        config
      );
      dispatch(setUpdateDriverData(data));
    } catch (error) {
      console.error(error);
    }
  };

export const deleteDriver = (driverId) => async (dispatch, getState) => {
  try {
    const {
      userLogin: { userInfo },
    } = getState();

    const config = {
      headers: {
        Authorization: `Bearer ${userInfo.token}`,
      },
    };
    const { data } = await axios.delete(
      `/api/driver-profiles/delete/${driverId}/`,
      config
    );
    dispatch(setDeleteDriverData(data.id));
    dispatch(listDrivers());
  } catch (error) {
    console.error(error);
  }
};

export const setDriverListData = (data) => ({
  type: SET_DRIVER_LIST_DATA,
  data,
});

export const setDriverDetailsData = (data) => ({
  type: SET_DRIVER_DETAILS_DATA,
  data,
});

export const setUpdateDriverData = (data) => ({
  type: SET_UPDATE_DRIVER_DATA,
  data,
});

export const setDeleteDriverData = (id) => ({
  type: SET_DELETE_DRIVER_DATA,
  data: id,
});

export const setUpdateDriversList = (data) => ({
  type: SET_UPDATE_DRIVERS_LIST,
  data,
});
