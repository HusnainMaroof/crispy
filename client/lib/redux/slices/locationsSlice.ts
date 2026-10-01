import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "@/lib/api";
import { mapStoreLocation } from "@/lib/storefront-locations";
import type { Location } from "../types";

type LocationsState = {
  locations: Location[];
  loading: boolean;
  error: string | null;
};

const initialState: LocationsState = {
  locations: [],
  loading: false,
  error: null,
};

export const fetchLocations = createAsyncThunk("locations/fetchLocations", async () => {
  const data = await api.get<Record<string, unknown>[]>("/store/locations");
  if (!Array.isArray(data)) return [] as Location[];
  return data.flatMap((row) => {
    const location = mapStoreLocation(row);
    return location ? [location] : [];
  });
});

const locationsSlice = createSlice({
  name: "locations",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchLocations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLocations.fulfilled, (state, action) => {
        state.loading = false;
        state.locations = action.payload;
      })
      .addCase(fetchLocations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to load locations";
      });
  },
});

export default locationsSlice.reducer;
