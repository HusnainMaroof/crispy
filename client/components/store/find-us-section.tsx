"use client";

import { useState } from "react";

interface LocationType {
  id: string;
  name: string;
  postcode: string;
  hours: string;
  mapsUrl: string;
}

const locations: LocationType[] = [
  {
    id: "01",
    name: "Stratford",
    postcode: "E15 1DA",
    hours: "11am\u201311pm",
    mapsUrl: "https://maps.google.com/?q=Stratford+E15+1DA",
  },
  {
    id: "02",
    name: "Whitechapel",
    postcode: "E1 1BJ",
    hours: "11am\u201312am",
    mapsUrl: "https://maps.google.com/?q=Whitechapel+E1+1BJ",
  },
  {
    id: "03",
    name: "Walthamstow",
    postcode: "E17 7LD",
    hours: "11am\u201311pm",
    mapsUrl: "https://maps.google.com/?q=Walthamstow+E17+7LD",
  },
  {
    id: "04",
    name: "Ilford",
    postcode: "IG1 1TG",
    hours: "11am\u201311pm",
    mapsUrl: "https://maps.google.com/?q=Ilford+IG1+1TG",
  },
  {
    id: "05",
    name: "Bethnal Green",
    postcode: "E2 6AA",
    hours: "11am\u201312am",
    mapsUrl: "https://maps.google.com/?q=Bethnal+Green+E2+6AA",
  },
];

function LocationRow({
  location,
  isHovered,
  onMouseEnter,
  onMouseLeave,
}: {
  location: LocationType;
  isHovered: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  return (
    <a
      href={location.mapsUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex cursor-pointer items-center justify-between border-b border-white/10 py-5 transition-opacity duration-300 first:border-t md:py-7"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="flex w-full items-baseline gap-4 md:gap-8">
        {/* Number */}
        <div className="w-8 text-lg font-semibold text-white/40 transition-colors duration-150 group-hover:text-brand-red md:w-12 md:text-2xl">
          {location.id}
        </div>

        {/* Name + Postcode */}
        <div className="min-w-0 flex-1">
          <h4 className="flex items-center gap-4 text-lg font-semibold uppercase text-nowrap bg-linear-to-r from-white from-50% to-brand-red to-50% bg-size-[200%] bg-left bg-clip-text text-transparent transition-[background-position] duration-700 group-hover:bg-right md:text-3xl">
            {location.name}

            {/* Arrow icon — appears on hover */}
            <span
              className={`ml-1 flex items-center text-brand-red transition-all duration-300 ${
                isHovered
                  ? "translate-x-0 opacity-100"
                  : "-translate-x-2 opacity-0"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M7 7h10v10" />
                <path d="M7 17 17 7" />
              </svg>
            </span>
          </h4>

          {/* Postcode */}
          <span className="mt-2 block text-[10px] font-semibold uppercase tracking-widest text-white/30 md:mt-3 md:text-sm">
            {location.postcode}
          </span>
        </div>

        {/* Hours */}
        <div className="shrink-0 text-right text-sm font-semibold uppercase tracking-widest text-white/50 md:text-base">
          {location.hours}
        </div>
      </div>
    </a>
  );
}

export default function FindUsSection() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <section className="relative overflow-hidden bg-black p-8 text-white md:p-16 lg:p-24">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-12 flex flex-col items-baseline justify-between gap-4 md:mb-16 md:flex-row">
          <h2 className="font-display text-4xl uppercase md:text-5xl lg:text-6xl">
            Find Us
          </h2>
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
            London, UK
          </span>
        </div>

        {/* Location List */}
        <div className="find-us-container flex w-full flex-col">
          {locations.map((location, index) => (
            <LocationRow
              key={location.id}
              location={location}
              isHovered={hoveredIndex === index}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            />
          ))}
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
            .find-us-container:hover .group:not(:hover) {
              opacity: 0.3;
            }
          `,
        }}
      />
    </section>
  );
}
