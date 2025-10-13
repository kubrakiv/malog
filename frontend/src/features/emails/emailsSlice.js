import { createSlice } from "@reduxjs/toolkit";
import { sendEmail } from "./emailsOperations";

export const emailsSlice = createSlice({
  name: "emails",
  initialState: {
    email: {
      data: [],
    },
  },
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(sendEmail.fulfilled, (state, action) => {
      state.email.data = action.payload;
    });
  },
});

export const emailsActions = emailsSlice.actions;

export default emailsSlice.reducer;
