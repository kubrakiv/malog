import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const authHeader = (token) => ({
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
});

const token = (thunkAPI) => thunkAPI.getState().userLogin?.userInfo?.token;

export const fetchCompany = createAsyncThunk(
  "company/fetch",
  async (_, thunkAPI) => {
    try {
      const { data } = await axios.get("/api/company/", authHeader(token(thunkAPI)));
      return data;
    } catch (error) {
      if (error.response?.status === 404) return null;
      return thunkAPI.rejectWithValue({ error: error.response?.data?.error || error.message });
    }
  }
);

export const saveCompany = createAsyncThunk(
  "company/save",
  async (formData, thunkAPI) => {
    try {
      const { data } = await axios.put("/api/company/update/", formData, authHeader(token(thunkAPI)));
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data || { error: error.message });
    }
  }
);

export const fetchBanks = createAsyncThunk(
  "company/fetchBanks",
  async (_, thunkAPI) => {
    try {
      const { data } = await axios.get("/api/company/banks/", authHeader(token(thunkAPI)));
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue({ error: error.response?.data?.error || error.message });
    }
  }
);

export const createBank = createAsyncThunk(
  "company/createBank",
  async (bankData, thunkAPI) => {
    try {
      const { data } = await axios.post("/api/company/banks/", bankData, authHeader(token(thunkAPI)));
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data || { error: error.message });
    }
  }
);

export const updateBank = createAsyncThunk(
  "company/updateBank",
  async ({ id, ...bankData }, thunkAPI) => {
    try {
      const { data } = await axios.put(`/api/company/banks/${id}/`, bankData, authHeader(token(thunkAPI)));
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data || { error: error.message });
    }
  }
);

export const deleteBank = createAsyncThunk(
  "company/deleteBank",
  async (id, thunkAPI) => {
    try {
      await axios.delete(`/api/company/banks/${id}/`, authHeader(token(thunkAPI)));
      return id;
    } catch (error) {
      return thunkAPI.rejectWithValue({ error: error.response?.data?.error || error.message });
    }
  }
);
