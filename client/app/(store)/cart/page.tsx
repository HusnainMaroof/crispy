"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "next/navigation";
import { useLenis } from "@/components/providers/smooth-scroll";
import { clearCart, removeItem, updateQuantity } from "@/lib/redux/slices/cartSlice";
import { fetchSettings } from "@/lib/redux/slices/settingsSlice";
import type { RootState, AppDispatch } from "@/lib/redux/store";
import { api } from "@/lib/api";
import type { Order, OrderStatus } from "@/lib/redux/types";

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Order Placed",
  preparing: "Preparing",
  ready: "Ready",
  "out-for-delivery": "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const STATUS_ORDER: OrderStatus[] = [
  "pending",
  "preparing",
  "ready",
  "out-for-delivery",
  "delivered",
];

type Tab = "cart" | "orders";

function OrderCard({ order }: { order: Order }) {
  const statusIndex = STATUS_ORDER.indexOf(order.status);
  const cancelled = order.status === "cancelled";

  const date = new Date(order.created_at);
  const formattedDate = date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <p className="text-xs text-white/40">Order #{order.id}</p>
          <p className="mt-0.5 text-sm text-white/50">{formattedDate}</p>
          <p className="mt-1 text-xs text-white/40">
            {order.fulfilment === "delivery" ? "Delivery" : "Collection"}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
            cancelled
              ? "bg-red-900/30 text-red-400"
              : statusIndex >= STATUS_ORDER.length - 1
                ? "bg-green-900/30 text-green-400"
                : "bg-yellow-900/30 text-yellow-400"
          }`}
        >
          {STATUS_LABELS[order.status]}
        </span>
      </div>

      {!cancelled && (
        <div className="mb-4 flex items-center gap-1">
          {STATUS_ORDER.map((s, i) => (
            <div key={s} className="flex-1">
              <div
                className={`h-1.5 rounded-full transition-colors duration-300 ${
                  i <= statusIndex ? "bg-brand-red" : "bg-white/10"
                }`}
              />
            </div>
          ))}
        </div>
      )}

      {order.items && order.items.length > 0 && (
        <div className="mb-4 space-y-1.5 border-t border-white/5 pt-4">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-white/70">
                {item.quantity}x {item.name}
              </span>
              <span className="text-white/50">£{(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-between border-t border-white/5 pt-3 text-sm font-semibold text-white">
        <span>Total</span>
        <span>£{order.total.toFixed(2)}</span>
      </div>
    </div>
  );
}

export default function CartPage() {
  const items = useSelector((state: RootState) => state.cart.items);
  const settings = useSelector((state: RootState) => state.settings.settings);
  const dispatch = useDispatch<AppDispatch>();
  const { scrollTo } = useLenis();

  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>(() => (searchParams.get("tab") === "orders" ? "orders" : "cart"));
  const [confirmingClear, setConfirmingClear] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);

  // Orders state
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [lookupError, setLookupError] = useState("");
  const [lookupMode, setLookupMode] = useState(false);

  useEffect(() => {
    if (!settings) dispatch(fetchSettings());
  }, [dispatch, settings]);

  useEffect(() => {
    if (tab !== "orders") return;
    if (orders.length > 0) return; // already loaded

    (async () => {
      setOrdersLoading(true);
      try {
        const data = await api.get<Order[]>("/orders/mine");
        setOrders(data ?? []);
        setLookupMode(!data || data.length === 0);
      } catch {
        setLookupMode(true);
      } finally {
        setOrdersLoading(false);
      }
    })();
  }, [tab, orders.length]);

  const handleEmailLookup = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLookupError("");
    setSubmitted(true);
    try {
      const data = await api.post<Order[]>("/orders/lookup", { email });
      setOrders(data ?? []);
    } catch {
      setLookupError("No orders found with that email address.");
    } finally {
      setSubmitted(false);
    }
  }, [email]);

  const DELIVERY_FEE = settings?.delivery_fee ?? 2.99;
  const FREE_DELIVERY_THRESHOLD = settings?.free_delivery_threshold ?? 20;

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [items],
  );
  const itemCount = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);
  const deliveryFee = subtotal >= FREE_DELIVERY_THRESHOLD || subtotal === 0 ? 0 : DELIVERY_FEE;
  const total = subtotal + deliveryFee;
  const remainingForFree = Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal);
  const pctToFreeDelivery = Math.min(100, (subtotal / FREE_DELIVERY_THRESHOLD) * 100);

  useEffect(() => {
    if (items.length === 0 && tab === "cart") scrollTo(0);
  }, [items.length, tab, scrollTo]);

  const handleClear = () => {
    dispatch(clearCart());
    setConfirmingClear(false);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <section ref={topRef} className="mx-auto max-w-5xl px-6 pb-8 pt-28 md:px-16 md:pb-10 md:pt-32 lg:px-24">
        <h1 className="cart-title font-[family-name:var(--font-bebas)] text-6xl uppercase leading-[0.85] text-white md:text-8xl lg:text-9xl">
          {tab === "cart" ? "Cart." : "Your Orders."}
        </h1>

        {/* Tabs */}
        <div className="mt-6 flex gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1 w-fit">
          <button
            type="button"
            onClick={() => setTab("cart")}
            className={`cursor-pointer rounded-full px-5 py-2 text-[11px] font-bold uppercase tracking-[0.15em] transition-all duration-200 ${
              tab === "cart"
                ? "bg-brand-red text-white"
                : "text-white/50 hover:text-white"
            }`}
          >
            Cart {itemCount > 0 && `(${itemCount})`}
          </button>
          <button
            type="button"
            onClick={() => setTab("orders")}
            className={`cursor-pointer rounded-full px-5 py-2 text-[11px] font-bold uppercase tracking-[0.15em] transition-all duration-200 ${
              tab === "orders"
                ? "bg-brand-red text-white"
                : "text-white/50 hover:text-white"
            }`}
          >
            Your Orders
          </button>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-6 md:px-16 lg:px-24 pb-16">
        {/* ── Cart Tab ── */}
        {tab === "cart" && (
          items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-6 text-white/20" aria-hidden>
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              <p className="font-[family-name:var(--font-bebas)] text-5xl uppercase text-white/30 md:text-6xl">
                Your bag is empty
              </p>
              <p className="mt-3 max-w-sm text-sm text-white/50">
                Nothing in here yet. Head to the menu and load up on some crispy goodness.
              </p>
              <Link
                href="/menu"
                className="group mt-8 inline-flex items-center gap-3 rounded-full bg-brand-red px-7 py-4 text-xs font-bold uppercase tracking-widest text-white shadow-[0_20px_60px_-15px_rgba(220,38,38,0.7)] transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
              >
                Browse the menu
                <span className="transition-transform group-hover:translate-x-1">&rarr;</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_380px] lg:gap-16">
              <div>
                {/* Free delivery progress */}
                <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                  {remainingForFree > 0 ? (
                    <p className="text-xs font-medium uppercase tracking-widest text-white/50">
                      Add <span className="text-brand-red">&pound;{remainingForFree.toFixed(2)}</span> more for free delivery
                    </p>
                  ) : (
                    <p className="text-xs font-medium uppercase tracking-widest text-brand-red">
                      You&apos;ve unlocked free delivery
                    </p>
                  )}
                  <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10" aria-hidden>
                    <div
                      className="h-full rounded-full bg-brand-red transition-[width] duration-500 ease-out"
                      style={{ width: `${pctToFreeDelivery}%` }}
                    />
                  </div>
                </div>

                {/* Clear / item count */}
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-widest text-white/40">
                    {itemCount} {itemCount === 1 ? "item" : "items"}
                  </span>
                  {confirmingClear ? (
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] uppercase tracking-widest text-white/50">Clear all?</span>
                      <button
                        type="button"
                        onClick={handleClear}
                        className="cursor-pointer rounded-full border border-brand-red/60 px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-brand-red transition-all duration-200 hover:bg-brand-red hover:text-white active:scale-95"
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmingClear(false)}
                        className="cursor-pointer rounded-full border border-white/15 px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-white/60 transition-all duration-200 hover:text-white active:scale-95"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmingClear(true)}
                      className="cursor-pointer text-[11px] font-bold uppercase tracking-widest text-white/40 transition-colors hover:text-brand-red"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                {/* Item rows */}
                <ul className="space-y-3">
                  {items.map((item) => (
                    <li
                      key={item.id}
                      className="cart-item-row flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4 md:gap-6 md:p-5"
                    >
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/10 text-sm font-bold text-white/40">
                        {item.quantity}
                      </span>

                      <div className="min-w-0 flex-1">
                        <h3 className="truncate font-semibold text-white">{item.name}</h3>
                        <p className="mt-0.5 text-xs text-white/40 tabular-nums">&pound;{item.price.toFixed(2)} each</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => dispatch(updateQuantity({ id: item.id, quantity: item.quantity - 1 }))}
                          disabled={item.quantity <= 1}
                          className="cursor-pointer grid h-8 w-8 place-items-center rounded-full border border-white/15 text-white/70 transition-all duration-200 hover:border-brand-red hover:text-brand-red active:scale-90 disabled:opacity-30 disabled:hover:border-white/15 disabled:hover:text-white/70"
                          aria-label={`Decrease ${item.name} quantity`}
                        >
                          <span className="text-lg leading-none">&minus;</span>
                        </button>
                        <span className="min-w-[2.5ch] text-center text-base font-bold tabular-nums text-white">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => dispatch(updateQuantity({ id: item.id, quantity: item.quantity + 1 }))}
                          className="cursor-pointer grid h-8 w-8 place-items-center rounded-full border border-white/15 text-white/70 transition-all duration-200 hover:border-brand-red hover:text-brand-red active:scale-90"
                          aria-label={`Increase ${item.name} quantity`}
                        >
                          <span className="text-lg leading-none">+</span>
                        </button>
                      </div>

                      <div className="w-16 shrink-0 text-right text-sm font-bold tabular-nums text-white md:w-20 md:text-base">
                        &pound;{(item.price * item.quantity).toFixed(2)}
                      </div>

                      <button
                        type="button"
                        onClick={() => dispatch(removeItem(item.id))}
                        className="cursor-pointer grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 text-white/40 transition-all duration-200 hover:border-brand-red hover:bg-brand-red hover:text-white active:scale-90"
                        aria-label={`Remove ${item.name} from cart`}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/menu"
                  className="group mt-6 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/50 transition-colors hover:text-white cursor-pointer"
                >
                  <span className="transition-transform group-hover:-translate-x-1">&larr;</span>
                  Add more items
                </Link>
              </div>

              {/* Summary */}
              <aside className="summary-card lg:sticky lg:top-28 lg:self-start">
                <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 md:p-8">
                  <h2 className="font-[family-name:var(--font-bebas)] text-3xl uppercase leading-none text-white">
                    Summary
                  </h2>

                  <dl className="mt-6 space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <dt className="text-white/50">Subtotal</dt>
                      <dd className="font-semibold tabular-nums text-white">&pound;{subtotal.toFixed(2)}</dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt className="text-white/50">Delivery</dt>
                      <dd className={`font-semibold tabular-nums ${deliveryFee === 0 ? "text-brand-red" : "text-white"}`}>
                        {deliveryFee === 0 ? "Free" : `£${deliveryFee.toFixed(2)}`}
                      </dd>
                    </div>
                    <div className="h-px w-full bg-white/10" aria-hidden />
                    <div className="flex items-baseline justify-between">
                      <dt className="text-base font-bold uppercase tracking-widest text-white">Total</dt>
                      <dd className="font-[family-name:var(--font-bebas)] text-3xl tabular-nums text-brand-red">
                        &pound;{total.toFixed(2)}
                      </dd>
                    </div>
                  </dl>

                  <Link
                    href="/checkout"
                    className="group mt-8 flex w-full items-center justify-center gap-3 rounded-full bg-brand-red px-6 py-4 text-xs font-bold uppercase tracking-widest text-white shadow-[0_20px_60px_-15px_rgba(220,38,38,0.7)] transition-all duration-300 hover:scale-[1.02] active:scale-95 cursor-pointer"
                  >
                    Checkout
                    <span className="transition-transform group-hover:translate-x-1">&rarr;</span>
                  </Link>

                  <p className="mt-4 flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest text-white/30">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    Secure checkout
                  </p>
                </div>
              </aside>
            </div>
          )
        )}

        {/* ── Orders Tab ── */}
        {tab === "orders" && (
          <div className="max-w-2xl">
            {ordersLoading && (
              <div className="flex justify-center py-16">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-red border-t-transparent" />
              </div>
            )}

            {!ordersLoading && lookupMode && (
              <div className="mb-10">
                <p className="mb-4 text-sm text-white/50">
                  Enter the email you used to order and we&apos;ll find it for you.
                </p>
                <form onSubmit={handleEmailLookup} className="flex flex-col gap-4 sm:flex-row">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@email.com"
                    className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-brand-red/50"
                  />
                  <button
                    type="submit"
                    disabled={submitted}
                    className="cursor-pointer rounded-xl bg-brand-red px-8 py-3 text-sm font-bold uppercase tracking-[0.15em] text-white transition-all duration-300 hover:bg-red-700 hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                  >
                    {submitted ? "Searching..." : "Find Order"}
                  </button>
                </form>
                {lookupError && (
                  <p className="mt-3 text-sm text-red-400">{lookupError}</p>
                )}
              </div>
            )}

            {!ordersLoading && orders.length > 0 && (
              <div className="space-y-5">
                {orders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            )}

            {!ordersLoading && orders.length === 0 && !lookupMode && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center">
                <p className="text-sm text-white/50">No orders yet.</p>
                <Link
                  href="/menu"
                  className="mt-4 inline-block rounded-full bg-brand-red px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] text-white transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
                >
                  Order Now
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
