// about.tsx
"use client";

import styles from "./about.module.css";

export const About = () => {
  return (
    <div className="relative w-full bg-white  py-6 xl:px-10 xl:py-10 overflow-hidden -mt-[90px] md:-mt-[140px]">
      <div className="flex flex-col items-center pt-10 text-center md:pt-20">
        <div className="overflow-hidden pt-6 md:pt-10">
          <h2 className="font-[family-name:var(--font-koulen),Koulen,sans-serif] text-black m-0 text-[clamp(48px,10vw,150px)] font-normal capitalize leading-[100%] tracking-[0.54px]">
            Welcome To
            <span className="text-[#FF0931]"> Crispies</span>
          </h2>
        </div>
        <p className="font-[family-name:var(--font-koulen),Koulen,sans-serif] text-black m-0 mt-4 max-w-[1306px] text-center text-[clamp(24px,4vw,60px)] font-normal capitalize leading-[100%] tracking-[0.54px]">
          Crispies was founded with a mission to serve the best burgers and chicken around. Our aim has always been to serve fresh, handmade food, bursting with flavours from around the globe.
        </p>

        {/* Three-image carousel */}
        <div className="relative mt-8 flex w-full items-center justify-center overflow-hidden md:mt-16">
          {/* Left blurred image — hidden on mobile, half out left on md+ */}
          <div
            className={`${styles.sideLeft} absolute top-1/2 z-10 -translate-y-1/2 translate-x-36 md:-translate-x-80  h-[160px] w-[360px] overflow-hidden rounded-[28px] opacity-60 blur-[4px] lg:h-[360px] lg:w-[520px] lg:rounded-[40px]`}
            style={{
              background:
                "url('/images/aboutimage.jpg') lightgray 50% / cover no-repeat",
            }}
            aria-hidden="true"
          />

          {/* Center sharp image */}
          <div
            className="relative z-10 h-[200px] w-[220px] shrink-0 overflow-hidden rounded-[32px] sm:h-[360px] sm:w-[360px] sm:rounded-[44px] md:h-[420px] md:w-[420px] lg:h-[520px] lg:w-[520px] lg:rounded-[66px]"
            style={{
              background:
                "url('/images/aboutimage.jpg') lightgray 50% / cover no-repeat",
            }}
          />

          {/* Right blurred image — hidden on mobile, half out right on md+ */}
          <div
            className={`${styles.sideRight} absolute  top-1/2 -translate-y-1/2  translate-x-36 md:translate-x-80  h-[160px] w-[360px] overflow-hidden rounded-[28px] opacity-60 blur-[4px] lg:h-[360px] lg:w-[520px] lg:rounded-[40px]`}
            style={{
              background:
                "url('/images/aboutimage.jpg') lightgray 50% / cover no-repeat",
            }}
            aria-hidden="true"
          />
        </div>
      </div>
    </div>
  );
};