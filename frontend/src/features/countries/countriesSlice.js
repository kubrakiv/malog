import { createSlice } from "@reduxjs/toolkit";
import { listCountries } from "./countriesOperations";

export const countriesSlice = createSlice({
  name: "countries",
  initialState: {
    countries: {
      data: [],
    },
  },
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(listCountries.fulfilled, (state, action) => {
      state.countries.data = action.payload;
    });
  },
});

export const countriesActions = countriesSlice.actions;

export default countriesSlice.reducer;
