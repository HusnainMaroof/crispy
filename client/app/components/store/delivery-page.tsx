"use client";

import { useState } from "react";

const locations = [
  { id: "harrow-road-maida-vale", name: "Harrow Road - Maida Vale" },
  { id: "tower-hill", name: "Tower Hill" },
  { id: "kilburn", name: "Kilburn" },
  { id: "harrow", name: "Harrow" },
  { id: "elephant-and-castle", name: "Elephant & Castle" },
  { id: "edgware-road", name: "Edgware Road" },
  { id: "stockwell", name: "Stockwell" },
];

const platforms = [
  {
    id: "uber-eats",
    name: "Uber Eats",
    desc: "Fast and reliable delivery straight to your door with real-time tracking.",
    logoBg: "#06BB67",
  },
  {
    id: "deliveroo",
    name: "Deliveroo",
    desc: "Order Crispies through Deliveroo for exclusive rewards and premium delivery.",
    logoBg: "#00CCBC",
  },
  {
    id: "just-eat",
    name: "Just Eat",
    desc: "Savor the flavor with Just Eat's seamless ordering process.",
    logoBg: "#FF8000",
  },
];

export default function DeliveryPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const [step, setStep] = useState<"branch" | "platform" | "redirect">("branch");
  const [platform, setPlatform] = useState<string | null>(null);

  const selectedName = locations.find((l) => l.id === selected)?.name ?? "";
  const selectedPlatform = platforms.find((p) => p.id === platform);

  return (
    <main className="min-h-screen bg-black flex flex-col items-center px-4 py-16 md:py-24">
      {/* Step 1: Branch Selection */}
      {step === "branch" && (
        <>
          <h1
            className="text-center uppercase leading-normal max-w-[70%]"
            style={{
              color: "#FFF",
              fontSize: "54px",
              fontWeight: 400,
              fontFamily: "var(--font-korolev), Korolev, sans-serif",
            }}
          >
            Where are
            <br />
            you ordering from?
          </h1>

          <p
            className="text-center mt-4 max-w-[70%]"
            style={{
              color: "#8D8D8D",
              fontSize: "18px",
              fontWeight: 400,
              lineHeight: "normal",
            }}
          >
            Choose your nearest Crispies branch to continue.
          </p>

          <div
            className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-12 w-full"
            style={{ maxWidth: "70%" }}
          >
            {locations.map((loc) => {
              const isSelected = selected === loc.id;

              return (
                <button
                  key={loc.id}
                  onClick={() => setSelected(loc.id)}
                  className="flex items-center justify-between cursor-pointer transition-all duration-200"
                  style={{
                    borderRadius: "16px",
                    border: isSelected ? "1px solid #FF0931" : "1px solid #222",
                    background: "#161616",
                    padding: "20px 24px",
                    minHeight: "80px",
                  }}
                >
                  <div className="flex flex-col gap-2 items-start">
                    <span
                      style={{
                        color: "#FFF",
                        fontSize: "18px",
                        fontWeight: 700,
                        lineHeight: "normal",
                      }}
                    >
                      {loc.name}
                    </span>
                    <span
                      className="inline-flex items-center gap-1.5"
                      style={{
                        borderRadius: "9999px",
                        background: "rgba(34, 197, 94, 0.15)",
                        padding: "4px 10px",
                        fontSize: "11px",
                        fontWeight: 600,
                        color: "#22c55e",
                        letterSpacing: "0.5px",
                        textTransform: "uppercase",
                      }}
                    >
                      <span
                        style={{
                          width: "6px",
                          height: "6px",
                          borderRadius: "50%",
                          background: "#22c55e",
                        }}
                      />
                      Open Now
                    </span>
                  </div>

                  <div className="flex-shrink-0 ml-4">
                    {isSelected ? (
                      <div
                        className="flex items-center justify-center"
                        style={{
                          width: "28px",
                          height: "28px",
                          borderRadius: "50%",
                          background: "#FF0931",
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path
                            d="M3 7.5L5.5 10L11 4"
                            stroke="white"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    ) : (
                      <div
                        style={{
                          width: "28px",
                          height: "28px",
                          borderRadius: "50%",
                          background: "#2A2A2A",
                        }}
                      />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <button
            disabled={!selected}
            onClick={() => setStep("platform")}
            className="mt-12 w-full cursor-pointer transition-all duration-200"
            style={{
              maxWidth: "70%",
              display: "flex",
              padding: "20px 48px",
              justifyContent: "center",
              alignItems: "center",
              gap: "12px",
              borderRadius: "9999px",
              background: selected ? "#FF0931" : "#222",
              color: "#FFF",
              fontSize: "18px",
              fontWeight: 400,
              letterSpacing: "0.54px",
              textTransform: "uppercase",
              opacity: selected ? 1 : 0.5,
              cursor: selected ? "pointer" : "not-allowed",
            }}
          >
            Continue to platforms
          </button>
        </>
      )}

      {/* Step 2: Platform Selection */}
      {step === "platform" && (
        <>
          <button
            onClick={() => setStep("branch")}
            className="absolute left-4 top-4 flex size-9 cursor-pointer items-center justify-center rounded-full border border-[#2b2b2b] bg-[#161616] text-white transition-colors hover:border-[#FF0931] hover:bg-[#FF0931]"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5" />
              <path d="m12 19-7-7 7-7" />
            </svg>
          </button>

          <h1
            className="text-center uppercase leading-[1.1] max-w-[70%]"
            style={{
              color: "#FFF",
              fontSize: "clamp(28px, 5vw, 54px)",
              fontWeight: 400,
              fontFamily: "var(--font-korolev), Korolev, sans-serif",
            }}
          >
            How would
            <br />
            you like to order?
          </h1>

          <p
            className="mt-4 text-center max-w-[70%]"
            style={{
              color: "#8D8D8D",
              fontSize: "18px",
              fontWeight: 400,
              lineHeight: "normal",
            }}
          >
            Choose your preferred delivery platform for{" "}
            <span style={{ color: "#FF0931", fontWeight: 700 }}>{selectedName}</span>{" "}
            branch.
          </p>

          <div
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-12 w-full"
            style={{ maxWidth: "70%" }}
          >
            {platforms.map((p) => {
              const isSelected = platform === p.id;

              return (
                <button
                  key={p.id}
                  onClick={() => setPlatform(p.id)}
                  className="flex flex-col items-center cursor-pointer transition-all duration-200"
                  style={{
                    borderRadius: "24px",
                    border: isSelected ? "1px solid #FF0931" : "1px solid #222",
                    background: "#161616",
                    padding: "32px 20px 24px",
                  }}
                >
                  <div
                    className="flex items-center justify-center rounded-full"
                    style={{
                      width: "80px",
                      height: "80px",
                      background: p.logoBg,
                    }}
                  >
                    <span className="text-white font-bold text-xl">
                      {p.name.charAt(0)}
                    </span>
                  </div>

                  <span
                    className="mt-5"
                    style={{
                      color: "#FFF",
                      fontSize: "20px",
                      fontWeight: 700,
                    }}
                  >
                    {p.name}
                  </span>

                  <span
                    className="mt-2 text-center"
                    style={{
                      color: "#9a9a9a",
                      fontSize: "14px",
                      lineHeight: "1.5",
                      maxWidth: "180px",
                    }}
                  >
                    {p.desc}
                  </span>

                  <div className="mt-6 flex items-center justify-center">
                    {isSelected ? (
                      <div
                        className="flex items-center justify-center"
                        style={{
                          width: "24px",
                          height: "24px",
                          borderRadius: "50%",
                          background: "#FF0931",
                        }}
                      >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path
                            d="M9.99969 3L4.50024 8.4996L2.00049 5.99978"
                            stroke="white"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                      </div>
                    ) : (
                      <div
                        style={{
                          width: "24px",
                          height: "24px",
                          borderRadius: "50%",
                          background: "#2A2A2A",
                        }}
                      />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <button
            disabled={!platform}
            onClick={() => {
              if (platform) {
                setStep("redirect");
              }
            }}
            className="mt-12 w-full cursor-pointer transition-all duration-200"
            style={{
              maxWidth: "70%",
              display: "flex",
              padding: "20px 48px",
              justifyContent: "center",
              alignItems: "center",
              gap: "12px",
              borderRadius: "9999px",
              background: platform ? "#FF0931" : "#222",
              color: "#FFF",
              fontSize: "18px",
              fontWeight: 400,
              letterSpacing: "0.54px",
              textTransform: "uppercase",
              opacity: platform ? 1 : 0.5,
              cursor: platform ? "pointer" : "not-allowed",
            }}
          >
            Continue to {selectedPlatform?.name ?? "platform"}
          </button>
        </>
      )}

      {/* Step 3: Redirect/Loading */}
      {step === "redirect" && (
        <div className="flex flex-col items-center justify-center py-10">
          {/* Red dashed spinner */}
          <div className="redirect-spinner mb-8" />

          {/* Heading */}
          <h1
            className="text-center uppercase leading-[1.1]"
            style={{
              color: "#FFF",
              fontSize: "clamp(28px, 5vw, 54px)",
              fontWeight: 900,
              fontFamily: "var(--font-korolev), Korolev, sans-serif",
            }}
          >
            TAKING YOU
            <br />
            TO YOUR ORDER...
          </h1>

          {/* Subtext */}
          <p
            className="mt-4 text-center max-w-md"
            style={{
              color: "#8D8D8D",
              fontSize: "16px",
              fontWeight: 400,
              lineHeight: "1.6",
            }}
          >
            You&apos;ll be redirected to your selected delivery platform in a moment.
            Get ready for premium good mood food.
          </p>

          {/* Info pills */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {/* Branch pill */}
            <div
              className="flex items-center gap-2 rounded-full px-5 py-3"
              style={{
                background: "#1a1a1a",
                border: "1px solid #333",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
                  fill="#FF0931"
                />
              </svg>
              <span
                style={{
                  color: "#FFF",
                  fontSize: "14px",
                  fontWeight: 500,
                }}
              >
                {selectedName} Branch
              </span>
            </div>

            {/* Platform pill */}
            <div
              className="flex items-center gap-2 rounded-full px-5 py-3"
              style={{
                background: "transparent",
                border: "1px solid #FF0931",
              }}
            >
              <span
                className="flex size-4 items-center justify-center rounded-full"
                style={{ background: selectedPlatform?.logoBg }}
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="white">
                  <circle cx="5" cy="5" r="3" />
                </svg>
              </span>
              <span
                style={{
                  color: "#FFF",
                  fontSize: "14px",
                  fontWeight: 500,
                }}
              >
                {selectedPlatform?.name}
              </span>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
