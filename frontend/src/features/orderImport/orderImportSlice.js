import { createSlice } from "@reduxjs/toolkit";

import { getRoute, getBookedTenderRoutes, getFreeOrders } from "./orderImportOperations";

export const sovtesSlice = createSlice({
  name: "sovtes",
  initialState: {
    route: {},
    routes: {
      data: [],
    },
    freeOrders: {
      data: [],
      loading: false,
      error: null,
    },
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getRoute.fulfilled, (state, action) => {
        state.route = action.payload;
      })
      .addCase(getBookedTenderRoutes.fulfilled, (state, action) => {
        state.routes.data = action.payload;
      })
      .addCase(getFreeOrders.pending, (state) => {
        state.freeOrders.loading = true;
        state.freeOrders.error = null;
        console.log("Fetching all routes...");
      })
      .addCase(getFreeOrders.fulfilled, (state, action) => {
        state.freeOrders.loading = false;
        state.freeOrders.data = action.payload;
        console.log("Fetched all routes successfully:", action.payload);
      })
      .addCase(getFreeOrders.rejected, (state, action) => {
        state.freeOrders.loading = false;
        state.freeOrders.error = action.payload?.error;
        console.error("Failed to fetch all routes:", state.freeOrders.error);
      });
  },
});

export const sovtesActions = sovtesSlice.actions;
export default sovtesSlice.reducer;
