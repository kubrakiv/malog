import { createSlice } from "@reduxjs/toolkit";
import { listRouteCategories } from "./routeCategoriesOperations";

export const routeCategoriesSlice = createSlice({
  name: "routeCategories",
  initialState: {
    categories: {
      data: [],
    },
  },
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(listRouteCategories.fulfilled, (state, action) => {
      state.categories.data = action.payload;
    });
  },
});

export default routeCategoriesSlice.reducer;
