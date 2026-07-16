"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const VALUES = [
  {
    title: "Halal by Default",
    description:
      "Every item on our menu is 100% halal. No compromises, no exceptions. We work with certified suppliers who share our commitment to quality and traceability.",
  },
  {
    title: "Fresh, Never Frozen",
    description:
      "Our chicken is delivered fresh daily. Our burgers are hand-formed. Our sides are made from scratch. Freshness isn't a marketing line — it's how we operate.",
  },
  {
    title: "Made for London",
    description:
      "We built Crispies for London's fast-paced lifestyle. Quick service, bold flavours, and a menu designed for the way this city actually eats.",
  },
  {
    title: "Community First",
    description:
      "We hire locally, source locally, and give back locally. Every Crispies location is embedded in the community it serves.",
  },
];

export default function AboutPage() {
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
          About Crispies
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/60">
          Born in London. Built on flavour. Crispies started with one simple
          idea: halal fast food that actually tastes good — made fresh, served
          fast, and priced fairly.
        </p>
      </section>

      {/* Story */}
      <section className="mx-auto max-w-5xl px-6 pb-24">
        <div className="fade-up grid gap-12 md:grid-cols-2">
          <div>
            <h2 className="font-[family-name:var(--font-bebas)] text-4xl tracking-wide text-white">
              Our Story
            </h2>
            <p className="mt-4 text-base leading-relaxed text-white/60">
              Crispies was founded with a clear mission: serve the best halal
              burgers and chicken in London, without the long waits or the
              inflated prices. We saw a gap in the market for fast food that
              respects both quality and community.
            </p>
            <p className="mt-4 text-base leading-relaxed text-white/60">
              From our first location, we&apos;ve grown by doing the simple things
              right. Fresh chicken, hand-formed patties, house-made sauces, and a
              team that genuinely cares about every order. No shortcuts. No
              compromises.
            </p>
          </div>
          <div className="flex flex-col gap-6">
            <div className="rounded-2xl bg-white/5 p-8">
              <span className="font-[family-name:var(--font-bebas)] text-5xl text-brand-red">
                100%
              </span>
              <p className="mt-2 text-sm text-white/50">Halal certified</p>
            </div>
            <div className="rounded-2xl bg-white/5 p-8">
              <span className="font-[family-name:var(--font-bebas)] text-5xl text-brand-red">
                Fresh
              </span>
              <p className="mt-2 text-sm text-white/50">
                Delivered daily, never frozen
              </p>
            </div>
            <div className="rounded-2xl bg-white/5 p-8">
              <span className="font-[family-name:var(--font-bebas)] text-5xl text-brand-red">
                London
              </span>
              <p className="mt-2 text-sm text-white/50">
                Built for the city, by the city
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="border-t border-white/10 px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="fade-up font-[family-name:var(--font-bebas)] text-4xl tracking-wide text-white text-center">
            What We Stand For
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-2">
            {VALUES.map((v) => (
              <div
                key={v.title}
                className="fade-up rounded-2xl bg-white/5 p-8 transition-colors hover:bg-white/10"
              >
                <h3 className="font-[family-name:var(--font-bebas)] text-2xl tracking-wide text-brand-red">
                  {v.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-white/60">
                  {v.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-white/10 px-6 py-24 text-center">
        <h2 className="fade-up font-[family-name:var(--font-bebas)] text-4xl tracking-wide text-white">
          Hungry Yet?
        </h2>
        <p className="fade-up mt-4 text-white/50">
          Taste the difference fresh makes.
        </p>
        <a
          href="/menu"
          className="fade-up mt-8 inline-block rounded-full bg-brand-red px-10 py-4 font-semibold text-white transition-colors hover:bg-red-700"
        >
          View Menu
        </a>
      </section>
    </div>
  );
}
