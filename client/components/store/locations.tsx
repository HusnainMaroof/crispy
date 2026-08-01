// locations.tsx
"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import type { MapLocation } from "./locations-map";

const LocationsMap = dynamic(() => import("./locations-map"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center text-white/40 text-sm">
      Loading map…
    </div>
  ),
});

// PLACEHOLDER DATA — real London coordinates as stand-ins so the map/fly-to
// animation is demoable now. Swap in real branch addresses + lat/lng before
// shipping. Each location now has a genuinely unique id (was "01" duplicated
// across all 5 rows before) — the displayed 01/02/03 number is derived from
// array position instead, since a display index and a stable id are not the
// same thing and shouldn't share a field.
const locations = [
  {
    id: "tower-hill",
    name: "Tower Hill",
    address: "2 Tower Hill Ter, London EC3N\n4EE, United Kingdom",
    status: "open" as const,
    hours: "11AM – 11 PM",
    lat: 51.5098,
    lng: -0.0759,
  },
  {
    id: "camden-town",
    name: "Camden Town",
    address: "45 Camden High St, London NW1\n7JH, United Kingdom",
    status: "open" as const,
    hours: "11AM – 11 PM",
    lat: 51.539,
    lng: -0.1426,
  },
  {
    id: "shoreditch",
    name: "Shoreditch",
    address: "112 Shoreditch High St, London E1\n6JN, United Kingdom",
    status: "open" as const,
    hours: "11AM – 11 PM",
    lat: 51.5229,
    lng: -0.0777,
  },
  {
    id: "westminster",
    name: "Westminster",
    address: "9 Victoria St, London SW1H\n0EX, United Kingdom",
    status: "open" as const,
    hours: "11AM – 11 PM",
    lat: 51.4994,
    lng: -0.1248,
  },
  {
    id: "canary-wharf",
    name: "Canary Wharf",
    address: "1 Canada Sq, London E14\n5AB, United Kingdom",
    status: "closed" as const,
    hours: "11AM – 11 PM",
    lat: 51.5054,
    lng: -0.0235,
  },
];

const mapLocations: MapLocation[] = locations.map((l) => ({
  id: l.id,
  name: l.name,
  lat: l.lat,
  lng: l.lng,
}));

function PinIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function ArrowIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M7 17 17 7" />
      <path d="M7 7h10v10" />
    </svg>
  );
}

function BuildingIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M3 21h18" />
      <path d="M5 21V7l7-4 7 4v14" />
      <path d="M9 21v-4h6v4" />
      <path d="M9 9h.01M15 9h.01M9 13h.01M15 13h.01" />
    </svg>
  );
}

export default function Locations() {
  const [selectedId, setSelectedId] = useState<string>(locations[0].id);

  return (
    <section className="relative w-full bg-white py-16 sm:py-20 md:py-24 lg:py-28">
      <div className="mx-auto max-w-[1280px] px-5 sm:px-6 xl:px-10">
        {/* Headline */}
        <h2
          className="m-0 text-center uppercase font-normal leading-[100%] tracking-[0.02em]"
          style={{
            fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
            fontSize: "clamp(36px, 7vw, 80px)",
          }}
        >
          <span className="text-black">Find Your </span>
          <span className="text-[#FF0931]">Nearest Crispies</span>
        </h2>

        {/* Content */}
        <div className="mt-10 sm:mt-12 md:mt-14 flex flex-col lg:flex-row gap-8 lg:gap-10 xl:gap-12 items-stretch">
          {/* Left — list + CTA */}
          <div className="flex-1 min-w-0 flex flex-col">
            <ul className="m-0 p-0 list-none loc-list">
              {locations.map((loc, i) => {
                const isActive = loc.id === selectedId;
                const numColor = isActive ? "text-[#BDBDBD]" : "text-[#D0D0D0]";
                const nameColor = isActive ? "text-black" : "text-[#B0B0B0]";
                const addrColor = isActive ? "text-[#9A9A9A]" : "text-[#C4C4C4]";
                const hoursColor = isActive ? "text-[#6B6B6B]" : "text-[#B0B0B0]";
                const statusBg =
                  loc.status === "closed"
                    ? "bg-[#8B6F5E]"
                    : isActive
                      ? "bg-[#1F5C2E]"
                      : "bg-[#6FA06A]";
                const statusDot =
                  loc.status === "closed"
                    ? "bg-[#C9A892]"
                    : isActive
                      ? "bg-[#7CFF8A]"
                      : "bg-[#C8F0C0]";
                const displayNum = String(i + 1).padStart(2, "0");

                return (
                  <li
                    key={loc.id}
                    role="button"
                    tabIndex={0}
                    aria-pressed={isActive}
                    onClick={() => setSelectedId(loc.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedId(loc.id);
                      }
                    }}
                    className="loc-row cursor-pointer border-b border-[#EAEAEA] py-4 sm:py-5 md:py-[22px]"
                  >
                    <div className="loc-slide flex flex-wrap lg:flex-nowrap items-center gap-x-3 sm:gap-x-4 md:gap-x-5 gap-y-2.5">
                      {/* 01 */}
                      <span
                        className={`loc-hover-red ${numColor} font-normal leading-none shrink-0 w-6 sm:w-7`}
                        style={{
                          fontFamily:
                            "var(--font-bebas), 'Bebas Neue', sans-serif",
                          fontSize: "clamp(16px, 1.8vw, 20px)",
                        }}
                      >
                        {displayNum}
                      </span>

                      {/* NAME */}
                      <span
                        className={`loc-hover-red ${nameColor} uppercase font-normal leading-none shrink-0 whitespace-nowrap`}
                        style={{
                          fontFamily:
                            "var(--font-bebas), 'Bebas Neue', sans-serif",
                          fontSize: "clamp(20px, 2.4vw, 28px)",
                        }}
                      >
                        {loc.name}
                      </span>

                      {/* Address */}
                      <div className="flex items-start gap-1.5 min-w-0 flex-1 basis-[calc(100%-4rem)] sm:basis-auto order-3 lg:order-none w-full lg:w-auto">
                        <PinIcon
                          className={`w-3.5 h-3.5 shrink-0 mt-[2px] ${
                            isActive ? "text-[#B0B0B0]" : "text-[#D0D0D0]"
                          }`}
                        />
                        <span
                          className={`loc-hover-red ${addrColor} font-normal leading-[140%] whitespace-pre-line`}
                          style={{
                            fontFamily:
                              "var(--font-inter), Inter, sans-serif",
                            fontSize: "clamp(11px, 1.15vw, 13px)",
                          }}
                        >
                          {loc.address}
                        </span>
                      </div>

                      {/* Status */}
                      <span
                        className={`${statusBg} inline-flex items-center gap-1.5 shrink-0 rounded-full px-3 py-[5px] text-white font-medium leading-none whitespace-nowrap order-4 lg:order-none`}
                        style={{
                          fontFamily:
                            "var(--font-inter), Inter, sans-serif",
                          fontSize: "clamp(11px, 1.15vw, 13px)",
                        }}
                      >
                        <span
                          className={`w-[6px] h-[6px] rounded-full ${statusDot} shrink-0`}
                        />
                        {loc.status === "open" ? "Open Now" : "Closed Now"}
                      </span>

                      {/* Hours */}
                      <span
                        className={`loc-hover-red ${hoursColor} font-normal leading-none shrink-0 whitespace-nowrap order-5 lg:order-none ml-auto lg:ml-0`}
                        style={{
                          fontFamily:
                            "var(--font-inter), Inter, sans-serif",
                          fontSize: "clamp(12px, 1.2vw, 14px)",
                        }}
                      >
                        {loc.hours}
                      </span>

                      {/* Arrow */}
                      <button
                        type="button"
                        aria-label={`Show ${loc.name} on map`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedId(loc.id);
                        }}
                        className="shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-[#FF0931] flex items-center justify-center text-[#FF0931] hover:bg-[#FF0931] hover:text-white transition-colors duration-200 ml-auto lg:ml-0 order-2 lg:order-none"
                      >
                        <ArrowIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* View all CTA */}
            <button
              type="button"
              className="mt-6 sm:mt-8 w-full flex items-center justify-between gap-4 rounded-[12px] sm:rounded-[14px] bg-[#FF0931] hover:bg-[#E0082C] transition-colors duration-200 pl-6 sm:pl-8 pr-3 sm:pr-3.5 py-3 sm:py-3.5 text-white"
            >
              <span
                className="uppercase font-normal leading-none tracking-[0.04em]"
                style={{
                  fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
                  fontSize: "clamp(22px, 2.8vw, 32px)",
                }}
              >
                View All 10+ Location
              </span>
              <span className="w-10 h-10 sm:w-11 sm:h-11 rounded-[10px] sm:rounded-[12px] bg-white flex items-center justify-center text-[#FF0931] shrink-0">
                <ArrowIcon className="w-5 h-5" />
              </span>
            </button>
          </div>

          {/* Right — real map card */}
          <div className="w-full lg:w-[340px] xl:w-[380px] shrink-0">
            <div className="relative h-full min-h-[420px] sm:min-h-[480px] lg:min-h-full rounded-[20px] sm:rounded-[24px] overflow-hidden bg-[#1A1A1A]">
              <LocationsMap locations={mapLocations} selectedId={selectedId} />

              {/* Bottom banner — sits above the map tiles */}
              <div className="absolute bottom-0 left-0 right-0 z-[3] bg-[#FF0931] px-4 sm:px-5 py-3.5 sm:py-4 flex items-center justify-between gap-3 pointer-events-none">
                <div className="flex items-center gap-2.5 min-w-0">
                  <PinIcon className="w-5 h-5 text-white shrink-0" />
                  <span
                    className="text-white uppercase font-normal leading-[110%] tracking-[0.04em]"
                    style={{
                      fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
                      fontSize: "clamp(14px, 1.6vw, 18px)",
                    }}
                  >
                    More Location
                    <br />
                    Coming Soon
                  </span>
                </div>
                <BuildingIcon className="w-8 h-8 sm:w-9 sm:h-9 text-white shrink-0 opacity-90" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}