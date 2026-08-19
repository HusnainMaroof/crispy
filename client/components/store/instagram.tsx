"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";

const INSTAGRAM_IMAGES = [
  "/images/aboutimage.jpg",
  "/images/aboutimage.jpg",
  "/images/aboutimage.jpg",
  "/images/aboutimage.jpg",
  "/images/aboutimage.jpg",
];

export default function Instagram() {
  const trackRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<gsap.core.Tween | null>(null);

  useEffect(() => {
    if (!trackRef.current) return;

    animRef.current = gsap.to(trackRef.current, {
      xPercent: -50,
      duration: 25,
      ease: "none",
      repeat: -1,
    });

    return () => {
      animRef.current?.kill();
    };
  }, []);

  const handleMouseEnter = () => animRef.current?.pause();
  const handleMouseLeave = () => animRef.current?.resume();

  return (
    <section className="   overflow-hidden w-full bg-[#FF0931] rounded-b-3xl lg:rounded-b-[50px] ">
      <div className="  px-6 py-16  bg-white rounded-3xl lg:rounded-[50px]">
        {/* Red top accent */}

        {/* Profile Section */}
        <div className="flex flex-row w-full justify-center items-start gap-6 px-6 py-8 sm:px-10 sm:py-10">
          {/* Logo */}
          <div className="flex h-[90px] w-[90px] shrink-0 items-center justify-center rounded-full bg-black sm:h-[100px] sm:w-[100px]">
            <div className="text-center leading-[0.9]">
              <span className="block font-[family-name:var(--font-koulen),Koulen,sans-serif] text-[14px] font-normal text-white sm:text-[16px]">
                CRISP
              </span>
              <span className="block font-[family-name:var(--font-koulen),Koulen,sans-serif] text-[14px] font-normal text-white sm:text-[16px]">
                IES
              </span>
            </div>
          </div>

          {/* Info */}
          <div className="flex flex-col items-center gap-4 text-start sm:items-start w-fit">
            {/* Username + Follow */}
            <div className="flex items-center gap-40">
              <h3 className="font-[family-name:var(--font-koulen),Koulen,sans-serif] text-[22px] font-normal text-black sm:text-[26px]">
                Crispiesuk
              </h3>
              <button
                type="button"
                className="rounded-lg bg-[#FF0931] px-5 py-2 font-[family-name:var(--font-inter),Inter,sans-serif] text-[13px] font-semibold text-white transition-colors hover:bg-[#E0082C]"
              >
                Follow
              </button>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 text-[13px] text-[#6B6B6B]">
              <span>
                <strong className="font-semibold text-black">557</strong> Posts
              </span>
              <span>
                <strong className="font-semibold text-black">16.1k</strong>{" "}
                Followers
              </span>
              <span>
                <strong className="font-semibold text-black">19</strong>{" "}
                Following
              </span>
            </div>

            {/* Bio */}
            <div className="text-[13px] leading-[1.6] text-[#414040]">
              <p className="font-[family-name:var(--font-koulen),Koulen,sans-serif] font-normal">
                Good Mood Food 🍔🍟
              </p>
              <p>📍 Tower Hill</p>
              <p>🍔 100% Angus Beef Burgers</p>
              <p>🍗 12 Flavor Packed Chicken</p>
            </div>
          </div>
        </div>

        {/* Image Slider */}
        <div
          className="relative pb-8"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="h-[542px] overflow-hidden sm:h-[742px]">
            <div
              ref={trackRef}
              className="flex h-full items-center gap-4 px-4 sm:gap-5 sm:px-6"
            >
              {[...INSTAGRAM_IMAGES, ...INSTAGRAM_IMAGES].map((src, i) => (
                <div
                  key={i}
                  className="h-[420px] w-[180px] flex-shrink-0 overflow-hidden rounded-[20px] bg-cover bg-center sm:h-[742px] sm:w-[420px] aspect-[5/7]"
                  style={{ backgroundImage: `url('${src}')` }}

                />
              ))}
            </div>
          </div>

          {/* Fade edges */}
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-white to-transparent sm:w-20" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-white to-transparent sm:w-20" />
        </div>
      </div>
    </section>
  );
}
