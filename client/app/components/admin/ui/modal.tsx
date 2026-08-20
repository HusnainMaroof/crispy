"use client";

import { useEffect, useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

gsap.registerPlugin(useGSAP);

type GsapTimeline = ReturnType<typeof gsap.timeline>;

interface ModalProps {
  children: React.ReactNode;
  onClose: () => void;
  title: string;
}

export default function Modal({ children, onClose, title }: ModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const openTl = useRef<GsapTimeline | null>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  useGSAP(() => {
    openTl.current = gsap.timeline();
    openTl.current
      .from(backdropRef.current, { autoAlpha: 0, duration: 0.25, ease: "power2.out" })
      .from(
        contentRef.current,
        { y: 20, autoAlpha: 0, scale: 0.96, duration: 0.3, ease: "back.out(1.7)" },
        "-=0.15",
      );
  }, { scope: backdropRef });

  const handleClose = () => {
    const tl = gsap.timeline({ onComplete: onClose });
    tl.to(contentRef.current, { y: 10, autoAlpha: 0, scale: 0.97, duration: 0.2, ease: "power2.in" });
    tl.to(backdropRef.current, { autoAlpha: 0, duration: 0.15, ease: "power2.in" }, "-=0.1");
  };

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 cursor-pointer"
      onClick={(e) => {
        if (e.target === backdropRef.current) handleClose();
      }}
    >
      <div ref={contentRef} className="w-full max-w-lg rounded-xl border border-white/10 bg-black p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-xl tracking-wide text-white">{title}</h2>
          <button
            onClick={handleClose}
            className="cursor-pointer rounded-lg p-2 text-white/50 transition-colors hover:bg-white/5 hover:text-white"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
