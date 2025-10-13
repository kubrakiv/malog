import { createSlice } from "@reduxjs/toolkit";

import { listCurrentTenders } from "./sovtesTendersOperations";

export const sovtesTendersSlice = createSlice({
  name: "sovtesTenders",
  initialState: {
    currentTenders: {
      data: [],
    },
  },
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(listCurrentTenders.fulfilled, (state, action) => {
      state.currentTenders.data = action.payload;
    });
  },
});

export const sovtesTendersActions = sovtesTendersSlice.actions;
export default sovtesTendersSlice.reducer;
