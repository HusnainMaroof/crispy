"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef, useState } from "react";

gsap.registerPlugin(useGSAP);

type Props = { onComplete?: () => void };

const WORD_KERN = [0, -8, -4, -6, -10, -4, -2, -2] as const;
const WORD = "CRISPIES".split("");

export default function Preloader({ onComplete }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [hovering, setHovering] = useState(false);

  useGSAP(
    () => {
      const tl = gsap.timeline({
        defaults: { ease: "power1.inOut" },
        onComplete: () => onComplete?.(),
      });

      gsap.set(".ch", { y: 80, autoAlpha: 0 });
      gsap.set(".divider-line", { scaleX: 0, transformOrigin: "center center" });
      gsap.set(".sub", { autoAlpha: 0, y: 14 });
      gsap.set(".progress-fill", { scaleX: 0, transformOrigin: "left center" });
      gsap.set(".panel", { yPercent: -100 });

      tl.to(".ch", { y: 0, autoAlpha: 1, stagger: 0.04, duration: 0.3, ease: "power3.out" });
      tl.to(".divider-line", { scaleX: 1, duration: 0.35, ease: "power2.inOut" }, "-=0.2");
      tl.to(".sub", { y: 0, autoAlpha: 1, duration: 0.25, stagger: 0.06, ease: "power2.out" }, "-=0.15");

      tl.to(".progress-fill", { scaleX: 1, duration: 1, ease: "power1.inOut" });

      tl.to(".panel", { yPercent: 0, duration: 0.5, stagger: 0.05, ease: "power2.in" });
      tl.to(rootRef.current, { autoAlpha: 0, duration: 0.4 }, "-=0.2");
    },
    { scope: rootRef },
  );

  return (
    <div ref={rootRef} className="fixed inset-0 z-[100] overflow-hidden bg-white">
      <div className="preloader-text absolute inset-0 z-10 flex items-center justify-center bg-white">
        <div className="flex w-full max-w-[90vw] flex-col items-center justify-center px-6 py-12 text-center font-[var(--font-oswald)] text-black">
          {/* Kicker */}
          <p
            className="flex items-center gap-3 text-[clamp(9px,1.4vw,12px)] font-semibold uppercase tracking-[0.4em] text-black/60 cursor-pointer transition-colors hover:text-black"
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
          >
            <span className="h-[2px] w-6 bg-black" />
            <span>{hovering ? "London, UK" : "London \u00B7 Est. 2019"}</span>
            <span className="h-[2px] w-6 bg-black" />
          </p>

          {/* Wordmark */}
          <h1 className="mt-6 flex select-none items-baseline justify-center leading-[0.8] text-[clamp(56px,14vw,210px)] font-bold uppercase tracking-tight">
            {WORD.map((c, i) => (
              <span key={i} className="ch relative inline-block" style={{ marginRight: WORD_KERN[i] }}>
                {c}
              </span>
            ))}
          </h1>

          {/* Divider */}
          <div className="divider-line mt-8 h-[3px] w-[clamp(120px,24vw,300px)] origin-center bg-black" aria-hidden />

          {/* Subtext */}
          <div className="mt-7 flex flex-col items-center gap-1.5 leading-[1.4] tracking-[0.42em] text-[clamp(11px,1.8vw,17px)] font-semibold uppercase text-black">
            <span className="sub">Burgers</span>
            <span className="sub flex items-center gap-3">
              <span className="font-sans text-[clamp(10px,1.5vw,14px)] leading-none font-black text-[#DC2626]">
                +
              </span>
              Chicken
            </span>
          </div>

          {/* Progress bar */}
          <div className="mt-10 h-[2px] w-[clamp(120px,24vw,300px)] overflow-hidden rounded-full bg-black/10">
            <div className="progress-fill h-full w-full bg-black" aria-hidden />
          </div>
        </div>
      </div>

      {/* Panels */}
      <div className="absolute inset-0 z-20 flex h-full w-full pointer-events-none">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="panel h-full w-[10%] bg-black will-change-transform" />
        ))}
      </div>
    </div>
  );
}
