import { createSlice } from "@reduxjs/toolkit";
import { fetchSubscription } from "./subscriptionOperations";

const subscriptionSlice = createSlice({
  name: "subscription",
  initialState: {
    data: null,
    // Start in a loading state: ProtectedRoute checks `loading` before
    // `data`, and Layout only dispatches fetchSubscription from a
    // useEffect (after first paint). Defaulting to false here caused a
    // one-frame flash of "No Active Subscription" on every refresh.
    loading: true,
    error: null,
  },
  reducers: {
    clearSubscription(state) {
      state.data = null;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSubscription.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSubscription.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchSubscription.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.data = null;
      });
  },
});

export const { clearSubscription } = subscriptionSlice.actions;
export default subscriptionSlice.reducer;
