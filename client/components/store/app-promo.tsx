"use client";

import { useEffect, useRef, useState } from "react";
import OptimizedImage from "@/components/ui/optimized-image";

const features = [
  "One-tap reorder",
  "Exclusive rewards",
  "App-only deals",
  "Faster checkout",
];

export default function AppPromo() {
  const [isVisible, setIsVisible] = useState(false);
  const [animStep, setAnimStep] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const sequence = [
      { step: 0, duration: 1000 },
      { step: 1, duration: 1000 },
      { step: 2, duration: 300 },
      { step: 3, duration: 1000 },
      { step: 4, duration: 300 },
      { step: 5, duration: 1500 },
      { step: 6, duration: 2500 },
    ];

    let currentIdx = 0;
    let timeoutId: ReturnType<typeof setTimeout>;

    const run = () => {
      setAnimStep(sequence[currentIdx].step);
      timeoutId = setTimeout(() => {
        currentIdx = (currentIdx + 1) % sequence.length;
        run();
      }, sequence[currentIdx].duration);
    };

    run();
    return () => clearTimeout(timeoutId);
  }, [isVisible]);

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes phone-float {
              0%, 100% { transform: translateY(0px); }
              50% { transform: translateY(-20px); }
            }
            .animate-phone-float { animation: phone-float 6s ease-in-out infinite; }
          `,
        }}
      />

      <section
        ref={sectionRef}
        className="bg-brand-black flex min-h-screen items-center justify-center overflow-hidden p-8 text-white lg:p-24"
        aria-label="Mobile app experience"
      >
        <div className="grid w-full max-w-7xl items-center gap-16 lg:grid-cols-2">
          {/* Left: Copy */}
          <div className="flex flex-col">
            <span className="mb-6 text-xs font-bold uppercase tracking-[0.2em] text-white">
              Mobile App Experience
            </span>
            <h2 className="font-display mb-8 text-6xl uppercase leading-[0.9] lg:text-[7rem]">
              Order in <span className="text-brand-red">seconds</span>
              <br />
              <span className="text-white">with our mobile app</span>
            </h2>
            <div className="mt-6 flex flex-col gap-4">
              {features.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 border-b border-white/10 pb-4 text-lg font-semibold text-white"
                >
                  <span
                    className="h-2 w-2 flex-shrink-0 rounded-full bg-brand-red"
                    aria-hidden
                  />
                  {f}
                </div>
              ))}
            </div>
          </div>

          {/* Right: Phone Mockup */}
          <div className="flex justify-center lg:justify-end">
            <div
              className={`relative ${isVisible ? "animate-phone-float" : ""}`}
            >
              <div className="relative h-[610px] w-[300px] overflow-hidden rounded-[3rem] border-[8px] border-[#222] bg-[#1a1a1a] shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
                {/* Dynamic Island */}
                <div className="absolute left-0 right-0 top-0 z-20 flex justify-center pt-2">
                  <div className="h-4 w-20 rounded-full bg-black" />
                </div>

                {/* App UI */}
                <div className="absolute inset-0 flex flex-col bg-[#0a0a0a] px-6 pt-16">
                  <h3 className="mb-6 text-xl font-bold text-white">
                    What are you craving?
                  </h3>

                  {/* Food card */}
                  <div className="relative mb-6 h-[140px] overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900">
                    <OptimizedImage
                      src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=600"
                      alt="Smash burger"
                      fill
                      sizes="260px"
                      className="object-cover opacity-60"
                    />
                    <div
                      className={`absolute bottom-3 right-4 flex h-8 w-8 items-center justify-center rounded-full font-bold transition-all ${
                        animStep >= 2
                          ? "scale-90 bg-green-500"
                          : "scale-100 bg-brand-red"
                      }`}
                    >
                      {animStep >= 2 ? "\u2713" : "+"}
                    </div>
                  </div>

                  {/* Rewards progress */}
                  <div className="mb-auto rounded-2xl border border-neutral-800 bg-[#111] p-5">
                    <p className="text-xs text-neutral-400">
                      Rewards Progress
                    </p>
                    <div className="mt-2 h-1.5 w-full rounded-full bg-neutral-800">
                      <div className="h-full w-[65%] rounded-full bg-brand-red" />
                    </div>
                  </div>

                  {/* CTA */}
                  <button
                    className={`mb-6 w-full rounded-xl py-4 font-bold text-white shadow-lg transition-all ${
                      animStep >= 4
                        ? "bg-neutral-800"
                        : "bg-brand-red shadow-red-900/20"
                    }`}
                  >
                    START ORDER
                  </button>
                </div>

                {/* Animated cursor */}
                <div
                  className={`pointer-events-none absolute z-50 h-6 w-6 rounded-full bg-white transition-all duration-700 ease-in-out ${
                    animStep === 0
                      ? "left-[80%] top-[40%] opacity-0"
                      : animStep === 1
                        ? "left-[245px] top-[225px] opacity-100"
                        : animStep === 2
                          ? "left-[245px] top-[225px] scale-75 opacity-100"
                          : animStep === 3
                            ? "left-[150px] top-[530px] opacity-100"
                            : animStep === 4
                              ? "left-[150px] top-[530px] scale-75 opacity-100"
                              : "opacity-0"
                  }`}
                  aria-hidden
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
