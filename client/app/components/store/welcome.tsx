"use client";

import { useEffect, useRef } from "react";
import styles from "./welcome.module.css";
import { localizedText } from "@/lib/i18n";
import { useLocale } from "@/lib/i18n/locale-context";

const PARAGRAPH =
  "Crispies was founded with a mission to serve the best burgers & chicken around. Our aim has always been to serve fresh, handmade food, bursting with flavours from around the globe.";
const BACK_IMAGE = "/images/welcomeSectionimageOne.jpg.avif";
const FRONT_IMAGE = "/images/welcomeSectionimageTwo.jpg.avif";

// The text reveal and the image slide are both driven by the same 0 → 1
// progress and are timed to land together at the end of the pinned scroll.
// Each word overlaps the next four so the reveal reads as a wave rather than a
// wipe, and the step is derived from the word count plus that overlap so the
// final word reaches full opacity exactly on 1 — the same moment the incoming
// image arrives.

const FRONT_BLUR_START = 0.2;
const FRONT_BLUR_END = 1.1;
const FRONT_MAX_BLUR = 8;

const FRONT_BLUR_PROGRESS = `clamp(0, (var(--p) - ${FRONT_BLUR_START}) / ${FRONT_BLUR_END - FRONT_BLUR_START}, 1)`;
const FRONT_BLUR = `calc(${FRONT_MAX_BLUR}px * (1 - ${FRONT_BLUR_PROGRESS}))`;

const REVEAL_OVERLAP = 4;

// The back image stays sharp until the front image has risen about 80% of the
// way into view, then it blurs and dims into the backdrop behind the sharp
// front. It finishes at --p: 1, the same moment the text and slide land.
const BLUR_START = 0.8;
// 1 / (1 - BLUR_START)
const BLUR_STEP = 5;
const BLUR_PROGRESS = `clamp(0, (var(--p) - ${BLUR_START}) * ${BLUR_STEP}, 1)`;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

export default function Welcome({
  headline = "Welcome to",
  accent = "Crispies",
  description = PARAGRAPH,
  backImage = BACK_IMAGE,
  frontImage = FRONT_IMAGE,
}: {
  headline?: string;
  accent?: string;
  description?: string;
  backImage?: string;
  frontImage?: string;
}) {
  const { locale } = useLocale();
  const back = backImage.trim() || BACK_IMAGE;
  const front = frontImage.trim() || FRONT_IMAGE;
  const words = (description.trim() || PARAGRAPH).split(/\s+/);
  const wordStep = 1 / (words.length + REVEAL_OVERLAP - 1);
  const wordWindow = wordStep * REVEAL_OVERLAP;
  const outerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // One scroll listener drives everything: the 0 → 1 number is written to the
  // panel as the `--p` custom property, and every animated style below is a
  // calc() off that single value, so text and images can never drift apart.
  useEffect(() => {
    const outer = outerRef.current;
    const panel = panelRef.current;
    if (!outer || !panel) return;

    const setProgress = (value: number) => {
      panel.style.setProperty("--p", value.toFixed(4));
    };

    // Reduced motion: leave the section sitting in its finished design state.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setProgress(1);
      return;
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
      // Scroll distance the panel spends pinned: the wrapper's extra height.
      travel = Math.max(1, outer.offsetHeight - panel.offsetHeight);
    };

    const update = () => {
      frame = 0;
      const rect = outer.getBoundingClientRect();
      setProgress(clamp01((navbarH - rect.top) / travel));
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    const onResize = () => {
      measure();
      update();
    };

    measure();
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div ref={outerRef} className={`  ${styles.outer}   min-[1400px]:bg-black  rounded-3xl  lg:rounded-[50px]  `}>
      <div
        ref={panelRef}
        className={`${styles.panel} flex w-full items-center overflow-hidden rounded-3xl bg-white px-6 sm:px-10  md:px-14 lg:px-20 lg:rounded-[50px] `}
        // Falls back to the finished design when JS is unavailable, so the
        // section is never left half-revealed for no-JS visitors.
        style={{ "--p": "1" } as React.CSSProperties}
      >
        <div className="relative z-10 mx-auto flex w-full flex-col items-center gap-10 md:flex-row md:items-center md:gap-16 lg:gap-24 ">
          {/* Text Content */}

          <div className="flex-1 text-center md:text-start">
            <h2 className="font-[family-name:var(--font-korolev),Korolev,sans-serif] text-[clamp(32px,8vw,120px)] font-black capitalize leading-[1] tracking-[0.54px] text-black">
              {localizedText(locale, headline)}{" "}
              {accent && <span className="text-nowrap text-[#FF0931]">{localizedText(locale, accent)}</span>}
            </h2>
            <p className="mt-6 max-w-lg font-[family-name:var(--font-inter),Inter,sans-serif] text-[clamp(14px,2.5vw,24px)] font-normal capitalize leading-[1.5] tracking-[0.54px] text-black md:mt-8">
              {words.map((word, i) => {
                const start = (i * wordStep).toFixed(4);
                const span = wordWindow.toFixed(4);
                const revealed = `clamp(0, (var(--p) - ${start}) / ${span}, 1)`;
                return (
                  <span
                    key={`${word}-${i}`}
                    className="inline-block"
                    style={{
                      opacity: revealed,
                      filter: `blur(calc((1 - ${revealed}) * 6px))`,
                    }}
                  >
                    {word}
                    {i < words.length - 1 ? "\u00A0" : ""}
                  </span>
                );
              })}
            </p>
          </div>

          {/* Image — background unrotated, front rotated -5.059deg, both
              identical 3:2-ratio boxes so the front's tilted corners naturally
              reveal the blurred straight-edged copy behind them.
              At --p: 1 this is exactly the shipped design; the transforms only
              pull the two layers apart while the section scrolls. */}
          <div className="w-full   flex-1 md:w-auto">
            {/* Width is capped by the viewport height too, so the taller image
                can never overflow the pinned panel on short laptop screens. */}
            <div className="relative mx-auto     w-[280px] h-[280px] sm:w-[360px] sm:h-[360px]  md:w-[380px] md:h-[380px]   lg:w-[420px] lg:h-[420px] xl:w-[460px] @max-3xl:w-[520px] xl:h-[460px] @max-3xl:h-[520px] my-8 sm:my-20  md:mx-0">
              <div
                className="absolute inset-0 overflow-hidden rounded-2xl ring-1 ring-black/5 lg:rounded-3xl"
                style={{
                  background: `url('${back}') lightgray 10% / cover no-repeat`,

                  filter: `blur(calc(8px * ${BLUR_PROGRESS}))`,
                  opacity: `calc(1 - 0.5 * ${BLUR_PROGRESS})`,
                }}
              />

              <div
                className="absolute inset-0 overflow-hidden rounded-2xl ring-1 ring-black/5 lg:rounded-3xl"
                style={{
                  background: `url('${front}') lightgray top center / cover no-repeat`,

                  transform:
                    "translateY(calc(120vh - (120vh - 10%) * var(--p))) rotate(calc(4deg - 12deg * var(--p)))",

                  filter: `blur(${FRONT_BLUR})`,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
