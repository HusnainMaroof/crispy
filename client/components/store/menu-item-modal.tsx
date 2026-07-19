"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import gsap from "gsap";
import { type MenuItem } from "@/lib/redux/types";

interface MenuItemModalProps {
  item: MenuItem;
  onClose: () => void;
  onAdd: (quantity: number) => void;
}

export default function MenuItemModal({ item, onClose, onAdd }: MenuItemModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  // Esc to close + lock scroll handled by parent; keep a fallback key handler
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Entrance animation (resolved in CSS keyframes class for reduced-motion safety
  // is not available here; use GSAP but respect reduced motion)
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    if (backdropRef.current) {
      gsap.fromTo(
        backdropRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.3, ease: "power2.out" },
      );
    }
    if (modalRef.current) {
      gsap.fromTo(
        modalRef.current,
        { opacity: 0, y: 24, scale: 0.96 },
        { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: "expo.out" },
      );
    }
  }, []);

  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleAdd = () => {
    onAdd(quantity);
    setAdded(true);
    timerRef.current = window.setTimeout(onClose, 900);
  };

  const total = (item.priceValue * quantity).toFixed(2);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        ref={backdropRef}
        className="absolute inset-0 cursor-pointer bg-black/80 backdrop-blur-md"
        onClick={onClose}
        aria-hidden
      />

      {/* Modal — capped to viewport so it never pops off-screen */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label={`${item.name} order details`}
        className="relative z-10 flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#0a0a0a] shadow-2xl"
      >
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-20 grid h-10 w-10 place-items-center cursor-pointer rounded-full border border-white/15 bg-black/50 text-white/70 backdrop-blur-md transition-colors hover:bg-white/15 hover:text-white"
          aria-label="Close"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
            <line x1="6" y1="6" x2="18" y2="18" />
            <line x1="6" y1="18" x2="18" y2="6" />
          </svg>
        </button>

        {/* Image */}
        <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden sm:aspect-[2/1]">
          <Image
            src={item.image}
            alt={item.name}
            fill
            sizes="(max-width: 640px) 100vw, 672px"
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" aria-hidden />
          {item.badge && (
            <span
              className={`absolute left-4 top-4 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md ${
                item.badgeVariant === "vegan"
                  ? "border border-brand-red/40 bg-brand-red/15 text-brand-red"
                  : "border border-white/15 bg-black/50 text-white/80"
              }`}
            >
              {item.badge}
            </span>
          )}
        </div>

        {/* Body — scrolls independently, footer stays pinned */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-8">
          <div className="flex items-start justify-between gap-4">
            <h3 className="text-2xl font-bold leading-tight text-white md:text-3xl">{item.name}</h3>
            <span className="shrink-0 text-2xl font-bold text-brand-red">{item.price}</span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-white/50">{item.description}</p>

          {/* Quantity */}
          <div className="mt-7 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-widest text-white/40">Quantity</span>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="grid h-9 w-9 place-items-center cursor-pointer rounded-full border border-white/15 text-white/70 transition-colors hover:border-white/30 hover:text-white disabled:opacity-30"
                disabled={quantity <= 1}
                aria-label="Decrease quantity"
              >
                <span className="text-lg leading-none">−</span>
              </button>
              <span className="min-w-[2ch] text-center text-lg font-bold tabular-nums text-white">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(20, q + 1))}
                className="grid h-9 w-9 place-items-center cursor-pointer rounded-full border border-white/15 text-white/70 transition-colors hover:border-white/30 hover:text-white"
                aria-label="Increase quantity"
              >
                <span className="text-lg leading-none">+</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer / Add to cart */}
        <div className="shrink-0 border-t border-white/10 bg-black/40 px-5 py-4 sm:px-8">
          <button
            type="button"
            onClick={handleAdd}
            className="group relative w-full cursor-pointer overflow-hidden rounded-full bg-brand-red px-6 py-4 text-sm font-bold uppercase tracking-widest text-white shadow-[0_20px_60px_-15px_rgba(220,38,38,0.7)] transition-transform duration-300 hover:scale-[1.02] active:scale-95"
          >
            <span className="relative z-10 flex items-center justify-center gap-3">
              {added ? (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Added to cart
                </>
              ) : (
                <>
                  Add to cart · £{total}
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                </>
              )}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}