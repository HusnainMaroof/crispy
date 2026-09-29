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
import { formatCurrency, localizedName } from "@/lib/i18n";
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
  const { t } = useLocale();
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

  const currentName = locations.find((location) => location.id === cart.locationId)?.name ?? t("branch.current");

  return (
    <BranchSelectionContext.Provider value={{ selectBranch }}>
      {children}
      {pending && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-black p-6 text-white">
            <p className="font-[family-name:var(--font-korolev),Korolev,sans-serif] text-2xl uppercase leading-none">
              {t("branch.switch.title")}
            </p>
            <p className="mt-4 text-sm leading-6 text-white/70">
              {t("branch.switch.body", { current: currentName, next: pending.name })}
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setPending(null)}
                className="cursor-pointer flex-1 rounded-full border border-white/20 px-4 py-3 text-xs font-bold uppercase tracking-widest"
              >
                {t("branch.switch.keep")}
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
                {t("branch.switch.confirm")}
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
  const menu = useSelector((state: RootState) => state.menu);
  const count = cartCount(cart);
  const { locale, t } = useLocale();
  const [quote, setQuote] = useState<ServerQuote | null>(null);
  const [quoteError, setQuoteError] = useState("");

  useEffect(() => {
    if (!open || cart.items.length === 0 || !cart.locationId) {
      setQuote(null);
      setQuoteError(cart.items.length > 0 && !cart.locationId ? t("cart.branchFirst") : "");
      return;
    }
    let cancelled = false;
    api.post<ServerQuote>("/menu/quote", {
      locationId: cart.locationId,
      locale,
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
  }, [open, cart, locale, t]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div role="dialog" aria-modal="true" aria-label={t("cart.title")} className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto p-4 sm:p-6">
      <div className="fixed inset-0 bg-black/85" onClick={onClose} aria-hidden />
      <div className="relative my-auto flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-[#242424] bg-black text-white shadow-[0_20px_60px_rgba(0,0,0,0.7)]">
        <button type="button" onClick={onClose} aria-label={t("nav.close")} className="absolute right-4 top-4 z-10 flex size-9 cursor-pointer items-center justify-center rounded-full border border-[#2b2b2b] bg-[#161616] text-white transition-colors hover:border-[#FF0931] hover:bg-[#FF0931]">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
        <div className="px-6 pb-2 pt-10 text-center sm:px-8">
          <h2 className="font-[family-name:var(--font-korolev),Korolev,sans-serif] text-[32px] font-bold uppercase leading-none text-white sm:text-5xl">{t("cart.title")}</h2>
          <p className="mt-3 text-sm text-[#8f8f8f]">{t("cart.notice")}</p>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4 sm:px-8">
          {cart.items.length === 0 && <p className="text-sm text-white/50">{t("cart.empty")}</p>}
          {cart.items.map((item) => {
            const quoted = quote?.items.find((line) => line.id === item.id && line.kind === item.kind);
            const stored = item.kind === "deal"
              ? menu.deals.find((deal) => deal.id === item.id)
              : menu.categories.flatMap((category) => category.items).find((product) => product.id === item.id);
            const name = stored
              ? localizedName(locale, stored.name, stored.nameAr)
              : quoted?.name ?? localizedName(locale, item.name);
            return (
            <div key={`${item.kind}-${item.id}`} className="flex items-center justify-between gap-3 border-b border-white/10 py-4">
              <div>
                <p className="text-sm font-medium">{name}</p>
                <p className="text-xs uppercase tracking-widest text-white/40">{t(`cart.kind.${item.kind}`)}</p>
                <p className="mt-1 text-sm">
                  {quoted
                    ? formatCurrency(quoted.unitPrice, locale)
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
            );
          })}
        </div>
        <div className="border-t border-white/10 px-6 py-5 sm:px-8">
          {quoteError && <p className="mb-3 text-sm text-[#FF0931]">{quoteError}</p>}
          <div className="mb-3 flex justify-between text-sm">
            <span>{t("cart.count", { count })}</span>
            <span>{quote ? `${t("cart.subtotal")} ${formatCurrency(quote.subtotal, locale)}` : t("cart.waiting")}</span>
          </div>
          <Link href="/checkout" onClick={onClose} className={`mb-3 block rounded-full bg-[#FF0931] py-3 text-center text-xs font-bold uppercase tracking-widest ${quote ? "" : "pointer-events-none opacity-40"}`}>
            {t("cart.checkout")}
          </Link>
          <button type="button" onClick={() => dispatch(clearCart())} disabled={cart.items.length === 0} className="cursor-pointer w-full rounded-full border border-white/20 py-3 text-xs font-bold uppercase tracking-widest disabled:opacity-40">
            {t("cart.clear")}
          </button>
        </div>
      </div>
    </div>
  );
}
