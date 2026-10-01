import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "@/lib/api";
import { mapMenuItem } from "@/lib/mappers";
import type { MenuCategory, Deal } from "../types";

type LoadStatus = "idle" | "loading" | "ready" | "failed";

type MenuState = {
  categories: MenuCategory[];
  deals: Deal[];
  /**
   * Catalogue and deals load independently. They used to share one `loading`
   * flag, so a deals refresh blanked the whole menu grid and showed the loading
   * copy even though the categories were already on screen.
   */
  status: LoadStatus;
  error: string | null;
  dealsStatus: LoadStatus;
  dealsError: string | null;
  /** Branch the cached categories belong to. "" is the unscoped/global menu. */
  scope: string | null;
};

const initialState: MenuState = {
  categories: [],
  deals: [],
  status: "idle",
  error: null,
  dealsStatus: "idle",
  dealsError: null,
  scope: null,
};

function mapMenuCategory(raw: Record<string, unknown>): MenuCategory {
  const items = (raw.items as Record<string, unknown>[]) ?? [];
  return {
    id: raw.id as string,
    number: raw.number as string,
    title: raw.title as string,
    titleAr: (raw.title_ar as string | undefined) ?? undefined,
    image: raw.image as string,
    items: items.map(mapMenuItem),
  };
}

function menuPath(path: string, locationId?: string) {
  if (!locationId) return path;
  return `${path}?location_id=${encodeURIComponent(locationId)}`;
}

export const fetchFullMenu = createAsyncThunk(
  "menu/fetchFullMenu",
  async (locationId: string | undefined, { rejectWithValue }) => {
    try {
      const data = await api.get<Record<string, unknown>[]>(menuPath("/menu/full", locationId));
      return { scope: locationId ?? "", categories: data.map(mapMenuCategory) as unknown as MenuCategory[] };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to load menu");
    }
  },
);

export const fetchDeals = createAsyncThunk(
  "menu/fetchDeals",
  async (locationId: string | undefined, { rejectWithValue }) => {
    try {
      const data = await api.get<Record<string, unknown>[]>(menuPath("/menu/deals", locationId));
      return { scope: locationId ?? "", deals: data.map(mapMenuItem) as unknown as Deal[] };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to load deals");
    }
  },
);

const menuSlice = createSlice({
  name: "menu",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchFullMenu.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchFullMenu.fulfilled, (state, action) => {
        state.status = "ready";
        state.categories = action.payload.categories;
        state.scope = action.payload.scope;
      })
      .addCase(fetchFullMenu.rejected, (state, action) => {
        state.status = "failed";
        state.error = (action.payload as string) ?? action.error.message ?? "Failed to load menu";
      })
      .addCase(fetchDeals.pending, (state) => {
        state.dealsStatus = "loading";
        state.dealsError = null;
      })
      .addCase(fetchDeals.fulfilled, (state, action) => {
        state.dealsStatus = "ready";
        state.deals = action.payload.deals;
      })
      .addCase(fetchDeals.rejected, (state, action) => {
        state.dealsStatus = "failed";
        state.dealsError = (action.payload as string) ?? action.error.message ?? "Failed to load deals";
      });
  },
});

export default menuSlice.reducer;
