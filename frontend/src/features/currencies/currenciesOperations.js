import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

export const listCurrencies = createAsyncThunk(
  "currency/listCurrencies",
  async (thunkAPI) => {
    try {
      const { data } = await axios.get("/api/currencies/");
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue({ error: error.message });
    }
  }
);
