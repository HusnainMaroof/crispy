"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const ROLES = [
  {
    title: "Kitchen Team Member",
    type: "Full-time / Part-time",
    description:
      "Work the line, prep fresh ingredients, and deliver orders that meet our quality standards. No experience needed — we train you properly.",
  },
  {
    title: "Shift Leader",
    type: "Full-time",
    description:
      "Lead shifts, manage the kitchen flow, and ensure every customer leaves happy. You'll be the backbone of the team.",
  },
  {
    title: "Store Manager",
    type: "Full-time",
    description:
      "Run a full Crispies location. P&L ownership, team development, and ops management. For people who want to build something.",
  },
  {
    title: "Delivery Rider",
    type: "Flexible hours",
    description:
      "Get food to customers fast. Flexible shifts, competitive pay, and a team that has your back.",
  },
];

const PERKS = [
  "Free meals on every shift",
  "Flexible scheduling",
  "Real career progression",
  "Staff discount across all locations",
  "Training from day one",
  "Team events and socials",
];

export default function CareersPage() {
  const pageRef = useRef<HTMLDivElement>(null);
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
          <div className="mt-12 flex flex-col gap-4">
            {ROLES.map((role) => (
              <div
                key={role.title}
                className="fade-up rounded-2xl border border-white/10 p-6 transition-colors hover:border-brand-red/40"
              >
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="font-[family-name:var(--font-bebas)] text-2xl tracking-wide text-white">
                    {role.title}
                  </h3>
                  <span className="text-xs font-medium text-brand-red">
                    {role.type}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-white/50">
                  {role.description}
                </p>
              </div>
            ))}
          </div>
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
          className="fade-up mt-8 inline-block rounded-full bg-brand-red px-10 py-4 font-semibold text-white transition-colors hover:bg-red-700"
        >
          Apply Now
        </a>
      </section>
    </div>
  );
}
