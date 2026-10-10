"use client";
import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { lockBodyScroll, unlockBodyScroll } from "@/lib/body-scroll-lock";

export default function Modal({ children, onClose, title, busy = false, size = "default" }: { children: React.ReactNode; onClose: () => void; title: string; busy?: boolean; size?: "default" | "wide" }) {
  const id = useId();
  const content = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  const busyRef = useRef(busy);
  useEffect(() => { close.current = onClose; busyRef.current = busy; }, [onClose, busy]);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    lockBodyScroll();
    (content.current?.querySelector<HTMLElement>("input:not([disabled])") ?? content.current?.querySelector<HTMLElement>("button:not([disabled])"))?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if ((event.target as HTMLElement)?.closest("[data-radix-popper-content-wrapper]")) return;
      if (event.key === "Escape" && !event.defaultPrevented && !busyRef.current) { event.preventDefault(); close.current(); }
      if (event.key !== "Tab") return;
      const elements = Array.from(content.current?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex="0"]') ?? []).filter((element) => element.getClientRects().length > 0);
      const first = elements[0]; const last = elements[elements.length - 1];
      if (!first) { event.preventDefault(); content.current?.focus(); }
      else if (event.shiftKey && (document.activeElement === first || !content.current?.contains(document.activeElement))) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || !content.current?.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", handleKey);
    return () => { document.removeEventListener("keydown", handleKey); unlockBodyScroll(); previous?.focus(); };
  }, []);
  return createPortal(<div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm sm:p-6" onClick={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }}>
    <div ref={content} role="dialog" aria-modal="true" aria-labelledby={id} aria-busy={busy} tabIndex={-1} className={`flex max-h-[90dvh] w-full flex-col overflow-hidden rounded-2xl border border-white/15 bg-[#0b0b0b] text-white shadow-2xl ${size === "wide" ? "max-w-3xl" : "max-w-xl"}`}>
      <div className="flex shrink-0 items-center justify-between gap-4 border-b border-white/10 px-6 py-5"><h2 id={id} className="font-display text-2xl tracking-wide">{title}</h2><button type="button" aria-label="Close dialog" disabled={busy} onClick={onClose} className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg text-white/60 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-brand-red disabled:opacity-30"><X className="h-5 w-5" /></button></div>
      <div className="overflow-y-auto overscroll-contain p-6">{children}</div>
    </div>
  </div>, document.body);
}
