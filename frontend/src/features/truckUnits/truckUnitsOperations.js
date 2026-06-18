import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

export const listTruckUnits = createAsyncThunk(
  "truckUnits/list",
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
      const { data } = await axios.get("/api/truck-units/", config);
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue({ error: error.message });
    }
  }
);

export const createTruckUnit = createAsyncThunk(
  "truckUnits/create",
  async (name, thunkAPI) => {
    try {
      const state = thunkAPI.getState();
      const token = state.userLogin?.userInfo?.token;
      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      };
      const { data } = await axios.post("/api/truck-units/create/", { name }, config);
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue({ error: error.message });
    }
  }
);

export const deleteTruckUnit = createAsyncThunk(
  "truckUnits/delete",
  async (unitId, thunkAPI) => {
    try {
      const state = thunkAPI.getState();
      const token = state.userLogin?.userInfo?.token;
      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      };
      await axios.delete(`/api/truck-units/delete/${unitId}/`, config);
      return unitId;
    } catch (error) {
      return thunkAPI.rejectWithValue({ error: error.message });
    }
  }
);

// { truck_id, unit_id }  — unit_id=null removes the truck from its current unit
export const assignTruckUnit = createAsyncThunk(
  "truckUnits/assign",
  async ({ truck_id, unit_id }, thunkAPI) => {
    try {
      const state = thunkAPI.getState();
      const token = state.userLogin?.userInfo?.token;
      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      };
      const { data } = await axios.post(
        "/api/truck-units/assign/",
        { truck_id, unit_id },
        config
      );
      return { truck_id, unit_id, assignment: data };
    } catch (error) {
      return thunkAPI.rejectWithValue({ error: error.message });
    }
  }
);

export const getTruckUnitHistory = createAsyncThunk(
  "truckUnits/history",
  async (truckId, thunkAPI) => {
    try {
      const state = thunkAPI.getState();
      const token = state.userLogin?.userInfo?.token;
      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      };
      const { data } = await axios.get(`/api/truck-units/history/${truckId}/`, config);
      return { truckId, history: data };
    } catch (error) {
      return thunkAPI.rejectWithValue({ error: error.message });
    }
  }
);
