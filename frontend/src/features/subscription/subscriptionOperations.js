import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

export const fetchSubscription = createAsyncThunk(
  "subscription/fetchSubscription",
  async (_, thunkAPI) => {
    try {
      const state = thunkAPI.getState();
      const token = state.userLogin?.userInfo?.token;
      if (!token) return null;

      const { data } = await axios.get("/api/subscriptions/current/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.error || "Failed to fetch subscription"
      );
    }
  }
);
