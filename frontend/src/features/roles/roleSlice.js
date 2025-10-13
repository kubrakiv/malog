import { createSlice } from "@reduxjs/toolkit";
import { listRoles } from "./roleOperations";

export const roleSlice = createSlice({
  name: "role",
  initialState: {
    roles: {
      data: [],
    },
  },
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(listRoles.fulfilled, (state, action) => {
      state.roles.data = action.payload;
    });
  },
});

export const roleActions = roleSlice.actions;
export default roleSlice.reducer;
