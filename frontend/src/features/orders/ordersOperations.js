import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

export const listOrders = createAsyncThunk(
  "order/listOrders",
  async ({ page = 1, pageSize = 10, filters = {} } = {}, thunkAPI) => {
    const params = new URLSearchParams({
      page,
      page_size: pageSize,
      ...filters,
    });

    try {
      // const { data } = await axios.get(
      //   `/api/orders/?page=${page}&page_size=${pageSize}`
      // );
      const { data } = await axios.get(`/api/orders/?${params.toString()}`);
      return data; // contains: { count, next, previous, results }
    } catch (error) {
      return thunkAPI.rejectWithValue({ error: error.message });
    }
  }
);

export const listOrderDetails = createAsyncThunk(
  "order/listOrderDetails",
  async (orderId, thunkAPI) => {
    try {
      const { data } = await axios.get(`/api/orders/${orderId}/`);
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue({ error: error.message });
    }
  }
);

export const updateOrder = createAsyncThunk(
  "order/updateOrder",
  async ({ dataToUpdate, orderId }, thunkAPI) => {
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
        `/api/orders/edit/${orderId}/`,
        dataToUpdate,
        config
      );
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue({ error: error.message });
    }
  }
);

export const deleteOrder = createAsyncThunk(
  "order/deleteOrder",
  async (orderId, thunkAPI) => {
    try {
      await axios.delete(`/api/orders/delete/${orderId}/`);
      return orderId;
    } catch (error) {
      return thunkAPI.rejectWithValue({ error: error.message });
    }
  }
);

export const searchOrderByNumber = createAsyncThunk(
  "order/searchOrderByNumber",
  async (orderNumber, thunkAPI) => {
    try {
      const { data } = await axios.get(
        `/api/orders/search/?order_number=${orderNumber}`
      );
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue({
        error: error.response?.data?.error || error.message,
      });
    }
  }
);
