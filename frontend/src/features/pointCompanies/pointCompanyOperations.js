import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

export const listPointCompanies = createAsyncThunk(
  "pointCompany/listPointCompanies",
  async (thunkAPI) => {
    try {
      const { data } = await axios.get("/api/point-companies/");
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue({ error: error.message });
    }
  }
);
