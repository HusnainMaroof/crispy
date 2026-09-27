"use client";

import Link from "next/link";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useDispatch, useSelector } from "react-redux";
import { api } from "@/lib/api";
import { needsBranchSwitch } from "@/lib/cart-model";
import { hydrateCart, switchCartBranch } from "@/lib/redux/slices/cartSlice";
import { fetchDeals, fetchFullMenu } from "@/lib/redux/slices/menuSlice";
import type { AppDispatch, RootState } from "@/lib/redux/store";
import { useUI } from "@/lib/context/ui-context";
import { cartCount } from "@/lib/cart-model";
import { formatCurrency } from "@/lib/i18n";
import { useLocale } from "@/lib/i18n/locale-context";
import { updateQuantity, removeItem, clearCart } from "@/lib/redux/slices/cartSlice";

type BranchSelectionValue = {
  selectBranch: (locationId: string, locationName: string) => boolean;
};

const BranchSelectionContext = createContext<BranchSelectionValue | null>(null);

export function useBranchSelection() {
  const value = useContext(BranchSelectionContext);
  if (!value) throw new Error("useBranchSelection must be used within BranchChrome");
  return value;
}

export function BranchChrome({ children }: { children: ReactNode }) {
  const dispatch = useDispatch<AppDispatch>();
  const cart = useSelector((state: RootState) => state.cart);
  const locations = useSelector((state: RootState) => state.locations.locations);
  const { isCartOpen, closeCart } = useUI();
  const [pending, setPending] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    dispatch(hydrateCart());
  }, [dispatch]);

  const commit = async (locationId: string, replaceCart: boolean) => {
    await api.patch("/store/location", { location_id: locationId });
    if (replaceCart) dispatch(switchCartBranch(locationId));
    dispatch(fetchFullMenu(locationId));
    dispatch(fetchDeals(locationId));
  };

  const selectBranch = (locationId: string, locationName: string) => {
    if (needsBranchSwitch(cart, locationId)) {
      setPending({ id: locationId, name: locationName });
      return false;
    }
    void commit(locationId, cart.items.length === 0 || cart.locationId === null);
    return true;
  };

  const currentName = locations.find((location) => location.id === cart.locationId)?.name ?? "the current branch";

  return (
    <BranchSelectionContext.Provider value={{ selectBranch }}>
      {children}
      {pending && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-black p-6 text-white">
            <p className="font-[family-name:var(--font-korolev),Korolev,sans-serif] text-2xl uppercase leading-none">
              Switch branch?
            </p>
            <p className="mt-4 text-sm leading-6 text-white/70">
              Your cart belongs to {currentName}. Switching to {pending.name} will clear your cart. Prices shown here are for display only.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setPending(null)}
                className="cursor-pointer flex-1 rounded-full border border-white/20 px-4 py-3 text-xs font-bold uppercase tracking-widest"
              >
                Keep current branch
              </button>
              <button
                type="button"
                onClick={() => {
                  const next = pending;
                  setPending(null);
                  void commit(next.id, true);
                }}
                className="cursor-pointer flex-1 rounded-full bg-[#FF0931] px-4 py-3 text-xs font-bold uppercase tracking-widest"
              >
                Clear cart and switch
              </button>
            </div>
          </div>
        </div>
      )}
      <CartDrawer open={isCartOpen} onClose={closeCart} />
    </BranchSelectionContext.Provider>
  );
}

type ServerQuote = {
  items: { kind: "product" | "deal"; id: string; name: string; quantity: number; unitPrice: number; lineTotal: number }[];
  subtotal: number;
  total: number;
};

function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dispatch = useDispatch<AppDispatch>();
  const cart = useSelector((state: RootState) => state.cart);
  const count = cartCount(cart);
  const { locale, t } = useLocale();
  const [quote, setQuote] = useState<ServerQuote | null>(null);
  const [quoteError, setQuoteError] = useState("");

  useEffect(() => {
    if (!open || cart.items.length === 0 || !cart.locationId) {
      setQuote(null);
      setQuoteError(cart.items.length > 0 && !cart.locationId ? "Choose a branch before the price can be confirmed." : "");
      return;
    }
    let cancelled = false;
    api.post<ServerQuote>("/menu/quote", {
      locationId: cart.locationId,
      items: cart.items.map((item) => ({ kind: item.kind, id: item.id, quantity: item.quantity })),
    }).then((data) => {
      if (!cancelled) {
        setQuote(data);
        setQuoteError("");
      }
    }).catch((error: Error & { item?: { id: string } }) => {
      if (!cancelled) {
        setQuote(null);
        setQuoteError(error.message);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [open, cart]);

  return (
    <div className={`fixed inset-0 z-[70] ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
      <button type="button" className={`absolute inset-0 bg-black/60 transition-opacity ${open ? "opacity-100" : "opacity-0"}`} onClick={onClose} aria-label="Close cart" />
      <aside className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-black text-white transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 className="font-[family-name:var(--font-korolev),Korolev,sans-serif] text-3xl uppercase">{t("cart.title")}</h2>
          <button type="button" onClick={onClose} className="cursor-pointer text-sm text-white/60">{t("nav.close")}</button>
        </div>
        <p className="px-5 pt-3 text-xs text-white/40">Display prices only. The server confirms the price when you order.</p>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {cart.items.length === 0 && <p className="text-sm text-white/50">{t("cart.empty")}</p>}
          {cart.items.map((item) => (
            <div key={`${item.kind}-${item.id}`} className="flex items-center justify-between gap-3 border-b border-white/10 py-4">
              <div>
                <p className="text-sm font-medium">{item.name}</p>
                <p className="text-xs uppercase tracking-widest text-white/40">{item.kind}</p>
                <p className="mt-1 text-sm">
                  {quote?.items.find((line) => line.id === item.id && line.kind === item.kind)
                    ? formatCurrency(quote.items.find((line) => line.id === item.id && line.kind === item.kind)!.unitPrice, locale)
                    : formatCurrency(item.price, locale)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" className="cursor-pointer h-8 w-8 rounded-full border border-white/20" onClick={() => dispatch(updateQuantity({ id: item.id, kind: item.kind, quantity: item.quantity - 1 }))}>-</button>
                <span className="w-6 text-center text-sm">{item.quantity}</span>
                <button type="button" className="cursor-pointer h-8 w-8 rounded-full border border-white/20" onClick={() => dispatch(updateQuantity({ id: item.id, kind: item.kind, quantity: item.quantity + 1 }))}>+</button>
                <button type="button" className="cursor-pointer text-xs uppercase tracking-widest text-white/50" onClick={() => dispatch(removeItem({ id: item.id, kind: item.kind }))}>{t("cart.remove")}</button>
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-white/10 px-5 py-4">
          {quoteError && <p className="mb-3 text-sm text-[#FF0931]">{quoteError}</p>}
          <div className="mb-3 flex justify-between text-sm">
            <span>{count} items</span>
            <span>{quote ? `${t("cart.subtotal")} ${formatCurrency(quote.subtotal, locale)}` : t("cart.waiting")}</span>
          </div>
          <Link href="/checkout" onClick={onClose} className={`mb-3 block rounded-full bg-[#FF0931] py-3 text-center text-xs font-bold uppercase tracking-widest ${quote ? "" : "pointer-events-none opacity-40"}`}>
            {t("cart.checkout")}
          </Link>
          <button type="button" onClick={() => dispatch(clearCart())} disabled={cart.items.length === 0} className="cursor-pointer w-full rounded-full border border-white/20 py-3 text-xs font-bold uppercase tracking-widest disabled:opacity-40">
            {t("cart.clear")}
          </button>
        </div>
      </aside>
    </div>
  );
}
