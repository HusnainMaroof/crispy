"use client";

import { useScrollReveal } from "@/lib/use-scroll-reveal";
import { BRAND } from "@/lib/brand";

type Reason = { title: string; description: string };
type Step = { number: string; title: string; description: string };

const REASONS: Reason[] = [
  {
    title: "Proven Concept",
    description:
      "Crispies has already established a strong presence in the food industry with our unique blend of flavours and high-quality ingredients. Our menu items, ranging from crispy chicken tenders to flavourful wraps and salads, have garnered a loyal customer base.",
  },
  {
    title: "Supportive Team",
    description:
      "When you join the Crispies family, you'll receive comprehensive support every step of the way. From site selection and restaurant design to training and marketing assistance, our team is committed to helping you succeed.",
  },
  {
    title: "Operational Excellence",
    description:
      "We provide our franchisees with access to our time-tested operational systems and processes, ensuring smooth day-to-day operations and consistent customer satisfaction.",
  },
  {
    title: "Marketing Power",
    description:
      "Benefit from our national marketing campaigns and promotional materials designed to drive foot traffic to your Crispies location. We'll also support you in developing local marketing strategies to attract customers in your area.",
  },
  {
    title: "Flexible Models",
    description:
      "Whether you're interested in opening a standalone restaurant, a food truck, or a kiosk in a high-traffic location, Crispies offers flexible franchise models to suit your preferences and budget.",
  },
  {
    title: "Community Engagement",
    description:
      "At Crispies, we believe in giving back to the communities we serve. As a franchisee, you'll have the opportunity to engage with local schools, charities, and events, strengthening your brand presence while making a positive impact.",
  },
];

const STEPS: Step[] = [
  {
    number: "01",
    title: "Submit Your Inquiry",
    description:
      "Fill out our franchise inquiry form to express your interest in joining the Crispies family. Tell us a bit about yourself and why you're excited about the opportunity.",
  },
  {
    number: "02",
    title: "Initial Consultation",
    description:
      "Once we receive your inquiry, a member of our franchise development team will reach out to schedule an initial consultation. This is your chance to ask questions and learn more about the franchise process.",
  },
  {
    number: "03",
    title: "Review Franchise Disclosure Document (FDD)",
    description:
      "Upon approval of your application, you'll receive our Franchise Disclosure Document (FDD) for review. This document contains important information about the franchise agreement, financial obligations, and support provided by Crispies.",
  },
  {
    number: "04",
    title: "Site Selection and Training",
    description:
      "With the help of our experienced team, you'll select the perfect location for your Crispies restaurant. You'll also undergo comprehensive training to ensure you're equipped with the knowledge and skills to run a successful operation.",
  },
  {
    number: "05",
    title: "Grand Opening",
    description:
      "Finally, it's time to celebrate! We'll work closely with you to plan and execute a memorable grand opening event, generating excitement and attracting eager customers to your new Crispies location.",
  },
];

export default function FranchisePage() {
  const pageRef = useScrollReveal();

  return (
    <div ref={pageRef} className="min-h-screen bg-black">
      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center px-6 pt-32 pb-20 text-center">
        <span className="mb-4 rounded-full border border-brand-red/30 bg-brand-red/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-brand-red">
          Franchise Opportunity
        </span>
        <h1 className="font-[family-name:var(--font-bebas)] text-[clamp(3rem,8vw,7rem)] leading-none tracking-[0.04em] text-white">
          Welcome to Crispies
          <br />
          Franchise Opportunity
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/60">
          Are you passionate about food and looking for a rewarding business
          venture? Crispies offers an exciting franchise opportunity for
          entrepreneurs who want to bring our delicious flavours to their local
          community.
        </p>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/50">
          As a Crispies franchisee, you&apos;ll be part of a growing family with a
          proven track record of success.
        </p>
      </section>

      {/* Why Choose Crispies? */}
      <section className="border-t border-white/10 px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="fade-up text-center font-[family-name:var(--font-bebas)] text-4xl tracking-wide text-white md:text-5xl">
            Why Choose Crispies?
          </h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {REASONS.map((reason, i) => (
              <div
                key={reason.title}
                className="fade-up rounded-2xl bg-white/5 p-8 transition-colors hover:bg-white/10"
              >
                <div className="flex items-baseline gap-4">
                  <span className="font-[family-name:var(--font-bebas)] text-3xl text-brand-red/70">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="font-[family-name:var(--font-bebas)] text-2xl tracking-wide text-white">
                    {reason.title}
                  </h3>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-white/60">
                  {reason.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How to Get Started */}
      <section className="border-t border-white/10 px-6 py-24">
        <div className="mx-auto max-w-3xl">
          <h2 className="fade-up text-center font-[family-name:var(--font-bebas)] text-4xl tracking-wide text-white md:text-5xl">
            How to Get Started
          </h2>
          <div className="mt-12 flex flex-col gap-6">
            {STEPS.map((step) => (
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

      {/* CTA */}
      <section className="border-t border-white/10 px-6 py-24 text-center">
        <h2 className="fade-up font-[family-name:var(--font-bebas)] text-4xl tracking-wide text-white">
          Join the Crispies Family
        </h2>
        <p className="fade-up mt-4 max-w-xl mx-auto text-white/50">
          Join the Crispies family today and embark on an exciting journey in
          the fast-paced world of food franchising. Contact us now to learn
          more about this rewarding opportunity!
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
