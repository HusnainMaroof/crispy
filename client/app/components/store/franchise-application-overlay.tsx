// franchise-application-overlay.tsx
// Full-screen overlay for the franchise application — 90% width/height panel,
// black background: hero (badge / headline / criteria) + full application form.
"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { lockBodyScroll, unlockBodyScroll } from "@/lib/body-scroll-lock";
import { useLenis } from "../providers/smooth-scroll";
import { Check } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-context";

const KOROLEV = "font-[family-name:var(--font-korolev),Korolev,sans-serif]";
const INTER = "font-[family-name:var(--font-inter),Inter,sans-serif]";

const CRITERIA = [
  "franchise.app.criteria.1",
  "franchise.app.criteria.2",
  "franchise.app.criteria.3",
];

/**
 * `value` stays the stable English string so the stored form data never depends
 * on the visitor's language. Only `labelKey` is translated, so switching to
 * Arabic relabels every option without rewriting what was already selected.
 */
type Option = { value: string; labelKey: string };

const PROPERTY_STATUS: Option[] = [
  { value: "Looking for Location", labelKey: "franchise.app.propertyStatus.1" },
  { value: "Already Own a Property", labelKey: "franchise.app.propertyStatus.2" },
  { value: "Leasing a Property", labelKey: "franchise.app.propertyStatus.3" },
];
const BUDGET_RANGES: Option[] = [
  { value: "£100,000 - £250,000", labelKey: "franchise.app.budget.1" },
  { value: "£250,000 - £500,000", labelKey: "franchise.app.budget.2" },
  { value: "£500,000+", labelKey: "franchise.app.budget.3" },
];
const EXPERIENCE: Option[] = [
  { value: "Yes, 3+ Years", labelKey: "franchise.app.experience.1" },
  { value: "Yes, 1-3 Years", labelKey: "franchise.app.experience.2" },
  { value: "No, but eager to learn", labelKey: "franchise.app.experience.3" },
];
const OWN_BUSINESSES: Option[] = [
  { value: "Yes, Multi-unit Owner", labelKey: "franchise.app.own.1" },
  { value: "Yes, Single Business", labelKey: "franchise.app.own.2" },
  { value: "No", labelKey: "franchise.app.own.3" },
];

const INPUT_CLS =
  "w-full rounded-[10px] border-1 border-[#C4C4C4] bg-[#F1F1F1] px-4 py-3.5 text-[15px] text-black outline-none transition-colors placeholder:text-[#9A9A9A] focus:border-[#FF0931]";
const LABEL_CLS = `mb-2 block text-[13px] font-semibold text-black ${INTER}`;
const ASTERISK = <span className="text-[#FF0931]"> *</span>;

function Section({
  num,
  title,
  desc,
  children,
}: {
  num: string;
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-center gap-3.5">
        <span
          className={`flex h-10 w-8 shrink-0 items-center justify-center rounded-[6px] bg-[#FF0931] text-[16px] font-bold text-white   sm:text-[18px] ${KOROLEV}`}
        >
          {num}
        </span>
        <h3
          className={`m-0 uppercase text-black ${KOROLEV}`}
          style={{
            fontSize: "clamp(20px, 2.4vw, 30px)",
            fontWeight: 800,
            lineHeight: "100%",
            letterSpacing: "0.3px",
          }}
        >
          {title}
        </h3>
      </div>
      <p
        className={`m-0 mt-3 text-[13px] leading-[150%] text-[#6B6B6B] sm:text-[14px] ${INTER}`}
      >
        {desc}
      </p>
      <div className="bg-[#F5F5F5] w-full h-[1.5px] mt-2.5" />
      <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6">
        {children}
      </div>
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className={LABEL_CLS}>
        {label}
        {ASTERISK}
      </label>
      {children}
    </div>
  );
}

function Select({
  value,
  onChange,
  options,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  options: Option[];
  label: string;
}) {
  const { t } = useLocale();
  return (
    <Field label={label}>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${INPUT_CLS} cursor-pointer appearance-none pe-10`}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {t(o.labelKey)}
            </option>
          ))}
        </select>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          className="pointer-events-none absolute end-4 top-1/2 h-4 w-4 -translate-y-1/2 text-black"
          aria-hidden="true"
        >
          <path
            d="M6 9L12 15L18 9"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </Field>
  );
}

function CheckIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      className="mt-0.5 h-5 w-5 shrink-0"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="11" fill="#FF0931" />
      <path
        d="M7 12.5L10.2 15.5L17 8.8"
        stroke="white"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const EMPTY_FORM = {
  fullName: "",
  email: "",
  phone: "",
  dob: "",
  city: "",
  propertyStatus: PROPERTY_STATUS[0].value,
  budget: BUDGET_RANGES[0].value,
  occupation: "",
  experience: EXPERIENCE[0].value,
  ownBusinesses: OWN_BUSINESSES[0].value,
  vision: "",
};

export default function FranchiseApplicationOverlay({
  onClose,
}: {
  onClose: () => void;
}) {
  const lenis = useLenis();
  const { locale, t } = useLocale();
  const dir = locale === "ar" ? "rtl" : "ltr";
  const [form, setForm] = useState(EMPTY_FORM);
  const [confirmAccurate, setConfirmAccurate] = useState(false);
  const [agreeComms, setAgreeComms] = useState(false);

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

  const set = (key: keyof typeof EMPTY_FORM) => (v: string) =>
    setForm((f) => ({ ...f, [key]: v }));

  const textFieldsFilled = [
    form.fullName,
    form.email,
    form.phone,
    form.dob,
    form.city,
    form.occupation,
    form.vision,
  ].every((v) => v.trim() !== "");

  const canSubmit = textFieldsFilled && confirmAccurate && agreeComms;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmAccurate || !agreeComms) {
      toast.error(t("franchise.app.errorConfirm"));
      return;
    }
    toast.success(t("franchise.app.success"));
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center "
      role="dialog"
      aria-modal="true"
      aria-label={t("franchise.app.title")}
    >
      {/* Backdrop — full black overlay */}
      <div
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel — full-screen black, white bg kept only on the form card */}
      <div
        data-lenis-prevent
        dir={dir}
        className="loc-scroll relative flex h-[95vh]  w-[95%] md:w-[90%]  rounded-2xl border border-[#242424] bg-black bg-black rounded-[20px] flex-col items-center overflow-y-auto px-4 pb-8 pt-12 shadow-[0_20px_60px_rgba(0,0,0,0.7)] sm:px-6 my-10!"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={t("franchise.app.close")}
          className="overlay-fade-in sticky -top-10 ms-auto z-50 -mb-9 flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-[#2b2b2b] bg-[#161616] text-white transition-colors hover:border-[#FF0931] hover:bg-[#FF0931]"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>

        {/* ---------- Hero ---------- */}
        <span
          className={`mt-6 inline-flex rounded-md bg-[#FF0931] px-5 py-2.5 text-white uppercase sm:mt-8 ${KOROLEV}`}
          style={{
            fontSize: "clamp(13px, 1.4vw, 18px)",
            fontWeight: 700,
            letterSpacing: "0.54px",
            lineHeight: "100%",
          }}
        >
          {t("franchise.app.badge")}
        </span>

        <h2
          className={`m-0 mt-5 uppercase sm:mt-7 ${KOROLEV} text-white`}
          style={{
            fontSize: "clamp(38px, 7.5vw, 110px)",
            fontWeight: 900,
            lineHeight: "100%",
            letterSpacing: "0.54px",
          }}
        >
          {t("franchise.app.titleLead")} <span className="text-[#FF0931]">{t("franchise.app.titleAccent")}</span>
        </h2>

        <p
          className={`m-0 mt-6 max-w-[640px] text-[#B9B9B9] sm:mt-8 ${INTER}`}
          style={{
            fontSize: "clamp(14px, 1.6vw, 20px)",
            fontWeight: 400,
            lineHeight: "160%",
            letterSpacing: "0.54px",
          }}
        >
          {t("franchise.app.intro")}
        </p>

        {/* Qualification criteria card */}
        <div className="mt-10 w-full max-w-[640px] rounded-2xl bg-[#1C1C1C] p-7 text-start sm:mt-12 sm:p-9">
          <h3
            className={`m-0 uppercase text-white ${KOROLEV}`}
            style={{
              fontSize: "clamp(20px, 2.2vw, 28px)",
              fontWeight: 800,
              lineHeight: "100%",
              letterSpacing: "0.54px",
            }}
          >
            {t("franchise.app.criteria")}
          </h3>

          <ul className="m-0 mt-6 list-none space-y-5 p-0 sm:mt-8 sm:space-y-6">
            {CRITERIA.map((labelKey) => (
              <li key={labelKey} className="flex items-start gap-3.5">
                <CheckIcon />
                <span
                  className={`text-[#EDEDED] ${INTER}`}
                  style={{
                    fontSize: "clamp(13px, 1.4vw, 16px)",
                    fontWeight: 400,
                    lineHeight: "150%",
                  }}
                >
                  {t(labelKey)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* ---------- Application form ---------- */}
        <form
          onSubmit={handleSubmit}
          className="relative mt-12 w-fit rounded-[20px] bg-white px-5 py-9 text-start sm:mt-16 sm:px-12 sm:py-14"
        >
          <div className="mx-auto flex max-w-[820px] flex-col gap-12 sm:gap-14">
            {/* 01 — Personal Information */}
            <Section
              num="01"
              title={t("franchise.app.s1Title")}
              desc={t("franchise.app.s1Desc")}
            >
              <Field label={t("franchise.app.fullName")}>
                <input
                  type="text"
                  required
                  placeholder={t("franchise.app.phName")}
                  value={form.fullName}
                  onChange={(e) => set("fullName")(e.target.value)}
                  className={INPUT_CLS}
                />
              </Field>
              <Field label={t("franchise.app.email")}>
                <input
                  type="email"
                  required
                  dir="ltr"
                  placeholder={t("franchise.app.phEmail")}
                  value={form.email}
                  onChange={(e) => set("email")(e.target.value)}
                  className={INPUT_CLS}
                />
              </Field>
              <Field label={t("franchise.app.phone")}>
                <input
                  type="tel"
                  required
                  dir="ltr"
                  placeholder={t("franchise.app.phPhone")}
                  value={form.phone}
                  onChange={(e) => set("phone")(e.target.value)}
                  className={INPUT_CLS}
                />
              </Field>
              <Field label={t("franchise.app.dob")}>
                <input
                  type="text"
                  required
                  dir="ltr"
                  placeholder={t("franchise.app.phDob")}
                  value={form.dob}
                  onChange={(e) => set("dob")(e.target.value)}
                  className={INPUT_CLS}
                />
              </Field>
            </Section>

            {/* 02 — Location Preferences */}
            <Section
              num="02"
              title={t("franchise.app.s2Title")}
              desc={t("franchise.app.s2Desc")}
            >
              <Field label={t("franchise.app.city")}>
                <input
                  type="text"
                  required
                  placeholder={t("franchise.app.phCity")}
                  value={form.city}
                  onChange={(e) => set("city")(e.target.value)}
                  className={INPUT_CLS}
                />
              </Field>
              <Select
                label={t("franchise.app.propertyStatus")}
                value={form.propertyStatus}
                onChange={set("propertyStatus")}
                options={PROPERTY_STATUS}
              />
            </Section>

            {/* 03 — Financial Information */}
            <Section
              num="03"
              title={t("franchise.app.s3Title")}
              desc={t("franchise.app.s3Desc")}
            >
              <Select
                label={t("franchise.app.budget")}
                value={form.budget}
                onChange={set("budget")}
                options={BUDGET_RANGES}
              />
              <Field label={t("franchise.app.occupation")}>
                <input
                  type="text"
                  required
                  placeholder={t("franchise.app.phOccupation")}
                  value={form.occupation}
                  onChange={(e) => set("occupation")(e.target.value)}
                  className={INPUT_CLS}
                />
              </Field>
            </Section>

            {/* 04 — Experience */}
            <Section
              num="04"
              title={t("franchise.app.s4Title")}
              desc={t("franchise.app.s4Desc")}
            >
              <Select
                label={t("franchise.app.experience")}
                value={form.experience}
                onChange={set("experience")}
                options={EXPERIENCE}
              />
              <Select
                label={t("franchise.app.ownBusinesses")}
                value={form.ownBusinesses}
                onChange={set("ownBusinesses")}
                options={OWN_BUSINESSES}
              />
            </Section>

            {/* 05 — Your Vision */}
            <Section
              num="05"
              title={t("franchise.app.s5Title")}
              desc={t("franchise.app.s5Desc")}
            >
              <div className="sm:col-span-2">
                <Field label={t("franchise.app.vision")}>
                  <textarea
                    required
                    rows={5}
                    placeholder={t("franchise.app.phVision")}
                    value={form.vision}
                    onChange={(e) => set("vision")(e.target.value)}
                    className={`${INPUT_CLS} resize-none leading-[160%]`}
                  />
                </Field>
              </div>
            </Section>

            {/* Confirmations */}
            <div className="flex flex-col gap-4">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={confirmAccurate}
                  onChange={(e) => setConfirmAccurate(e.target.checked)}
                  aria-label={t("franchise.app.consentAccurate")}
                  // sr-only, not `hidden`: display:none drops the input from the
                  // accessibility tree and from tab order, so a keyboard user
                  // could never tick the box that gates submit.
                  className="sr-only"
                />
                <span className="h-5 w-5 shrink-0 cursor-pointer rounded border-2 border-[#FF0931] flex items-center justify-center">
                  {confirmAccurate && <Check className="text-[#FF0931]" />}
                </span>
                <span
                  className={`text-[13px] leading-[150%] text-[#3D3C3D] sm:text-[14px] ${INTER}`}
                >
                  {t("franchise.app.consentAccurate")}
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={agreeComms}
                  onChange={(e) => setAgreeComms(e.target.checked)}
                  aria-label={t("franchise.app.consentComms")}
                  className="sr-only"
                />

                <span className="h-5 w-5 shrink-0 cursor-pointer rounded border-2 border-[#FF0931] flex items-center justify-center">
                  {agreeComms && <Check className="text-[#FF0931]" />}
                </span>

                <span
                  className={`text-[13px] leading-[150%] text-[#3D3C3D] sm:text-[14px] ${INTER}`}
                >
                  {t("franchise.app.consentComms")}
                </span>
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={!canSubmit}
              className={`group flex w-full items-center justify-between gap-6 rounded-[14px] px-6 py-6 text-white transition-colors sm:px-9 sm:py-7 ${
                canSubmit
                  ? "cursor-pointer bg-[#FF0931] hover:bg-[#E0082C]"
                  : "cursor-not-allowed bg-[#B8B8B8]"
              }`}
            >
              <span
                className={`uppercase ${KOROLEV}`}
                style={{
                  fontSize: "clamp(20px, 2.4vw, 30px)",
                  fontWeight: 800,
                  lineHeight: "100%",
                  letterSpacing: "0.54px",
                }}
              >
                {t("franchise.app.submit")}
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 33 33"
                fill="none"
                className="h-8 w-8 shrink-0 transition-transform duration-200 group-hover:translate-x-1 group-hover:-translate-y-1 sm:h-10 sm:w-10"
              >
                <path
                  d="M3.36031 33L0 29.6441L24.9869 4.64668H5.68668L5.72977 0H33V27.2777H28.3042L28.3473 8.00261L3.36031 33Z"
                  fill="white"
                />
              </svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
