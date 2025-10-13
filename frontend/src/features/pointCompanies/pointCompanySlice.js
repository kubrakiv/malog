import { createSlice } from "@reduxjs/toolkit";
import { listPointCompanies } from "./pointCompanyOperations";

export const pointCompanySlice = createSlice({
  name: "pointCompany",
  initialState: {
    pointCompanies: {
      data: [],
    },
  },
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(listPointCompanies.fulfilled, (state, action) => {
      state.pointCompanies.data = action.payload;
    });
  },
});

export const pointCompanyActions = pointCompanySlice.actions;

export default pointCompanySlice.reducer;
