"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/i18n";
import { useLocale } from "@/lib/i18n/locale-context";
import { clearCart } from "@/lib/redux/slices/cartSlice";
import type { AppDispatch, RootState } from "@/lib/redux/store";
import { useStoreLocations } from "@/lib/use-store-locations";

type Quote = {
  locationId: string;
  items: { kind: string; id: string; name: string; quantity: number; unitPrice: number; lineTotal: number }[];
  subtotal: number;
  total: number;
};

type CreatedOrder = {
  id: number;
  status: string;
  fulfilment: string;
  location_id: string | null;
  subtotal: number;
  delivery_fee: number;
  total: number;
  items: { name: string; quantity: number; price: number; kind: string }[];
};

const KEY = "crispies_checkout_key";

function checkoutKey() {
  const existing = sessionStorage.getItem(KEY);
  if (existing) return existing;
  const next = crypto.randomUUID();
  sessionStorage.setItem(KEY, next);
  return next;
}

export default function CheckoutPage() {
  const dispatch = useDispatch<AppDispatch>();
  const cart = useSelector((state: RootState) => state.cart);
  useStoreLocations();
  const locations = useSelector((state: RootState) => state.locations.locations);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteError, setQuoteError] = useState("");
  const [order, setOrder] = useState<CreatedOrder | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [fulfilment, setFulfilment] = useState<"collection" | "delivery">("collection");
  const [payment, setPayment] = useState<"cash" | "card">("cash");
  const [form, setForm] = useState({ customer_name: "", email: "", phone: "", address: "", postcode: "", city: "", notes: "" });
  const { locale, t } = useLocale();

  useEffect(() => {
    if (!cart.locationId || cart.items.length === 0) return;
    let cancelled = false;
    api.post<Quote>("/menu/quote", {
      locationId: cart.locationId,
      items: cart.items.map((item) => ({ kind: item.kind, id: item.id, quantity: item.quantity })),
    }).then((data) => {
      if (!cancelled) {
        setQuote(data);
        setQuoteError("");
      }
    }).catch((err: Error) => {
      if (!cancelled) {
        setQuote(null);
        setQuoteError(err.message);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [cart]);

  const branchName = locations.find((location) => location.id === cart.locationId)?.name ?? "Selected branch";

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!cart.locationId || !quote) return;
    setSubmitting(true);
    setError("");
    try {
      const created = await api.post<CreatedOrder>("/orders", {
        ...form,
        fulfilment,
        payment_method: payment,
        location_id: cart.locationId,
        checkout_key: checkoutKey(),
        items: cart.items.map((item) => ({ kind: item.kind, id: item.id, quantity: item.quantity })),
      });
      setOrder(created);
      dispatch(clearCart());
      sessionStorage.removeItem(KEY);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (order) {
    return (
      <main className="min-h-screen bg-black px-4 py-16 text-white">
        <div className="mx-auto max-w-lg">
          <h1 className="font-[family-name:var(--font-korolev),Korolev,sans-serif] text-5xl uppercase">{t("checkout.placed")}</h1>
          <p className="mt-4 text-sm text-white/60">Order #{order.id} is {t(`status.${order.status}`)}.</p>
          <p className="mt-6 text-sm">Branch {branchName}</p>
          <p className="text-sm capitalize">{order.fulfilment}</p>
          <ul className="mt-6 space-y-2 text-sm">
            {order.items.map((item) => (
              <li key={`${item.kind}-${item.name}`} className="flex justify-between gap-4">
                <span>{item.quantity} x {item.name}</span>
                <span>{formatCurrency(Number(item.price), locale)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-lg">{t("checkout.total")} {formatCurrency(Number(order.total), locale)}</p>
          <a href={`/orders/${order.id}`} className="mt-6 inline-block text-sm text-[#FF0931]">{t("checkout.view")}</a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black px-4 py-16 text-white">
      <form onSubmit={(event) => void submit(event)} className="mx-auto flex max-w-lg flex-col gap-4">
        <h1 className="font-[family-name:var(--font-korolev),Korolev,sans-serif] text-5xl uppercase">{t("checkout.title")}</h1>
        <p className="text-sm text-white/60">{branchName}. Totals below come from the server.</p>
        {quoteError && <p className="text-sm text-[#FF0931]">{quoteError}</p>}
        {error && <p className="text-sm text-[#FF0931]">{error}</p>}
        <label className="text-xs uppercase tracking-widest text-white/50">Name
          <input required value={form.customer_name} onChange={(event) => setForm({ ...form, customer_name: event.target.value })} className="mt-1 h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white" />
        </label>
        <label className="text-xs uppercase tracking-widest text-white/50">Email
          <input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="mt-1 h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white" />
        </label>
        <label className="text-xs uppercase tracking-widest text-white/50">Phone
          <input required value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className="mt-1 h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white" />
        </label>
        <label className="text-xs uppercase tracking-widest text-white/50">Fulfilment
          <select value={fulfilment} onChange={(event) => setFulfilment(event.target.value as "collection" | "delivery")} className="mt-1 h-12 w-full rounded-2xl border border-white/10 bg-black px-4 text-sm">
            <option value="collection">Collection</option>
            <option value="delivery">Delivery</option>
          </select>
        </label>
        {fulfilment === "delivery" && (
          <>
            <input required placeholder="Address" value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} className="h-12 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm" />
            <input required placeholder="Postcode" value={form.postcode} onChange={(event) => setForm({ ...form, postcode: event.target.value })} className="h-12 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm" />
            <input required placeholder="City" value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} className="h-12 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm" />
          </>
        )}
        <label className="text-xs uppercase tracking-widest text-white/50">Payment label
          <select value={payment} onChange={(event) => setPayment(event.target.value as "cash" | "card")} className="mt-1 h-12 w-full rounded-2xl border border-white/10 bg-black px-4 text-sm">
            <option value="cash">Cash</option>
            <option value="card">Card</option>
          </select>
        </label>
        <textarea placeholder="Notes" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} className="min-h-24 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm" />
        <ul className="space-y-2 text-sm">
          {(quote?.items ?? []).map((item) => (
            <li key={`${item.kind}-${item.id}`} className="flex justify-between">
              <span>{item.quantity} x {item.name}</span>
              <span>{formatCurrency(item.lineTotal, locale)}</span>
            </li>
          ))}
        </ul>
        <p className="text-lg">{quote ? `${t("checkout.total")} ${formatCurrency(quote.total, locale)}` : t("checkout.waiting")}</p>
        <button type="submit" disabled={!quote || submitting || !cart.locationId} className="cursor-pointer rounded-full bg-[#FF0931] py-4 text-xs font-bold uppercase tracking-widest disabled:opacity-50">
          {submitting ? "Placing order..." : "Place order"}
        </button>
      </form>
    </main>
  );
}
