import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

export const listTrucks = createAsyncThunk(
  "truck/listTrucks",
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

      const { data } = await axios.get("/api/trucks/", config);
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue({ error: error.message });
    }
  },
);

export const updateTruck = createAsyncThunk(
  "truck/updateTruck",
  async (dataToUpdate, thunkAPI) => {
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
        `/api/trucks/update/${dataToUpdate.id}/`,
        dataToUpdate,
        config,
      );
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue({ error: error.message });
    }
  },
);

export const updateTruckTrailerAndDriver = createAsyncThunk(
  "truck/updateTruckTrailerAndDriver",
  async (dataToUpdate, thunkAPI) => {
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
        `/api/trucks/update-trailer-driver/${dataToUpdate.id}/`,
        dataToUpdate,
        config,
      );
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue({ error: error.message });
    }
  },
);

export const createTruck = createAsyncThunk(
  "truck/createTruck",
  async (dataToCreate, thunkAPI) => {
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
        "/api/trucks/create/",
        dataToCreate,
        config,
      );
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue({ error: error.message });
    }
  },
);

export const deleteTruck = createAsyncThunk(
  "truck/deleteTruck",
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

      await axios.delete(`/api/trucks/delete/${truckId}/`, config);
      return truckId;
    } catch (error) {
      return thunkAPI.rejectWithValue({ error: error.message });
    }
  },
);

export const reorderTrucks = createAsyncThunk(
  "truck/reorderTrucks",
  async ({ orderedTruckIds, unitId }, thunkAPI) => {
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
        "/api/trucks/reorder/",
        { ordered_truck_ids: orderedTruckIds, unit_id: unitId ?? null },
        config,
      );
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue({ error: error.message });
    }
  },
);
