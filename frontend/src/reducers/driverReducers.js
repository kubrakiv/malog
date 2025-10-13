import {
  SET_DRIVER_LIST_DATA,
  SET_DRIVER_DETAILS_DATA,
  SET_UPDATE_DRIVER_DATA,
  SET_DELETE_DRIVER_DATA,
  SET_UPDATE_DRIVERS_LIST,
} from "../actions/driverActions";

const initialState = {
  drivers: {
    data: [],
  },
  driver: {
    data: {},
  },
};

export const driverReducer = (state = initialState, action) => {
  switch (action.type) {
    case SET_DRIVER_LIST_DATA:
      return {
        ...state,
        drivers: {
          ...state.drivers,
          data: action.data,
        },
      };
    case SET_UPDATE_DRIVER_DATA:
      return {
        ...state,
        driver: {
          ...state.driver,
          data: action.data,
        },
      };
    case SET_DELETE_DRIVER_DATA:
      return {
        ...state,
        drivers: {
          ...state.drivers,
          data: state.drivers.data.filter((driver) => driver.id !== action.id),
        },
      };
    case SET_UPDATE_DRIVERS_LIST:
      return {
        ...state,
        drivers: {
          ...state.drivers,
          data: action.data,
        },
      };

    case SET_DRIVER_DETAILS_DATA:
      return {
        ...state,
        driver: {
          ...state.driver,
          data: action.data,
        },
      };

    default:
      return state;
  }
};
