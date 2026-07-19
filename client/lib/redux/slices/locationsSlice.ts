import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "@/lib/api";
import type { Location } from "../types";
import { mockLocations } from "@/lib/data";

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
  try {
    const data = await api.get<Record<string, unknown>[]>("/store/locations");
    return data.map((l) => ({
      id: l.id as string,
      name: l.name as string,
      address: l.address as string,
      hours: l.hours as string,
      phone: l.phone as string,
      lat: (l.lat as number) ?? null,
      lng: (l.lng as number) ?? null,
      sort_order: (l.sort_order as number) ?? 0,
    }));
  } catch {
    return mockLocations as Location[];
  }
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
