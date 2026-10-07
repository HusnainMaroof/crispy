"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MapPin, Briefcase, ChevronDown } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-context";
import { localizedName, localizedText } from "@/lib/i18n";
import Footer from "@/app/components/store/footer";
import { hasAppliedToJob } from "@/lib/applied-jobs";
import type { StoreJobPost } from "@/lib/load-jobs";

const KOROLEV = "font-[family-name:var(--font-korolev),Korolev,sans-serif]";
const INTER = "font-[family-name:var(--font-inter),Inter,sans-serif]";

type CareerPageProps = {
  jobs: StoreJobPost[];
  /** False when the API could not be reached, so the copy can say so. */
  reachable: boolean;
};

export default function CareerPage({ jobs, reachable }: CareerPageProps) {
  const { t } = useLocale();
  const [branch, setBranch] = useState<string>("all");
  const [appliedIds, setAppliedIds] = useState<string[]>([]);
  // localStorage has no server value, so the applied badges can only resolve
  // after mount. The update is deferred to a microtask to keep it out of the
  // effect body: a synchronous setState here would render twice and the React
  // lint rule rejects it. Same shape as the menu page branch auto-select.
  useEffect(() => {
    let live = true;
    queueMicrotask(() => {
      if (!live) return;
      setAppliedIds(jobs.filter((job) => hasAppliedToJob(job.id)).map((job) => job.id));
    });
    return () => {
      live = false;
    };
  }, [jobs]);

  /**
   * Branch options come from the roles themselves rather than the branch list.
   * A branch with nothing open would otherwise be offered and then return
   * nothing, which reads as a broken filter.
   */
  const branchOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const job of jobs) {
      if (job.location_id) seen.set(job.location_id, job.location);
    }
    return [...seen.entries()].map(([id, name]) => ({ id, name }));
  }, [jobs]);

  const visible = branch === "all" ? jobs : jobs.filter((job) => job.location_id === branch);

  return (
    <>
      {/* 1. Hero */}
      <section className="w-full bg-white">
        <div className="px-6 py-20 sm:px-10 sm:py-24 md:px-12 xl:px-25">
          <h1
            className={`m-0 capitalize ${KOROLEV}`}
            style={{ fontSize: "clamp(48px, 11vw, 150px)", fontWeight: 900, lineHeight: "100%" }}
          >
            <span className="block text-black">{t("career.heroLine")}</span>
            <span className="block text-[#FF0931]">{t("career.heroAccent")}</span>
          </h1>
          <p
            className={`m-0 mt-8 max-w-[720px] capitalize text-black ${INTER}`}
            style={{ fontSize: "clamp(14px, 1.6vw, 24px)", fontWeight: 400, lineHeight: "140%" }}
          >
            {t("career.intro")}
          </p>
        </div>
      </section>

      {/* 2. Open roles */}
      <section className="w-full bg-black">
        <div className="px-6 py-20 sm:px-10 sm:py-24 md:px-12 xl:px-25">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <h2
              className={`m-0 uppercase ${KOROLEV} text-white`}
              style={{ fontSize: "clamp(36px, 7vw, 96px)", fontWeight: 900, lineHeight: "100%" }}
            >
              {t("career.openRoles")}
            </h2>

            {branchOptions.length > 1 && (
              <div className="relative shrink-0">
                <label className={`mb-2 block text-[13px] font-semibold text-white/60 ${INTER}`} htmlFor="career-branch">
                  {t("career.branch")}
                </label>
                {/* appearance-none removes the native arrow, so a chevron has to
                    replace it or the control stops reading as a dropdown. */}
                <select
                  id="career-branch"
                  value={branch}
                  onChange={(event) => setBranch(event.target.value)}
                  className={`h-[52px] min-w-[220px] appearance-none rounded-[12px] border border-white/15 bg-[#161616] pe-12 ps-5 text-[15px] text-white outline-none transition-colors focus:border-[#FF0931] ${INTER}`}
                >
                  <option value="all">{t("career.allBranches")}</option>
                  {branchOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="pointer-events-none absolute end-5 bottom-[18px] h-4 w-4 text-white/50"
                  strokeWidth={2}
                  aria-hidden
                />
              </div>
            )}
          </div>

          {!reachable ? (
            <p role="alert" className={`mt-12 text-[15px] text-[#FF0931] ${INTER}`}>
              {t("career.loadError")}
            </p>
          ) : visible.length === 0 ? (
            <div className="mt-12 rounded-[20px] border border-white/10 bg-white/5 px-6 py-14 text-center">
              <h3 className={`m-0 uppercase text-white ${KOROLEV}`} style={{ fontSize: "clamp(24px, 3vw, 40px)", fontWeight: 900, lineHeight: "100%" }}>
                {t("career.noRolesTitle")}
              </h3>
              <p className={`m-0 mx-auto mt-4 max-w-[520px] text-[15px] leading-[150%] text-white/60 ${INTER}`}>
                {t("career.noRolesBody")}
              </p>
            </div>
          ) : (
            <ul className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-2">
              {visible.map((job) => (
                <li key={job.id}>
                  <JobCard
                    job={job}
                    label={t("career.viewRole")}
                    appliedLabel={t("career.alreadyApplied")}
                    applied={appliedIds.includes(job.id)}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <Footer />
    </>
  );
}

export function JobCard({
  job,
  label,
  appliedLabel,
  applied = false,
}: {
  job: StoreJobPost;
  label: string;
  appliedLabel: string;
  applied?: boolean;
}) {
  // Job content carries Arabic columns with an English fallback, the same as
  // menu items; the type is free text and goes through the phrase map instead.
  const { locale } = useLocale();
  return (
    <Link
      href={`/career/${job.id}`}
      className="group card-hover flex h-full flex-col gap-4 rounded-[20px] border border-white/10 bg-white/5 p-7 transition-colors hover:border-white/25 sm:p-8"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className={`inline-flex items-center gap-2 rounded-full bg-[#FF0931] px-4 py-1.5 text-[13px] font-semibold text-white ${INTER}`}>
          {localizedText(locale, job.type)}
        </span>
        {applied && (
          <span className={`inline-flex items-center rounded-full bg-white/10 px-4 py-1.5 text-[13px] font-semibold text-white/70 ${INTER}`}>
            {appliedLabel}
          </span>
        )}
      </div>

      <h3 className={`m-0 uppercase text-white ${KOROLEV}`} style={{ fontSize: "clamp(24px, 2.6vw, 34px)", fontWeight: 900, lineHeight: "100%" }}>
        {localizedName(locale, job.title, job.title_ar)}
      </h3>

      <div className={`flex flex-wrap items-center gap-x-5 gap-y-2 text-[14px] text-white/50 ${INTER}`}>
        <span className="inline-flex items-center gap-2">
          <MapPin className="h-4 w-4 shrink-0" strokeWidth={1.5} aria-hidden />
          {localizedText(locale, job.location)}
        </span>
        <span className="inline-flex items-center gap-2">
          <Briefcase className="h-4 w-4 shrink-0" strokeWidth={1.5} aria-hidden />
          {job.salary}
        </span>
      </div>

      <p className={`m-0 line-clamp-2 text-[15px] leading-[150%] text-white/50 ${INTER}`}>
        {localizedName(locale, job.description, job.description_ar)}
      </p>

      <span className={`mt-auto inline-flex items-center gap-2 pt-2 text-[15px] font-semibold text-[#FF0931] ${INTER}`}>
        {label}
        <span aria-hidden className="transition-transform duration-200 group-hover:translate-x-1 rtl:group-hover:-translate-x-1">
          &rarr;
        </span>
      </span>
    </Link>
  );
}
