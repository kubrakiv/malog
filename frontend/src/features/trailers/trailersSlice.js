import { createSlice } from "@reduxjs/toolkit";
import {
  listTrailers,
  updateTrailer,
  createTrailer,
} from "./trailersOperations";

export const trailerSlice = createSlice({
  name: "trailer",
  initialState: {
    trailers: {
      data: [],
    },
    selectedTrailer: {
      data: {},
    },
    showTrailerModal: false,
    editModeTrailer: false,
    showAddTrailerModal: false,
  },
  reducers: {
    setSelectedTrailer: (state, action) => {
      state.selectedTrailer.data = action.payload;
    },
    setShowTrailerModal: (state, action) => {
      state.showTrailerModal = action.payload;
    },
    setEditModeTrailer: (state, action) => {
      state.editModeTrailer = action.payload;
    },
    setShowAddTrailerModal: (state, action) => {
      state.showAddTrailerModal = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(listTrailers.fulfilled, (state, action) => {
      state.trailers.data = action.payload;
    });
    builder.addCase(updateTrailer.fulfilled, (state, action) => {
      const index = state.trailers.data.findIndex(
        (trailer) => trailer.id === action.payload.id
      );
      state.trailers.data[index] = action.payload;
    });
    builder.addCase(createTrailer.fulfilled, (state, action) => {
      state.trailers.data.push(action.payload);
    });
  },
});

export const trailerActions = trailerSlice.actions;
export const {
  setSelectedTrailer,
  setShowTrailerModal,
  setEditModeTrailer,
  setShowAddTrailerModal,
} = trailerActions;
export default trailerSlice.reducer;
