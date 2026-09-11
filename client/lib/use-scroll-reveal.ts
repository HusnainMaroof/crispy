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
 * - `data-delay` (seconds) staggers siblings.
 * - `data-reveal="lift"` animates only y, so CSS opacity hovers still work.
 * - Pass `deps` to re-run when async content loads (e.g. fetched data).
 */
export function useScrollReveal(start = DEFAULT_START, deps: unknown[] = []) {
  const scopeRef = useRef<HTMLElement>(null);

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

      els.forEach((el) => {
        if (el.dataset.revealed === "1") return;

        const liftOnly = el.dataset.reveal === "lift";
        const delay = Number(el.dataset.delay ?? 0);
        const fromY = liftOnly ? 18 : 24;
        const fromVars = liftOnly ? { y: fromY } : { y: fromY, opacity: 0 };
        const clear = liftOnly ? "transform" : "transform,opacity";

        const rect = el.getBoundingClientRect();
        const alreadyInView = rect.top < vh * 0.92 && rect.bottom > 0;

        gsap.set(el, fromVars);

        const toVars: gsap.TweenVars = {
          y: 0,
          duration: 0.7,
          ease: "power3.out",
          delay: alreadyInView ? 0.04 + delay : delay,
          onComplete: () => {
            el.dataset.revealed = "1";
            gsap.set(el, { clearProps: clear });
          },
        };
        if (!liftOnly) toVars.opacity = 1;

        if (alreadyInView) {
          gsap.to(el, toVars);
        } else {
          gsap.to(el, {
            ...toVars,
            scrollTrigger: {
              trigger: el,
              start,
              once: true,
            },
          });
        }
      });

      ScrollTrigger.refresh();
    },
    { scope: scopeRef, dependencies: deps },
  );

  return scopeRef;
}
