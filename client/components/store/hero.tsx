"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useLenis } from "@/components/providers/smooth-scroll";

const HERO_IMG =
  "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=2000&auto=format&fit=crop";
const PILL_IMG =
  "https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=800&auto=format&fit=crop";
const HERO_VIDEO = "/sizzle-reel.mp4";

const SLICE_LINES: { text: string; cls: string; reveal: string; delay: string }[] = [
  { text: "GOOD", cls: "white-slice", reveal: "reveal-left", delay: "0.05s" },
  { text: "MOOD", cls: "red-slice", reveal: "reveal-center", delay: "0.18s" },
  { text: "FOOD.", cls: "white-slice", reveal: "reveal-right", delay: "0.32s" },
];

type HeroProps = { started: boolean };

export default function Hero({ started }: HeroProps) {
  const rootRef = useRef<HTMLElement>(null);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const [videoOpen, setVideoOpen] = useState(false);
  const { stop, start } = useLenis();

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const onMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 50;
      const y = (e.clientY / window.innerHeight - 0.5) * 50;
      setParallax({ x, y });
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  useEffect(() => {
    if (!videoOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setVideoOpen(false);
    };
    window.addEventListener("keydown", onKey);
    stop();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      start();
    };
  }, [videoOpen, stop, start]);

  return (
    <section
      ref={rootRef}
      aria-busy={!started}
      className={`relative flex h-dvh flex-col justify-between overflow-hidden bg-black text-white selection:bg-white selection:text-brand-red ${
        started ? "" : "hero-paused"
      }`}
    >
      {/* Ambient background image */}
      <div className="absolute inset-0 z-0">
        <Image
          src={HERO_IMG}
          alt="Crispies signature halal smash burger served in London"
          fill
          priority
          fetchPriority="high"
          sizes="100vw"
          className="object-cover object-center"
        />
        {/* Horizontal gradient - lighter for clearer image */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" aria-hidden />
        {/* Vertical gradient - subtle bottom fade */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/30" aria-hidden />
      </div>

      {/* Film grain */}
      <div
        className="pointer-events-none absolute inset-0 z-40 opacity-[0.05] mix-blend-overlay animate-grain"
        aria-hidden
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      <main className="relative z-20 mx-auto flex h-dvh w-full max-w-[1400px] flex-grow flex-col justify-between px-6 pb-8 pt-24 md:px-12 lg:px-16 xl:px-24">
        {/* Top tagline */}
        <div className="overflow-hidden">
          <p className="slide-in-right flex items-center gap-4 text-[9px] font-bold uppercase tracking-[0.3em] text-white/40 md:text-[10px]" style={{ animationDelay: "0.1s" }}>
            <span className="h-[3px] w-8 bg-brand-red" />
            <span>London &middot; Est. 2019 &middot; 100% Halal</span>
          </p>
        </div>

        {/* Headline + embedded pill */}
        <div
          className="z-30 flex flex-1 flex-col justify-center transition-transform duration-200 ease-out"
          style={{ transform: `translate(${parallax.x}px, ${parallax.y}px)` }}
        >
          <h1 className="font-teko flex w-fit flex-col text-6xl md:text-9xl lg:text-[180px] font-semibold leading-[0.8] uppercase tracking-normal">
            {/* Row 1: GOOD + pill */}
            <div
              className="reveal-left flex flex-wrap items-center gap-4 md:gap-8"
              style={{ animationDelay: "0.05s" }}
            >
              <span className="slice-text white-slice" data-text="GOOD">
                GOOD
              </span>
              <button
                type="button"
                onClick={() => setVideoOpen(true)}
                className="group relative flex h-24 w-40 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white/20 shadow-2xl transition-transform duration-300 hover:scale-[1.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red sm:h-28 sm:w-48 md:h-32 md:w-60 lg:h-36 lg:w-72 xl:h-40 xl:w-80"
                aria-label="Watch the sizzle reel"
              >
                <Image
                  src={PILL_IMG}
                  alt="Burger on the grill"
                  fill
                  sizes="(max-width: 640px) 128px, (max-width: 768px) 176px, 288px"
                  className="object-cover opacity-80 transition-all duration-700 group-hover:scale-110 group-hover:opacity-100"
                />
                <div className="absolute inset-0 bg-brand-red/10 mix-blend-color-burn transition-opacity duration-300 group-hover:opacity-0" aria-hidden />
                <span className="absolute flex h-12 w-12 items-center justify-center rounded-full border border-white/30 bg-white/10 pl-1 backdrop-blur-md transition-all duration-300 group-hover:scale-110 group-hover:bg-white/20 md:h-16 md:w-16">
                  <svg className="h-5 w-5 text-white drop-shadow-md md:h-6 md:w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </span>
              </button>
            </div>

            {/* Row 2 + 3 */}
            {SLICE_LINES.slice(1).map((line) => (
              <span
                key={line.text}
                className={`slice-text relative z-10 ${line.cls} ${line.reveal}`}
                data-text={line.text}
                style={{ animationDelay: line.delay }}
              >
                {line.text}
              </span>
            ))}
          </h1>
        </div>

        {/* Bottom: description + CTAs */}
        <div
          className="hero-fade-up grid w-full grid-cols-1 items-end gap-10 pb-8 lg:grid-cols-2"
          style={{ animationDelay: "0.55s" }}
        >
          <p
            className="max-w-xs border-l-2 border-brand-red pl-4 text-[11px] font-medium leading-relaxed tracking-wide text-white/50 transition-colors duration-300 hover:text-brand-red md:text-xs"
            style={{ transform: `translate(${parallax.x * 0.2}px, ${parallax.y * 0.2}px)` }}
          >
            Crispy on the outside. Juicy on the inside.
            <br />
            Made halal, made fresh, made for London.
          </p>

          <div
            className="flex flex-wrap items-center gap-4 pb-2 lg:justify-end"
            style={{ transform: `translate(${parallax.x * -0.2}px, ${parallax.y * -0.2}px)` }}
          >
            <Link
              href="/menu"
              className="group relative overflow-hidden rounded-full bg-brand-red px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-white transition-transform duration-300 hover:-translate-y-1 active:translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red"
            >
              <span className="relative z-10 flex items-center gap-2">
                Order delivery
                <span className="-mt-1 text-xl leading-none transition-transform group-hover:translate-x-1">&rarr;</span>
              </span>
              <div className="absolute inset-0 z-0 h-full w-0 bg-white opacity-10 transition-all duration-300 ease-out group-hover:w-full" aria-hidden />
            </Link>
            <Link
              href="/cart"
              className="group rounded-full border border-white/30 bg-transparent px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-white/60 transition-all duration-300 hover:-translate-y-1 hover:border-white hover:bg-white/5 hover:text-white active:translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              <span className="transition-all duration-300 group-hover:tracking-[0.2em]">Click &amp; collect</span>
            </Link>
          </div>
        </div>
      </main>

      {/* Sizzle reel modal */}
      {videoOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Sizzle reel video"
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8"
        >
          <div
            className="video-modal-backdrop-enter absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={() => setVideoOpen(false)}
            aria-hidden
          />
          <div className="video-modal-enter relative z-10 w-full max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl">
            <button
              type="button"
              onClick={() => setVideoOpen(false)}
              className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white/70 transition-colors hover:bg-white/20 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red"
              aria-label="Close video"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                <line x1="6" y1="6" x2="18" y2="18" />
                <line x1="6" y1="18" x2="18" y2="6" />
              </svg>
            </button>
            <video
              className="aspect-video w-full bg-black"
              src={HERO_VIDEO}
              controls
              autoPlay
              playsInline
              aria-label="Crispies sizzle reel"
            />
          </div>
        </div>
      )}
    </section>
  );
}