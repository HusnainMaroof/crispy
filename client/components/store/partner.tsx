// partner.tsx

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
        fill="#FF0000"
      />
    </svg>
  );
}

export default function Partner() {
  return (
    <section className="relative w-full bg-[#FF0931]">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8 md:px-10 lg:px-14 xl:px-16 py-14 sm:py-16 md:py-20 lg:py-24">
        <div className="flex flex-col lg:flex-row items-center lg:items-center gap-10 sm:gap-12 lg:gap-14 xl:gap-20">
          {/* Left — copy + CTA */}
          <div className="flex-1 min-w-0 w-full text-left">
            {/* Headline — Koulen */}
            <h2
              className="m-0 text-[#FFF] capitalize font-normal leading-[100%] tracking-[0.02em]"
              style={{
                fontFamily:
                  "var(--font-koulen), Koulen, sans-serif",
                fontSize: "clamp(36px, 7vw, 80px)",
              }}
            >
              Bring Crispies
              <br />
              to your city.
            </h2>

            {/* Subcopy — Inter */}
            <p
              className="m-0 mt-4 sm:mt-5 md:mt-6 text-[#FFF] font-normal leading-[140%] tracking-[0.02em] max-w-[1100px]"
              style={{
                fontFamily: "var(--font-inter), Inter, sans-serif",
                fontSize: "clamp(14px, 1.4vw, 16px)",
              }}
            >
              Join London&apos;s fastest-growing halal restaurant brand.
            </p>

            {/* CTA — Koulen */}
            <button
              type="button"
              className="mt-7 sm:mt-8 md:mt-10 w-full max-w-[992px] flex items-center justify-between gap-4 rounded-[12px] sm:rounded-[14px] bg-black hover:bg-[#111] transition-colors duration-200 pl-6 sm:pl-8 md:pl-10 pr-3 sm:pr-4 py-4 sm:py-5"
            >
              <span
                className="text-[#FFF] capitalize font-normal leading-[100%] tracking-[0.04em] whitespace-nowrap overflow-hidden"
                style={{
                  fontFamily:
                    "var(--font-koulen), Koulen, sans-serif",
                  fontSize: "clamp(22px, 2.8vw, 32px)",
                }}
              >
                Become A Partner
              </span>
              <span className="w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-[10px] sm:rounded-[12px] bg-white flex items-center justify-center shrink-0">
                <ArrowIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              </span>
            </button>
          </div>

          {/* Right — image */}
          <div className="w-full lg:w-[46%] xl:w-[44%] shrink-0">
            <div className="relative w-full overflow-hidden rounded-[20px] sm:rounded-[24px] md:rounded-[28px] aspect-[4/3] sm:aspect-[5/4] lg:aspect-[4/3.4]">
              <img
                src="/images/partnerImages.jpg"
                alt="Crispies team outside store"
                className="absolute inset-0 w-full h-full object-cover object-center"
                draggable={false}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
