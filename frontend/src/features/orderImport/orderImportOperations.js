import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

export const getRoute = createAsyncThunk(
  "route/getRoute",
  async ({ routeId, platform }, thunkAPI) => {
    try {
      const { data } = await axios.post(`/api/import/routes/`, {
        routeId,
        platform,
      });
      return data;
    } catch (error) {
      if (error.response && error.response.data) {
        // Return the detailed error from the backend if available
        return thunkAPI.rejectWithValue(error.response.data);
      } else {
        // Return a generic error message
        return thunkAPI.rejectWithValue({ error: error.message });
      }
    }
  }
);

export const getBookedTenderRoutes = createAsyncThunk(
  "route/getBookedTenderRoutes",
  async (thunkAPI) => {
    try {
      const { data } = await axios.get(`/api/import/booked-tender-routes/`);
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue({ error: error.message });
    }
  }
);

export const createRoute = createAsyncThunk(
  "route/createRoute",
  async (orderData, thunkAPI) => {
    try {
      const { data } = await axios.post(`/api/import/create-route/`, orderData);
      return data;
    } catch (error) {
      if (error.response && error.response.data) {
        // Return the detailed error from the backend if available
        return thunkAPI.rejectWithValue(error.response.data);
      } else {
        // Return a generic error message
        return thunkAPI.rejectWithValue({ error: error.message });
      }
    }
  }
);

export const getFreeOrders = createAsyncThunk(
  "route/getFreeOrders",
  async (thunkAPI) => {
    try {
      const { data } = await axios.get(`/api/import/booked-tender-routes/`);
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue({ error: error.message });
    }
  }
);
