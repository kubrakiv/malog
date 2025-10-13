import { createSlice } from "@reduxjs/toolkit";
import {
  listCustomerManagers,
  createCustomerManager,
  updateCustomerManager,
  deleteCustomerManager,
} from "./customerManagersOperations";

export const customerManagersSlice = createSlice({
  name: "customerManager",
  initialState: {
    customerManagers: [],
    customerManager: {
      data: {},
      isEditMode: false,
    },
    isAddCustomerManager: false,
    showCustomerManagerForm: false,
  },
  reducers: {
    setAddCustomerManager: (state, action) => {
      state.isAddCustomerManager = action.payload;
    },
    setShowCustomerManagerForm: (state, action) => {
      state.showCustomerManagerForm = action.payload;
    },
    setCustomerManagers: (state, action) => {
      state.customerManagers = action.payload;
    },
    setCustomerManager: (state, action) => {
      state.customerManager.data = action.payload;
    },
    setIsEditModeCustomerManager: (state, action) => {
      state.customerManager.isEditMode = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(listCustomerManagers.fulfilled, (state, action) => {
      state.customerManagers = action.payload;
    });
    builder.addCase(createCustomerManager.fulfilled, (state, action) => {
      state.customerManagers.push(action.payload);
    });
    builder.addCase(updateCustomerManager.fulfilled, (state, action) => {
      const index = state.customerManagers.findIndex(
        (customerManager) => customerManager.id === action.payload.id
      );
      state.customerManagers[index] = action.payload;
    });
    builder.addCase(deleteCustomerManager.fulfilled, (state, action) => {
      state.customerManagers = state.customerManagers.filter(
        (customerManager) => customerManager.id !== action.payload.id
      );
    });
  },
});

export const customerManagersActions = customerManagersSlice.actions;

export const {
  setAddCustomerManager,
  setCustomerManagers,
  setCustomerManager,
  setShowCustomerManagerForm,
  setIsEditModeCustomerManager,
} = customerManagersSlice.actions;

export default customerManagersSlice.reducer;
