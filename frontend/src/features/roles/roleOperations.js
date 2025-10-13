import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

export const listRoles = createAsyncThunk(
  "role/listRoles",
  async (thunkAPI) => {
    try {
      const { data } = await axios.get("/api/roles/");
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue({ error: error.message });
    }
  }
);
