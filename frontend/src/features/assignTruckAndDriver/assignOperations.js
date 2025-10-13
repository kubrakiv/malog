import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

export const assignTruckAndDriver = createAsyncThunk(
  "assign/assignTruckAndDriver",
  async (dataToAssign, thunkAPI) => {
    try {
      const { data } = await axios.post(
        "/api/assign-truck-driver/",
        dataToAssign
      );
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue({ error: error.message });
    }
  }
);
