"use client";

import { FilePenLine } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

type HowToGetStartedItem = { title: string; description: string };

const KOROLEV = "font-[family-name:var(--font-korolev),Korolev,sans-serif]";
const INTER = "font-[family-name:var(--font-inter),Inter,sans-serif]";

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

export default function HowToGetStarted({
  heading,
  items,
}: {
  heading: ReactNode;
  items: HowToGetStartedItem[];
}) {
  const outerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const outer = outerRef.current;
    const panel = panelRef.current;
    if (!outer || !panel) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const raf = requestAnimationFrame(() => setReduced(true));
      return () => cancelAnimationFrame(raf);
    }

    let frame = 0;
    let navbarH = 0;
    let travel = 1;

    const measure = () => {
      navbarH =
        parseFloat(
          getComputedStyle(document.documentElement).getPropertyValue(
            "--navbar-h",
          ),
        ) || 0;
      travel = Math.max(1, outer.offsetHeight - panel.offsetHeight);
    };

    const update = () => {
      frame = 0;
      const rect = outer.getBoundingClientRect();
      const p = clamp01((navbarH - rect.top) / travel);
      setActive(Math.min(items.length - 1, Math.floor(p * items.length)));
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    const onResize = () => {
      measure();
      update();
    };

    measure();
    const raf = requestAnimationFrame(update);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, [items.length]);

  if (reduced) {
    return (
      <div className="bg-[#FF0931] px-6 py-16 sm:px-10 md:px-12">
        <div className="mx-auto flex w-full flex-col gap-10">
          {heading}
          <div className="flex flex-col gap-7">
            {items.map((item) => (
              <div key={item.title}>
                <h3
                  className={`m-0 ${KOROLEV} capitalize text-white text-[24px] font-black leading-none`}
                >
                  {item.title}
                </h3>
                <p
                  className={`m-0 mt-3 ${INTER} text-white/90 text-[15px] leading-[150%]`}
                >
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={outerRef}
      className="relative w-full"
      style={{ height: `${(items.length + 1) * 100}vh` }}
    >
      <div
        ref={panelRef}
        className="sticky flex flex-col justify-center bg-[#FF0931] px-6 py-16 sm:px-10 sm:py-24 md:px-12 xl:px-25"
        style={{
          top: "var(--navbar-h, 0px)",
          height: "calc(100dvh - var(--navbar-h, 0px))",
        }}
      >
        <div className="flex w-full flex-col gap-12 lg:flex-row lg:items-center lg:justify-between lg:gap-16">
          {heading}

          <div className="flex items-center justify-end gap-6 sm:gap-12">
            <div className="relative w-full h-auto min-h-[420px] sm:h-[550px] sm:min-h-0 rounded-2xl bg-black/10 p-6 sm:p-8 flex">
              <div className="absolute translate-y-[-50%]  top-[50%] -translate-x-1/2 -left-3 max-sm:-left-2 p-5   rounded-[10px] max-sm:translate-x-0 bg-white  hidden! lg:block!">
                <FilePenLine
                  className="w-16 h-16 sm:w-20 sm:h-20 lg:w-[162px] lg:h-[162px] text-black "
                  strokeWidth={1.5}
                />
              </div>

              <div className="flex items-center gap-6 sm:gap-8 px-8 sm:px-20 lg:px-40">
                <div className="min-w-0">
                  <h3
                    key={`t-${active}`}
                    className={`overlay-fade-up stagger-1 m-0 ${KOROLEV} capitalize text-white`}
                    style={{
                      fontSize: "clamp(36px, 6vw, 80px)",
                      fontWeight: 900,
                      lineHeight: "100%",
                    }}
                  >
                    {items[active].title}
                  </h3>
                  <p
                    key={`d-${active}`}
                    className={`overlay-fade-up stagger-2 m-0 mt-3 ${INTER} capitalize text-white max-w-[480px]   text-[10px] sm:text-[14px]  lg:text-[25px] `}
                    style={{
                      fontWeight: 400,
                      lineHeight: "150%",
                      letterSpacing: "0.54px",
                    }}
                  >
                    {items[active].description}
                  </p>
                </div>
              </div>
            </div>

            <div className="ml-auto absolute shrink-0 flex-col gap-6 flex right-5">
              {items.map((item, i) => (
                <span
                  key={item.title}
                  className={`h-3 w-3 rounded-full transition-colors duration-300 ${
                    i === active ? "bg-white" : "border"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
