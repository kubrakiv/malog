import axios from "axios";

export const SET_CUSTOMER_LIST_DATA = "SET_CUSTOMER_LIST_DATA";
export const SET_CUSTOMER_DETAILS_DATA = "SET_CUSTOMER_DETAILS_DATA";
export const SET_EDIT_MODE_CUSTOMER = "SET_EDIT_MODE_CUSTOMER";
export const SET_MANAGER_LIST_DATA = "SET_MANAGER_LIST_DATA";
export const SET_MANAGER_DETAILS_DATA = "SET_MANAGER_DETAILS_DATA";

export const listCustomers = () => async (dispatch) => {
  try {
    dispatch(setCustomerListData({ loading: true, error: null }));

    const { data } = await axios.get("/api/customers/");
    dispatch(setCustomerListData({ data, loading: false }));
  } catch (error) {
    dispatch(setCustomerListData({ error: error.message, loading: false }));
  }
};

export const setCustomerListData = (data) => ({
  type: SET_CUSTOMER_LIST_DATA,
  data,
});

export const setCustomerDetailsData = (data) => ({
  type: SET_CUSTOMER_DETAILS_DATA,
  data,
});

export const setEditModeCustomer = (payload) => ({
  type: SET_EDIT_MODE_CUSTOMER,
  payload,
});

export const setManagersListData = (data) => ({
  type: SET_MANAGER_LIST_DATA,
  data,
});

export const setManagerDetailsData = (data) => ({
  type: SET_MANAGER_DETAILS_DATA,
  data,
});
