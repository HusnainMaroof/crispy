"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef, useState } from "react";
import { LOCATIONS } from "@/lib/data/locations";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export default function FindUsPage() {
  const pageRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState(0);
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
          Find Us
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/60">
          Six locations across London, with more on the way. Find your nearest
          Crispies and come hungry.
        </p>
      </section>

      {/* Locations */}
      <section className="mx-auto max-w-5xl px-6 pb-24">
        <div className="grid gap-8 md:grid-cols-2">
          {/* Location list */}
          <div className="flex flex-col gap-3">
            {LOCATIONS.map((loc, i) => (
              <button
                key={loc.name}
                onClick={() => setSelected(i)}
                className={`fade-up w-full rounded-2xl border p-5 text-left transition-all ${
                  selected === i
                    ? "border-brand-red bg-brand-red/10"
                    : "border-white/10 bg-white/5 hover:border-white/20"
                }`}
              >
                <h3 className="font-[family-name:var(--font-bebas)] text-xl tracking-wide text-white">
                  {loc.name}
                </h3>
                <p className="mt-1 text-sm text-white/50">{loc.address}</p>
              </button>
            ))}
          </div>

          {/* Detail card */}
          <div className="fade-up">
            <div className="sticky top-28 rounded-2xl border border-white/10 bg-white/5 p-8">
              <h2 className="font-[family-name:var(--font-bebas)] text-3xl tracking-wide text-white">
                {LOCATIONS[selected].name}
              </h2>
              <div className="mt-6 flex flex-col gap-4">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-widest text-brand-red">
                    Address
                  </span>
                  <p className="mt-1 text-sm text-white/70">
                    {LOCATIONS[selected].address}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase tracking-widest text-brand-red">
                    Hours
                  </span>
                  <p className="mt-1 text-sm text-white/70">
                    {LOCATIONS[selected].hours}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase tracking-widest text-brand-red">
                    Phone
                  </span>
                  <p className="mt-1 text-sm text-white/70">
                    {LOCATIONS[selected].phone}
                  </p>
                </div>
              </div>
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(LOCATIONS[selected].address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 block w-full rounded-full bg-brand-red py-4 text-center font-semibold text-white transition-colors hover:bg-red-700"
              >
                Get Directions
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Map placeholder */}
      <section className="border-t border-white/10 px-6 py-24 text-center">
        <h2 className="fade-up font-[family-name:var(--font-bebas)] text-4xl tracking-wide text-white">
          Coming Soon
        </h2>
        <p className="fade-up mt-4 text-white/50">
          We&apos;re expanding. New locations opening across London in 2025 and
          2026.
        </p>
      </section>
    </div>
  );
}
