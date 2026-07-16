"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";

interface DealType {
  id: string;
  badge: string;
  title: string;
  price: string;
  imageUrl: string;
}

const deals: DealType[] = [
  {
    id: "01",
    badge: "SIGNATURE",
    title: "THE SMASH\nBURGER",
    price: "£9.49",
    imageUrl:
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=1600&h=900",
  },
  {
    id: "02",
    badge: "LIMITED TIME",
    title: "SPICY CRISP\nCHICKEN",
    price: "£8.99",
    imageUrl:
      "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&q=80&w=1600&h=900",
  },
  {
    id: "03",
    badge: "CROWD FAVORITE",
    title: "DOUBLE\nTROUBLE",
    price: "£11.49",
    imageUrl:
      "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&q=80&w=1600&h=900",
  },
];

const SLIDE_DURATION = 6;

export default function DealsSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % deals.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + deals.length) % deals.length);
  }, []);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      nextSlide();
    }, SLIDE_DURATION * 1000);
    return () => clearInterval(timer);
  }, [currentIndex, isPaused, nextSlide]);

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .deals-text-outline {
              color: transparent;
              -webkit-text-stroke: 1.5px rgba(255, 255, 255, 0.15);
            }
            @keyframes fillProgress {
              0% { transform: scaleX(0); }
              100% { transform: scaleX(1); }
            }
          `,
        }}
      />

      <section
        className="bg-brand-black flex min-h-screen items-center justify-center p-2 selection:bg-brand-red selection:text-white sm:p-4 md:p-8 lg:p-12"
        aria-label="Featured deals"
      >
        <div
          className="group/container relative min-h-[500px] w-full overflow-hidden rounded-[1.5rem] bg-black shadow-2xl md:min-h-[600px] md:rounded-[2rem] lg:h-[75vh]"
          style={{ maxWidth: "80rem" }}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Navigation Panel */}
          <div className="absolute left-4 right-4 top-4 z-40 flex items-center justify-between text-white mix-blend-difference sm:left-6 sm:right-6 sm:top-6">
            <div className="hidden items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] sm:flex md:gap-4 md:text-sm">
              <div className="h-[2px] w-8 bg-white/50 md:w-12" />
              <span>Featured</span>
            </div>

            <div className="ml-auto flex items-center gap-4 sm:ml-0 md:gap-6">
              <div className="font-display text-lg tracking-wider md:text-xl">
                {String(currentIndex + 1).padStart(2, "0")}{" "}
                <span className="text-white/40">
                  / {String(deals.length).padStart(2, "0")}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={prevSlide}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 backdrop-blur-sm transition-colors hover:bg-white hover:text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red md:h-11 md:w-11"
                  aria-label="Previous deal"
                >
                  <ArrowLeftIcon />
                </button>
                <button
                  onClick={nextSlide}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 backdrop-blur-sm transition-colors hover:bg-white hover:text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red md:h-11 md:w-11"
                  aria-label="Next deal"
                >
                  <ArrowRightIcon />
                </button>
              </div>
            </div>
          </div>

          {/* Slides */}
          {deals.map((deal, idx) => {
            const isActive = idx === currentIndex;

            return (
              <div
                key={deal.id}
                className={`pointer-events-none absolute inset-0 transition-all duration-1000 ease-[cubic-bezier(0.77,0,0.175,1)] ${
                  isActive
                    ? "z-20 opacity-100 pointer-events-auto"
                    : "z-10 opacity-0"
                }`}
              >
                {/* Background Image with Ken Burns */}
                <div
                  className={`absolute inset-0 transition-transform duration-[6s] ease-out ${
                    isActive ? "scale-100" : "scale-110"
                  }`}
                >
                  <Image
                    src={deal.imageUrl}
                    alt={deal.title.replace("\n", " ")}
                    fill
                    sizes="100vw"
                    className="object-cover object-center"
                    priority={idx === 0}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-black via-black/10 to-transparent opacity-90" />
                  <div className="absolute inset-0 bg-gradient-to-r from-brand-black/80 via-transparent to-transparent opacity-90" />
                  <div
                    className="pointer-events-none absolute inset-0 z-0 opacity-[0.05] mix-blend-overlay"
                    aria-hidden
                    style={{
                      backgroundImage:
                        "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
                    }}
                  />
                </div>

                {/* Hollow Text Background */}
                <div className="pointer-events-none absolute left-1/2 top-1/4 z-10 w-full -translate-x-1/2 -translate-y-1/2 overflow-hidden text-center">
                  <h2
                    className={`deals-text-outline font-display whitespace-nowrap text-[22vw] uppercase leading-none transition-all duration-[1.2s] ease-[cubic-bezier(0.16,1,0.3,1)] md:text-[15vw] ${
                      isActive
                        ? "translate-y-0 opacity-100 delay-200"
                        : "translate-y-16 opacity-0"
                    }`}
                  >
                    {deal.title.replace("\n", " ")}
                  </h2>
                </div>

                {/* Content Overlay */}
                <div className="pointer-events-none absolute inset-0 z-30 flex flex-col justify-end p-5 pb-20 sm:p-8 sm:pb-24 md:p-12 lg:p-16">
                  <div className="pointer-events-auto flex flex-col gap-6 md:flex-row md:items-end md:justify-between md:gap-8">
                    {/* Badge & Title */}
                    <div className="relative max-w-2xl overflow-hidden">
                      {/* Badge */}
                      <div
                        className={`transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                          isActive
                            ? "translate-y-0 opacity-100 delay-400"
                            : "translate-y-12 opacity-0"
                        }`}
                      >
                        <div className="mb-4 inline-flex items-center gap-3 md:mb-6">
                          <span className="flex items-center gap-2 rounded bg-brand-red px-3 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-white shadow-[0_0_20px_rgba(220,38,38,0.4)] sm:text-sm">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              stroke="none"
                              className="animate-pulse"
                              aria-hidden
                            >
                              <path d="M12 2c-.546 2.37-3.146 4.792-4.838 7.025-1.926 2.544-2.825 5.518-1.558 8.653 1.096 2.71 3.565 4.322 6.396 4.322 2.83 0 5.3-1.612 6.396-4.322 1.267-3.135.368-6.109-1.558-8.653-1.692-2.233-4.292-4.655-4.838-7.025z" />
                            </svg>
                            {deal.badge}
                          </span>
                        </div>
                      </div>

                      {/* Title */}
                      <div
                        className={`transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                          isActive
                            ? "translate-y-0 opacity-100 delay-500"
                            : "translate-y-12 opacity-0"
                        }`}
                      >
                        <h2 className="font-display whitespace-pre-line text-[3.5rem] uppercase leading-[0.9] text-white drop-shadow-2xl sm:text-6xl md:text-8xl lg:text-[7rem]">
                          {deal.title}
                        </h2>
                      </div>
                    </div>

                    {/* Price Button */}
                    <div
                      className={`mt-2 w-full transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] md:mt-0 md:w-auto md:pb-8 ${
                        isActive
                          ? "translate-x-0 opacity-100 delay-600"
                          : "translate-x-12 opacity-0"
                      }`}
                    >
                      <button className="group/btn relative flex w-full items-center justify-between overflow-hidden rounded-full border border-white/20 bg-white/10 py-2 pl-6 pr-2 backdrop-blur-md transition-all duration-500 hover:border-brand-red hover:bg-brand-red sm:w-auto md:justify-center md:gap-6 md:pl-8">
                        <span className="text-xs font-bold uppercase tracking-widest text-white sm:text-sm">
                          {deal.price}
                        </span>
                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-white text-black transition-transform duration-500 group-hover/btn:scale-95 group-hover/btn:-rotate-45">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden
                          >
                            <path d="M5 12h14" />
                            <path d="m12 5 7 7-7 7" />
                          </svg>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Progress Indicator */}
          <div className="absolute bottom-4 left-1/2 z-40 flex -translate-x-1/2 gap-2 md:bottom-6 md:gap-3">
            {deals.map((_, idx) => (
              <div
                key={idx}
                className="group/dash relative h-1 w-8 cursor-pointer overflow-hidden rounded-full bg-white/20 sm:w-12 md:h-1.5 md:w-16"
                onClick={() => goToSlide(idx)}
                role="button"
                aria-label={`Go to deal ${idx + 1}`}
              >
                <div className="absolute inset-0 origin-left scale-x-0 bg-white/40 transition-transform duration-300 group-hover/dash:scale-x-100" />
                <div
                  key={
                    idx === currentIndex
                      ? `active-${currentIndex}`
                      : `inactive-${idx}`
                  }
                  className="absolute inset-0 origin-left bg-brand-red"
                  style={{
                    transform:
                      idx < currentIndex ? "scaleX(1)" : "scaleX(0)",
                    animation:
                      idx === currentIndex
                        ? `fillProgress ${SLIDE_DURATION}s linear forwards`
                        : "none",
                    animationPlayState: isPaused ? "paused" : "running",
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function ArrowLeftIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
