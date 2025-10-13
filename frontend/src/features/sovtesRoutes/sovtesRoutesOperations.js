import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

export const listActiveSovtesRoutes = createAsyncThunk(
  "sovtesRoutes/listActiveSovtesRoutes",
  async (thunkAPI) => {
    try {
      const { data } = await axios.get("/api/sovtes-routes/active/");
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue({ error: error.message });
    }
  }
);
