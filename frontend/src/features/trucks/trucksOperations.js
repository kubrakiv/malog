import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

export const listTrucks = createAsyncThunk(
  "truck/listTrucks",
  async (thunkAPI) => {
    try {
      const { data } = await axios.get("/api/trucks/");
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue({ error: error.message });
    }
  }
);

export const updateTruck = createAsyncThunk(
  "truck/updateTruck",
  async (dataToUpdate, thunkAPI) => {
    try {
      const { data } = await axios.put(
        `/api/trucks/update/${dataToUpdate.id}/`,
        dataToUpdate
      );
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue({ error: error.message });
    }
  }
);

export const updateTruckTrailerAndDriver = createAsyncThunk(
  "truck/updateTruckTrailerAndDriver",
  async (dataToUpdate, thunkAPI) => {
    try {
      const { data } = await axios.put(
        `/api/trucks/update-trailer-driver/${dataToUpdate.id}/`,
        dataToUpdate
      );
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue({ error: error.message });
    }
  }
);

export const createTruck = createAsyncThunk(
  "truck/createTruck",
  async (dataToCreate, thunkAPI) => {
    try {
      const { data } = await axios.post("/api/trucks/create/", dataToCreate);
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue({ error: error.message });
    }
  }
);

export const deleteTruck = createAsyncThunk(
  "truck/deleteTruck",
  async (truckId, thunkAPI) => {
    try {
      await axios.delete(`/api/trucks/delete/${truckId}/`);
      return truckId;
    } catch (error) {
      return thunkAPI.rejectWithValue({ error: error.message });
    }
  }
);
