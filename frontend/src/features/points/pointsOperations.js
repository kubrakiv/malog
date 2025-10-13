import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

export const listPoints = createAsyncThunk(
  "point/listPoints",
  async (thunkAPI) => {
    try {
      const { data } = await axios.get("/api/points/");
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue({ error: error.message });
    }
  }
);

export const createPoint = createAsyncThunk(
  "point/createPoint",
  async (point, thunkAPI) => {
    try {
      const { data } = await axios.post("/api/points/create/", point);
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue({ error: error.message });
    }
  }
);

export const updatePoint = createAsyncThunk(
  "point/updatePoint",
  async (point, thunkAPI) => {
    try {
      const { data } = await axios.put(`/api/points/edit/${point.id}/`, point);
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue({ error: error.message });
    }
  }
);

export const deletePoint = createAsyncThunk(
  "point/deletePoint",
  async (pointId, thunkAPI) => {
    try {
      await axios.delete(`/api/points/delete/${pointId}/`);
      return pointId;
    } catch (error) {
      return thunkAPI.rejectWithValue({ error: error.message });
    }
  }
);
