import { createSlice } from "@reduxjs/toolkit";

import {
  listOrders,
  listOrderDetails,
  updateOrder,
  deleteOrder,
} from "./ordersOperations";
import { setEditModeDocument } from "../../reducers/documentReducers";

export const orderSlice = createSlice({
  name: "order",
  initialState: {
    orders: {
      data: [],
      count: 0,
      next: null,
      previous: null,
      currentPage: 1,
      pageSize: 10,
      loading: false,
      error: null,
    },
    orderDetails: {
      data: {},
      loading: false,
      error: null,
    },
    task: {
      data: {},
      editModeTask: false,
    },
    taskListNoOrder: {
      data: [],
    },
    orderFactData: {
      distance: 0,
      emptyDistance: 0,
      factual: {},
    },
    selectedDriver: "",
    selectedTruck: "",
    selectedCustomer: "",
    showTaskModal: false,
    editModeOrder: false,
    addTaskMode: false,
    addTaskNoOrderMode: false,
  },
  reducers: {
    setPage: (state, action) => {
      state.orders.currentPage = action.payload;
    },
    setOrderFactData: (state, action) => {
      state.orderFactData = action.payload;
    },
    setEditModeOrder: (state, action) => {
      state.editModeOrder = action.payload;
    },
    setAddTaskMode: (state, action) => {
      state.addTaskMode = action.payload;
    },
    setAddTaskNoOrderMode: (state, action) => {
      state.addTaskNoOrderMode = action.payload;
    },
    setEditModeTask: (state, action) => {
      state.task.data = action.payload.data;
      state.task.editModeTask = action.payload.editModeTask;
    },
    setTaskListNoOrder: (state, action) => {
      state.taskListNoOrder.data = action.payload;
    },
    clearTaskListNoOrder: (state) => {
      state.taskListNoOrder.data = [];
    },
    setSelectedDriver: (state, action) => {
      state.selectedDriver = action.payload;
    },
    setSelectedTruck: (state, action) => {
      state.selectedTruck = action.payload;
    },
    setSelectedCustomer: (state, action) => {
      state.selectedCustomer = action.payload;
    },
    setShowTaskModal: (state, action) => {
      state.showTaskModal = action.payload;
    },
    resetOrderDetails: (state) => {
      state.orderDetails.data = {};
      state.orderDetails.loading = false;
      state.orderDetails.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(listOrders.pending, (state) => {
        state.orders.loading = true;
      })
      .addCase(listOrders.fulfilled, (state, action) => {
        state.orders.loading = false;
        state.orders.data = action.payload.results;
        state.orders.count = action.payload.count;
        state.orders.next = action.payload.next;
        state.orders.previous = action.payload.previous;
      })
      .addCase(listOrders.rejected, (state, action) => {
        state.orders.loading = false;
        state.orders.error = action.payload?.error || "Failed to load orders";
      })
      .addCase(listOrderDetails.fulfilled, (state, action) => {
        state.orderDetails.data = action.payload;
      })
      .addCase(updateOrder.fulfilled, (state, action) => {
        state.orderDetails.data = action.payload;
      })
      .addCase(deleteOrder.fulfilled, (state, action) => {
        state.orders.data = state.orders.data.filter(
          (order) => order.id !== action.payload
        );
      });
  },
});

export const {
  setPage,
  setEditModeOrder,
  setAddTaskMode,
  setAddTaskNoOrderMode,
  setEditModeTask,
  setTaskListNoOrder,
  clearTaskListNoOrder,
  setSelectedDriver,
  setSelectedTruck,
  setSelectedCustomer,
  setShowTaskModal,
  resetOrderDetails,
  setOrderFactData,
} = orderSlice.actions;
export default orderSlice.reducer;
