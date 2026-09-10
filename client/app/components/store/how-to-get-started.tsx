"use client";

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
              <div className="absolute translate-y-full -translate-x-1/2 -left-3 max-sm:-left-2 max-sm:translate-x-0">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="162"
                  height="162"
                  viewBox="0 0 162 162"
                  fill="none"
                >
                  <rect
                    x="0.75"
                    y="0.75"
                    width="160.5"
                    height="160.5"
                    rx="9.25"
                    fill="white"
                    stroke="#C4C4C4"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M91.6787 105.164L99.0491 97.9888C99.3386 98.0237 100.054 98.7304 100.05 99.0837L99.9943 109.071C99.9769 112.356 97.3922 114 94.4517 114H59.274C55.8731 113.997 54 111.712 54 108.403L54.0174 54.2403C54.0174 51.6656 55.8487 49.07 58.6532 49.0665L94.4308 49C97.8492 48.993 99.7537 51.3088 99.7502 54.5901L99.7083 77.3214L92.4495 85.7766L82.7247 96.7399L81.3469 104.492C81.2422 105.09 81.3992 106.045 81.7026 106.437C82.0515 106.885 83.3944 107.381 83.9978 107.22L91.6787 105.164ZM88.5463 66.3616C89.666 66.3616 90.4125 65.3191 90.4578 64.553C90.4927 63.9863 89.8648 62.7514 89.1358 62.7514H64.5202C63.4075 62.7514 62.6052 63.8883 62.7691 64.8259C62.9331 65.7634 63.7842 66.3861 64.8271 66.3861L88.5428 66.3581L88.5463 66.3616ZM88.1871 78.182C89.5509 78.182 90.4683 77.4543 90.3288 76.1075C90.2276 75.1385 89.3835 74.4949 88.1975 74.4984L64.4644 74.5194C63.4807 74.5194 62.654 75.7227 62.7168 76.4189C62.8215 77.5488 63.6342 78.1645 64.8097 78.168L88.1836 78.1855L88.1871 78.182ZM80.5237 89.8624C81.169 89.0684 81.4341 88.1133 81.1341 87.4207C80.9074 86.8995 79.8784 86.3538 79.1703 86.3538L64.4365 86.3712C63.5016 86.3712 62.654 87.4942 62.7482 88.2953C62.8668 89.2887 63.7493 89.8694 64.7888 89.8694L80.5237 89.8624Z"
                    fill="black"
                  />
                  <path
                    d="M84.4617 104.097L85.2605 98.0552L100.845 80.9525C102.147 79.5253 102.858 78.042 105.129 78.3499C106.747 78.5703 108.348 79.7841 108.858 81.5752C109.419 83.5622 108.233 84.804 106.803 86.2243L90.3357 102.564L84.4652 104.097H84.4617Z"
                    fill="black"
                  />
                </svg>
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
                    className={`overlay-fade-up stagger-2 m-0 mt-3 ${INTER} capitalize text-white max-w-[480px]`}
                    style={{
                      fontSize: "clamp(14px, 1.5vw, 24px)",
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

           <div className="ml-auto hidden shrink-0 flex-col gap-6 sm:flex">
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
