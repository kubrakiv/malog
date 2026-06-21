import { createSlice } from "@reduxjs/toolkit";
import {
  fetchCompany, saveCompany,
  fetchBanks, createBank, updateBank, deleteBank,
} from "./companyOperations";

const companySlice = createSlice({
  name: "company",
  initialState: {
    company: null,
    banks: [],
    loading: false,
    saving: false,
    banksLoading: false,
    error: null,
    saveError: null,
  },
  reducers: {
    clearCompanyErrors: (state) => {
      state.error = null;
      state.saveError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchCompany
      .addCase(fetchCompany.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchCompany.fulfilled, (state, action) => { state.loading = false; state.company = action.payload; })
      .addCase(fetchCompany.rejected, (state, action) => { state.loading = false; state.error = action.payload?.error || "Помилка завантаження"; })

      // saveCompany
      .addCase(saveCompany.pending, (state) => { state.saving = true; state.saveError = null; })
      .addCase(saveCompany.fulfilled, (state, action) => { state.saving = false; state.company = action.payload; })
      .addCase(saveCompany.rejected, (state, action) => {
        state.saving = false;
        const p = action.payload;
        state.saveError = (p && typeof p === "object" && !p.error)
          ? Object.entries(p).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`).join("; ")
          : p?.error || "Помилка збереження";
      })

      // fetchBanks
      .addCase(fetchBanks.pending, (state) => { state.banksLoading = true; })
      .addCase(fetchBanks.fulfilled, (state, action) => { state.banksLoading = false; state.banks = action.payload; })
      .addCase(fetchBanks.rejected, (state) => { state.banksLoading = false; })

      // createBank
      .addCase(createBank.fulfilled, (state, action) => { state.banks.push(action.payload); })

      // updateBank
      .addCase(updateBank.fulfilled, (state, action) => {
        const idx = state.banks.findIndex((b) => b.id === action.payload.id);
        if (idx !== -1) state.banks[idx] = action.payload;
      })

      // deleteBank
      .addCase(deleteBank.fulfilled, (state, action) => {
        state.banks = state.banks.filter((b) => b.id !== action.payload);
      });
  },
});

export const { clearCompanyErrors } = companySlice.actions;
export default companySlice.reducer;
