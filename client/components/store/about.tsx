// about.tsx
"use client";

import styles from "./about.module.css";

export const About = () => {
  return (
    <div className="relative w-full overflow-hidden rounded-t-3xl bg-white py-6 xl:rounded-t-[50px]  xl:py-10">
      <div className="flex flex-col items-center pt-10 text-center md:pt-20">
        <div className="overflow-hidden md:pt-10">
          <h2 className="m-0 font-[family-name:var(--font-koulen),Koulen,sans-serif] text-[clamp(48px,10vw,150px)] font-normal capitalize leading-[100%] tracking-[0.54px] text-black">
            Welcome To
            <span className="text-[#FF0931]"> Crispies</span>
          </h2>
        </div>
        <p className="m-0 mt-4 max-w-[1306px] font-[family-name:var(--font-koulen),Koulen,sans-serif] text-center text-[clamp(24px,4vw,60px)] font-normal capitalize leading-[100%] tracking-[0.54px] text-black">
          Crispies was founded with a mission to serve the best burgers and
          chicken around. Our aim has always been to serve fresh, handmade food,
          bursting with flavours from around the globe.
        </p>

        <div className="relative mt-8 flex w-full items-center justify-center overflow-hidden md:mt-16">
          <div
            className={`${styles.sideImg} ${styles.sideLeft} z-100`}
            style={{
              background:
                "url('/images/aboutimage.jpg') lightgray 50% / cover no-repeat",
            }}
            aria-hidden="true"
          />

          <div
            className="relative z-10 h-[200px] w-[220px] shrink-0 overflow-hidden rounded-[32px] sm:h-[360px] sm:w-[360px] sm:rounded-[44px] md:h-[420px] md:w-[420px] lg:h-[520px] lg:w-[50%] lg:rounded-[66px]"
            style={{
              background:
                "url('/images/aboutimage.jpg') lightgray 50% / cover no-repeat",
            }}
          />

          <div
            className={`${styles.sideImg} ${styles.sideRight} z-100`}
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
