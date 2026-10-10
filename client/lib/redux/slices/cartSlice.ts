import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import {
  addLine,
  changeQuantity,
  clearLines,
  emptyCart,
  parseStoredCart,
  removeLine,
  replaceBranch,
  type CartLine,
  type CartLineKind,
  type CartState,
} from "@/lib/cart-model";

const CART_STORAGE_KEY = "crispies_cart";

function loadCart(): CartState {
  if (typeof window === "undefined") return emptyCart();
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return emptyCart();
    return parseStoredCart(JSON.parse(raw));
  } catch {
    return emptyCart();
  }
}

function saveCart(state: CartState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or unavailable
  }
}

const cartSlice = createSlice({
  name: "cart",
  initialState: emptyCart(),
  reducers: {
    hydrateCart(state) {
      const loaded = loadCart();
      state.locationId = loaded.locationId;
      state.items = loaded.items;
    },
    addItem(state, action: PayloadAction<Omit<CartLine, "quantity"> & { locationId?: string | null }>) {
      const next = addLine(state, action.payload);
      state.locationId = next.locationId;
      state.items = next.items;
      saveCart(state);
    },
    removeItem(state, action: PayloadAction<{ id: string; kind: CartLineKind }>) {
      const next = removeLine(state, action.payload.id, action.payload.kind);
      state.items = next.items;
      saveCart(state);
    },
    updateQuantity(state, action: PayloadAction<{ id: string; kind: CartLineKind; quantity: number }>) {
      const next = changeQuantity(state, action.payload.id, action.payload.kind, action.payload.quantity);
      state.items = next.items;
      saveCart(state);
    },
    clearCart(state) {
      const next = clearLines(state);
      state.items = next.items;
      saveCart(state);
    },
    switchCartBranch(state, action: PayloadAction<string>) {
      const next = replaceBranch(state, action.payload);
      state.locationId = next.locationId;
      state.items = next.items;
      saveCart(state);
    },
    /**
     * Back to browsing the whole menu across every branch. The cart is emptied
     * because its lines were picked against a specific branch, and checkout
     * needs a branch before it can quote.
     */
    clearCartBranch(state) {
      const next = clearLines(state);
      state.locationId = null;
      state.items = next.items;
      saveCart(state);
    },
  },
});

export const { hydrateCart, addItem, removeItem, updateQuantity, clearCart, switchCartBranch, clearCartBranch } = cartSlice.actions;
export default cartSlice.reducer;
