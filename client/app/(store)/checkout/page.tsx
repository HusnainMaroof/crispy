"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/i18n";
import { useLocale } from "@/lib/i18n/locale-context";
import { clearCart } from "@/lib/redux/slices/cartSlice";
import type { AppDispatch, RootState } from "@/lib/redux/store";
import { useStoreLocations } from "@/lib/use-store-locations";
import { useStoreOrdering } from "@/lib/use-store-ordering";

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
  const router = useRouter();
  const { resolveOrdering } = useStoreOrdering();
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

  // Redirect system: orders go to the external apps, so on-site checkout is
  // closed. Hold the page blank until the published mode is known, otherwise the
  // form flashes on screen for anyone who arrives on a stale cart.
  const [modeChecked, setModeChecked] = useState(false);
  useEffect(() => {
    let active = true;
    void resolveOrdering().then((resolved) => {
      if (!active) return;
      if (resolved.mode === "redirect") {
        dispatch(clearCart());
        router.replace("/menu");
        return;
      }
      setModeChecked(true);
    });
    return () => {
      active = false;
    };
  }, [resolveOrdering, router, dispatch]);

  useEffect(() => {
    if (!modeChecked) return;
    if (!cart.locationId || cart.items.length === 0) return;
    let cancelled = false;
    api.post<Quote>("/menu/quote", {
      locationId: cart.locationId,
      locale,
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
  }, [cart, locale, modeChecked]);

  const branchName = locations.find((location) => location.id === cart.locationId)?.name ?? t("checkout.branchFallback");

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
        locale,
        items: cart.items.map((item) => ({ kind: item.kind, id: item.id, quantity: item.quantity })),
      });
      setOrder(created);
      dispatch(clearCart());
      sessionStorage.removeItem(KEY);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("error.generic"));
    } finally {
      setSubmitting(false);
    }
  };

  if (!modeChecked) return null;

  if (order) {
    return (
      <main className="min-h-screen bg-black px-4 py-16 text-white">
        <div className="mx-auto max-w-lg">
          <h1 className="font-[family-name:var(--font-korolev),Korolev,sans-serif] text-5xl uppercase">{t("checkout.placed")}</h1>
          <p className="mt-4 text-sm text-white/60">{t("order.statusLine", { id: order.id, status: t(`status.${order.status}`) })}</p>
          <p className="mt-6 text-sm">{t("checkout.branch", { name: branchName })}</p>
          <p className="text-sm">{t(`checkout.${order.fulfilment}`)}</p>
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
        <p className="text-sm text-white/60">{t("checkout.branch", { name: branchName })}. {t("checkout.quoteNote")}</p>
        {quoteError && <p className="text-sm text-[#FF0931]">{quoteError}</p>}
        {error && <p className="text-sm text-[#FF0931]">{error}</p>}
        <label className="text-xs uppercase tracking-widest text-white/50">{t("checkout.name")}
          <input required value={form.customer_name} onChange={(event) => setForm({ ...form, customer_name: event.target.value })} className="mt-1 h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white" />
        </label>
        <label className="text-xs uppercase tracking-widest text-white/50">{t("checkout.email")}
          <input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="mt-1 h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white" />
        </label>
        <label className="text-xs uppercase tracking-widest text-white/50">{t("checkout.phone")}
          <input required value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className="mt-1 h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white" />
        </label>
        <label className="text-xs uppercase tracking-widest text-white/50">{t("checkout.fulfilment")}
          <select value={fulfilment} onChange={(event) => setFulfilment(event.target.value as "collection" | "delivery")} className="mt-1 h-12 w-full rounded-2xl border border-white/10 bg-black px-4 text-sm">
            <option value="collection">{t("checkout.collection")}</option>
            <option value="delivery">{t("checkout.delivery")}</option>
          </select>
        </label>
        {fulfilment === "delivery" && (
          <>
            <input required placeholder={t("checkout.address")} value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} className="h-12 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm" />
            <input required placeholder={t("checkout.postcode")} value={form.postcode} onChange={(event) => setForm({ ...form, postcode: event.target.value })} className="h-12 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm" />
            <input required placeholder={t("checkout.city")} value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} className="h-12 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm" />
          </>
        )}
        <label className="text-xs uppercase tracking-widest text-white/50">{t("checkout.payment")}
          <select value={payment} onChange={(event) => setPayment(event.target.value as "cash" | "card")} className="mt-1 h-12 w-full rounded-2xl border border-white/10 bg-black px-4 text-sm">
            <option value="cash">{t("checkout.cash")}</option>
            <option value="card">{t("checkout.card")}</option>
          </select>
        </label>
        <textarea placeholder={t("checkout.notes")} value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} className="min-h-24 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm" />
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
          {submitting ? t("checkout.placing") : t("checkout.save")}
        </button>
      </form>
    </main>
  );
}
