"use client";

import { useState } from "react";

const CONSENT_COOKIE = "crispy_cookie_consent";
const CONSENT_MAX_AGE = 365 * 24 * 60 * 60; // 1 year

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name: string, value: string, maxAge: number) {
  document.cookie = `${name}=${encodeURIComponent(value)}; max-age=${maxAge}; path=/; SameSite=Lax`;
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(() => !getCookie(CONSENT_COOKIE));

  const accept = () => {
    setCookie(CONSENT_COOKIE, "accepted", CONSENT_MAX_AGE);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[80] p-4 sm:p-5">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 rounded-2xl border border-white/10 bg-[#0d0d0d]/95 px-6 py-5 backdrop-blur-xl sm:flex-row sm:justify-between">
        <div className="max-w-xl text-center sm:text-left">
          <p className="text-[13px] leading-relaxed text-white/70">
            We use cookies to enhance your experience, remember your cart, and
            track anonymous order history. By clicking &quot;Accept&quot;, you
            consent to our use of cookies.
          </p>
          <p className="mt-1.5 text-[11px] text-white/35">
            Essential cookies (cart, order tracking) are always active.
          </p>
        </div>
        <button
          onClick={accept}
          className="shrink-0 rounded-full bg-brand-red px-6 py-2.5 text-[11px] font-bold uppercase tracking-[0.15em] text-white transition-transform duration-300 hover:scale-105 active:scale-95"
        >
          Accept
        </button>
      </div>
    </div>
  );
}
