// brochure-overlay.tsx
// Franchise email verification popup. One panel, four steps:
//   1. name   -> kept with the rest of the progress
//   2. email  -> the server emails a 4-digit code
//   3. code   -> the server checks it and returns a short-lived token
//   4. choose -> Download Brochure or Submit Form, both need that token
// Codes are created and checked on the server only.
//
// Layout: all three steps sit in the same grid cell, and only the active one
// is visible. The panel is therefore exactly as tall as the tallest step and
// keeps that size, without a fixed height that leaves empty space.
//
// State: where the visitor is up to (email, code sent, verified token) lives in
// the parent as `session` and is saved to sessionStorage, so closing the popup
// or reloading resumes at the right step. Typing state stays local.
"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useLocale } from "@/lib/i18n/locale-context";
import { lockBodyScroll, unlockBodyScroll } from "@/lib/body-scroll-lock";
import type { VerifySession } from "@/lib/franchise-verification";
import { useLenis } from "../providers/smooth-scroll";

const KOROLEV = "font-[family-name:var(--font-korolev),Korolev,sans-serif]";
const INTER = "font-[family-name:var(--font-inter),Inter,sans-serif]";

const INPUT_CLS =
  "w-full rounded-[10px] border border-[#2b2b2b] bg-[#161616] px-4 py-3.5 text-[15px] text-white outline-none transition-colors placeholder:text-[#6b6b6b] focus:border-[#FF0931]";
const PRIMARY_BTN = `group flex w-full items-center justify-center gap-3 rounded-[10px] px-6 py-4 uppercase text-white transition-colors cursor-pointer bg-[#FF0931] hover:bg-[#E0082C] disabled:cursor-not-allowed disabled:opacity-60 ${KOROLEV}`;
const BTN_STYLE = { fontSize: "clamp(14px, 1.8vw, 16px)", fontWeight: 800, letterSpacing: "0.54px" } as const;
const LINK_BTN = `cursor-pointer text-[13px] text-[#8f8f8f] underline-offset-2 transition-colors hover:text-white hover:underline disabled:cursor-default disabled:no-underline disabled:hover:text-[#8f8f8f] ${INTER}`;
const TITLE_STYLE = { fontSize: "clamp(28px, 5.5vw, 44px)", fontWeight: 900, lineHeight: "105%", letterSpacing: "0.54px" } as const;
const BODY_STYLE = { fontSize: "clamp(13px, 1.6vw, 15px)", lineHeight: "160%" } as const;

type Step = "name" | "email" | "code" | "choose";
const STEPS: Step[] = ["name", "email", "code", "choose"];
const CODE_LENGTH = 4;
const EMPTY_CODE = () => Array<string>(CODE_LENGTH).fill("");

type Envelope<T> = { success?: boolean; data?: T };

async function postJson<T>(path: string, body: unknown): Promise<{ ok: boolean; status: number; data?: T }> {
  try {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = (await res.json().catch(() => null)) as Envelope<T> | null;
    return { ok: res.ok && json?.success === true, status: res.status, data: json?.data };
  } catch {
    return { ok: false, status: 0 };
  }
}

function minutesFromNow(minutes: number): number {
  return Date.now() + minutes * 60_000;
}

function stepFor(session: VerifySession | null): Step {
  if (session?.stage === "verified") return "choose";
  if (session?.stage === "code") return "code";
  if (session?.stage === "email") return "email";
  return "name";
}

export default function BrochureOverlay({
  session,
  onSessionChange,
  onClose,
  onApply,
}: {
  /** Saved progress from the parent. Decides which step the popup opens on. */
  session: VerifySession | null;
  onSessionChange: (next: VerifySession | null) => void;
  onClose: () => void;
  /** Submit Form was picked. The parent opens the form with the verified session. */
  onApply: () => void;
}) {
  const { locale, t } = useLocale();
  const lenis = useLenis();
  const headingId = useId();

  const [step, setStep] = useState<Step>(() => stepFor(session));
  const [name, setName] = useState(session?.name ?? "");
  const [email, setEmail] = useState(session && session.stage !== "email" ? session.email : "");
  const [digits, setDigits] = useState<string[]>(EMPTY_CODE);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  /** Set only when the browser blocked the new tab, so a link is shown instead. */
  const [brochureUrl, setBrochureUrl] = useState("");
  const [now, setNow] = useState(() => Date.now());

  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const digitRefs = useRef<(HTMLInputElement | null)[]>([]);
  // Guards against a second check firing while the first is still running.
  const checkingRef = useRef(false);

  const resendIn = session?.stage === "code" ? Math.max(0, Math.ceil((session.resendAt - now) / 1000)) : 0;

  useEffect(() => {
    lockBodyScroll({
      onStop: () => lenis?.stop(),
      onStart: () => lenis?.start(),
    });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      unlockBodyScroll();
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose, lenis]);

  // Focus the first field of whichever step is showing, after it fades in.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (step === "name") nameRef.current?.focus();
      if (step === "email") emailRef.current?.focus();
      if (step === "code") digitRefs.current[0]?.focus();
    }, 120);
    return () => window.clearTimeout(timer);
  }, [step]);

  // Clock for the resend countdown. Runs only while one is pending.
  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [resendIn]);

  // A code or token that runs out while the popup is open sends the visitor back.
  useEffect(() => {
    if (!session || session.stage === "email") return;
    const expiresAt = session.stage === "code" ? session.codeExpiresAt : session.tokenExpiresAt;
    const ms = expiresAt - Date.now();
    const timer = window.setTimeout(() => {
      // Keep the name, ask for the email again.
      onSessionChange({ stage: "email", name: session.name });
      setStep("email");
      setDigits(EMPTY_CODE());
      setError(t(session.stage === "code" ? "brochure.errorCode" : "brochure.errorExpired"));
    }, Math.max(0, ms));
    return () => window.clearTimeout(timer);
  }, [session, onSessionChange, t]);

  function goTo(next: Step) {
    setError("");
    setNotice("");
    setBrochureUrl("");
    setStep(next);
  }

  const sendCode = useCallback(
    async (isResend: boolean) => {
      const address = email.trim();
      setBusy(true);
      setError("");
      setNotice("");
      const res = await postJson<{ resendInSeconds: number; expiresInMinutes: number }>("/api/franchise/verify/send", {
        name: name.trim(),
        email: address,
        locale,
      });
      setBusy(false);
      if (!res.ok) {
        setError(res.status === 429 ? t("brochure.errorWait") : t("brochure.errorSend"));
        return false;
      }
      const sentAt = Date.now();
      setNow(sentAt);
      onSessionChange({
        stage: "code",
        name: name.trim(),
        email: address,
        codeExpiresAt: sentAt + (res.data?.expiresInMinutes ?? 10) * 60_000,
        resendAt: sentAt + (res.data?.resendInSeconds ?? 30) * 1000,
      });
      setDigits(EMPTY_CODE());
      if (isResend) {
        setNotice(t("brochure.resent"));
        digitRefs.current[0]?.focus();
      }
      return true;
    },
    [name, email, locale, onSessionChange, t],
  );

  function handleNameSubmit(event: React.FormEvent) {
    event.preventDefault();
    const clean = name.trim();
    if (!clean) return;
    onSessionChange({ stage: "email", name: clean });
    goTo("email");
  }

  async function handleEmailSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (busy || !email.trim()) return;
    if (await sendCode(false)) goTo("code");
  }

  async function checkCode(code: string) {
    if (checkingRef.current || code.length !== CODE_LENGTH || session?.stage !== "code") return;
    checkingRef.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    const res = await postJson<{ token: string; expiresInMinutes: number }>("/api/franchise/verify/check", {
      email: session.email,
      code,
    });
    setBusy(false);
    checkingRef.current = false;
    if (!res.ok || !res.data?.token) {
      setError(t("brochure.errorCode"));
      setDigits(EMPTY_CODE());
      window.setTimeout(() => digitRefs.current[0]?.focus(), 0);
      return;
    }
    onSessionChange({
      stage: "verified",
      name: session.name,
      email: session.email,
      token: res.data.token,
      tokenExpiresAt: minutesFromNow(res.data.expiresInMinutes ?? 60),
    });
    goTo("choose");
  }

  /**
   * Writes several digits at once (paste or phone autofill). A full code always
   * fills every box from the first one, wherever it was pasted. A shorter run
   * fills from the box it was pasted into.
   */
  function applyDigits(start: number, raw: string) {
    const incoming = raw.replace(/\D/g, "");
    if (!incoming) return;
    const next = [...digits];
    if (incoming.length >= CODE_LENGTH) {
      incoming
        .slice(0, CODE_LENGTH)
        .split("")
        .forEach((d, i) => (next[i] = d));
    } else {
      incoming.split("").forEach((d, i) => {
        if (start + i < CODE_LENGTH) next[start + i] = d;
      });
    }
    commitDigits(next, Math.min(start + incoming.length, CODE_LENGTH - 1));
  }

  /** Saves the boxes, then checks the code if complete, or moves focus on. */
  function commitDigits(next: string[], focusIndex: number) {
    setDigits(next);
    setError("");
    const code = next.join("");
    if (code.length === CODE_LENGTH) {
      digitRefs.current[CODE_LENGTH - 1]?.blur();
      void checkCode(code);
      return;
    }
    const firstEmpty = next.findIndex((d) => !d);
    digitRefs.current[firstEmpty >= 0 && firstEmpty < focusIndex ? firstEmpty : focusIndex]?.focus();
  }

  function handleDigitChange(index: number, value: string) {
    const clean = value.replace(/\D/g, "");
    // A whole code arriving through typing events is phone autofill.
    if (clean.length >= CODE_LENGTH) return applyDigits(0, clean);
    const next = [...digits];
    if (clean.length > 1) {
      // Typed over a filled box: keep only the digit just typed.
      next[index] = clean.startsWith(digits[index]) ? clean.slice(-1) : clean[0];
    } else {
      next[index] = clean;
    }
    commitDigits(next, clean && index < CODE_LENGTH - 1 ? index + 1 : index);
  }

  function handleDigitPaste(index: number, e: React.ClipboardEvent<HTMLInputElement>) {
    // Take over the paste, or boxes that hold one digit would cut it short.
    e.preventDefault();
    applyDigits(index, e.clipboardData.getData("text"));
  }

  function handleDigitKey(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      e.preventDefault();
      const next = [...digits];
      next[index - 1] = "";
      setDigits(next);
      digitRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowLeft" && index > 0) {
      digitRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < CODE_LENGTH - 1) {
      digitRefs.current[index + 1]?.focus();
    }
  }

  function changeEmail() {
    // The name stays; only the email (and any code or token for it) is dropped.
    onSessionChange({ stage: "email", name: name.trim() });
    setDigits(EMPTY_CODE());
    goTo("email");
  }

  /** Drops everything, including the name, and goes back to step 1. */
  function startOver() {
    onSessionChange(null);
    setName("");
    setEmail("");
    setDigits(EMPTY_CODE());
    goTo("name");
  }

  async function downloadBrochure() {
    if (busy || session?.stage !== "verified") return;
    // Open the tab inside the click, before the request, so popup blockers allow it.
    const tab = window.open("", "_blank");
    setBusy(true);
    setError("");
    const res = await postJson<{ url: string }>("/api/franchise/brochure", {
      name: session.name,
      email: session.email,
      token: session.token,
      locale,
    });
    setBusy(false);
    if (!res.ok || !res.data?.url) {
      tab?.close();
      if (res.status === 403) {
        changeEmail();
        setError(t("brochure.errorExpired"));
      } else {
        setError(t("brochure.errorDownload"));
      }
      return;
    }
    if (tab) {
      tab.opener = null;
      tab.location.href = res.data.url;
    } else {
      // Pop-up blocked: keep the visitor here and show a plain link instead.
      setBrochureUrl(res.data.url);
    }
  }

  const dir = locale === "ar" ? "rtl" : "ltr";
  const stepNumber = STEPS.indexOf(step) + 1;
  const shownEmail = session && session.stage !== "email" ? session.email : email.trim();

  /** Props for one step's wrapper: only the active step is visible and focusable. */
  const pane = (name: Step) => {
    const active = step === name;
    return {
      "aria-hidden": active ? undefined : true,
      inert: !active,
      className: `col-start-1 row-start-1 flex flex-col ${active ? "overlay-fade-up" : "invisible"}`,
    };
  };

  const title = (name: Step, text: string) => (
    <h2
      id={step === name ? headingId : undefined}
      className={`m-0 uppercase text-white ${KOROLEV}`}
      style={TITLE_STYLE}
    >
      {text}
    </h2>
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={headingId}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6"
    >
      <div className="overlay-backdrop-in absolute inset-0 bg-black/85" onClick={onClose} aria-hidden />

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
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>

        {/* Stepper: numbered dots joined by lines. Done steps show a tick, the
            current one gets a ring. Space on the end side is left for the close button. */}
        <nav aria-label={t("brochure.stepOf", { step: String(stepNumber), total: String(STEPS.length) })} className="overlay-fade-in pe-12">
          <ol className="m-0 flex list-none items-start p-0">
            {STEPS.map((name, i) => {
              const n = i + 1;
              const done = n < stepNumber;
              const current = n === stepNumber;
              return (
                <li
                  key={name}
                  aria-current={current ? "step" : undefined}
                  className={`flex items-start ${i < STEPS.length - 1 ? "flex-1" : ""}`}
                >
                  <div className="flex w-12 shrink-0 flex-col items-center gap-2">
                    <span
                      className={`flex size-7 items-center justify-center rounded-full text-[12px] font-bold transition-all duration-300 ${INTER} ${
                        done
                          ? "bg-[#FF0931] text-white"
                          : current
                            ? "bg-[#FF0931] text-white ring-4 ring-[#FF0931]/25"
                            : "border border-[#2e2e2e] bg-[#111] text-[#6b6b6b]"
                      }`}
                    >
                      {done ? (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path d="M5 12.5 10 17.5 19 7.5" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : (
                        n
                      )}
                    </span>
                    <span
                      className={`text-[11px] font-semibold uppercase tracking-[0.06em] transition-colors duration-300 ${INTER} ${
                        current ? "text-white" : done ? "text-[#bdbdbd]" : "text-[#5a5a5a]"
                      }`}
                    >
                      {t(`brochure.step.${name}`)}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <span className="mt-[13px] h-[2px] flex-1 overflow-hidden rounded-full bg-[#242424]" aria-hidden="true">
                      <span
                        className={`block h-full bg-[#FF0931] transition-[width] duration-500 ease-out ${done ? "w-full" : "w-0"}`}
                      />
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
        <div className="mb-6 mt-6 h-px bg-[#1c1c1c]" aria-hidden="true" />

        <div className="grid">
          {/* Step 1: name */}
          <form {...pane("name")} onSubmit={handleNameSubmit}>
            {title("name", t("brochure.nameTitle"))}
            <p className={`m-0 mt-4 text-[#8f8f8f] ${INTER}`} style={BODY_STYLE}>
              {t("brochure.nameBody")}
            </p>
            <label htmlFor="brochure-name" className={`mt-7 mb-2 block text-[13px] font-semibold text-white ${INTER}`}>
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
              placeholder={t("brochure.namePlaceholder")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={INPUT_CLS}
            />
            {step === "name" && <StatusLine error="" notice="" />}
            <button type="submit" disabled={!name.trim()} className={`mt-4 ${PRIMARY_BTN}`} style={BTN_STYLE}>
              {t("brochure.next")}
              <ArrowIcon />
            </button>
            <p className={`m-0 mt-4 text-center text-[11px] leading-[150%] text-[#6b6b6b] ${INTER}`}>{t("brochure.privacy")}</p>
          </form>

          {/* Step 2: email */}
          <form {...pane("email")} onSubmit={handleEmailSubmit}>
            {title("email", t("brochure.emailTitle"))}
            <p className={`m-0 mt-4 text-[#8f8f8f] ${INTER}`} style={BODY_STYLE}>
              {t("brochure.emailBody")}
            </p>
            <label htmlFor="brochure-email" className={`mt-7 mb-2 block text-[13px] font-semibold text-white ${INTER}`}>
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
              maxLength={254}
              autoComplete="email"
              placeholder="john@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              aria-invalid={step === "email" && error ? true : undefined}
              className={INPUT_CLS}
            />
            {step === "email" && <StatusLine error={error} notice={notice} />}
            <button type="button" onClick={() => goTo("name")} disabled={busy} className={`self-start ${LINK_BTN}`}>
              {t("brochure.changeName", { name: name.trim() })}
            </button>
            <button type="submit" disabled={busy || !email.trim()} className={`mt-4 ${PRIMARY_BTN}`} style={BTN_STYLE}>
              {busy && step === "email" ? t("brochure.sendingCode") : t("brochure.continue")}
              <ArrowIcon />
            </button>
            <p className={`m-0 mt-4 text-center text-[11px] leading-[150%] text-[#6b6b6b] ${INTER}`}>{t("brochure.privacy")}</p>
          </form>

          {/* Step 3: code */}
          <form
            {...pane("code")}
            onSubmit={(e) => {
              e.preventDefault();
              void checkCode(digits.join(""));
            }}
          >
            {title("code", t("brochure.codeTitle"))}
            <p className={`m-0 mt-4 text-[#8f8f8f] ${INTER}`} style={BODY_STYLE}>
              {t("brochure.codeBody", { email: shownEmail })}
            </p>
            <fieldset className="m-0 mt-7 border-0 p-0">
              <legend className="sr-only">{t("brochure.codeLabel")}</legend>
              {/* Digits always run left to right, even in Arabic. */}
              <div dir="ltr" className="flex justify-center gap-3 sm:gap-4">
                {digits.map((d, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      digitRefs.current[i] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete={i === 0 ? "one-time-code" : "off"}
                    // Room for a whole code, so phone autofill and typing over a
                    // filled box both reach handleDigitChange intact.
                    maxLength={CODE_LENGTH}
                    aria-label={t("brochure.digit", { n: String(i + 1) })}
                    aria-invalid={step === "code" && error ? true : undefined}
                    value={d}
                    disabled={busy}
                    onChange={(e) => handleDigitChange(i, e.target.value)}
                    onPaste={(e) => handleDigitPaste(i, e)}
                    onKeyDown={(e) => handleDigitKey(i, e)}
                    onFocus={(e) => e.target.select()}
                    className={`size-16 rounded-[12px] border bg-[#161616] text-center text-[28px] font-bold text-white outline-none transition-colors sm:size-[72px] ${
                      step === "code" && error ? "border-[#FF0931]" : d ? "border-[#5a5a5a]" : "border-[#2b2b2b]"
                    } focus:border-[#FF0931] disabled:opacity-60 ${INTER}`}
                  />
                ))}
              </div>
            </fieldset>
            {step === "code" && <StatusLine error={error} notice={notice} centered />}
            <div className={`mt-1 flex items-center justify-center gap-5 ${INTER}`}>
              <button type="button" onClick={() => void sendCode(true)} disabled={busy || resendIn > 0} className={LINK_BTN}>
                {resendIn > 0 ? t("brochure.resendIn", { s: String(resendIn) }) : t("brochure.resend")}
              </button>
              <span className="h-3.5 w-px bg-[#2b2b2b]" aria-hidden="true" />
              <button type="button" onClick={changeEmail} disabled={busy} className={LINK_BTN}>
                {t("brochure.changeEmail")}
              </button>
            </div>
            <button
              type="submit"
              disabled={busy || digits.join("").length !== CODE_LENGTH}
              className={`mt-5 ${PRIMARY_BTN}`}
              style={BTN_STYLE}
            >
              {busy && step === "code" ? t("brochure.verifying") : t("brochure.verify")}
            </button>
            <p className={`m-0 mt-4 text-center text-[11px] leading-[150%] text-[#6b6b6b] ${INTER}`}>{t("brochure.spamHint")}</p>
          </form>

          {/* Step 4: choose */}
          <div {...pane("choose")}>
            {title("choose", t("brochure.doneTitle"))}
            <p className={`m-0 mt-4 text-[#8f8f8f] ${INTER}`} style={BODY_STYLE}>
              {t("brochure.doneBody")}
            </p>
            {step === "choose" && <StatusLine error={error} notice="" />}
            {brochureUrl && (
              <a
                href={brochureUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`text-[14px] font-semibold text-[#FF4D6A] underline underline-offset-4 hover:text-white ${INTER}`}
              >
                {t("brochure.openLink")}
              </a>
            )}
            <div className="mt-3 flex flex-col gap-3">
              <OptionCard
                primary
                icon={<DownloadIcon />}
                title={busy && step === "choose" ? t("brochure.downloading") : t("brochure.download")}
                description={t("brochure.downloadHint")}
                onClick={() => void downloadBrochure()}
                disabled={busy}
              />
              <OptionCard
                icon={<FormIcon />}
                title={t("brochure.submitForm")}
                description={t("brochure.submitHint")}
                onClick={onApply}
                disabled={busy}
              />
            </div>
            <button
              type="button"
              onClick={startOver}
              disabled={busy}
              className={`group mt-5 inline-flex items-center gap-2 self-center ${LINK_BTN}`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="transition-transform duration-300 group-hover:-rotate-90">
                <path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {t("brochure.startOver")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** A big tappable choice: icon tile, title, one-line description, arrow. */
function OptionCard({
  primary = false,
  icon,
  title,
  description,
  onClick,
  disabled,
}: {
  primary?: boolean;
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`group flex w-full cursor-pointer items-center gap-4 rounded-[14px] p-4 text-start transition-all duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 ${
        primary
          ? "bg-[#FF0931] shadow-[0_10px_30px_rgba(255,9,49,0.25)] hover:bg-[#E0082C]"
          : "border border-[#2b2b2b] bg-[#121212] hover:border-[#FF0931]"
      }`}
    >
      <span
        className={`flex size-12 shrink-0 items-center justify-center rounded-[12px] ${primary ? "bg-white/15" : "bg-[#FF0931]/12"}`}
        aria-hidden="true"
      >
        {icon}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className={`uppercase leading-none text-white ${KOROLEV}`} style={{ fontSize: "clamp(16px, 2vw, 19px)", fontWeight: 800, letterSpacing: "0.54px" }}>
          {title}
        </span>
        <span className={`text-[13px] leading-[140%] ${primary ? "text-white/80" : "text-[#8f8f8f]"} ${INTER}`}>{description}</span>
      </span>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-5 w-5 shrink-0 transition-transform duration-200 group-hover:translate-x-1 rtl:-scale-x-100 rtl:group-hover:-translate-x-1"
        aria-hidden="true"
      >
        <path d="M9 6l6 6-6 6" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

function FormIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" stroke="#FF4D6A" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M14 3v5h5M9 13h6M9 17h4" stroke="#FF4D6A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** One line for errors or confirmations. Space is always reserved so nothing jumps. */
function StatusLine({ error, notice, centered = false }: { error: string; notice: string; centered?: boolean }) {
  return (
    <p
      role={error ? "alert" : "status"}
      aria-live="polite"
      className={`m-0 mt-2 min-h-[20px] text-[13px] leading-[150%] ${error ? "text-[#FF4D6A]" : "text-[#8f8f8f]"} ${centered ? "text-center" : ""} ${INTER}`}
    >
      {error || notice}
    </p>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 rtl:-scale-x-100" aria-hidden="true">
      <path d="M5 12h14m0 0-5-5m5 5-5 5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 shrink-0 transition-transform duration-200 group-hover:translate-y-0.5" aria-hidden="true">
      <path d="M12 3v13m0 0l-5-5m5 5l5-5M4 20h16" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
