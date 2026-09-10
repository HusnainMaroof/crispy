"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type ScrollTabItem = { title: string; description: string };

type ScrollTabsProps = {
  heading: ReactNode;
  items: ScrollTabItem[];
  theme: "dark" | "red";
};

const KOROLEV = "font-[family-name:var(--font-korolev),Korolev,sans-serif]";
const INTER = "font-[family-name:var(--font-inter),Inter,sans-serif]";

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

export default function ScrollTabs({ heading, items, theme }: ScrollTabsProps) {
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

  const bg = theme === "dark" ? "bg-black" : "bg-[#FF0931]";
  const numberColor = theme === "dark" ? "text-[#FF0931]" : "text-black";
  const numberStroke =
    theme === "dark" ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.35)";
  const titleColor = "text-white";
  const descColor = "text-white";
  const activeDot = theme === "dark" ? "bg-white" : "bg-black";
  const idleDot = theme === "dark" ? "border" : "bg-black/30";

  if (reduced) {
    return (
      <div className={`${bg} px-6 py-16 sm:px-10 md:px-12`}>
        <div className="mx-auto flex w-full flex-col gap-10">
          {heading}
          <div className="flex flex-col gap-7">
            {items.map((item, i) => (
              <div key={item.title} className="flex items-start gap-4">
                <span
                  className={`${numberColor} ${KOROLEV} shrink-0 text-[28px] font-black leading-none sm:text-[32px]`}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3
                    className={`${titleColor} ${KOROLEV} m-0 text-[20px] font-bold uppercase leading-none sm:text-[24px]`}
                  >
                    {item.title}
                  </h3>
                  <p
                    className={`${descColor} ${INTER} m-0 mt-3 text-[15px] leading-[150%] sm:text-[16px]`}
                  >
                    {item.description}asfas
                  </p>
                </div>
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
        className={`${bg} sticky flex flex-col justify-center px-6 py-16 sm:px-10 sm:py-24 md:px-12 xl:px-25`}
        style={{
          top: "var(--navbar-h, 0px)",
          height: "calc(100dvh - var(--navbar-h, 0px))",
        }}
      >
        <div className="flex w-full  gap-12 flex-row lg:items-center lg:justify-between lg:gap-20">
          {heading}

          <div className="flex flex-wrap sm:flex-nowrap items-center justify-end gap-12 xl:gap-30">
            <div className="min-w-0">
              <h3
                key={`t-${active}`}
                className={`overlay-fade-up stagger-1 m-0 ${KOROLEV} capitalize ${titleColor}   text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-[80px]`}
                style={{
              
                  fontWeight: 900,
                  lineHeight: "100%",
                }}
              >
                {items[active].title}
              </h3>
              <p
                key={`d-${active}`}
                className={`overlay-fade-up stagger-2 m-0 mt-4 max-w-[400px] ${INTER} capitalize ${descColor} text-[12px] sm:text-[14px] md:text-[16px] lg:text-[18px] xl:text-[20px]`}
                style={{
                
                
                  letterSpacing: "1px",
                }}
              >
                {items[active].description}
              </p>
            </div>

            <span
              key={active}
              className={`overlay-fade-up shrink-0 ${INTER} font-thin text-[100px] leading-[0.8] tracking-[-0.06em] lg:text-[150px] xl:text-[254px]`}
              style={{
                color: "transparent",
                WebkitTextStroke: `1px ${numberStroke}`,
              }}
            >
              {String(active + 1).padStart(2, "0")}
            </span>

            <div className="ml-auto hidden shrink-0 flex-col gap-6 sm:flex">
              {items.map((item, i) => (
                <span
                  key={item.title}
                  className={`h-3 w-3 rounded-full transition-colors duration-300 ${
                    i === active ? activeDot : idleDot
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
