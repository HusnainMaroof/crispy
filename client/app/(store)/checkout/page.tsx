"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import Link from "next/link";
import { useMemo, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { clearCart } from "@/lib/redux/slices/cartSlice";
import { fetchSettings } from "@/lib/redux/slices/settingsSlice";
import { fetchLocations } from "@/lib/redux/slices/locationsSlice";
import type { RootState, AppDispatch } from "@/lib/redux/store";
import { api } from "@/lib/api";

type Fulfilment = "delivery" | "collection";
type PaymentMethod = "card" | "cash";

type FormState = {
  name: string;
  email: string;
  phone: string;
  address: string;
  postcode: string;
  city: string;
  notes: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

const initialForm: FormState = {
  name: "",
  email: "",
  phone: "",
  address: "",
  postcode: "",
  city: "",
  notes: "",
};

export default function CheckoutPage() {
  const items = useSelector((state: RootState) => state.cart.items);
  const settings = useSelector((state: RootState) => state.settings.settings);
  const locations = useSelector((state: RootState) => state.locations.locations);
  const dispatch = useDispatch<AppDispatch>();

  const [selectedLocationId, setSelectedLocationId] = useState<string>("");

  useEffect(() => {
    if (!settings) dispatch(fetchSettings());
    if (locations.length === 0) dispatch(fetchLocations());
  }, [dispatch, settings, locations.length]);

  useEffect(() => {
    api.get<{ id: string }>("/store/location").then((loc) => {
      if (loc?.id) setSelectedLocationId(loc.id);
    }).catch(() => {});
  }, []);

  const DELIVERY_FEE = settings?.delivery_fee ?? 2.99;
  const FREE_DELIVERY_THRESHOLD = settings?.free_delivery_threshold ?? 20;

  const rootRef = useRef<HTMLDivElement>(null);

  const [fulfilment, setFulfilment] = useState<Fulfilment>("delivery");
  const [payment, setPayment] = useState<PaymentMethod>("card");
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [items],
  );
  const deliveryFee =
    fulfilment === "collection" || subtotal >= FREE_DELIVERY_THRESHOLD || subtotal === 0
      ? 0
      : DELIVERY_FEE;
  const total = subtotal + deliveryFee;
  const itemCount = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);

  useGSAP(
    () => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce) return;

      gsap.from(".checkout-title", { y: 24, opacity: 0, duration: 0.7, ease: "power3.out" });
      gsap.from(".form-section", {
        y: 18,
        opacity: 0,
        duration: 0.5,
        stagger: 0.08,
        ease: "power2.out",
        delay: 0.1,
      });
      gsap.from(".summary-card", { x: 24, opacity: 0, duration: 0.6, ease: "power3.out", delay: 0.2 });
    },
    { scope: rootRef },
  );

  const updateField = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = (): FormErrors => {
    const e: FormErrors = {};
    if (!form.name.trim()) e.name = "Please enter your full name.";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Enter a valid email address.";
    if (!/^[0-9 +\-()]{7,}$/.test(form.phone)) e.phone = "Enter a valid phone number.";
    if (fulfilment === "delivery") {
      if (!form.address.trim()) e.address = "Delivery address is required.";
      if (!form.postcode.trim()) e.postcode = "Postcode is required.";
      if (!form.city.trim()) e.city = "City is required.";
    }
    return e;
  };

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) {
      const firstKey = Object.keys(e)[0] as keyof FormState;
      const el = document.getElementById(`field-${firstKey}`);
      el?.focus();
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setSubmitting(true);
    api.post("/orders", {
      customer_name: form.name,
      email: form.email,
      phone: form.phone,
      address: fulfilment === "delivery" ? form.address : null,
      postcode: fulfilment === "delivery" ? form.postcode : null,
      city: fulfilment === "delivery" ? form.city : null,
      location_id: selectedLocationId || null,
      notes: form.notes || null,
      fulfilment,
      payment_method: payment,
      subtotal,
      delivery_fee: deliveryFee,
      total,
      items: items.map((i) => ({
        menu_item_id: i.id,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
      })),
    }).then(() => {
      setOrderComplete(true);
      dispatch(clearCart());
    }).catch(() => {
      setSubmitting(false);
      setErrors((p) => ({ ...p, name: "Something went wrong placing your order. Please try again." }));
    });
  };

  // Order complete view
  if (orderComplete) {
    return (
      <div ref={rootRef} className="min-h-screen bg-black text-white">
        <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-24 text-center md:px-16 lg:px-24">
          <div className="grid h-20 w-20 place-items-center rounded-full border border-brand-red/40 bg-brand-red/10 text-brand-red">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <p className="checkout-title mt-8 text-[11px] font-bold uppercase tracking-[0.3em] text-brand-red">
            Order confirmed
          </p>
          <h1 className="checkout-title mt-4 font-[family-name:var(--font-bebas)] text-6xl uppercase leading-[0.85] text-white md:text-7xl">
            You&apos;re sorted.
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-white/50">
            Thanks for your order. We&apos;ve sent a confirmation to your email.
            {fulfilment === "delivery"
              ? " Your food will arrive hot, fresh, and crispy."
              : " Pop in at your chosen time and we&apos;ll have it ready."}
          </p>
          <Link
            href="/"
            className="group mt-10 inline-flex items-center gap-3 rounded-full bg-brand-red px-7 py-4 text-xs font-bold uppercase tracking-widest text-white shadow-[0_20px_60px_-15px_rgba(220,38,38,0.7)] transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
          >
            Back to home
            <span className="transition-transform group-hover:translate-x-1">&rarr;</span>
          </Link>
        </div>
      </div>
    );
  }

  // Empty cart guard
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-24 text-center">
          <p className="font-[family-name:var(--font-bebas)] text-5xl uppercase text-white/30 md:text-6xl">
            Nothing to check out
          </p>
          <p className="mt-3 max-w-sm text-sm text-white/50">
            Your cart is empty. Add a few items first, then come back here.
          </p>
          <Link
            href="/menu"
            className="group mt-8 inline-flex items-center gap-3 rounded-full bg-brand-red px-7 py-4 text-xs font-bold uppercase tracking-widest text-white transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
          >
            Browse the menu
            <span className="transition-transform group-hover:translate-x-1">&rarr;</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div ref={rootRef} className="min-h-screen bg-black text-white">
      <section className="px-6 pb-8 pt-28 md:px-16 md:pb-10 md:pt-32 lg:px-24">
        <p className="checkout-title mb-3 text-[11px] font-bold uppercase tracking-[0.25em] text-white/40">
          Almost there
        </p>
        <h1 className="checkout-title font-[family-name:var(--font-bebas)] text-6xl uppercase leading-[0.85] text-white md:text-8xl lg:text-9xl">
          Checkout.
        </h1>
      </section>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 gap-10 px-6 pb-16 md:px-16 lg:grid-cols-[1fr_380px] lg:gap-16 lg:px-24"
        noValidate
      >
        {/* Left — form sections */}
        <div className="space-y-10">
          {/* Fulfilment toggle */}
          <fieldset className="form-section">
            <legend className="mb-3 text-[11px] font-bold uppercase tracking-widest text-white/40">
              How do you want it?
            </legend>
            <div className="grid grid-cols-2 gap-3">
              {(["delivery", "collection"] as const).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    setFulfilment(opt);
                    if (opt === "collection") {
                      setErrors((p) => ({ ...p, address: undefined, postcode: undefined, city: undefined }));
                    }
                  }}
                  aria-pressed={fulfilment === opt}
                  className={`flex cursor-pointer items-center justify-center gap-2 rounded-2xl border px-4 py-4 text-xs font-bold uppercase tracking-widest transition-all duration-200 ${
                    fulfilment === opt
                      ? "border-brand-red bg-brand-red text-white"
                      : "border-white/15 bg-white/[0.02] text-white/60 hover:border-white/30 hover:text-white active:scale-95"
                  }`}
                >
                  {opt === "delivery" ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <rect x="1" y="3" width="15" height="13" rx="1" />
                      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                      <circle cx="5.5" cy="18.5" r="2.5" />
                      <circle cx="18.5" cy="18.5" r="2.5" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                  )}
                  {opt === "delivery" ? "Delivery" : "Collection"}
                </button>
              ))}
            </div>
          </fieldset>

          {/* Location selector */}
          <fieldset className="form-section">
            <legend className="mb-4 text-[11px] font-bold uppercase tracking-widest text-white/40">
              Choose a location
            </legend>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {locations.map((loc) => (
                <button
                  key={loc.id}
                  type="button"
                  onClick={() => {
                    setSelectedLocationId(loc.id);
                    api.patch("/store/location", { location_id: loc.id }).catch(() => {});
                  }}
                  aria-pressed={selectedLocationId === loc.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-left text-xs font-bold uppercase tracking-widest transition-all duration-200 ${
                    selectedLocationId === loc.id
                      ? "border-brand-red bg-brand-red text-white"
                      : "border-white/15 bg-white/[0.02] text-white/60 hover:border-white/30 hover:text-white active:scale-95"
                  }`}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="shrink-0">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <span className="truncate">{loc.name.replace("Crispies ", "")}</span>
                </button>
              ))}
            </div>
            {locations.length === 0 && (
              <p className="text-[11px] text-white/40">Loading locations…</p>
            )}
          </fieldset>

          {/* Contact details */}
          <fieldset className="form-section">
            <legend className="mb-4 text-[11px] font-bold uppercase tracking-widest text-white/40">
              Contact details
            </legend>
            <div className="space-y-5">
              <Field
                id="field-name"
                label="Full name"
                value={form.name}
                onChange={(v) => updateField("name", v)}
                error={errors.name}
                autoComplete="name"
                required
              />
              <Field
                id="field-email"
                label="Email address"
                type="email"
                value={form.email}
                onChange={(v) => updateField("email", v)}
                error={errors.email}
                autoComplete="email"
                required
              />
              <Field
                id="field-phone"
                label="Phone number"
                type="tel"
                value={form.phone}
                onChange={(v) => updateField("phone", v)}
                error={errors.phone}
                autoComplete="tel"
                required
              />
            </div>
          </fieldset>

          {/* Delivery address (conditional) */}
          {fulfilment === "delivery" && (
            <fieldset className="form-section">
              <legend className="mb-4 text-[11px] font-bold uppercase tracking-widest text-white/40">
                Delivery address
              </legend>
              <div className="space-y-5">
                <Field
                  id="field-address"
                  label="Street address"
                  value={form.address}
                  onChange={(v) => updateField("address", v)}
                  error={errors.address}
                  autoComplete="street-address"
                  required
                />
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <Field
                    id="field-postcode"
                    label="Postcode"
                    value={form.postcode}
                    onChange={(v) => updateField("postcode", v)}
                    error={errors.postcode}
                    autoComplete="postal-code"
                    required
                  />
                  <Field
                    id="field-city"
                    label="City"
                    value={form.city}
                    onChange={(v) => updateField("city", v)}
                    error={errors.city}
                    autoComplete="address-level2"
                    required
                  />
                </div>
              </div>
            </fieldset>
          )}

          {/* Order notes */}
          <fieldset className="form-section">
            <legend className="mb-4 text-[11px] font-bold uppercase tracking-widest text-white/40">
              Order notes <span className="normal-case text-white/25">(optional)</span>
            </legend>
            <textarea
              id="field-notes"
              rows={3}
              value={form.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              placeholder="E.g. ring the bell, leave at the door, no onions…"
              className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none transition-colors duration-200 focus:border-brand-red/60 focus:bg-white/[0.05]"
            />
          </fieldset>

          {/* Payment method */}
          <fieldset className="form-section">
            <legend className="mb-4 text-[11px] font-bold uppercase tracking-widest text-white/40">
              Payment method
            </legend>
            <div className="grid grid-cols-2 gap-3">
              {(["card", "cash"] as const).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPayment(method)}
                  aria-pressed={payment === method}
                  className={`flex cursor-pointer items-center justify-center gap-2 rounded-2xl border px-4 py-4 text-xs font-bold uppercase tracking-widest transition-all duration-200 ${
                    payment === method
                      ? "border-brand-red bg-brand-red text-white"
                      : "border-white/15 bg-white/[0.02] text-white/60 hover:border-white/30 hover:text-white active:scale-95"
                  }`}
                >
                  {method === "card" ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                      <line x1="1" y1="10" x2="23" y2="10" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <rect x="2" y="6" width="20" height="12" rx="1" />
                      <circle cx="12" cy="12" r="2.5" />
                    </svg>
                  )}
                  {method === "card" ? "Card" : "Cash"}
                </button>
              ))}
            </div>
            {payment === "card" && (
              <p className="mt-3 text-[10px] uppercase tracking-widest text-white/30">
                You&apos;ll enter card details on the next step after placing the order.
              </p>
            )}
          </fieldset>
        </div>

        {/* Right — order summary */}
        <aside className="summary-card lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 md:p-8">
            <div className="flex items-center justify-between">
              <h2 className="font-[family-name:var(--font-bebas)] text-3xl uppercase leading-none text-white">
                Your order
              </h2>
              <span className="text-xs font-semibold uppercase tracking-widest text-white/40">
                {itemCount} {itemCount === 1 ? "item" : "items"}
              </span>
            </div>

            {/* Item list (compact) */}
            <ul className="mt-5 max-h-64 space-y-3 overflow-y-auto pr-1">
              {items.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex min-w-0 items-center gap-2.5">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-white/10 text-[11px] font-bold text-white/40">
                      {item.quantity}
                    </span>
                    <span className="truncate text-white/80">{item.name}</span>
                  </span>
                  <span className="shrink-0 font-medium tabular-nums text-white/60">
                    &pound;{(item.price * item.quantity).toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="my-5 h-px w-full bg-white/10" aria-hidden />

            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-white/50">Subtotal</dt>
                <dd className="font-semibold tabular-nums text-white">&pound;{subtotal.toFixed(2)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-white/50">{fulfilment === "collection" ? "Collection" : "Delivery"}</dt>
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

            {/* Place order */}
            <button
              type="submit"
              disabled={submitting}
              className="group mt-8 flex w-full cursor-pointer items-center justify-center gap-3 rounded-full bg-brand-red px-6 py-4 text-xs font-bold uppercase tracking-widest text-white shadow-[0_20px_60px_-15px_rgba(220,38,38,0.7)] transition-all duration-300 hover:scale-[1.02] active:scale-95 disabled:scale-100 disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  Placing order…
                </>
              ) : (
                <>
                  Place order &middot; &pound;{total.toFixed(2)}
                  <span className="transition-transform group-hover:translate-x-1">&rarr;</span>
                </>
              )}
            </button>

            <p className="mt-4 flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest text-white/30">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Secure checkout
            </p>
          </div>
        </aside>
      </form>
    </div>
  );
}

/* ---------- Reusable field ---------- */

type FieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  error?: string;
  autoComplete?: string;
  required?: boolean;
};

function Field({ id, label, value, onChange, type = "text", error, autoComplete, required }: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-white/50">
        {label} {required && <span className="text-brand-red" aria-hidden>*</span>}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`h-12 w-full rounded-2xl border bg-white/[0.03] px-4 text-sm text-white placeholder:text-white/30 outline-none transition-colors duration-200 focus:bg-white/[0.05] ${
          error
            ? "border-brand-red/70 focus:border-brand-red"
            : "border-white/10 focus:border-brand-red/60"
        }`}
      />
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1.5 flex items-center gap-1.5 text-[11px] font-medium text-brand-red">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}