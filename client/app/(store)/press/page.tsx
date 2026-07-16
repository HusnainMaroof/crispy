"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const MENTIONS = [
  {
    outlet: "Time Out London",
    headline: "Crispies Is Redefining Halal Fast Food in London",
    date: "March 2025",
    excerpt:
      "With bold flavours, fresh ingredients, and a no-nonsense approach to quality, Crispies has quickly become one of London's most talked-about new fast-food arrivals.",
    url: "#",
  },
  {
    outlet: "Evening Standard",
    headline: "The Halal Burger Joint That's Packing Out Every Night",
    date: "January 2025",
    excerpt:
      "Lines out the door, five-star reviews, and a cult following on social media. Crispies is doing something different — and London is paying attention.",
    url: "#",
  },
  {
    outlet: "The Guardian",
    headline: "Fast Food, Done Right: London's Crispies Leads the Way",
    date: "November 2024",
    excerpt:
      "In a market dominated by global chains, Crispies proves that local, halal, and genuinely fresh can compete — and win.",
    url: "#",
  },
  {
    outlet: "BBC News",
    headline: "How a Small Halal Brand Became London's Fastest-Growing Restaurant",
    date: "September 2024",
    excerpt:
      "From one location to 23 in under two years. Crispies' growth story is fuelled by community, quality, and a menu that keeps people coming back.",
    url: "#",
  },
];

const STATS = [
  { value: "50+", label: "Press features" },
  { value: "23", label: "Locations" },
  { value: "4.8", label: "Average review score" },
  { value: "1M+", label: "Orders served" },
];

export default function PressPage() {
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
          Press
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/60">
          Crispies in the news. What people are saying about London&apos;s
          fastest-growing halal restaurant brand.
        </p>
      </section>

      {/* Stats */}
      <section className="mx-auto max-w-4xl px-6 pb-20">
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {STATS.map((s) => (
            <div
              key={s.label}
              className="fade-up rounded-2xl bg-white/5 p-6 text-center"
            >
              <span className="font-[family-name:var(--font-bebas)] text-4xl text-brand-red">
                {s.value}
              </span>
              <p className="mt-2 text-xs text-white/50">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Mentions */}
      <section className="border-t border-white/10 px-6 py-24">
        <div className="mx-auto max-w-3xl">
          <h2 className="fade-up font-[family-name:var(--font-bebas)] text-4xl tracking-wide text-white text-center">
            In the Media
          </h2>
          <div className="mt-12 flex flex-col gap-6">
            {MENTIONS.map((m) => (
              <a
                key={m.headline}
                href={m.url}
                className="fade-up block rounded-2xl border border-white/10 p-6 transition-colors hover:border-brand-red/40"
              >
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-xs font-semibold uppercase tracking-widest text-brand-red">
                    {m.outlet}
                  </span>
                  <span className="text-xs text-white/40">{m.date}</span>
                </div>
                <h3 className="mt-3 font-[family-name:var(--font-bebas)] text-xl tracking-wide text-white">
                  {m.headline}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-white/50">
                  {m.excerpt}
                </p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="border-t border-white/10 px-6 py-24 text-center">
        <h2 className="fade-up font-[family-name:var(--font-bebas)] text-4xl tracking-wide text-white">
          Media Enquiries
        </h2>
        <p className="fade-up mt-4 text-white/50">
          For press inquiries, interviews, or assets, reach out to{" "}
          <span className="text-brand-red">press@crispies.co.uk</span>
        </p>
      </section>
    </div>
  );
}
