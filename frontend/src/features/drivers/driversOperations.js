import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// Get all drivers
export const listDrivers = createAsyncThunk(
  "driver/listDrivers",
  async (_, thunkAPI) => {
    try {
      const state = thunkAPI.getState();
      const token = state.userLogin?.userInfo?.token;

      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      };

      const { data } = await axios.get("/api/driver-profiles/", config);
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue({ error: error.message });
    }
  }
);

// Get driver details
export const getDriverDetails = createAsyncThunk(
  "driver/getDriverDetails",
  async (driverId, thunkAPI) => {
    try {
      const state = thunkAPI.getState();
      const token = state.userLogin?.userInfo?.token;

      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      };

      const { data } = await axios.get(
        `/api/driver-profiles/${driverId}/`,
        config
      );
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue({ error: error.message });
    }
  }
);

// Update driver
export const updateDriver = createAsyncThunk(
  "driver/updateDriver",
  async ({ driverId, dataToUpdate }, thunkAPI) => {
    try {
      const state = thunkAPI.getState();
      const token = state.userLogin?.userInfo?.token;

      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      };

      const { data } = await axios.put(
        `/api/driver-profiles/update/${driverId}/`,
        dataToUpdate,
        config
      );
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue({ error: error.message });
    }
  }
);

// Create driver
export const createDriver = createAsyncThunk(
  "driver/createDriver",
  async (userData, thunkAPI) => {
    try {
      const state = thunkAPI.getState();
      const token = state.userLogin?.userInfo?.token;

      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      };

      // Register the user first
      const { data: registeredUser } = await axios.post(
        "/api/users/register/",
        userData,
        config
      );

      return registeredUser;
    } catch (error) {
      return thunkAPI.rejectWithValue({
        error: error.response?.data?.detail || error.message,
      });
    }
  }
);

// Delete driver
export const deleteDriver = createAsyncThunk(
  "driver/deleteDriver",
  async (driverId, thunkAPI) => {
    try {
      const state = thunkAPI.getState();
      const token = state.userLogin?.userInfo?.token;

      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      };

      await axios.delete(`/api/driver-profiles/delete/${driverId}/`, config);
      return driverId;
    } catch (error) {
      return thunkAPI.rejectWithValue({ error: error.message });
    }
  }
);
