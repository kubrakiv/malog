import { createSlice } from "@reduxjs/toolkit";

import { listPoints, createPoint, updatePoint } from "./pointsOperations";
import { set } from "date-fns";

export const pointsSlice = createSlice({
  name: "points",
  initialState: {
    points: {
      data: [],
    },
    point: {
      data: {},
    },
    selectedPoint: {
      data: {},
    },
    editModePoint: false,
    tabToggleMode: true,
  },
  reducers: {
    setPointDetailsData: (state, action) => {
      state.point.data = action.payload;
    },
    setSelectedPoint: (state, action) => {
      state.selectedPoint.data = action.payload;
    },
    setEditModePoint: (state, action) => {
      state.editModePoint = action.payload;
    },
    setTabToggleMode: (state, action) => {
      state.tabToggleMode = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(listPoints.fulfilled, (state, action) => {
        state.points.data = action.payload;
      })
      .addCase(createPoint.fulfilled, (state, action) => {
        state.points.data.push(action.payload);
      })
      .addCase(updatePoint.fulfilled, (state, action) => {
        const index = state.points.data.findIndex(
          (point) => point.id === action.payload.id
        );
        state.points.data[index] = action.payload;
      });
  },
});

export const pointsActions = pointsSlice.actions;
export const {
  setPointDetailsData,
  setSelectedPoint,
  setEditModePoint,
  setTabToggleMode,
} = pointsSlice.actions;
export default pointsSlice.reducer;
