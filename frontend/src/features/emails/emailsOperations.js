import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

export const sendEmail = createAsyncThunk(
  "email/sendEmail",
  async (emailData, thunkAPI) => {
    try {
      await axios.post("/api/send-email/", emailData);
      return emailData;
    } catch (error) {
      return thunkAPI.rejectWithValue({ error: error.message });
    }
  }
);
