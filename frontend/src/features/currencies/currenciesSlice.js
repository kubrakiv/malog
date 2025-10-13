import { createSlice } from "@reduxjs/toolkit";
import { listCurrencies } from "./currenciesOperations";

export const currenciesSlice = createSlice({
  name: "currencies",
  initialState: {
    currencies: {
      data: [],
    },
  },
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(listCurrencies.fulfilled, (state, action) => {
      state.currencies.data = action.payload;
    });
  },
});

export const currenciesActions = currenciesSlice.actions;
export default currenciesSlice.reducer;
