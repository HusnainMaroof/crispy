"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useScrollReveal } from "@/lib/use-scroll-reveal";
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
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
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

      {/* Status progress */}
      {!cancelled && (
        <div className="mb-4 flex items-center gap-1">
          {STATUS_ORDER.map((s, i) => (
            <div key={s} className="flex items-center gap-1 flex-1">
              <div
                className={`h-1.5 rounded-full transition-colors duration-300 flex-1 ${
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

export default function TrackPage() {
  const pageRef = useScrollReveal();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [lookupError, setLookupError] = useState("");
  const [lookupMode, setLookupMode] = useState(false);

  // On mount, try cookie-based auto-load
  useEffect(() => {
    (async () => {
      try {
        const data = await api.get<Order[]>("/orders/mine");
        setOrders(data ?? []);
        if (data && data.length > 0) {
          setLookupMode(false);
        } else {
          setLookupMode(true);
        }
      } catch {
        setLookupMode(true);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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

  return (
    <div ref={pageRef} className="min-h-screen bg-black">
      <section className="relative flex flex-col items-center justify-center px-6 pt-32 pb-16 text-center">
        <h1 className="font-[family-name:var(--font-bebas)] text-[clamp(3rem,8vw,7rem)] leading-none tracking-[0.04em] text-white">
          Track Your Order
        </h1>
        <p className="mt-6 max-w-lg text-lg leading-relaxed text-white/60">
          {lookupMode
            ? "Enter the email you used to order and we&apos;ll find it for you."
            : "Your recent orders are listed below."}
        </p>
      </section>

      <section className="mx-auto max-w-2xl px-6 pb-24">
        {loading && (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-red border-t-transparent" />
          </div>
        )}

        {!loading && lookupMode && (
          <div className="fade-up mb-12">
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

        {!loading && orders.length > 0 && (
          <div className="space-y-6">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}

        {!loading && orders.length === 0 && !lookupMode && (
          <div className="fade-up rounded-2xl border border-white/10 bg-white/5 p-12 text-center">
            <p className="text-sm text-white/50">No orders yet.</p>
            <a
              href="/menu"
              className="mt-4 inline-block rounded-full bg-brand-red px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] text-white transition-all duration-300 hover:scale-105 active:scale-95"
            >
              Order Now
            </a>
          </div>
        )}
      </section>
    </div>
  );
}
