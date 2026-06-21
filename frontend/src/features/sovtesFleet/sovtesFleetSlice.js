import { createSlice } from "@reduxjs/toolkit";
import {
  fetchSovtesTrucks,
  fetchSovtesTrailers,
  syncSovtesTruck,
  resyncSovtesTruck,
  syncSovtesTrailer,
  resyncSovtesTrailer,
  linkSovtesTruck,
  linkSovtesTrailer,
  resyncAllSovtesTrucks,
  resyncAllSovtesTrailers,
  fetchSovtesDrivers,
  syncSovtesDriver,
  resyncSovtesDriver,
  linkSovtesDriver,
  resyncAllSovtesDrivers,
} from "./sovtesFleetOperations";

const markSynced = (list, sovtesId) => {
  const item = list.find((t) => String(t.id) === sovtesId);
  if (item) item.already_synced = true;
};

const sovtesFleetSlice = createSlice({
  name: "sovtesFleet",
  initialState: {
    trucks: [],
    trailers: [],
    drivers: [],
    loading: false,
    syncingIds: [],
    resyncingAll: false,
    error: null,
    showModal: false,
    modalInitialTab: "trucks",
  },
  reducers: {
    setShowSovtesSyncModal: (state, action) => {
      // Accept either a boolean or { show: bool, tab: string }
      const payload = action.payload;
      if (typeof payload === "object" && payload !== null) {
        state.showModal = payload.show;
        if (payload.tab) state.modalInitialTab = payload.tab;
      } else {
        state.showModal = payload;
      }
      if (!state.showModal) {
        state.trucks = [];
        state.trailers = [];
        state.drivers = [];
        state.error = null;
      }
    },
    clearSovtesFleetError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSovtesTrucks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSovtesTrucks.fulfilled, (state, action) => {
        state.loading = false;
        state.trucks = action.payload;
      })
      .addCase(fetchSovtesTrucks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || "Failed to fetch Sovtes trucks";
      })

      .addCase(fetchSovtesTrailers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSovtesTrailers.fulfilled, (state, action) => {
        state.loading = false;
        state.trailers = action.payload;
      })
      .addCase(fetchSovtesTrailers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || "Failed to fetch Sovtes trailers";
      })

      .addCase(syncSovtesTruck.pending, (state, action) => {
        state.syncingIds.push(String(action.meta.arg.id));
      })
      .addCase(syncSovtesTruck.fulfilled, (state, action) => {
        const sovtesId = String(action.meta.arg.id);
        state.syncingIds = state.syncingIds.filter((id) => id !== sovtesId);
        markSynced(state.trucks, sovtesId);
      })
      .addCase(syncSovtesTruck.rejected, (state, action) => {
        const sovtesId = String(action.meta.arg.id);
        state.syncingIds = state.syncingIds.filter((id) => id !== sovtesId);
        state.error = action.payload?.error || "Failed to sync truck";
      })

      .addCase(resyncSovtesTruck.pending, (state, action) => {
        state.syncingIds.push(String(action.meta.arg.id));
      })
      .addCase(resyncSovtesTruck.fulfilled, (state, action) => {
        state.syncingIds = state.syncingIds.filter(
          (id) => id !== String(action.meta.arg.id)
        );
      })
      .addCase(resyncSovtesTruck.rejected, (state, action) => {
        state.syncingIds = state.syncingIds.filter(
          (id) => id !== String(action.meta.arg.id)
        );
        state.error = action.payload?.error || "Failed to re-sync truck";
      })

      .addCase(syncSovtesTrailer.pending, (state, action) => {
        state.syncingIds.push(String(action.meta.arg.id));
      })
      .addCase(syncSovtesTrailer.fulfilled, (state, action) => {
        const sovtesId = String(action.meta.arg.id);
        state.syncingIds = state.syncingIds.filter((id) => id !== sovtesId);
        markSynced(state.trailers, sovtesId);
      })
      .addCase(syncSovtesTrailer.rejected, (state, action) => {
        const sovtesId = String(action.meta.arg.id);
        state.syncingIds = state.syncingIds.filter((id) => id !== sovtesId);
        state.error = action.payload?.error || "Failed to sync trailer";
      })

      .addCase(resyncSovtesTrailer.pending, (state, action) => {
        state.syncingIds.push(String(action.meta.arg.id));
      })
      .addCase(resyncSovtesTrailer.fulfilled, (state, action) => {
        state.syncingIds = state.syncingIds.filter(
          (id) => id !== String(action.meta.arg.id)
        );
      })
      .addCase(resyncSovtesTrailer.rejected, (state, action) => {
        state.syncingIds = state.syncingIds.filter(
          (id) => id !== String(action.meta.arg.id)
        );
        state.error = action.payload?.error || "Failed to re-sync trailer";
      })

      .addCase(linkSovtesTruck.pending, (state, action) => {
        state.syncingIds.push(String(action.meta.arg.id));
      })
      .addCase(linkSovtesTruck.fulfilled, (state, action) => {
        const sovtesId = String(action.meta.arg.id);
        state.syncingIds = state.syncingIds.filter((id) => id !== sovtesId);
        markSynced(state.trucks, sovtesId);
      })
      .addCase(linkSovtesTruck.rejected, (state, action) => {
        state.syncingIds = state.syncingIds.filter(
          (id) => id !== String(action.meta.arg.id)
        );
        state.error = action.payload?.error || "Failed to link truck";
      })

      .addCase(linkSovtesTrailer.pending, (state, action) => {
        state.syncingIds.push(String(action.meta.arg.id));
      })
      .addCase(linkSovtesTrailer.fulfilled, (state, action) => {
        const sovtesId = String(action.meta.arg.id);
        state.syncingIds = state.syncingIds.filter((id) => id !== sovtesId);
        markSynced(state.trailers, sovtesId);
      })
      .addCase(linkSovtesTrailer.rejected, (state, action) => {
        state.syncingIds = state.syncingIds.filter(
          (id) => id !== String(action.meta.arg.id)
        );
        state.error = action.payload?.error || "Failed to link trailer";
      })

      .addCase(resyncAllSovtesTrucks.pending, (state) => {
        state.resyncingAll = true;
        state.error = null;
      })
      .addCase(resyncAllSovtesTrucks.fulfilled, (state) => {
        state.resyncingAll = false;
      })
      .addCase(resyncAllSovtesTrucks.rejected, (state, action) => {
        state.resyncingAll = false;
        state.error = action.payload?.error || "Failed to re-sync all trucks";
      })

      .addCase(resyncAllSovtesTrailers.pending, (state) => {
        state.resyncingAll = true;
        state.error = null;
      })
      .addCase(resyncAllSovtesTrailers.fulfilled, (state) => {
        state.resyncingAll = false;
      })
      .addCase(resyncAllSovtesTrailers.rejected, (state, action) => {
        state.resyncingAll = false;
        state.error = action.payload?.error || "Failed to re-sync all trailers";
      })

      .addCase(fetchSovtesDrivers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSovtesDrivers.fulfilled, (state, action) => {
        state.loading = false;
        state.drivers = action.payload;
      })
      .addCase(fetchSovtesDrivers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || "Failed to fetch Sovtes drivers";
      })

      .addCase(syncSovtesDriver.pending, (state, action) => {
        state.syncingIds.push(String(action.meta.arg.id));
      })
      .addCase(syncSovtesDriver.fulfilled, (state, action) => {
        const sovtesId = String(action.meta.arg.id);
        state.syncingIds = state.syncingIds.filter((id) => id !== sovtesId);
        markSynced(state.drivers, sovtesId);
      })
      .addCase(syncSovtesDriver.rejected, (state, action) => {
        const sovtesId = String(action.meta.arg.id);
        state.syncingIds = state.syncingIds.filter((id) => id !== sovtesId);
        state.error = action.payload?.error || "Failed to sync driver";
      })

      .addCase(resyncSovtesDriver.pending, (state, action) => {
        state.syncingIds.push(String(action.meta.arg.id));
      })
      .addCase(resyncSovtesDriver.fulfilled, (state, action) => {
        state.syncingIds = state.syncingIds.filter(
          (id) => id !== String(action.meta.arg.id)
        );
      })
      .addCase(resyncSovtesDriver.rejected, (state, action) => {
        state.syncingIds = state.syncingIds.filter(
          (id) => id !== String(action.meta.arg.id)
        );
        state.error = action.payload?.error || "Failed to re-sync driver";
      })

      .addCase(linkSovtesDriver.pending, (state, action) => {
        state.syncingIds.push(String(action.meta.arg.id));
      })
      .addCase(linkSovtesDriver.fulfilled, (state, action) => {
        const sovtesId = String(action.meta.arg.id);
        state.syncingIds = state.syncingIds.filter((id) => id !== sovtesId);
        markSynced(state.drivers, sovtesId);
      })
      .addCase(linkSovtesDriver.rejected, (state, action) => {
        state.syncingIds = state.syncingIds.filter(
          (id) => id !== String(action.meta.arg.id)
        );
        state.error = action.payload?.error || "Failed to link driver";
      })

      .addCase(resyncAllSovtesDrivers.pending, (state) => {
        state.resyncingAll = true;
        state.error = null;
      })
      .addCase(resyncAllSovtesDrivers.fulfilled, (state) => {
        state.resyncingAll = false;
      })
      .addCase(resyncAllSovtesDrivers.rejected, (state, action) => {
        state.resyncingAll = false;
        state.error = action.payload?.error || "Failed to re-sync all drivers";
      });
  },
});

export const { setShowSovtesSyncModal, clearSovtesFleetError } =
  sovtesFleetSlice.actions;
export default sovtesFleetSlice.reducer;
