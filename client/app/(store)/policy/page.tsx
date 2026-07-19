"use client";

import { useScrollReveal } from "@/lib/use-scroll-reveal";

const SECTIONS = [
  {
    title: "Order Accuracy",
    content:
      "We aim for 100% accuracy on every order. If something is missing, incorrect, or doesn't match your expectations, contact us within 30 minutes of receiving your order and we'll make it right — either a full replacement or a refund.",
  },
  {
    title: "Refunds",
    content:
      "If your order arrives with a quality issue, missing items, or an error on our part, you're entitled to a full refund or replacement. Refunds are processed to the original payment method within 3–5 working days. For orders placed through third-party platforms (Deliveroo, Uber Eats, Just Eat), please contact the platform directly in the first instance.",
  },
  {
    title: "Cancellations",
    content:
      "You can cancel your order at any time before it enters preparation. Once preparation has started, we may not be able to cancel. To cancel, contact us immediately by phone or email. For third-party orders, cancellation policies are set by the platform.",
  },
  {
    title: "Collection Orders",
    content:
      "Collection orders are held for 30 minutes after the stated ready time. After this window, we may need to prepare a fresh order. If you're running late, call the store and we'll do our best to accommodate.",
  },
  {
    title: "Delivery Orders",
    content:
      "Delivery times are estimated and may vary based on demand, weather, and rider availability. Crispies is not responsible for delays caused by third-party delivery partners. If your order arrives significantly late or in poor condition, contact us for a resolution.",
  },
  {
    title: "Food Quality",
    content:
      "All food is prepared fresh to order. If you receive food that doesn't meet our standards — cold, poorly presented, or otherwise unsatisfactory — let us know and we'll replace it immediately. Photo evidence helps us investigate and improve.",
  },
  {
    title: "Allergen Information",
    content:
      "Full allergen information is available on our menu and in-store. While we take every precaution, our kitchen handles all major allergens. If you have a severe allergy, please inform our team when ordering. We cannot guarantee a completely allergen-free environment.",
  },
  {
    title: "Data & Privacy",
    content:
      "We collect minimal personal data — only what's needed to process your order and communicate with you. We never sell your data to third parties. For full details, refer to our Privacy Policy. You can request deletion of your data at any time by emailing privacy@crispies.co.uk.",
  },
];

export default function PolicyPage() {
  const pageRef = useScrollReveal();

  return (
    <div ref={pageRef} className="min-h-screen bg-black">
      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center px-6 pt-32 pb-20 text-center">
        <h1 className="font-[family-name:var(--font-bebas)] text-[clamp(3rem,8vw,7rem)] leading-none tracking-[0.04em] text-white">
          Order Policy
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/60">
          We keep things fair and transparent. Here&apos;s how we handle orders,
          refunds, and everything in between.
        </p>
      </section>

      {/* Sections */}
      <section className="mx-auto max-w-3xl px-6 pb-24">
        <div className="flex flex-col gap-8">
          {SECTIONS.map((s) => (
            <div key={s.title} className="fade-up">
              <h2 className="font-[family-name:var(--font-bebas)] text-2xl tracking-wide text-white">
                {s.title}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-white/50">
                {s.content}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section className="border-t border-white/10 px-6 py-24 text-center">
        <h2 className="fade-up font-[family-name:var(--font-bebas)] text-4xl tracking-wide text-white">
          Need Help?
        </h2>
        <p className="fade-up mt-4 text-white/50">
          If your situation isn&apos;t covered above, reach out to{" "}
          <span className="text-brand-red">support@crispies.co.uk</span> and
          we&apos;ll sort it out.
        </p>
      </section>
    </div>
  );
}
