"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef, useState } from "react";
import { api } from "@/lib/api";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export default function ContactPage() {
  const pageRef = useRef<HTMLDivElement>(null);
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useGSAP(
    () => {
      if (reduced) return;
      gsap.utils.toArray<HTMLElement>(".fade-up").forEach((el) => {
        gsap.from(el, {
          y: 40,
          opacity: 0,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 85%", once: true },
        });
      });
    },
    { scope: pageRef }
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.post("/contact", { name, email, subject, message, type: "general" });
      setSubmitted(true);
    } catch {
      alert("Something went wrong. Please try again.");
    }
  }

  return (
    <div ref={pageRef} className="min-h-screen bg-black">
      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center px-6 pt-32 pb-20 text-center">
        <h1 className="font-[family-name:var(--font-bebas)] text-[clamp(3rem,8vw,7rem)] leading-none tracking-[0.04em] text-white">
          Contact Us
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/60">
          Got a question, feedback, or just want to say hi? We&apos;d love to
          hear from you.
        </p>
      </section>

      {/* Form + Info */}
      <section className="mx-auto max-w-5xl px-6 pb-24">
        <div className="grid gap-12 md:grid-cols-2">
          {/* Form */}
          <div className="fade-up">
            {submitted ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-12 text-center">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-brand-red/20">
                  <svg
                    className="h-8 w-8 text-brand-red"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h3 className="font-[family-name:var(--font-bebas)] text-3xl tracking-wide text-white">
                  Message Sent
                </h3>
                <p className="mt-3 text-sm text-white/50">
                  Thanks for reaching out. We&apos;ll get back to you within 24
                  hours.
                </p>
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setName("");
                    setEmail("");
                    setSubject("");
                    setMessage("");
                  }}
                  className="mt-6 cursor-pointer rounded-full border border-white/20 px-6 py-2.5 text-sm text-white transition-all duration-200 hover:border-white/40 active:scale-95"
                >
                  Send Another
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div>
                  <label
                    htmlFor="name"
                    className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-white/50"
                  >
                    Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-brand-red/50"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label
                    htmlFor="email"
                    className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-white/50"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-brand-red/50"
                    placeholder="you@email.com"
                  />
                </div>
                <div>
                  <label
                    htmlFor="subject"
                    className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-white/50"
                  >
                    Subject
                  </label>
                  <input
                    id="subject"
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-brand-red/50"
                    placeholder="What's this about?"
                  />
                </div>
                <div>
                  <label
                    htmlFor="message"
                    className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-white/50"
                  >
                    Message
                  </label>
                  <textarea
                    id="message"
                    required
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-brand-red/50"
                    placeholder="Tell us more..."
                  />
                </div>
                <button
                  type="submit"
                  className="mt-2 w-full cursor-pointer rounded-full bg-brand-red py-4 font-semibold text-white transition-all duration-300 hover:bg-red-700 hover:scale-[1.02] active:scale-95"
                >
                  Send Message
                </button>
              </form>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col gap-8">
            <div className="fade-up rounded-2xl bg-white/5 p-6">
              <span className="text-xs font-semibold uppercase tracking-widest text-brand-red">
                General Enquiries
              </span>
              <p className="mt-2 text-sm text-white/70">
                hello@crispies.co.uk
              </p>
            </div>
            <div className="fade-up rounded-2xl bg-white/5 p-6">
              <span className="text-xs font-semibold uppercase tracking-widest text-brand-red">
                Order Support
              </span>
              <p className="mt-2 text-sm text-white/70">
                support@crispies.co.uk
              </p>
            </div>
            <div className="fade-up rounded-2xl bg-white/5 p-6">
              <span className="text-xs font-semibold uppercase tracking-widest text-brand-red">
                Franchise
              </span>
              <p className="mt-2 text-sm text-white/70">
                franchise@crispies.co.uk
              </p>
            </div>
            <div className="fade-up rounded-2xl bg-white/5 p-6">
              <span className="text-xs font-semibold uppercase tracking-widest text-brand-red">
                Press
              </span>
              <p className="mt-2 text-sm text-white/70">
                press@crispies.co.uk
              </p>
            </div>
            <div className="fade-up rounded-2xl bg-white/5 p-6">
              <span className="text-xs font-semibold uppercase tracking-widest text-brand-red">
                Phone
              </span>
              <p className="mt-2 text-sm text-white/70">
                +44 20 7946 0000
              </p>
              <p className="mt-1 text-xs text-white/40">
                Mon–Sun, 10:00 AM – 10:00 PM
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
