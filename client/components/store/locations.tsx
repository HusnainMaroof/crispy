// locations.tsx
"use client";

import dynamic from "next/dynamic";
import { SVGProps, useState } from "react";
import type { MapLocation } from "./locations-map";

const LocationsMap = dynamic(() => import("./locations-map"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center text-white/40 text-sm">
      Loading map…
    </div>
  ),
});
function LocationPinIcon(props: SVGProps<SVGSVGElement>) {
  // ⚠ Not provided in the spec — placeholder pin icon, swap for the real asset.
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="150"
      height="150"
      viewBox="0 0 255 255"
      fill="none"
    >
      <rect width="255" height="255" rx="30" fill="#E21E2F" />
      <path
        d="M182.57 146.016L170.92 146.036C168.81 146.036 167.47 147.626 167.65 149.576C167.81 151.356 169.43 152.696 171.4 152.356L178.06 152.496L188.59 183.836C188.59 183.836 74.7 185.176 71.99 184.586L84.72 152.356L88.76 152.416H94.3C96.15 152.416 97.54 150.966 97.57 149.326C97.61 147.756 96.32 146.056 94.49 146.046L80.05 146.016L67 183.936V190.126L196.3 189.956V186.906L182.57 146.016Z"
        fill="white"
      />
      <path
        d="M167.71 86.1256C163.41 77.9356 156.43 71.6856 147.92 67.9956C139.22 64.2356 129.57 64.0756 120.56 67.1756C113.28 69.6856 106.7 73.8856 101.51 79.5656C95.3596 86.2956 91.9596 94.7456 91.1196 103.776C89.5396 120.906 96.4396 137.586 106.72 151.096C113.54 160.056 121.92 167.476 131.34 173.566C132.64 174.406 133.8 174.176 135 173.396C138.39 171.166 141.57 168.986 144.67 166.286C155.7 156.656 164.12 144.466 168.9 130.566C173.77 116.376 174.77 99.5656 167.7 86.1256H167.71ZM135.64 138.186C118.16 140.296 102.24 127.756 100.14 110.266C98.0596 92.9556 110.42 76.8556 128.12 74.7856C145.88 72.7056 161.65 85.5656 163.57 102.976C165.49 120.376 153.02 136.086 135.63 138.186H135.64Z"
        fill="black"
      />
      <path
        d="M150.13 96.9962C138.91 82.9862 107.21 92.0562 113.11 100.926C113.84 102.016 115.14 102.486 116.71 102.486L147.8 102.466C149.12 102.466 150.6 102.016 151.02 100.976C151.54 99.7162 150.99 98.0562 150.13 96.9862V96.9962ZM123.78 97.9262C122.83 98.2162 121.74 97.5562 121.45 96.5462C121.18 95.6262 121.79 94.5162 122.93 94.2662C123.94 94.0462 124.88 94.7162 125.1 95.5162C125.41 96.6262 124.82 97.6162 123.78 97.9362V97.9262ZM132.11 96.1262C131.06 96.3262 130.05 95.6062 129.87 94.5762C129.68 93.5162 130.36 92.5362 131.59 92.3462C132.56 92.1962 133.52 93.0062 133.67 93.8562C133.86 94.9562 133.12 95.9362 132.11 96.1262ZM141.36 97.5862C140.45 98.0762 139.43 97.7662 138.94 97.1562C138.16 96.1862 138.44 94.9662 139.6 94.3162C140.57 93.7662 141.71 94.2562 142.13 95.1562C142.53 96.0062 142.16 97.1462 141.35 97.5862H141.36Z"
        fill="white"
      />
      <path
        d="M150.57 114.375C150.93 117.775 148.99 120.585 145.62 120.585H117.63C114.86 120.585 113.11 118.535 112.79 115.985C112.71 115.385 112.68 113.665 113.62 113.665L149.02 113.615C149.54 113.615 150.52 113.965 150.57 114.375Z"
        fill="white"
      />
      <path
        d="M142.66 104.526C146.31 104.206 150.67 104.746 150.65 107.936C150.64 109.586 148.79 111.336 146.88 111.346L118.66 111.436C115.75 111.436 112.99 110.656 112.76 108.276C112.53 105.896 114.79 104.506 117.8 104.506H132.19L137.46 109.916L142.66 104.516V104.526Z"
        fill="white"
      />
    </svg>
  );
}
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
      width="38"
      height="38"
      viewBox="0 0 38 38"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <rect x="0.5" y="0.5" width="36.8693" height="36.8693" rx="14.5" stroke="#FF0931" />
      <path d="M13.4312 26.4355L11.959 24.9633L22.906 13.9974H14.4504L14.4693 11.959H26.4167V23.9253H24.3594L24.3782 15.4696L13.4312 26.4355Z" fill="#FF0931" />
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
    <section className="relative w-full bg-white px-6 py-16 sm:px-10 sm:py-20 md:px-14 md:py-24 lg:px-20 lg:py-28">

      <div className="absolute translate-x-[-50%] left-[50%] translate-y-[-50%] top-0 ">
        <LocationPinIcon/>
      </div>
      <div className="mx-auto max-w-[1280px]">
        {/* Headline */}
        <h2
          className="m-0 text-center uppercase font-normal leading-[100%] tracking-[0.54px]"
          style={{
            fontFamily: "var(--font-koulen), Koulen, sans-serif",
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
                    className="loc-row cursor-pointer border-b border-[#EAEAEA] py-4 sm:py-5 md:py-[22px] hover:bg-gray-50 transition-colors duration-200"
                  >
                    <div className="loc-slide flex flex-wrap lg:flex-nowrap items-center gap-x-3 sm:gap-x-4 md:gap-x-5 gap-y-2.5">
                      {/* 01 */}
                      <span
                        className={`loc-hover-red ${numColor} font-normal leading-none shrink-0 w-6 sm:w-7`}
                        style={{
                          fontFamily: "var(--font-koulen), Koulen, sans-serif",
                          fontSize: "clamp(16px, 1.8vw, 20px)",
                        }}
                      >
                        {displayNum}
                      </span>

                      {/* NAME */}
                      <span
                        className={`loc-hover-red ${nameColor} uppercase font-normal leading-none shrink-0 whitespace-nowrap`}
                        style={{
                          fontFamily: "var(--font-koulen), Koulen, sans-serif",
                          fontSize: "clamp(20px, 2.4vw, 28px)",
                          letterSpacing: "0.54px",
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
                        className={`${statusBg} inline-flex items-center gap-1.5 shrink-0 rounded-full px-3 py-[5px] text-white font-medium leading-none whitespace-nowrap order-4 lg:order-none transition-transform duration-200 hover:scale-105`}
                        style={{
                          fontFamily:
                            "var(--font-inter), Inter, sans-serif",
                          fontSize: "clamp(11px, 1.15vw, 13px)",
                        }}
                      >
                        <span
                          className={`w-[6px] h-[6px] rounded-full ${statusDot} shrink-0`}
                        />
                        {loc.status === "open" ? "Open Now" : "Close Now"}
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
                        className="shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-[#FF0931] flex items-center justify-center text-[#FF0931] hover:bg-[#FF0931] hover:text-white transition-all duration-200 ml-auto lg:ml-0 order-2 lg:order-none hover:scale-110"
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
                className="uppercase font-normal leading-none tracking-[0.54px]"
                style={{
                  fontFamily: "var(--font-koulen), Koulen, sans-serif",
                  fontSize: "clamp(22px, 2.8vw, 32px)",
                }}
              >
                View All 10+ Location
              </span>
              <span className="w-10 h-10 sm:w-11 sm:h-11 rounded-[10px] sm:rounded-[12px] bg-white flex items-center justify-center shrink-0">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 38 38"
                  fill="none"
                >
                  <path d="M13.4312 26.4355L11.959 24.9633L22.906 13.9974H14.4504L14.4693 11.959H26.4167V23.9253H24.3594L24.3782 15.4696L13.4312 26.4355Z" fill="#FF0931" />
                </svg>
              </span>
            </button>
          </div>

          {/* Right — real map card */}
          <div className="w-full lg:w-[340px] xl:w-[380px] shrink-0">
            <div className="relative min-h-[420px] sm:min-h-[480px] lg:min-h-[500px] rounded-[20px] sm:rounded-[24px] overflow-hidden bg-[#1A1A1A]">
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