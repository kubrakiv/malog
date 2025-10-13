import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

export const listCustomers = createAsyncThunk(
  "customer/listCustomers",
  async (thunkAPI) => {
    try {
      const { data } = await axios.get("/api/customers/");
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue({ error: error.message });
    }
  }
);

export const createCustomer = createAsyncThunk(
  "customer/createCustomer",
  async (customer, thunkAPI) => {
    try {
      const { data } = await axios.post("/api/customers/create/", customer);
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue({ error: error.message });
    }
  }
);

export const updateCustomer = createAsyncThunk(
  "customer/updateCustomer",
  async (customer, thunkAPI) => {
    try {
      const { data } = await axios.put(
        `/api/customers/update/${customer.id}/`,
        customer
      );
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue({ error: error.message });
    }
  }
);

export const deleteCustomer = createAsyncThunk(
  "customer/deleteCustomer",
  async (customerId, thunkAPI) => {
    try {
      await axios.delete(`/api/customers/delete/${customerId}/`);
      return customerId;
    } catch (error) {
      return thunkAPI.rejectWithValue({ error: error.message });
    }
  }
);
