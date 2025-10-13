import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

export const listTasks = createAsyncThunk(
  "task/listTasks",
  async (thunkAPI) => {
    try {
      const { data } = await axios.get("/api/tasks/");
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue({ error: error.message });
    }
  }
);

export const listTasksByWeek = createAsyncThunk(
  "task/listTasksByWeek",
  async ({ year, week }, thunkAPI) => {
    try {
      const { data } = await axios.get(`/api/tasks/?year=${year}&week=${week}`);
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue({ error: error.message });
    }
  }
);

export const updateTask = createAsyncThunk(
  "task/updateTask",
  async (dataToUpdate, thunkAPI) => {
    try {
      const { data } = await axios.put(
        `/api/tasks/edit/${dataToUpdate.id}/`,
        dataToUpdate
      );
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue({ error: error.message });
    }
  }
);

export const createTask = createAsyncThunk(
  "task/createTask",
  async (dataToCreate, thunkAPI) => {
    try {
      const { data } = await axios.post("/api/tasks/create/", dataToCreate);
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue({ error: error.message });
    }
  }
);

export const deleteTask = createAsyncThunk(
  "task/deleteTask",
  async (taskId, thunkAPI) => {
    try {
      await axios.delete(`/api/tasks/delete/${taskId}/`);
      return taskId;
    } catch (error) {
      return thunkAPI.rejectWithValue({ error: error.message });
    }
  }
);
