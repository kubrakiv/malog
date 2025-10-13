import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

export const updateOrderStatus = createAsyncThunk(
  "orderStatus/updateOrderStatus",
  async ({ orderId, orderStatusData }, thunkAPI) => {
    try {
      const { data } = await axios.post(
        `/api/order-statuses/${orderId}/update-status/`,
        orderStatusData
      );
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue({ error: error.message });
    }
  }
);
