"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

gsap.registerPlugin(useGSAP);

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: React.ReactNode;
}

export default function StatCard({
  title,
  value,
  change,
  changeType = "neutral",
  icon,
}: StatCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const card = cardRef.current;
    const icon = iconRef.current;
    if (!card || !icon) return;

    const enterTl = gsap.timeline({ paused: true });
    enterTl.to(card, { scale: 1.02, duration: 0.25, ease: "power2.out" });
    enterTl.to(icon, { scale: 1.15, rotation: 5, duration: 0.25, ease: "back.out(1.7)" }, "<");

    const leaveTl = gsap.timeline({ paused: true });
    leaveTl.to(card, { scale: 1, duration: 0.25, ease: "power2.out" });
    leaveTl.to(icon, { scale: 1, rotation: 0, duration: 0.25, ease: "power2.out" }, "<");

    card.addEventListener("mouseenter", () => {
      leaveTl.kill();
      enterTl.restart();
    });
    card.addEventListener("mouseleave", () => {
      enterTl.kill();
      leaveTl.restart();
    });
  }, { scope: cardRef });

  return (
    <div ref={cardRef} className="cursor-pointer rounded-xl border border-white/10 bg-white/5 p-6 will-change-transform">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-white/50">{title}</p>
          <p className="mt-2 font-display text-3xl tracking-wide text-white">{value}</p>
          {change && (
            <p
              className={`mt-2 text-xs font-medium ${
                changeType === "positive"
                  ? "text-green-400"
                  : changeType === "negative"
                  ? "text-brand-red"
                  : "text-white/50"
              }`}
            >
              {change}
            </p>
          )}
        </div>
        <div ref={iconRef} className="rounded-lg bg-white/5 p-3 text-white/50 will-change-transform">
          {icon}
        </div>
      </div>
    </div>
  );
}
