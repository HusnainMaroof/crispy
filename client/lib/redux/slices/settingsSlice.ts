import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "@/lib/api";
import type { Settings } from "../types";
import { mockSettings } from "@/lib/data";

type SettingsState = {
  settings: Settings | null;
  loading: boolean;
  error: string | null;
};

const initialState: SettingsState = {
  settings: null,
  loading: false,
  error: null,
};

export const fetchSettings = createAsyncThunk("settings/fetchSettings", async () => {
  try {
    const data = await api.get<Record<string, unknown>>("/store/settings");
    return {
      id: data.id as number,
      delivery_fee: data.delivery_fee as number,
      free_delivery_threshold: data.free_delivery_threshold as number,
    };
  } catch {
    return mockSettings as Settings;
  }
});

const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.settings = action.payload;
      })
      .addCase(fetchSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to load settings";
      });
  },
});

export default settingsSlice.reducer;
