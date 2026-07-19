"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useScrollReveal } from "@/lib/use-scroll-reveal";
import { BRAND } from "@/lib/brand";

type Step = { number: string; title: string; description: string };
type Stat = { value: string; label: string };

type FranchiseData = {
  steps: Step[];
  numbers: Stat[];
  investment: string;
};

export default function FranchisePage() {
  const pageRef = useScrollReveal();
  const [data, setData] = useState<FranchiseData | null>(null);

  useEffect(() => {
    api
      .get<Record<string, unknown>>("/store/homepage")
      .then((raw) => {
        if (raw && raw.franchise) {
          setData(raw.franchise as FranchiseData);
        }
      })
      .catch(() => {});
  }, []);

  const steps = data?.steps ?? [];
  const numbers = data?.numbers ?? [];
  const investment = data?.investment ?? "";

  return (
    <div ref={pageRef} className="min-h-screen bg-black">
      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center px-6 pt-32 pb-20 text-center">
        <span className="mb-4 rounded-full border border-brand-red/30 bg-brand-red/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-brand-red">
          Franchise Opportunities
        </span>
        <h1 className="font-[family-name:var(--font-bebas)] text-[clamp(3rem,8vw,7rem)] leading-none tracking-[0.04em] text-white">
          Bring Crispies to
          <br />
          Your City
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/60">
          Join London&apos;s fastest-growing halal restaurant brand. Full
          training, proven systems, premium support. We&apos;ve built the playbook
          — you bring the drive.
        </p>
      </section>

      {/* Numbers */}
      {numbers.length > 0 && (
        <section className="mx-auto max-w-4xl px-6 pb-24">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {numbers.map((n) => (
              <div
                key={n.label}
                className="fade-up rounded-2xl bg-white/5 p-6 text-center"
              >
                <span className="font-[family-name:var(--font-bebas)] text-4xl text-brand-red">
                  {n.value}
                </span>
                <p className="mt-2 text-xs text-white/50">{n.label}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Steps */}
      {steps.length > 0 && (
        <section className="border-t border-white/10 px-6 py-24">
          <div className="mx-auto max-w-3xl">
            <h2 className="fade-up font-[family-name:var(--font-bebas)] text-4xl tracking-wide text-white text-center">
              How It Works
            </h2>
            <div className="mt-12 flex flex-col gap-6">
              {steps.map((step) => (
                <div
                  key={step.number}
                  className="fade-up flex gap-6 rounded-2xl bg-white/5 p-6"
                >
                  <span className="font-[family-name:var(--font-bebas)] text-4xl text-brand-red/60">
                    {step.number}
                  </span>
                  <div>
                    <h3 className="font-[family-name:var(--font-bebas)] text-2xl tracking-wide text-white">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-white/50">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Investment */}
      {investment && (
        <section className="border-t border-white/10 px-6 py-24">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="fade-up font-[family-name:var(--font-bebas)] text-4xl tracking-wide text-white">
              The Investment
            </h2>
            <p
              className="fade-up mt-6 text-lg leading-relaxed text-white/60"
              dangerouslySetInnerHTML={{ __html: investment.replace(/\*\*(.*?)\*\*/g, '<span class="text-brand-red font-semibold">$1</span>') }}
            />
            <p className="fade-up mt-4 text-white/50">
              We&apos;ll walk you through the numbers in detail during the discovery
              phase. No hidden fees, no surprises.
            </p>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="border-t border-white/10 px-6 py-24 text-center">
        <h2 className="fade-up font-[family-name:var(--font-bebas)] text-4xl tracking-wide text-white">
          Let&apos;s Talk
        </h2>
        <p className="fade-up mt-4 text-white/50">
          Ready to build something? Start with a conversation.
        </p>
        <a
          href={`mailto:${BRAND.EMAILS.FRANCHISE}`}
          className="fade-up mt-8 inline-block rounded-full bg-brand-red px-10 py-4 font-semibold text-white transition-all duration-300 hover:bg-red-700 hover:scale-105 active:scale-95 cursor-pointer"
        >
          Get in Touch
        </a>
      </section>
    </div>
  );
}
