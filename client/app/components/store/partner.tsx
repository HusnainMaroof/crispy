// partner.tsx
"use client";

import { useScrollReveal } from "@/lib/use-scroll-reveal";

function ArrowIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="33"
      height="33"
      viewBox="0 0 33 33"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M3.36031 33L0 29.6441L24.9869 4.64668H5.68668L5.72977 0H33V27.2777H28.3042L28.3473 8.00261L3.36031 33Z"
        fill="#FF0931"
      />
    </svg>
  );
}

const DEFAULT_TITLE = ["Bring Crispies", "to your city."];

export default function Partner({
  title = DEFAULT_TITLE.join("\n"),
  description = "Join London's fastest-growing halal restaurant brand.",
  ctaLabel = "Become A Partner",
  imageUrl = "/images/partnerImages.jpg",
  ctaUrl = "/franchise-inquiries",
}: {
  title?: string;
  description?: string;
  ctaLabel?: string;
  imageUrl?: string | null;
  ctaUrl?: string | null;
}) {
  const lines = (title.trim() ? title : DEFAULT_TITLE.join("\n")).split("\n");
  const picture = imageUrl || "/images/partnerImages.jpg";
  const scopeRef = useScrollReveal();
  const externalCta = /^https:\/\//i.test(ctaUrl || "");

  return (
    <section
      ref={scopeRef}
      className="relative w-full bg-[#FF0931] px-6 py-14 sm:px-10 sm:py-16 md:px-14 md:py-20 lg:px-20 lg:py-24"
    >
      <div className="mx-auto ">
        <div className="flex flex-col lg:flex-row items-center lg:items-center gap-10 sm:gap-12 lg:gap-14 xl:gap-20">
          {/* Left — copy + CTA */}
          <div className="flex-1 min-w-0 w-full text-start">
            {/* Headline — Koulen */}
            <h2
              className="fade-up m-0 text-[#FFF] capitalize font-bold leading-[100%] tracking-[0.02em]"
              style={{
                fontFamily:
                  "var(--font-korolev), Korolev, sans-serif",
                fontSize: "clamp(30px, 5.5vw, 120px)",
              }}
            >
              {lines.map((line, index) => (
                <span key={`${line}-${index}`}>
                  {line}
                  {index < lines.length - 1 ? <br /> : null}
                </span>
              ))}
            </h2>

            {/* Subcopy — Inter */}
            <p
              className="fade-up m-0 mt-4 sm:mt-5 md:mt-6 text-[#FFF] font-normal leading-[140%] tracking-[0.02em] max-w-[1100px]"
              data-delay="0.08"
              style={{
                fontFamily: "var(--font-inter), Inter, sans-serif",
                fontSize: "clamp(12px, 2vw, 24px)",
              }}
            >
              {description}
            </p>

            {/* CTA — Koulen */}
            <a
              href={ctaUrl || "/franchise-inquiries"}
              target={externalCta ? "_blank" : undefined}
              rel={externalCta ? "noopener noreferrer" : undefined}
              className="group micro-elevate fade-up mt-7 sm:mt-8 md:mt-10 w-full max-w-[992px] flex items-center justify-between gap-4 rounded-[12px] sm:rounded-[14px] bg-black hover:bg-[#111] ps-6 sm:ps-8 md:ps-10 pe-3 sm:pe-4 py-4 sm:py-5"
              data-delay="0.14"
            >
              <span
                className="text-[#FFF] capitalize font-normal leading-[100%] tracking-[0.04em] whitespace-nowrap overflow-hidden"
                style={{
                  fontFamily:
                    "var(--font-korolev), Korolev, sans-serif",
                  fontSize: "clamp(18px, 2.2vw, 40px)",
                }}
              >
                {ctaLabel}
              </span>
            <svg xmlns="http://www.w3.org/2000/svg" width="84" height="84" viewBox="0 0 84 84" fill="none" className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
  <rect width="84" height="84" rx="15" fill="white"/>
  <path d="M29.3603 59L26 55.6441L50.9869 30.6467H31.6867L31.7298 26H59V53.2777H54.3042L54.3473 34.0026L29.3603 59Z" fill="#FF0000"/>
</svg>
            </a>
          </div>

          {/* Right — image */}
          <div
            className="fade-up w-full lg:w-[46%] xl:w-[44%] shrink-0"
            data-delay="0.1"
          >
            <div className="relative w-full overflow-hidden rounded-[20px] sm:rounded-[24px] md:rounded-[28px] aspect-[4/3] sm:aspect-[5/4] lg:aspect-[4/3.4]">
              <img
                src={picture}
                alt="Crispies team outside store"
                className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 ease-out hover:scale-[1.04]"
                draggable={false}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
