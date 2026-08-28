// franchise-application-overlay.tsx
// Full-screen overlay for the franchise application — 90% width/height panel,
// black background: hero (badge / headline / criteria) + full application form.
"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { lockBodyScroll, unlockBodyScroll } from "@/lib/body-scroll-lock";
import { useLenis } from "../providers/smooth-scroll";
import { Check } from "lucide-react";

const KOROLEV = "font-[family-name:var(--font-korolev),Korolev,sans-serif]";
const INTER = "font-[family-name:var(--font-inter),Inter,sans-serif]";

const CRITERIA = [
  "Minimum liquid assets of £100,000",
  "Passion for superior food quality & service",
  "Local market knowledge and business acumen",
];

const PROPERTY_STATUS = [
  "Looking for Location",
  "Already Own a Property",
  "Leasing a Property",
];
const BUDGET_RANGES = [
  "£100,000 - £250,000",
  "£250,000 - £500,000",
  "£500,000+",
];
const EXPERIENCE = [
  "Yes, 3+ Years",
  "Yes, 1-3 Years",
  "No, but eager to learn",
];
const OWN_BUSINESSES = ["Yes, Multi-unit Owner", "Yes, Single Business", "No"];

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
  options: string[];
  label: string;
}) {
  return (
    <Field label={label}>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${INPUT_CLS} cursor-pointer appearance-none pr-10`}
        >
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-black"
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
  propertyStatus: PROPERTY_STATUS[0],
  budget: BUDGET_RANGES[0],
  occupation: "",
  experience: EXPERIENCE[0],
  ownBusinesses: OWN_BUSINESSES[0],
  vision: "",
};

export default function FranchiseApplicationOverlay({
  onClose,
}: {
  onClose: () => void;
}) {
  const lenis = useLenis();
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmAccurate || !agreeComms) {
      toast.error("Please confirm both checkboxes before submitting");
      return;
    }
    toast.success("Application submitted! We'll be in touch soon.");
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Franchise application"
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
        className="loc-scroll relative flex h-full min-h-screen w-full flex-col items-center overflow-y-auto px-4 py-10 text-center sm:px-10 sm:py-14"
      >
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close franchise application"
          className="fixed right-4 top-4 z-10 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-[#FF0931]"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            className="h-5 w-5"
          >
            <path
              d="M6 6L18 18M18 6L6 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
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
          Partner With Us
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
          Franchise <span className="text-[#FF0931]">Application</span>
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
          Tell us about your background, financial capability, and target
          territories. Let&apos;s make some bold flavor moves together.
        </p>

        {/* Qualification criteria card */}
        <div className="mt-10 w-full max-w-[640px] rounded-2xl bg-[#1C1C1C] p-7 text-left sm:mt-12 sm:p-9">
          <h3
            className={`m-0 uppercase text-white ${KOROLEV}`}
            style={{
              fontSize: "clamp(20px, 2.2vw, 28px)",
              fontWeight: 800,
              lineHeight: "100%",
              letterSpacing: "0.54px",
            }}
          >
            Qualification Criteria
          </h3>

          <ul className="m-0 mt-6 list-none space-y-5 p-0 sm:mt-8 sm:space-y-6">
            {CRITERIA.map((item) => (
              <li key={item} className="flex items-start gap-3.5">
                <CheckIcon />
                <span
                  className={`text-[#EDEDED] ${INTER}`}
                  style={{
                    fontSize: "clamp(13px, 1.4vw, 16px)",
                    fontWeight: 400,
                    lineHeight: "150%",
                  }}
                >
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* ---------- Application form ---------- */}
        <form
          onSubmit={handleSubmit}
          className="mt-12 w-fit rounded-[20px] bg-white px-5 py-9 text-left sm:mt-16 sm:px-12 sm:py-14"
        >
          <div className="mx-auto flex max-w-[820px] flex-col gap-12 sm:gap-14">
            {/* 01 — Personal Information */}
            <Section
              num="01"
              title="Personal Information"
              desc="Please provide your primary contact and identification information."
            >
              <Field label="Full Name">
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={form.fullName}
                  onChange={(e) => set("fullName")(e.target.value)}
                  className={INPUT_CLS}
                />
              </Field>
              <Field label="Email Address">
                <input
                  type="email"
                  required
                  placeholder="john@example.com"
                  value={form.email}
                  onChange={(e) => set("email")(e.target.value)}
                  className={INPUT_CLS}
                />
              </Field>
              <Field label="Phone Number">
                <input
                  type="tel"
                  required
                  placeholder="e.g. +44 7123 456789"
                  value={form.phone}
                  onChange={(e) => set("phone")(e.target.value)}
                  className={INPUT_CLS}
                />
              </Field>
              <Field label="Date of Birth">
                <input
                  type="text"
                  required
                  placeholder="DD / MM / YYYY"
                  value={form.dob}
                  onChange={(e) => set("dob")(e.target.value)}
                  className={INPUT_CLS}
                />
              </Field>
            </Section>

            {/* 02 — Location Preferences */}
            <Section
              num="02"
              title="Location Preferences"
              desc="Where would you like to build your Crispies empire?"
            >
              <Field label="Preferred City / Area">
                <input
                  type="text"
                  required
                  placeholder="e.g. London, Manchester"
                  value={form.city}
                  onChange={(e) => set("city")(e.target.value)}
                  className={INPUT_CLS}
                />
              </Field>
              <Select
                label="Current Property Status"
                value={form.propertyStatus}
                onChange={set("propertyStatus")}
                options={PROPERTY_STATUS}
              />
            </Section>

            {/* 03 — Financial Information */}
            <Section
              num="03"
              title="Financial Information"
              desc="Verify that your liquid investment capital meets our brand threshold requirements."
            >
              <Select
                label="Investment Budget Range"
                value={form.budget}
                onChange={set("budget")}
                options={BUDGET_RANGES}
              />
              <Field label="Current Employment / Occupation">
                <input
                  type="text"
                  required
                  placeholder="e.g. Business Director"
                  value={form.occupation}
                  onChange={(e) => set("occupation")(e.target.value)}
                  className={INPUT_CLS}
                />
              </Field>
            </Section>

            {/* 04 — Experience */}
            <Section
              num="04"
              title="Experience"
              desc="We value partners with previous business and hospitality track records."
            >
              <Select
                label="Do you have food industry experience?"
                value={form.experience}
                onChange={set("experience")}
                options={EXPERIENCE}
              />
              <Select
                label="Do you currently own other businesses?"
                value={form.ownBusinesses}
                onChange={set("ownBusinesses")}
                options={OWN_BUSINESSES}
              />
            </Section>

            {/* 05 — Your Vision */}
            <Section
              num="05"
              title="Your Vision for Crispies"
              desc="Tell us why you are passionate about launching a Crispies branch in your territory."
            >
              <div className="sm:col-span-2">
                <Field label="Tell us about your vision">
                  <textarea
                    required
                    rows={5}
                    placeholder="Write a brief paragraph on how you plan to manage, market, and drive success at your proposed franchise outle..."
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
                  className=" hidden"
                />
                <span
                  className="h-5 w-5 shrink-0 cursor-pointer rounded border-2 border-[#FF0931] flex items-center justify-center"
                >
                  {confirmAccurate && <Check className="text-[#FF0931]" />}
                </span>
                <span
                  className={`text-[13px] leading-[150%] text-[#3D3C3D] sm:text-[14px] ${INTER}`}
                >
                  I confirm that the financial and personal details provided are
                  accurate to the best of my knowledge.
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={agreeComms}
                  onChange={(e) => setAgreeComms(e.target.checked)}
                  className="hidden"
                />

                <span
               
                  className="h-5 w-5 shrink-0 cursor-pointer rounded border-2 border-[#FF0931] flex items-center justify-center"
                >
                  {agreeComms && <Check className="text-[#FF0931]" />}
                </span>

                <span
                  className={`text-[13px] leading-[150%] text-[#3D3C3D] sm:text-[14px] ${INTER}`}
                >
                  I agree to receive communications regarding my franchise
                  inquiries and future partnership opportunities.
                </span>
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="group flex w-full cursor-pointer items-center justify-between gap-6 rounded-[14px] bg-[#FF0931] px-6 py-6 text-white transition-colors hover:bg-[#E0082C] sm:px-9 sm:py-7"
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
                Submit Franchise Application
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
