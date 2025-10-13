import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

export const listTrailers = createAsyncThunk(
  "trailers/listTrailers",
  async (thunkAPI) => {
    try {
      const { data } = await axios.get("/api/trailers/");
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue({ error: error.message });
    }
  }
);

export const updateTrailer = createAsyncThunk(
  "trailers/updateTrailer",
  async (dataToUpdate, thunkAPI) => {
    try {
      const { data } = await axios.put(
        `/api/trailers/update/${dataToUpdate.id}/`,
        dataToUpdate
      );
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue({ error: error.message });
    }
  }
);

export const createTrailer = createAsyncThunk(
  "trailers/createTrailer",
  async (dataToCreate, thunkAPI) => {
    try {
      const { data } = await axios.post("/api/trailers/create/", dataToCreate);
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue({ error: error.message });
    }
  }
);

export const deleteTrailer = createAsyncThunk(
  "trailers/deleteTrailer",
  async (trailerId, thunkAPI) => {
    try {
      await axios.delete(`/api/trailers/delete/${trailerId}/`);
      return trailerId;
    } catch (error) {
      return thunkAPI.rejectWithValue({ error: error.message });
    }
  }
);
