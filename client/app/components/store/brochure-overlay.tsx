// brochure-overlay.tsx
// Name and email capture for the franchise brochure. Nothing is sent here:
// the details go on to the franchise application, and the brochure is
// emailed once that application is submitted. Same overlay family as the
// franchise application and delivery popups: black panel, hairline border,
// circular close button, red accent, Korolev headings over Inter body.
"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useLocale } from "@/lib/i18n/locale-context";
import { lockBodyScroll, unlockBodyScroll } from "@/lib/body-scroll-lock";
import { useLenis } from "../providers/smooth-scroll";

const KOROLEV = "font-[family-name:var(--font-korolev),Korolev,sans-serif]";
const INTER = "font-[family-name:var(--font-inter),Inter,sans-serif]";

const INPUT_CLS =
  "w-full rounded-[10px] border border-[#2b2b2b] bg-[#161616] px-4 py-3.5 text-[15px] text-white outline-none transition-colors placeholder:text-[#6b6b6b] focus:border-[#FF0931]";

type Step = "name" | "email";

export default function BrochureOverlay({
  onClose,
  onDone,
}: {
  onClose: () => void;
  /** Called once both name and email are entered. */
  onDone: (details: { name: string; email: string }) => void;
}) {
  const { locale, t } = useLocale();
  const lenis = useLenis();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [step, setStep] = useState<Step>("name");
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const headingId = useId();

  useEffect(() => {
    lockBodyScroll({
      onStop: () => lenis?.stop(),
      onStart: () => lenis?.start(),
    });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const focusTimer = window.setTimeout(() => nameRef.current?.focus(), 120);
    return () => {
      unlockBodyScroll();
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(focusTimer);
    };
  }, [onClose, lenis]);

  useEffect(() => {
    if (step === "email") emailRef.current?.focus();
  }, [step]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (step === "name") {
      if (name.trim()) setStep("email");
      return;
    }
    if (email.trim()) onDone({ name: name.trim(), email: email.trim() });
  }

  const isArabic = locale === "ar";
  const dir = isArabic ? "rtl" : "ltr";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={headingId}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6"
    >
      <div
        className="overlay-backdrop-in absolute inset-0 bg-black/85"
        onClick={onClose}
        aria-hidden
      />

      <div
        data-lenis-prevent
        dir={dir}
        className="overlay-panel-in loc-scroll relative my-auto max-h-[92vh] w-full overflow-y-auto rounded-[20px] border border-[#242424] bg-black px-5 py-10 shadow-[0_20px_60px_rgba(0,0,0,0.7)] sm:max-w-[520px] sm:px-8 sm:py-12"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={t("brochure.close")}
          className="overlay-fade-in absolute end-4 top-4 flex size-9 cursor-pointer items-center justify-center rounded-full border border-[#2b2b2b] bg-[#161616] text-white transition-colors hover:border-[#FF0931] hover:bg-[#FF0931]"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>

        <>
            <span
              className={`overlay-fade-in inline-flex rounded-md bg-[#FF0931] px-5 py-2.5 uppercase text-white ${KOROLEV}`}
              style={{
                fontSize: "clamp(12px, 1.4vw, 15px)",
                fontWeight: 700,
                letterSpacing: "0.54px",
                lineHeight: "100%",
              }}
            >
              {t("franchise.brochure")}
            </span>

            <h2
              id={headingId}
              className={`overlay-fade-up stagger-1 m-0 mt-5 uppercase text-white ${KOROLEV}`}
              style={{
                fontSize: "clamp(28px, 5.5vw, 44px)",
                fontWeight: 900,
                lineHeight: "105%",
                letterSpacing: "0.54px",
              }}
            >
              {t("brochure.title")}
            </h2>

            <p
              className={`overlay-fade-up stagger-2 m-0 mt-4 text-[#8f8f8f] ${INTER}`}
              style={{
                fontSize: "clamp(13px, 1.6vw, 15px)",
                lineHeight: "160%",
              }}
            >
              {t("brochure.body")}
            </p>

            <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-4 sm:mt-8 sm:gap-5">
              {step === "name" ? (
                <div>
                  <label htmlFor="brochure-name" className={`mb-2 block text-[13px] font-semibold text-white ${INTER}`}>
                    {t("brochure.name")}
                    <span className="text-[#FF0931]"> *</span>
                  </label>
                  <input
                    ref={nameRef}
                    id="brochure-name"
                    name="name"
                    type="text"
                    required
                    maxLength={200}
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={INPUT_CLS}
                  />
                </div>
              ) : (
                <div className="overlay-fade-up">
                  <label htmlFor="brochure-email" className={`mb-2 block text-[13px] font-semibold text-white ${INTER}`}>
                    {t("brochure.email")}
                    <span className="text-[#FF0931]"> *</span>
                  </label>
                  <input
                    ref={emailRef}
                    id="brochure-email"
                    name="email"
                    type="email"
                    required
                    dir="ltr"
                    autoComplete="email"
                    placeholder="john@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={INPUT_CLS}
                  />
                  <button
                    type="button"
                    onClick={() => setStep("name")}
                    className={`mt-2 cursor-pointer text-[12px] text-[#8f8f8f] underline-offset-2 hover:text-white hover:underline ${INTER}`}
                  >
                    {t("brochure.changeName", { name: name.trim() })}
                  </button>
                </div>
              )}

              <button
                type="submit"
                className={`group mt-1 flex w-full items-center justify-center gap-3 rounded-[10px] px-6 py-4 uppercase text-white transition-colors cursor-pointer bg-[#FF0931] hover:bg-[#E0082C] ${KOROLEV}`}
                style={{ fontSize: "clamp(14px, 1.8vw, 16px)", fontWeight: 800, letterSpacing: "0.54px" }}
              >
                {step === "name" ? t("brochure.next") : t("brochure.submit")}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-5 w-5 shrink-0 transition-transform duration-200 group-hover:translate-y-0.5"
                  aria-hidden="true"
                >
                  <path
                    d="M12 3v13m0 0l-5-5m5 5l5-5M4 20h16"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              <p className={`m-0 text-center text-[11px] leading-[150%] text-[#6b6b6b] ${INTER}`}>
                {t("brochure.privacy")}
              </p>
            </form>
        </>
      </div>
    </div>
  );
}
