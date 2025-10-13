import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

export const listCustomerManagers = createAsyncThunk(
  "customerManager/listCustomerManagers",
  async (thunkAPI) => {
    try {
      const { data } = await axios.get("/api/customer-managers/");
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue({ error: error.message });
    }
  }
);

export const createCustomerManager = createAsyncThunk(
  "customerManager/createCustomerManager",
  async (customerManager, thunkAPI) => {
    try {
      const { data } = await axios.post(
        "/api/customer-managers/create/",
        customerManager
      );
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue({ error: error.message });
    }
  }
);

export const updateCustomerManager = createAsyncThunk(
  "customerManager/updateCustomerManager",
  async (customerManager, thunkAPI) => {
    try {
      const { data } = await axios.put(
        `/api/customer-managers/update/${customerManager.id}/`,
        customerManager
      );
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue({ error: error.message });
    }
  }
);

export const deleteCustomerManager = createAsyncThunk(
  "customerManager/deleteCustomerManager",
  async (customerManagerId, thunkAPI) => {
    try {
      await axios.delete(`/api/customer-managers/delete/${customerManagerId}/`);
      return { id: customerManagerId };
    } catch (error) {
      return thunkAPI.rejectWithValue({ error: error.message });
    }
  }
);
