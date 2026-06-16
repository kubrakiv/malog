import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const authConfig = (state) => ({
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${state.userLogin?.userInfo?.token}`,
  },
});

export const fetchSovtesTrucks = createAsyncThunk(
  "sovtesFleet/fetchTrucks",
  async (_, thunkAPI) => {
    try {
      const { data } = await axios.get(
        "/api/sovtes/fleet/trucks/",
        authConfig(thunkAPI.getState())
      );
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue({ error: error.message });
    }
  }
);

export const fetchSovtesTrailers = createAsyncThunk(
  "sovtesFleet/fetchTrailers",
  async (_, thunkAPI) => {
    try {
      const { data } = await axios.get(
        "/api/sovtes/fleet/trailers/",
        authConfig(thunkAPI.getState())
      );
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue({ error: error.message });
    }
  }
);

export const syncSovtesTruck = createAsyncThunk(
  "sovtesFleet/syncTruck",
  async (sovtesVehicle, thunkAPI) => {
    try {
      const { data } = await axios.post(
        "/api/sovtes/fleet/sync-truck/",
        sovtesVehicle,
        authConfig(thunkAPI.getState())
      );
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data || { error: error.message }
      );
    }
  }
);

export const resyncSovtesTruck = createAsyncThunk(
  "sovtesFleet/resyncTruck",
  async (sovtesVehicle, thunkAPI) => {
    try {
      const { data } = await axios.post(
        "/api/sovtes/fleet/resync-truck/",
        sovtesVehicle,
        authConfig(thunkAPI.getState())
      );
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data || { error: error.message }
      );
    }
  }
);

export const syncSovtesTrailer = createAsyncThunk(
  "sovtesFleet/syncTrailer",
  async (sovtesVehicle, thunkAPI) => {
    try {
      const { data } = await axios.post(
        "/api/sovtes/fleet/sync-trailer/",
        sovtesVehicle,
        authConfig(thunkAPI.getState())
      );
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data || { error: error.message }
      );
    }
  }
);

export const resyncSovtesTrailer = createAsyncThunk(
  "sovtesFleet/resyncTrailer",
  async (sovtesVehicle, thunkAPI) => {
    try {
      const { data } = await axios.post(
        "/api/sovtes/fleet/resync-trailer/",
        sovtesVehicle,
        authConfig(thunkAPI.getState())
      );
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data || { error: error.message }
      );
    }
  }
);

// { local_truck_id, ...sovtesVehicle }
export const linkSovtesTruck = createAsyncThunk(
  "sovtesFleet/linkTruck",
  async (payload, thunkAPI) => {
    try {
      const { data } = await axios.post(
        "/api/sovtes/fleet/link-truck/",
        payload,
        authConfig(thunkAPI.getState())
      );
      return { ...data, sovtes_id: String(payload.id) };
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data || { error: error.message }
      );
    }
  }
);

// { local_trailer_id, ...sovtesVehicle }
export const linkSovtesTrailer = createAsyncThunk(
  "sovtesFleet/linkTrailer",
  async (payload, thunkAPI) => {
    try {
      const { data } = await axios.post(
        "/api/sovtes/fleet/link-trailer/",
        payload,
        authConfig(thunkAPI.getState())
      );
      return { ...data, sovtes_id: String(payload.id) };
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data || { error: error.message }
      );
    }
  }
);

export const resyncAllSovtesTrucks = createAsyncThunk(
  "sovtesFleet/resyncAllTrucks",
  async (_, thunkAPI) => {
    try {
      const { data } = await axios.post(
        "/api/sovtes/fleet/resync-all-trucks/",
        {},
        authConfig(thunkAPI.getState())
      );
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data || { error: error.message }
      );
    }
  }
);

export const resyncAllSovtesTrailers = createAsyncThunk(
  "sovtesFleet/resyncAllTrailers",
  async (_, thunkAPI) => {
    try {
      const { data } = await axios.post(
        "/api/sovtes/fleet/resync-all-trailers/",
        {},
        authConfig(thunkAPI.getState())
      );
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data || { error: error.message }
      );
    }
  }
);
