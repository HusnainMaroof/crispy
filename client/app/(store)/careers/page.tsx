"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { getAppliedJobIds } from "@/lib/applied-jobs";
import type { JobPost } from "@/lib/redux/types";
import { useScrollReveal } from "@/lib/use-scroll-reveal";

const PERKS = [
  "Free meals on every shift",
  "Flexible scheduling",
  "Real career progression",
  "Staff discount across all locations",
  "Training from day one",
  "Team events and socials",
];

export default function CareersPage() {
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [appliedIds, setAppliedIds] = useState<string[]>([]);
  const pageRef = useScrollReveal("top 88%", [jobs]);

  useEffect(() => {
    api
      .get<JobPost[]>("/store/jobs")
      .then((data) => {
        setJobs(data);
        setAppliedIds(getAppliedJobIds());
      })
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div ref={pageRef} className="min-h-screen bg-black">
      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center px-6 pt-32 pb-20 text-center">
        <h1 className="font-[family-name:var(--font-bebas)] text-[clamp(3rem,8vw,7rem)] leading-none tracking-[0.04em] text-white">
          Work at Crispies
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/60">
          We&apos;re building something special and we need people who want to grow
          with us. No experience barriers — just energy, reliability, and a
          willingness to learn.
        </p>
      </section>

      {/* Perks */}
      <section className="mx-auto max-w-5xl px-6 pb-20">
        <h2 className="fade-up font-[family-name:var(--font-bebas)] text-3xl tracking-wide text-white text-center">
          Why Work Here
        </h2>
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {PERKS.map((perk) => (
            <div
              key={perk}
              className="fade-up rounded-xl bg-white/5 px-6 py-5 text-center text-sm text-white/70"
            >
              {perk}
            </div>
          ))}
        </div>
      </section>

      {/* Open Roles */}
      <section className="border-t border-white/10 px-6 py-24">
        <div className="mx-auto max-w-3xl">
          <h2 className="fade-up font-[family-name:var(--font-bebas)] text-4xl tracking-wide text-white text-center">
            Open Roles
          </h2>

          {loading ? (
            <div className="mt-12 flex flex-col gap-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="animate-pulse rounded-2xl border border-white/10 p-6"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="h-6 w-48 rounded bg-white/10" />
                    <div className="h-4 w-24 rounded bg-white/10" />
                  </div>
                  <div className="mt-3 h-4 w-full rounded bg-white/5" />
                </div>
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <div className="mt-12 text-center">
              <p className="text-lg text-white/40">
                No open positions right now. Check back soon!
              </p>
            </div>
          ) : (
            <div className="mt-12 flex flex-col gap-4">
              {jobs.map((job) => {
                const applied = appliedIds.includes(job.id);
                return (
                <Link
                  key={job.id}
                  href={`/careers/${job.id}`}
                  className="fade-up group rounded-2xl border border-white/10 p-6 transition-all duration-300 hover:border-brand-red/40 hover:bg-white/[0.02]"
                >
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <h3 className="font-[family-name:var(--font-bebas)] text-2xl tracking-wide text-white transition-colors group-hover:text-brand-red">
                        {job.title}
                      </h3>
                      {applied && (
                        <span className="rounded-full bg-green-500/15 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-green-400">
                          Applied
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium text-brand-red">
                        {job.type}
                      </span>
                      <span className="text-xs text-white/30">
                        {job.location}
                      </span>
                    </div>
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-white/50">
                    {job.description}
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-white/30 transition-colors group-hover:text-brand-red">
                    {applied ? "View Application" : "View Details"}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="transition-transform group-hover:translate-x-1"
                    >
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
                  </div>
                </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-white/10 px-6 py-24 text-center">
        <h2 className="fade-up font-[family-name:var(--font-bebas)] text-4xl tracking-wide text-white">
          Ready to Join?
        </h2>
        <p className="fade-up mt-4 text-white/50">
          Send your CV and a short note to{" "}
          <span className="text-brand-red">careers@crispies.co.uk</span>
        </p>
        <a
          href="mailto:careers@crispies.co.uk"
          className="fade-up mt-8 inline-block rounded-full bg-brand-red px-10 py-4 font-semibold text-white transition-all duration-300 hover:bg-red-700 hover:scale-105 active:scale-95 cursor-pointer"
        >
          Apply Now
        </a>
      </section>
    </div>
  );
}
