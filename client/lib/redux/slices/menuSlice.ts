import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "@/lib/api";
import type { MenuCategory, Deal, MenuItem } from "../types";
import { mockMenuFull, mockMenuDeals } from "@/lib/data";

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
    badge: (raw.badge as string | undefined) ?? undefined,
    badgeVariant: (raw.badge_variant as "default" | "vegan" | undefined) ?? undefined,
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
  try {
    const data = await api.get<Record<string, unknown>[]>("/menu/full");
    return data.map(mapMenuCategory) as unknown as MenuCategory[];
  } catch {
    return mockMenuFull as unknown as MenuCategory[];
  }
});

export const fetchDeals = createAsyncThunk("menu/fetchDeals", async () => {
  try {
    const data = await api.get<Record<string, unknown>[]>("/menu/deals");
    return data.map(mapMenuItem) as unknown as Deal[];
  } catch {
    return mockMenuDeals as unknown as Deal[];
  }
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
        state.categories = action.payload as unknown as MenuCategory[];
      })
      .addCase(fetchFullMenu.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to load menu";
      })
      .addCase(fetchDeals.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDeals.fulfilled, (state, action) => {
        state.loading = false;
        state.deals = action.payload as unknown as Deal[];
      })
      .addCase(fetchDeals.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to load deals";
      });
  },
});

export default menuSlice.reducer;
