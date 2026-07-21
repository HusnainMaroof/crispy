"use client";

import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, type ReactNode } from "react";

gsap.registerPlugin(ScrollTrigger);

export type LenisScrollEvent = {
  scroll: number;
  limit: number;
  progress: number;
  velocity: number;
};

type LenisContextValue = {
  scrollTo: (target: HTMLElement | string | number, opts?: { offset?: number }) => void;
  subscribeScroll: (cb: (e: LenisScrollEvent) => void) => () => void;
  stop: () => void;
  start: () => void;
};

const LenisContext = createContext<LenisContextValue>({
  scrollTo: () => {},
  subscribeScroll: () => () => {},
  stop: () => {},
  start: () => {},
});

export function useLenis() {
  return useContext(LenisContext);
}

export default function SmoothScroll({ children }: { children: ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);
  const listenersRef = useRef<Set<(e: LenisScrollEvent) => void>>(new Set());

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const instance = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      autoRaf: false,
    });
    lenisRef.current = instance;

    // Notify any subscribers that subscribed before Lenis was created
    // (child effects run before this parent effect, so they registered
    // against a null lenisRef; ping them now that the instance exists).
    queueMicrotask(() => {
      listenersRef.current.forEach((cb) =>
        cb({ scroll: instance.scroll, limit: instance.limit, progress: instance.progress, velocity: instance.velocity }),
      );
      ScrollTrigger.refresh();
    });

const onScroll = (e: LenisScrollEvent) => {
      ScrollTrigger.update();
      listenersRef.current.forEach((cb) => cb(e));
    };
    instance.on("scroll", onScroll);

    const raf = (time: number) => {
      instance.raf(time * 1000);
    };
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    // Hash-anchor handler: when arriving with a #fragment (cross-page or
    // in-page), call lenis.scrollTo instead of letting the browser's native
    // jump fight Lenis' internal scroll target.
    const scrollToHash = (hash: string) => {
      const id = hash.replace(/^#/, "");
      if (!id) return;
      const el = document.getElementById(id);
      if (!el) return;
      // 128px ~ matches scroll-mt-32 used across the site, clears fixed navbar.
      instance.scrollTo(el, { offset: -128, immediate: false });
    };

    const onHashChange = () => {
      if (window.location.hash) scrollToHash(window.location.hash);
    };
    window.addEventListener("hashchange", onHashChange);
    // Defer to next tick so route-rendered target elements exist.
    queueMicrotask(onHashChange);

    return () => {
      gsap.ticker.remove(raf);
      instance.off("scroll", onScroll);
      window.removeEventListener("hashchange", onHashChange);
      instance.destroy();
      lenisRef.current = null;
    };
  }, []);

  const scrollTo = useCallback(
    (target: HTMLElement | string | number, opts?: { offset?: number }) => {
      const inst = lenisRef.current;
      if (!inst) {
        if (typeof target === "object" && target && "scrollIntoView" in target) {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        return;
      }
      inst.scrollTo(target, { offset: opts?.offset ?? 0, immediate: false });
    },
    [],
  );

  const stop = useCallback(() => {
    lenisRef.current?.stop();
  }, []);

  const start = useCallback(() => {
    lenisRef.current?.start();
  }, []);

  const subscribeScroll = useCallback((cb: (e: LenisScrollEvent) => void) => {
    listenersRef.current.add(cb);
    const inst = lenisRef.current;
    if (inst) {
      cb({ scroll: inst.scroll, limit: inst.limit, progress: inst.progress, velocity: inst.velocity });
    }
    return () => {
      listenersRef.current.delete(cb);
    };
  }, []);

  const value = useMemo(
    () => ({ scrollTo, subscribeScroll, stop, start }),
    [scrollTo, subscribeScroll, stop, start],
  );

  return (
    <LenisContext.Provider value={value}>
      {children}
    </LenisContext.Provider>
  );
}