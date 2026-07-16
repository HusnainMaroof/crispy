"use client";

import { useEffect, useRef } from "react";

interface ModalProps {
  children: React.ReactNode;
  onClose: () => void;
  title: string;
}

export default function Modal({ children, onClose, title }: ModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 cursor-pointer admin-fade-in"
      onClick={(e) => {
        if (e.target === backdropRef.current) onClose();
      }}
    >
      <div className="w-full max-w-lg rounded-xl border border-white/10 bg-black p-6 admin-scale-in">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-xl tracking-wide text-white">{title}</h2>
          <button
            onClick={onClose}
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
