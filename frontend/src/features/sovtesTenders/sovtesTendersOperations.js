import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

export const listCurrentTenders = createAsyncThunk(
  "sovtesTenders/listCurrentTenders",
  async (thunkAPI) => {
    try {
      const { data } = await axios.get("/api/sovtes/current-tenders/");
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue({ error: error.message });
    }
  }
);
