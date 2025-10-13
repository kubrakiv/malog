import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

export const listInvoices = createAsyncThunk(
  "invoice/listInvoices",
  async (_, thunkAPI) => {
    const state = thunkAPI.getState();
    const token = state.userLogin?.userInfo?.token;

    try {
      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      };

      const { data } = await axios.get("/api/invoices/", config);
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue({ error: error.message });
    }
  }
);

export const listInvoiceDetails = createAsyncThunk(
  "invoice/listInvoiceDetails",
  async (id, thunkAPI) => {
    const state = thunkAPI.getState();
    const token = state.userLogin?.userInfo?.token;

    try {
      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      };

      const { data } = await axios.get(`/api/invoices/${id}/`, config);
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue({ error: error.message });
    }
  }
);

export const createInvoice = createAsyncThunk(
  "invoice/createInvoice",
  async (invoice, thunkAPI) => {
    const state = thunkAPI.getState();
    const token = state.userLogin?.userInfo?.token;

    try {
      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      };

      const { data } = await axios.post(
        "/api/invoices/create/",
        invoice,
        config
      );
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue({ error: error.message });
    }
  }
);

export const updateInvoice = createAsyncThunk(
  "invoice/updateInvoice",
  async (invoice, thunkAPI) => {
    const state = thunkAPI.getState();
    const token = state.userLogin?.userInfo?.token;

    try {
      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      };

      const { data } = await axios.put(
        `/api/invoices/update/${invoice.id}/`,
        invoice,
        config
      );
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue({ error: error.message });
    }
  }
);

export const updateInvoicePaymentDate = createAsyncThunk(
  "invoice/updateInvoicePaymentDate",
  async (invoice, thunkAPI) => {
    const state = thunkAPI.getState();
    const token = state.userLogin?.userInfo?.token;

    try {
      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      };

      const { data } = await axios.put(
        `/api/invoices/update/${invoice.id}/payment-date/`,
        invoice,
        config
      );
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue({ error: error.message });
    }
  }
);

export const deleteInvoice = createAsyncThunk(
  "invoice/deleteInvoice",
  async (id, thunkAPI) => {
    const state = thunkAPI.getState();
    const token = state.userLogin?.userInfo?.token;

    try {
      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      };

      const { data } = await axios.delete(
        `/api/invoices/delete/${id}/`,
        config
      );
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue({ error: error.message });
    }
  }
);
