"use client";

import { useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { ArrowLeft, MapPin, Briefcase, Upload } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-context";
import { localizedName, localizedText } from "@/lib/i18n";
import Footer from "@/app/components/store/footer";
import { api } from "@/lib/api";
import { markJobApplied } from "@/lib/applied-jobs";
import type { StoreJobPost } from "@/lib/load-jobs";

const KOROLEV = "font-[family-name:var(--font-korolev),Korolev,sans-serif]";
const INTER = "font-[family-name:var(--font-inter),Inter,sans-serif]";

const INPUT =
  "w-full rounded-[12px] border border-[#C4C4C4] bg-white px-5 py-4 text-[15px] text-black placeholder-black/30 outline-none transition-colors focus:border-[#FF0931]";

/** Mirrors the file filter on POST /api/jobs/cv, so a wrong pick is refused
 * at the field instead of after an upload that would be rejected. */
const CV_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const CV_ACCEPT =
  ".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const MAX_CV_BYTES = 5 * 1024 * 1024;

/**
 * Date only. `formatDate` in lib/i18n adds a time, which reads oddly next to
 * "Posted". Intl locale has to be resolved here because `intlLocale` is private
 * to that module.
 */
function formatDay(value: string, locale: string): string {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en-GB", { dateStyle: "medium" }).format(
    new Date(value)
  );
}

type Status = "idle" | "sending" | "sent";

export default function CareerDetailPage({ job }: { job: StoreJobPost }) {
  const { locale, t } = useLocale();
  const [status, setStatus] = useState<Status>("idle");
  // Split out from `status` so the button can say which half of the wait the
  // visitor is sitting through: the CV upload or the application itself.
  const [uploading, setUploading] = useState(false);
  // `field` drives aria-invalid on the CV inputs only. A name or email problem
  // used to mark the CV field invalid as well, which pointed the screen reader
  // at the wrong input.
  const [error, setError] = useState<{ message: string; field: "cv" | "form" } | null>(null);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    applicant_name: "",
    email: "",
    phone: "",
    cover_letter: "",
  });

  const update = (key: keyof typeof form, value: string) => {
    setForm((previous) => ({ ...previous, [key]: value }));
    if (error) setError(null);
  };

  const pickCv = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (file && (!CV_TYPES.includes(file.type) || file.size > MAX_CV_BYTES)) {
      setError({ message: t("career.errorCvFile"), field: "cv" });
      event.target.value = "";
      return;
    }
    setCvFile(file);
    if (error) setError(null);
  };

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const name = form.applicant_name.trim();
    const email = form.email.trim();

    // Same checks the server enforces, so the visitor gets the message in the
    // page language instead of a raw 400 body.
    if (!name || !email) {
      setError({ message: t("career.errorRequired"), field: "form" });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError({ message: t("career.errorEmail"), field: "form" });
      return;
    }
    // The CV is a file upload only, and the server requires it, because a
    // CV-less application cannot be shortlisted. The form sends back the URL of
    // the file the server stored.
    if (!cvFile) {
      setError({ message: t("career.errorCvRequired"), field: "cv" });
      return;
    }

    setStatus("sending");
    setError(null);
    setUploading(true);
    let cvUrl = "";
    try {
      const body = new FormData();
      body.append("file", cvFile);
      cvUrl = (await api.upload<{ url: string }>("/jobs/cv", body)).url;
    } catch {
      setStatus("idle");
      setError({ message: t("career.errorCvUpload"), field: "cv" });
      return;
    } finally {
      setUploading(false);
    }
    try {
      await api.post(`/jobs/${encodeURIComponent(job.id)}/apply`, {
        applicant_name: name,
        email,
        phone: form.phone.trim() || undefined,
        cv_url: cvUrl,
        cover_letter: form.cover_letter.trim() || undefined,
      });
      markJobApplied(job.id);
      setStatus("sent");
      toast.success(t("career.sentTitle"));
    } catch {
      setStatus("idle");
      setError({ message: t("career.errorGeneric"), field: "form" });
    }
  }

  // Job content carries Arabic columns with an English fallback, the same as
  // menu items. The requirements list is translated whole or not at all: a
  // half-translated list would misquote the role.
  const shownTitle = localizedName(locale, job.title, job.title_ar);
  const requirementItems = job.requirements_ar.length > 0 ? job.requirements_ar : job.requirements;

  if (status === "sent") {
    return (
      <>
        <section className="w-full bg-white">
          <div className="px-6 py-24 sm:px-10 md:px-12 xl:px-25">
            <div className="w-[90%] xl:w-[70%] mx-auto rounded-4xl border-2 border-[#C4C4C4] bg-[#FEFEFE] px-8 py-14 text-center sm:px-14">
              <h1
                className={`m-0 uppercase text-black ${KOROLEV}`}
                style={{ fontSize: "clamp(32px, 6vw, 80px)", fontWeight: 900, lineHeight: "100%" }}
              >
                {t("career.sentTitle")}
              </h1>
              <p className={`m-0 mx-auto mt-6 max-w-[560px] text-[16px] leading-[150%] text-black/60 ${INTER}`}>
                {t("career.sentBody", { job: shownTitle, branch: localizedText(locale, job.location) })}
              </p>
              <Link
                href="/career"
                className={`btn-press mt-10 inline-flex items-center gap-3 rounded-[12px] bg-[#FF0931] px-8 py-5 text-white transition-colors hover:bg-[#E0082C] ${INTER} text-[16px] font-semibold`}
              >
                <ArrowLeft className="h-5 w-5 rtl:rotate-180" strokeWidth={2} aria-hidden />
                {t("career.another")}
              </Link>
            </div>
          </div>
        </section>
        <Footer />
      </>
    );
  }

  return (
    <>
      {/* 1. Role header */}
      <section className="w-full bg-white">
        <div className="px-6 py-16 sm:px-10 sm:py-20 md:px-12 xl:px-25">
          <span className={`inline-flex items-center rounded-full bg-[#FF0931] px-5 py-2 text-[13px] font-semibold text-white ${INTER}`}>
            {localizedText(locale, job.type)}
          </span>

          <h1
            className={`m-0 mt-5 uppercase text-black ${KOROLEV}`}
            style={{ fontSize: "clamp(40px, 8vw, 110px)", fontWeight: 900, lineHeight: "100%" }}
          >
            {shownTitle}
          </h1>

          <div className={`mt-8 flex flex-wrap items-center gap-x-8 gap-y-3 text-[16px] text-black/60 ${INTER}`}>
            <span className="inline-flex items-center gap-2">
              <MapPin className="h-5 w-5 shrink-0" strokeWidth={1.5} aria-hidden />
              {localizedText(locale, job.location)}
            </span>
            <span className="inline-flex items-center gap-2">
              <Briefcase className="h-5 w-5 shrink-0" strokeWidth={1.5} aria-hidden />
              {job.salary}
            </span>
            {job.created_at && (
              <span>
                {t("career.posted")} {formatDay(job.created_at, locale)}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* 2. Role detail + apply form */}
      <section className="w-full bg-black">
        <div className="px-6 py-16 sm:px-10 sm:py-20 md:px-12 xl:px-25">
          <div className="flex flex-col gap-14 lg:flex-row lg:gap-20">
            <div className="w-full lg:w-1/2">
              <h2
                className={`m-0 uppercase text-white ${KOROLEV}`}
                style={{ fontSize: "clamp(26px, 3.4vw, 44px)", fontWeight: 900, lineHeight: "100%" }}
              >
                {t("career.aboutRole")}
              </h2>
              <p className={`m-0 mt-6 text-[16px] leading-[160%] text-white/70 ${INTER}`}>
                {localizedName(locale, job.description, job.description_ar)}
              </p>

              {requirementItems.length > 0 && (
                <>
                  <h2
                    className={`m-0 mt-12 uppercase text-white ${KOROLEV}`}
                    style={{ fontSize: "clamp(26px, 3.4vw, 44px)", fontWeight: 900, lineHeight: "100%" }}
                  >
                    {t("career.requirements")}
                  </h2>
                  <ul className="mt-6 flex flex-col gap-4">
                    {requirementItems.map((item) => (
                      <li key={item} className={`flex gap-3 text-[16px] leading-[150%] text-white/70 ${INTER}`}>
                        <span aria-hidden className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#FF0931]" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>

            <div className="w-full lg:w-1/2">
              <div className="rounded-[20px] bg-white p-7 sm:p-10">
                <h2
                  className={`m-0 uppercase text-black ${KOROLEV}`}
                  style={{ fontSize: "clamp(26px, 3.4vw, 44px)", fontWeight: 900, lineHeight: "100%" }}
                >
                  {t("career.applyNow")}
                </h2>
                <p className={`m-0 mt-4 text-[15px] leading-[150%] text-black/60 ${INTER}`}>{t("career.applyIntro")}</p>

                {/* noValidate so the browser does not short-circuit submit with its
                    own English-only bubbles; the messages come from `career.*` keys. */}
                <form onSubmit={handleSubmit} noValidate className="mt-8 flex flex-col gap-5">
                  <Field label={t("career.nameLabel")} id="career-name">
                    <input
                      id="career-name"
                      type="text"
                      autoComplete="name"
                      required
                      value={form.applicant_name}
                      onChange={(event) => update("applicant_name", event.target.value)}
                      className={INPUT}
                    />
                  </Field>

                  <Field label={t("career.emailLabel")} id="career-email">
                    <input
                      id="career-email"
                      type="email"
                      autoComplete="email"
                      required
                      value={form.email}
                      onChange={(event) => update("email", event.target.value)}
                      className={INPUT}
                    />
                  </Field>

                  <Field label={t("career.phoneLabel")} id="career-phone">
                    <input
                      id="career-phone"
                      type="tel"
                      autoComplete="tel"
                      value={form.phone}
                      onChange={(event) => update("phone", event.target.value)}
                      className={INPUT}
                    />
                  </Field>

                  <Field label={t("career.cvLabel")} id="career-cv" hint={t("career.cvHint")}>
                    <div className="flex flex-col gap-3">
                      <input
                        id="career-cv"
                        type="file"
                        accept={CV_ACCEPT}
                        className="sr-only"
                        onChange={pickCv}
                        aria-invalid={error?.field === "cv"}
                      />
                      {cvFile ? (
                        <div className="flex items-center justify-between gap-3 rounded-[12px] border border-[#C4C4C4] bg-white px-5 py-4">
                          <span className={`min-w-0 truncate text-[15px] text-black ${INTER}`}>{cvFile.name}</span>
                          <button
                            type="button"
                            onClick={() => setCvFile(null)}
                            className={`shrink-0 cursor-pointer text-[13px] font-semibold text-[#FF0931] transition-colors hover:text-[#E0082C] ${INTER}`}
                          >
                            {t("career.cvRemove")}
                          </button>
                        </div>
                      ) : (
                        <label
                          htmlFor="career-cv"
                          className={`flex cursor-pointer items-center justify-center gap-3 rounded-[12px] border border-dashed border-[#C4C4C4] px-5 py-4 text-[15px] text-black/60 transition-colors hover:border-[#FF0931] hover:text-[#FF0931] ${INTER}`}
                        >
                          <Upload className="h-5 w-5 shrink-0" strokeWidth={1.5} aria-hidden />
                          {t("career.cvUpload")}
                        </label>
                      )}
                    </div>
                  </Field>

                  <Field label={t("career.coverLabel")} id="career-cover">
                    <textarea
                      id="career-cover"
                      rows={4}
                      value={form.cover_letter}
                      onChange={(event) => update("cover_letter", event.target.value)}
                      className={INPUT}
                    />
                  </Field>

                  {error && (
                    <p role="alert" className={`m-0 rounded-[10px] border border-[#FF0931]/30 bg-[#FF0931]/10 px-4 py-3 text-[14px] text-[#C4001F] ${INTER}`}>
                      {error.message}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={status === "sending"}
                    className={`group mt-2 flex w-full items-center justify-between gap-4 rounded-[14px] px-7 py-5 text-white transition-colors ${
                      status === "sending" ? "cursor-not-allowed bg-[#B8B8B8]" : "cursor-pointer bg-[#FF0931] hover:bg-[#E0082C]"
                    }`}
                  >
                    <span className={`text-[16px] font-semibold uppercase ${INTER}`}>
                      {status === "sending"
                        ? uploading
                          ? t("career.cvUploading")
                          : t("career.sending")
                        : t("career.submit")}
                    </span>
                    <span aria-hidden>&rarr;</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}

function Field({
  label,
  id,
  hint,
  children,
}: {
  label: string;
  id: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className={`mb-2 block text-[14px] font-semibold text-black ${INTER}`}>
        {label}
      </label>
      {children}
      {hint && <p className={`mt-2 text-[13px] leading-[140%] text-black/45 ${INTER}`}>{hint}</p>}
    </div>
  );
}
