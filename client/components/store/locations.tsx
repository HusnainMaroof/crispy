// locations.tsx

const locations = [
  {
    id: "01",
    name: "Tower Hill",
    address: "2 Tower Hi Ter, London EC3N\n4EE, United Kingdom",
    status: "open" as const,
    hours: "11AM – 11 PM",
    tone: "active" as const,
  },
  {
    id: "01",
    name: "Tower Hill",
    address: "2 Tower Hi Ter, London EC3N\n4EE, United Kingdom",
    status: "open" as const,
    hours: "11AM – 11 PM",
    tone: "muted" as const,
  },
  {
    id: "01",
    name: "Tower Hill",
    address: "2 Tower Hi Ter, London EC3N\n4EE, United Kingdom",
    status: "open" as const,
    hours: "11AM – 11 PM",
    tone: "muted" as const,
  },
  {
    id: "01",
    name: "Tower Hill",
    address: "2 Tower Hi Ter, London EC3N\n4EE, United Kingdom",
    status: "open" as const,
    hours: "11AM – 11 PM",
    tone: "muted" as const,
  },
  {
    id: "01",
    name: "Tower Hill",
    address: "2 Tower Hi Ter, London EC3N\n4EE, United Kingdom",
    status: "closed" as const,
    hours: "11AM – 11 PM",
    tone: "muted" as const,
  },
];

const mapPins = [
  { n: 1, label: "City of London", top: "18%", left: "38%" },
  { n: 2, label: null, top: "28%", left: "72%" },
  { n: 3, label: "Westminster", top: "52%", left: "32%" },
  { n: 4, label: null, top: "68%", left: "78%" },
];

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
                const isActive = loc.tone === "active";
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

                return (
                  <li
                    key={i}
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
                        {loc.id}
                      </span>

                      {/* TOWER HILL */}
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
                        aria-label={`Open ${loc.name}`}
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

          {/* Right — map card */}
          <div className="w-full lg:w-[340px] xl:w-[380px] shrink-0">
            <div className="relative h-full min-h-[420px] sm:min-h-[480px] lg:min-h-full rounded-[20px] sm:rounded-[24px] overflow-hidden bg-[#1A1A1A]">
              {/* Map texture */}
              <div
                className="absolute inset-0 opacity-40"
                style={{
                  backgroundImage: `
                    radial-gradient(circle at 30% 25%, #2a2a2a 0%, transparent 40%),
                    radial-gradient(circle at 70% 60%, #252525 0%, transparent 35%),
                    linear-gradient(180deg, #1f1f1f 0%, #141414 100%)
                  `,
                }}
              />
              {/* Subtle grid roads */}
              <svg
                className="absolute inset-0 w-full h-full opacity-30"
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path
                  d="M0 80 Q80 60 160 90 T320 70 T400 100"
                  stroke="#3a3a3a"
                  strokeWidth="8"
                  fill="none"
                />
                <path
                  d="M0 180 Q100 200 200 160 T400 190"
                  stroke="#333"
                  strokeWidth="6"
                  fill="none"
                />
                <path
                  d="M40 0 Q60 120 50 240 T80 480"
                  stroke="#353535"
                  strokeWidth="10"
                  fill="none"
                />
                <path
                  d="M200 0 Q180 150 220 300 T180 500"
                  stroke="#2e2e2e"
                  strokeWidth="7"
                  fill="none"
                />
                <path
                  d="M300 40 Q280 160 320 280 T300 480"
                  stroke="#333"
                  strokeWidth="5"
                  fill="none"
                />
                <circle cx="140" cy="120" r="40" fill="#222" opacity="0.6" />
                <circle cx="260" cy="280" r="50" fill="#1e1e1e" opacity="0.5" />
              </svg>

              {/* Area labels */}
              <span
                className="absolute top-[14%] left-1/2 -translate-x-1/2 text-[#5A5A5A] uppercase tracking-[0.18em] font-medium z-[1]"
                style={{
                  fontFamily: "var(--font-inter), Inter, sans-serif",
                  fontSize: "clamp(10px, 1.1vw, 12px)",
                }}
              >
                City of London
              </span>
              <span
                className="absolute top-[46%] left-[18%] text-[#5A5A5A] uppercase tracking-[0.18em] font-medium z-[1]"
                style={{
                  fontFamily: "var(--font-inter), Inter, sans-serif",
                  fontSize: "clamp(10px, 1.1vw, 12px)",
                }}
              >
                Westminster
              </span>

              {/* Pins */}
              {mapPins.map((pin) => (
                <div
                  key={pin.n}
                  className="absolute z-[2] -translate-x-1/2 -translate-y-full"
                  style={{ top: pin.top, left: pin.left }}
                >
                  <div className="relative flex flex-col items-center">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#FF0931] border-[3px] border-white shadow-lg flex items-center justify-center">
                      <span
                        className="text-white font-normal leading-none"
                        style={{
                          fontFamily:
                            "var(--font-bebas), 'Bebas Neue', sans-serif",
                          fontSize: "16px",
                        }}
                      >
                        {pin.n}
                      </span>
                    </div>
                    <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-[#FF0931] -mt-[1px]" />
                  </div>
                </div>
              ))}

              {/* Bottom banner */}
              <div className="absolute bottom-0 left-0 right-0 z-[3] bg-[#FF0931] px-4 sm:px-5 py-3.5 sm:py-4 flex items-center justify-between gap-3">
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
