import { createSlice } from "@reduxjs/toolkit";
import {
  listDrivers,
  getDriverDetails,
  updateDriver,
  createDriver,
  deleteDriver,
} from "./driversOperations";

export const driverSlice = createSlice({
  name: "driver",
  initialState: {
    drivers: {
      data: [],
    },
    selectedDriver: {
      data: {},
    },
    createdDriver: {
      data: {},
    },
    editModeDriver: false,
    showDriverModal: false,
    showAddDriverModal: false,
    loading: false,
    error: null,
  },
  reducers: {
    setEditModeDriver: (state, action) => {
      state.editModeDriver = action.payload;
    },
    setShowDriverModal: (state, action) => {
      state.showDriverModal = action.payload;
    },
    setShowAddDriverModal: (state, action) => {
      state.showAddDriverModal = action.payload;
    },
    setSelectedDriver: (state, action) => {
      state.selectedDriver.data = action.payload;
    },
    // Add a reducer to handle the creation of a driver
    addDriver: (state, action) => {
      state.drivers.data = [...state.drivers.data, action.payload];
      state.createdDriver.data = action.payload;
    },
  },
  extraReducers: (builder) => {
    // List drivers cases
    builder.addCase(listDrivers.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(listDrivers.fulfilled, (state, action) => {
      state.loading = false;
      state.drivers.data = action.payload;
    });
    builder.addCase(listDrivers.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload?.error || "Failed to fetch drivers";
    });

    // Get driver details cases
    builder.addCase(getDriverDetails.fulfilled, (state, action) => {
      state.selectedDriver.data = action.payload;
    });

    // Update driver cases
    builder.addCase(updateDriver.fulfilled, (state, action) => {
      const index = state.drivers.data.findIndex(
        (driver) =>
          driver.id === action.payload.id ||
          driver.profile === action.payload.id
      );
      if (index !== -1) {
        state.drivers.data[index] = action.payload;
      }
    });

    // Create driver cases
    builder.addCase(createDriver.fulfilled, (state, action) => {
      state.drivers.data.push(action.payload);
      state.createdDriver.data = action.payload;
    });

    // Delete driver cases
    builder.addCase(deleteDriver.fulfilled, (state, action) => {
      state.drivers.data = state.drivers.data.filter(
        (driver) =>
          driver.id !== action.payload && driver.profile !== action.payload
      );
    });
  },
});

export const driverActions = driverSlice.actions;
export const {
  setEditModeDriver,
  setShowDriverModal,
  setShowAddDriverModal,
  setSelectedDriver,
  addDriver,
} = driverActions;

export default driverSlice.reducer;
