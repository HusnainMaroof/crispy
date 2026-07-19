import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";

gsap.registerPlugin(ScrollTrigger);

const DEFAULT_START = "top 88%";

/**
 * Animates all `.fade-up` children inside `scopeRef`.
 * - Elements already visible on mount animate immediately.
 * - Below-the-fold elements get ScrollTrigger.
 * - `once: true` so animations don't reverse on scroll-up.
 * - Pass `deps` to re-run when async content loads (e.g. fetched data).
 */
export function useScrollReveal(start = DEFAULT_START, deps: unknown[] = []) {
  const scopeRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      )
        return;

      const els = gsap.utils.toArray<HTMLElement>(".fade-up", scopeRef.current);
      if (!els.length) return;

      const vh = window.innerHeight;
      const belowFold: HTMLElement[] = [];

      els.forEach((el) => {
        const computed = window.getComputedStyle(el);
        const alreadyAnimated = computed.opacity === "1" && computed.transform !== "none";

        if (alreadyAnimated) return;

        const rect = el.getBoundingClientRect();
        const alreadyInView = rect.top < vh * 0.92 && rect.bottom > 0;

        if (alreadyInView) {
          gsap.set(el, { y: 40, opacity: 0 });
          gsap.to(el, {
            y: 0,
            opacity: 1,
            duration: 0.8,
            ease: "power3.out",
            delay: 0.05,
          });
        } else {
          gsap.set(el, { y: 40, opacity: 0 });
          belowFold.push(el);
        }
      });

      belowFold.forEach((el) => {
        gsap.to(el, {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: el,
            start,
            once: true,
          },
        });
      });

      ScrollTrigger.refresh();
    },
    { scope: scopeRef, dependencies: deps },
  );

  return scopeRef;
}
