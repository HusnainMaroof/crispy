"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLenis } from "@/components/providers/smooth-scroll";
import { clearCart, removeItem, updateQuantity } from "@/lib/redux/slices/cartSlice";
import { fetchSettings } from "@/lib/redux/slices/settingsSlice";
import type { RootState, AppDispatch } from "@/lib/redux/store";

export default function CartPage() {
  const items = useSelector((state: RootState) => state.cart.items);
  const settings = useSelector((state: RootState) => state.settings.settings);
  const dispatch = useDispatch<AppDispatch>();
  const { scrollTo } = useLenis();

  useEffect(() => {
    if (!settings) dispatch(fetchSettings());
  }, [dispatch, settings]);

  const DELIVERY_FEE = settings?.delivery_fee ?? 2.99;
  const FREE_DELIVERY_THRESHOLD = settings?.free_delivery_threshold ?? 20;

  const [confirmingClear, setConfirmingClear] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [items],
  );
  const itemCount = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);
  const deliveryFee = subtotal >= FREE_DELIVERY_THRESHOLD || subtotal === 0 ? 0 : DELIVERY_FEE;
  const total = subtotal + deliveryFee;
  const remainingForFree = Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal);
  const pctToFreeDelivery = Math.min(100, (subtotal / FREE_DELIVERY_THRESHOLD) * 100);

  useGSAP(
    () => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce) return;

      gsap.from(".cart-title", { y: 24, opacity: 0, duration: 0.7, ease: "power3.out" });
      gsap.from(".cart-item-row", {
        y: 18,
        opacity: 0,
        duration: 0.4,
        stagger: 0.05,
        ease: "power2.out",
      });
      gsap.from(".summary-card", { x: 24, opacity: 0, duration: 0.6, ease: "power3.out", delay: 0.15 });
    },
    { scope: rootRef, dependencies: [items.length] },
  );

  // Scroll to top when last item removed (so empty state is visible)
  useEffect(() => {
    if (items.length === 0) scrollTo(0);
  }, [items.length, scrollTo]);

  const handleClear = () => {
    dispatch(clearCart());
    setConfirmingClear(false);
  };

  return (
    <div ref={rootRef} className="min-h-screen bg-black text-white">
      <section ref={topRef} className="px-6 pb-8 pt-28 md:px-16 md:pb-10 md:pt-32 lg:px-24">
        <p className="cart-title mb-3 text-[11px] font-bold uppercase tracking-[0.25em] text-white/40">
          Your order
        </p>
        <h1 className="cart-title font-[family-name:var(--font-bebas)] text-6xl uppercase leading-[0.85] text-white md:text-8xl lg:text-9xl">
          Cart.
        </h1>
      </section>

      <div className="px-6 md:px-16 lg:px-24">
        {items.length === 0 ? (
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
          <div className="grid grid-cols-1 gap-10 pb-16 lg:grid-cols-[1fr_380px] lg:gap-16">
            {/* Items */}
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
                    {/* Index dot */}
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/10 text-sm font-bold text-white/40">
                      {item.quantity}
                    </span>

                    {/* Name + unit price */}
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-semibold text-white">{item.name}</h3>
                      <p className="mt-0.5 text-xs text-white/40 tabular-nums">&pound;{item.price.toFixed(2)} each</p>
                    </div>

                    {/* Quantity stepper */}
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

                    {/* Line total */}
                    <div className="w-16 shrink-0 text-right text-sm font-bold tabular-nums text-white md:w-20 md:text-base">
                      &pound;{(item.price * item.quantity).toFixed(2)}
                    </div>

                    {/* Remove */}
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

              {/* Continue shopping */}
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
        )}
      </div>
    </div>
  );
}