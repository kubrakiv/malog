import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

export const listRouteCategories = createAsyncThunk(
  "routeCategories/list",
  async (_, thunkAPI) => {
    try {
      const { data } = await axios.get("/api/route-categories/");
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue({ error: error.message });
    }
  }
);
