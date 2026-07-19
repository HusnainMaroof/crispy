"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { hasAppliedToJob, markJobApplied } from "@/lib/applied-jobs";
import type { JobPost } from "@/lib/redux/types";
import { useScrollReveal } from "@/lib/use-scroll-reveal";

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [job, setJob] = useState<JobPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const pageRef = useScrollReveal("top 88%", [job]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [cvUrl, setCvUrl] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const alreadyApplied = useMemo(() => hasAppliedToJob(id), [id]);

  useEffect(() => {
    api
      .get<JobPost>(`/store/jobs/${id}`)
      .then(setJob)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!job) return;
    setSubmitting(true);
    setSubmitError("");

    try {
      await api.post(`/jobs/${job.id}/apply`, {
        applicant_name: name,
        email,
        phone: phone || undefined,
        cv_url: cvUrl || undefined,
        cover_letter: coverLetter || undefined,
      });
      markJobApplied(job.id);
      toast.success("Application sent!");
      setTimeout(() => router.push("/careers"), 800);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black px-6 pt-32">
        <div className="mx-auto max-w-3xl animate-pulse">
          <div className="h-8 w-48 rounded bg-white/10" />
          <div className="mt-4 h-4 w-32 rounded bg-white/5" />
          <div className="mt-8 h-4 w-full rounded bg-white/5" />
          <div className="mt-3 h-4 w-3/4 rounded bg-white/5" />
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-black px-6 pt-32 text-center">
        <h1 className="font-[family-name:var(--font-bebas)] text-5xl text-white">
          Job Not Found
        </h1>
        <p className="mt-4 text-white/50">
          This position may have been filled or removed.
        </p>
        <Link
          href="/careers"
          className="mt-8 inline-block rounded-full border border-white/20 px-8 py-3 text-sm font-semibold text-white transition-colors hover:border-brand-red hover:text-brand-red"
        >
          Back to Careers
        </Link>
      </div>
    );
  }

  return (
    <div ref={pageRef} className="min-h-screen bg-black">
      {/* Header */}
      <section className="px-6 pt-32 pb-16">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/careers"
            className="fade-up mb-8 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-white/40 transition-colors hover:text-white"
          >
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
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
            All Roles
          </Link>

          <h1 className="fade-up font-[family-name:var(--font-bebas)] text-[clamp(2.5rem,6vw,5rem)] leading-none tracking-wide text-white">
            {job.title}
          </h1>

          <div className="fade-up mt-4 flex flex-wrap items-center gap-4 text-sm">
            <span className="rounded-full bg-brand-red/15 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-brand-red">
              {job.type}
            </span>
            <span className="text-white/50">{job.location}</span>
            <span className="text-white/50">{job.salary}</span>
          </div>
        </div>
      </section>

      {/* Job Details */}
      <section className="border-t border-white/10 px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="fade-up font-[family-name:var(--font-bebas)] text-3xl tracking-wide text-white">
            About The Role
          </h2>
          <p className="fade-up mt-6 whitespace-pre-line text-base leading-relaxed text-white/60">
            {job.description}
          </p>

          {job.requirements.length > 0 && (
            <div className="fade-up mt-10">
              <h3 className="font-[family-name:var(--font-bebas)] text-2xl tracking-wide text-white">
                Requirements
              </h3>
              <ul className="mt-4 space-y-3">
                {job.requirements.map((req, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-white/60">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-red" />
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      {/* Application Form */}
      <section className="border-t border-white/10 px-6 py-24">
        <div className="mx-auto max-w-3xl">
          <h2 className="fade-up font-[family-name:var(--font-bebas)] text-4xl tracking-wide text-white">
            {alreadyApplied ? "You've Applied" : `Apply for ${job.title}`}
          </h2>
          <p className="fade-up mt-3 text-white/50">
            {alreadyApplied
              ? "You've already submitted an application for this role. We'll be in touch!"
              : "Fill out the form below and we'll be in touch."}
          </p>

          {alreadyApplied ? (
            <div className="fade-up mt-10">
              <Link
                href="/careers"
                className="inline-block rounded-full border border-white/20 px-8 py-3 text-sm font-semibold text-white transition-colors hover:border-brand-red hover:text-brand-red"
              >
                Browse More Roles
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="fade-up mt-10 space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="name" className="mb-2 block text-xs font-semibold uppercase tracking-widest text-white/40">
                    Full Name *
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none transition-colors focus:border-brand-red/60"
                    placeholder="Jane Doe"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="mb-2 block text-xs font-semibold uppercase tracking-widest text-white/40">
                    Email *
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none transition-colors focus:border-brand-red/60"
                    placeholder="jane@example.com"
                  />
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="phone" className="mb-2 block text-xs font-semibold uppercase tracking-widest text-white/40">
                    Phone
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none transition-colors focus:border-brand-red/60"
                    placeholder="+44 7123 456789"
                  />
                </div>
                <div>
                  <label htmlFor="cv" className="mb-2 block text-xs font-semibold uppercase tracking-widest text-white/40">
                    CV URL
                  </label>
                  <input
                    id="cv"
                    type="url"
                    value={cvUrl}
                    onChange={(e) => setCvUrl(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none transition-colors focus:border-brand-red/60"
                    placeholder="https://drive.google.com/..."
                  />
                  <p className="mt-1.5 text-[11px] text-white/30">
                    Link to your CV (Google Drive, Dropbox, etc.)
                  </p>
                </div>
              </div>

              <div>
                <label htmlFor="cover" className="mb-2 block text-xs font-semibold uppercase tracking-widest text-white/40">
                  Cover Letter
                </label>
                <textarea
                  id="cover"
                  rows={5}
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none transition-colors focus:border-brand-red/60"
                  placeholder="Tell us why you'd be a great fit…"
                />
              </div>

              {submitError && (
                <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {submitError}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-full bg-brand-red px-6 py-4 text-sm font-bold uppercase tracking-widest text-white shadow-[0_20px_60px_-15px_rgba(220,38,38,0.7)] transition-all duration-300 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Sending…" : "Submit Application"}
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
