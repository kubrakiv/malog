import { createSlice } from "@reduxjs/toolkit";
import {
  listTruckUnits,
  createTruckUnit,
  deleteTruckUnit,
  assignTruckUnit,
  getTruckUnitHistory,
} from "./truckUnitsOperations";

const truckUnitsSlice = createSlice({
  name: "truckUnits",
  initialState: {
    units: [],          // available TruckUnit list for this tenant
    history: {},        // { [truckId]: [assignments] }
    loading: false,
    assigning: false,
    error: null,
  },
  reducers: {
    clearTruckUnitsError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // list
    builder
      .addCase(listTruckUnits.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(listTruckUnits.fulfilled, (state, action) => {
        state.loading = false;
        state.units = action.payload;
      })
      .addCase(listTruckUnits.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || "Failed to load units";
      });

    // create
    builder
      .addCase(createTruckUnit.fulfilled, (state, action) => {
        state.units.push(action.payload);
      })
      .addCase(createTruckUnit.rejected, (state, action) => {
        state.error = action.payload?.error || "Failed to create unit";
      });

    // delete
    builder
      .addCase(deleteTruckUnit.fulfilled, (state, action) => {
        state.units = state.units.filter((u) => u.id !== action.payload);
      });

    // assign
    builder
      .addCase(assignTruckUnit.pending, (state) => { state.assigning = true; state.error = null; })
      .addCase(assignTruckUnit.fulfilled, (state) => { state.assigning = false; })
      .addCase(assignTruckUnit.rejected, (state, action) => {
        state.assigning = false;
        state.error = action.payload?.error || "Failed to assign unit";
      });

    // history
    builder
      .addCase(getTruckUnitHistory.fulfilled, (state, action) => {
        state.history[action.payload.truckId] = action.payload.history;
      });
  },
});

export const { clearTruckUnitsError } = truckUnitsSlice.actions;
export default truckUnitsSlice.reducer;
