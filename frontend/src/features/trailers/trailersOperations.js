import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

export const listTrailers = createAsyncThunk(
  "trailers/listTrailers",
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

      const { data } = await axios.get("/api/trailers/", config);
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
      const state = thunkAPI.getState();
      const token = state.userLogin?.userInfo?.token;

      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      };

      const { data } = await axios.put(
        `/api/trailers/update/${dataToUpdate.id}/`,
        dataToUpdate,
        config
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
      const state = thunkAPI.getState();
      const token = state.userLogin?.userInfo?.token;

      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      };

      const { data } = await axios.post(
        "/api/trailers/create/",
        dataToCreate,
        config
      );
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
      const state = thunkAPI.getState();
      const token = state.userLogin?.userInfo?.token;

      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      };

      await axios.delete(`/api/trailers/delete/${trailerId}/`, config);
      return trailerId;
    } catch (error) {
      return thunkAPI.rejectWithValue({ error: error.message });
    }
  }
);
