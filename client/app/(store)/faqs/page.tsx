"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef, useState } from "react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const FAQS = [
  {
    q: "Is all your food halal?",
    a: "Yes. Every single item on our menu is 100% halal certified. No exceptions. We work with certified suppliers and our entire kitchen operates to halal standards.",
  },
  {
    q: "Do you deliver?",
    a: "Yes. We deliver through Deliveroo, Uber Eats, and Just Eat. You can also order directly from our website for collection or delivery in supported areas.",
  },
  {
    q: "Can I customise my order?",
    a: "Absolutely. You can add or remove toppings, choose your heat level, and request customisations when ordering in-store or through our website.",
  },
  {
    q: "Do you cater for allergies?",
    a: "We take allergies seriously. All allergen information is available on our menu. If you have a specific allergy, please let our team know when ordering and we'll take every precaution.",
  },
  {
    q: "What are your opening hours?",
    a: "Most locations are open 11:00 AM – 11:00 PM, with some open until midnight on weekends. Check our Find Us page for specific location hours.",
  },
  {
    q: "How do I apply for a job?",
    a: "Visit our Careers page for current openings. You can also drop your CV into any location and ask to speak to a manager.",
  },
  {
    q: "Do you offer franchise opportunities?",
    a: "Yes. We're actively expanding across the UK. Visit our Franchise page to learn more about the opportunity and submit an enquiry.",
  },
  {
    q: "Can I book for a large group or event?",
    a: "Yes. We offer group bookings and event catering. Contact us at events@crispies.co.uk with your requirements and we'll sort something out.",
  },
  {
    q: "How can I give feedback or make a complaint?",
    a: "We want to hear from you. Email hello@crispies.co.uk or speak to a manager in-store. We aim to respond to all feedback within 24 hours.",
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="fade-up border-b border-white/10">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full cursor-pointer items-center justify-between gap-4 py-5 text-left"
        aria-expanded={open}
      >
        <span className="font-[family-name:var(--font-bebas)] text-xl tracking-wide text-white">
          {q}
        </span>
        <svg
          className={`h-5 w-5 shrink-0 text-white/40 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {open && (
        <div className="pb-5">
          <p className="text-sm leading-relaxed text-white/50">{a}</p>
        </div>
      )}
    </div>
  );
}

export default function FaqsPage() {
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
          FAQs
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/60">
          Everything you need to know about Crispies. Can&apos;t find what
          you&apos;re looking for?{" "}
          <a href="/contact" className="text-brand-red underline cursor-pointer transition-colors hover:text-red-400">
            Get in touch
          </a>
          .
        </p>
      </section>

      {/* FAQ list */}
      <section className="mx-auto max-w-3xl px-6 pb-24">
        <div className="flex flex-col">
          {FAQS.map((faq) => (
            <FaqItem key={faq.q} q={faq.q} a={faq.a} />
          ))}
        </div>
      </section>
    </div>
  );
}
