import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

export const listCountries = createAsyncThunk(
  "country/listCountries",
  async (thunkAPI) => {
    try {
      const { data } = await axios.get("/api/countries/");
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue({ error: error.message });
    }
  }
);
