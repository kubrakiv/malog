import { createSlice } from "@reduxjs/toolkit";
import {
  listCustomers,
  createCustomer,
  deleteCustomer,
  updateCustomer,
} from "./customersOperations";

export const customerSlice = createSlice({
  name: "customer",
  initialState: {
    customers: {
      data: [],
    },
    customer: {
      data: {},
    },
    managers: {
      data: [],
    },
    editModeCustomer: false,
  },
  reducers: {
    setCustomerDetailsData: (state, action) => {
      state.customer.data = action.payload;
    },
    setEditModeCustomer: (state, action) => {
      state.editModeCustomer = action.payload;
    },
    setManagersListData: (state, action) => {
      state.managers.data = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(listCustomers.fulfilled, (state, action) => {
      state.customers.data = action.payload;
    });
    builder.addCase(createCustomer.fulfilled, (state, action) => {
      state.customers.data.push(action.payload);
    });
    builder.addCase(deleteCustomer.fulfilled, (state, action) => {
      state.customers.data = state.customers.data.filter(
        (customer) => customer.id !== action.payload
      );
    });
    builder.addCase(updateCustomer.fulfilled, (state, action) => {
      const index = state.customers.data.findIndex(
        (customer) => customer.id === action.payload.id
      );
      state.customers.data[index] = action.payload;
    });
  },
});

export const customerActions = customerSlice.actions;
export const {
  setCustomerDetailsData,
  setEditModeCustomer,
  setManagersListData,
  setManagerDetailsData,
} = customerSlice.actions;
export default customerSlice.reducer;
