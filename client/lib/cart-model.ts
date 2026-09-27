export type CartLineKind = "product" | "deal";

export type CartLine = {
  id: string;
  kind: CartLineKind;
  name: string;
  price: number;
  quantity: number;
};

export type CartState = {
  locationId: string | null;
  items: CartLine[];
};

export const emptyCart = (): CartState => ({ locationId: null, items: [] });

export function parseStoredCart(raw: unknown): CartState {
  if (Array.isArray(raw)) {
    return {
      locationId: null,
      items: raw.filter(isLegacyLine).map((line) => ({
        id: line.id,
        kind: "product",
        name: line.name,
        price: line.price,
        quantity: line.quantity,
      })),
    };
  }
  if (!raw || typeof raw !== "object") return emptyCart();
  const record = raw as { locationId?: unknown; items?: unknown };
  const items = Array.isArray(record.items) ? record.items.filter(isLine) : [];
  return {
    locationId: typeof record.locationId === "string" ? record.locationId : null,
    items,
  };
}

function isLegacyLine(value: unknown): value is { id: string; name: string; price: number; quantity: number } {
  if (!value || typeof value !== "object") return false;
  const line = value as Record<string, unknown>;
  return typeof line.id === "string" && typeof line.name === "string" && typeof line.price === "number" && typeof line.quantity === "number";
}

function isLine(value: unknown): value is CartLine {
  if (!isLegacyLine(value)) return false;
  const kind = (value as { kind?: unknown }).kind;
  return kind === "product" || kind === "deal";
}

export function cartCount(state: CartState): number {
  return state.items.reduce((sum, item) => sum + item.quantity, 0);
}

export function cartSubtotal(state: CartState): number {
  return state.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function needsBranchSwitch(state: CartState, nextLocationId: string): boolean {
  return state.items.length > 0 && state.locationId !== nextLocationId;
}

export function addLine(
  state: CartState,
  line: Omit<CartLine, "quantity"> & { locationId?: string | null },
): CartState {
  const locationId = line.locationId === undefined ? state.locationId : line.locationId;
  if (state.items.length > 0 && state.locationId !== locationId) return state;
  const nextLocation = state.items.length === 0 ? (locationId ?? null) : state.locationId;
  const existing = state.items.find((item) => item.id === line.id && item.kind === line.kind);
  const items = existing
    ? state.items.map((item) => item === existing ? { ...item, quantity: item.quantity + 1, price: line.price } : item)
    : [...state.items, { id: line.id, kind: line.kind, name: line.name, price: line.price, quantity: 1 }];
  return { locationId: nextLocation, items };
}

export function changeQuantity(state: CartState, id: string, kind: CartLineKind, quantity: number): CartState {
  if (quantity < 1) {
    return { ...state, items: state.items.filter((item) => !(item.id === id && item.kind === kind)) };
  }
  return {
    ...state,
    items: state.items.map((item) => item.id === id && item.kind === kind ? { ...item, quantity } : item),
  };
}

export function removeLine(state: CartState, id: string, kind: CartLineKind): CartState {
  return { ...state, items: state.items.filter((item) => !(item.id === id && item.kind === kind)) };
}

export function clearLines(state: CartState): CartState {
  return { ...state, items: [] };
}

export function replaceBranch(state: CartState, locationId: string): CartState {
  return { locationId, items: [] };
}
