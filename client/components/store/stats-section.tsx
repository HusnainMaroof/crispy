"use client";

import { useEffect, useRef, useState } from "react";

interface StatItem {
  value: string;
  numericPart: number;
  suffix: string;
  label: string;
}

const stats: StatItem[] = [
  { value: "5", numericPart: 5, suffix: "", label: "London Locations" },
  { value: "100%", numericPart: 100, suffix: "%", label: "Halal Certified" },
  { value: "30min", numericPart: 30, suffix: "min", label: "Average Delivery" },
  { value: "12k+", numericPart: 12, suffix: "k+", label: "Five-Star Reviews" },
];

function useCountUp(target: number, duration: number, shouldStart: boolean) {
  const [count, setCount] = useState(0);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    if (!shouldStart) return;

    let startTime: number | null = null;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(step);
      }
    };

    frameRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration, shouldStart]);

  return count;
}

function StatBlock({
  stat,
  index,
  isVisible,
}: {
  stat: StatItem;
  index: number;
  isVisible: boolean;
}) {
  const count = useCountUp(stat.numericPart, 1800, isVisible);

  const displayValue =
    stat.suffix === "k+"
      ? `${count}k+`
      : stat.suffix === "%"
        ? `${count}%`
        : stat.suffix === "min"
          ? `${count}min`
          : `${count}`;

  return (
    <div
      className={`flex flex-1 flex-col items-center gap-1 transition-all duration-700 sm:gap-2 md:gap-3 md:py-12 ${
        isVisible
          ? "translate-y-0 opacity-100"
          : "translate-y-8 opacity-0"
      }`}
      style={{ transitionDelay: `${index * 120}ms` }}
    >
      <span className="font-display text-3xl leading-none text-white sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl">
        {displayValue}
      </span>
      <span className="text-[8px] font-semibold uppercase tracking-[0.15em] text-white/40 sm:text-[10px] sm:tracking-[0.25em] md:text-xs lg:text-sm">
        {stat.label}
      </span>
    </div>
  );
}

export default function StatsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="bg-brand-black border-y border-white/10"
      aria-label="Key stats"
    >
      {/* Mobile: 4-in-a-row flex | md+: 4-column grid with dividers */}
      <div className="mx-auto flex max-w-7xl md:grid md:grid-cols-4">
        {stats.map((stat, idx) => (
          <div key={stat.label} className="relative flex-1">
            {/* Vertical divider — desktop only, skip first */}
            {idx > 0 && (
              <div
                className="absolute bottom-1/2 left-0 hidden h-12 w-px -translate-y-1/2 bg-white/10 md:block"
                aria-hidden
              />
            )}
            <StatBlock stat={stat} index={idx} isVisible={isVisible} />
          </div>
        ))}
      </div>
    </section>
  );
}
