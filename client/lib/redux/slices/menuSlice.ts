import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "@/lib/api";
import type { MenuCategory, Deal, MenuItem } from "../types";

type MenuState = {
  categories: MenuCategory[];
  deals: Deal[];
  loading: boolean;
  error: string | null;
};

const initialState: MenuState = {
  categories: [],
  deals: [],
  loading: false,
  error: null,
};

function mapMenuItem(raw: Record<string, unknown>): MenuItem {
  const price = Number(raw.price) || 0;
  return {
    id: raw.id as string,
    name: raw.name as string,
    description: raw.description as string,
    price: `£${price.toFixed(2)}`,
    priceValue: price,
    image: raw.image as string,
    badge: (raw.badge as string) ?? undefined,
    badgeVariant: (raw.badge_variant as "default" | "vegan") ?? undefined,
  };
}

function mapMenuCategory(raw: Record<string, unknown>): MenuCategory {
  const items = (raw.items as Record<string, unknown>[]) ?? [];
  return {
    id: raw.id as string,
    number: raw.number as string,
    title: raw.title as string,
    image: raw.image as string,
    items: items.map(mapMenuItem),
  };
}

export const fetchFullMenu = createAsyncThunk("menu/fetchFullMenu", async () => {
  const data = await api.get<Record<string, unknown>[]>("/menu/full");
  return data.map(mapMenuCategory);
});

export const fetchDeals = createAsyncThunk("menu/fetchDeals", async () => {
  const data = await api.get<Record<string, unknown>[]>("/menu/deals");
  return data.map(mapMenuItem);
});

const menuSlice = createSlice({
  name: "menu",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchFullMenu.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFullMenu.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = action.payload;
      })
      .addCase(fetchFullMenu.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to load menu";
      })
      .addCase(fetchDeals.fulfilled, (state, action) => {
        state.deals = action.payload;
      });
  },
});

export default menuSlice.reducer;
