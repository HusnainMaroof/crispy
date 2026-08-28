"use client";

import { useState } from "react";
import Footer from "@/app/components/store/footer";
import FranchiseApplicationOverlay from "@/app/components/store/franchise-application-overlay";
import { ArrowUpDown } from "lucide-react";
import Image from "next/image";

const KOROLEV = "font-[family-name:var(--font-korolev),Korolev,sans-serif]";
const INTER = "font-[family-name:var(--font-inter),Inter,sans-serif]";

function OutlineNumber({ className = "" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="174"
      height="254"
      viewBox="0 0 174 254"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        opacity="0.25"
        d="M53.1504 0.5C68.6757 0.500094 81.9336 6.14833 91.3096 15.8779C100.684 25.6065 106.15 39.3856 106.15 55.5996V198.05C106.15 214.09 100.684 227.783 91.3096 237.467C81.9338 247.152 68.6758 252.8 53.1504 252.8C37.6244 252.8 24.4527 247.152 15.1641 237.465C5.87697 227.78 0.5 214.088 0.5 198.05V55.5996C0.500083 39.388 5.87606 25.6092 15.1631 15.8799C24.452 6.14865 37.6243 0.5 53.1504 0.5ZM172.625 2.9502V250.7H146.775V40.9258C141.524 42.856 134.78 43.475 129.017 42.7969L128.575 42.7441V17.6504H129.075C133.088 17.6504 136.314 17.4533 138.896 16.9854C141.478 16.5173 143.385 15.7835 144.788 14.7314C147.559 12.6529 148.525 9.2004 148.525 3.4502V2.9502H172.625ZM53.1504 25.6504C45.5517 25.6504 38.8638 27.9799 34.0771 32.7236C29.2928 37.4653 26.3496 44.6758 26.3496 54.5498V198.75C26.3496 208.62 29.378 215.831 34.207 220.574C39.0393 225.321 45.7289 227.65 53.1504 227.65C60.5717 227.65 67.2616 225.321 72.0938 220.574C76.9226 215.831 79.9502 208.62 79.9502 198.75V54.5498C79.9502 44.6758 77.007 37.4653 72.2227 32.7236C67.4361 27.98 60.7488 25.6505 53.1504 25.6504Z"
        stroke="white"
      />
    </svg>
  );
}

export default function PartnerPage() {
  const [applicationOpen, setApplicationOpen] = useState(false);

  return (
    <>
      {/* 1. Hero — Grow With Crispies */}
      <section className="w-full bg-white">
        <div className="px-6 py-16 sm:px-10 sm:py-20 md:px-12 xl:px-25">
          <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between lg:gap-16">
            <div className="flex flex-1 flex-col justify-center">
         
              <h1
                className={`m-0 ${KOROLEV} capitalize text-black`}
                style={{
                  fontSize: "clamp(40px, 10vw, 150px)",
                  fontWeight: 900,
                  lineHeight: "100%",
                }}
              >
                Grow With <span className="text-[#FF0931]">Crispies</span>
              </h1>
              <p
                className={`m-0 mt-6 max-w-[720px] ${INTER} capitalize text-black`}
                style={{
                  fontSize: "clamp(16px, 2.2vw, 30px)",
                  fontWeight: 400,
                  lineHeight: "100%",
                  letterSpacing: "0.54px",
                }}
              >
                join a fast-growing brand with bold flavours, loyal customers
                and a proven recipe for success.
              </p>
            </div>

            <div className="w-full shrink-0 lg:w-auto">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/partnerImages.jpg"
                alt="The Crispies team celebrating a store opening"
                className="w-full rounded-[50px] object-cover"
                style={{
                  maxWidth: "685px",
                  height: "auto",
                  aspectRatio: "341 / 227",
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 2. Why Choose Crispies */}
      <section className="bg-black px-6 py-16 sm:px-10 sm:py-24 md:px-12 xl:px-25 w-full">
        <div className="flex flex-col gap-12 lg:flex-row lg:items-center justify-between lg:gap-20 w-full">
          <h2
            className={`m-0 shrink-0 ${KOROLEV} capitalize`}
            style={{
              fontSize: "clamp(44px, 10vw, 150px)",
              fontWeight: 900,
              lineHeight: "100%",
            }}
          >
            <span className="block text-white">Why Choose</span>
            <span className="block text-[#FF0931]">Crispies ?</span>
          </h2>

          <div className="flex flex-wrap justify-end items-center gap-6 sm:gap-30">
            <div className="min-w-0">
              <h3
                className={`m-0 ${KOROLEV} capitalize text-white`}
                style={{
                  fontSize: "clamp(28px, 6vw, 100px)",
                  fontWeight: 900,
                  lineHeight: "100%",
                }}
              >
                Proven Concept
              </h3>
              <p
                className={`m-0 mt-4 max-w-[400px] ${INTER} capitalize text-white font `}
                style={{
                  fontSize: "clamp(16px, 2.2vw, 30px)",

                  lineHeight: "100%",
                  letterSpacing: "0.54px",
                }}
              >
                a strong presence in the food industry with a unique blend of
                flavours &amp; high-quality ingredients that customers love.
              </p>
            </div>
            <OutlineNumber className="h-[140px] w-auto shrink-0 sm:h-[200px] lg:h-[254px]" />

            <div className="ml-auto hidden shrink-0 flex-col gap-3 sm:flex">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="240"
                viewBox="0 0 12 240"
                fill="none"
              >
                <circle cx="6" cy="6" r="6" fill="white" />
                <circle cx="6" cy="44" r="5.5" stroke="white" />
                <circle cx="6" cy="82" r="5.5" stroke="white" />
                <circle cx="6" cy="120" r="5.5" stroke="white" />
                <circle cx="6" cy="158" r="5.5" stroke="white" />
                <circle cx="6" cy="196" r="5.5" stroke="white" />
                <circle cx="6" cy="234" r="5.5" stroke="white" />
              </svg>
            </div>
          </div>
        </div>
      </section>
      {/* 3. How To Get Started */}
      <section className="bg-[#FF0931] px-6 py-16 sm:px-10 sm:py-24 md:px-12 xl:px-25">
        <div className="flex flex-col gap-12 lg:flex-row lg:items-center lg:gap-16 w-full justify-between">
          <h2
            className={`m-0 shrink-0 ${KOROLEV} capitalize`}
            style={{
              fontSize: "clamp(44px, 10vw, 150px)",
              fontWeight: 900,
              lineHeight: "100%",
            }}
          >
            <span className="block text-black"> How To Get</span>
            <span className="block text-white">Started?</span>
          </h2>
          <div className="flex justify-end items-center gap-6 sm:gap-12">
            <div className="relative w-full h-auto min-h-[420px] sm:h-[550px] sm:min-h-0 rounded-2xl bg-black/10 p-6 sm:p-8 flex ">
              <div className="absolute translate-y-full -translate-x-1/2 -left-3 max-sm:-left-2 max-sm:translate-x-0">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="162"
                  height="162"
                  viewBox="0 0 162 162"
                  fill="none"
                >
                  <rect
                    x="0.75"
                    y="0.75"
                    width="160.5"
                    height="160.5"
                    rx="9.25"
                    fill="white"
                    stroke="#C4C4C4"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M91.6787 105.164L99.0491 97.9888C99.3386 98.0237 100.054 98.7304 100.05 99.0837L99.9943 109.071C99.9769 112.356 97.3922 114 94.4517 114H59.274C55.8731 113.997 54 111.712 54 108.403L54.0174 54.2403C54.0174 51.6656 55.8487 49.07 58.6532 49.0665L94.4308 49C97.8492 48.993 99.7537 51.3088 99.7502 54.5901L99.7083 77.3214L92.4495 85.7766L82.7247 96.7399L81.3469 104.492C81.2422 105.09 81.3992 106.045 81.7026 106.437C82.0515 106.885 83.3944 107.381 83.9978 107.22L91.6787 105.164ZM88.5463 66.3616C89.666 66.3616 90.4125 65.3191 90.4578 64.553C90.4927 63.9863 89.8648 62.7514 89.1358 62.7514H64.5202C63.4075 62.7514 62.6052 63.8883 62.7691 64.8259C62.9331 65.7634 63.7842 66.3861 64.8271 66.3861L88.5428 66.3581L88.5463 66.3616ZM88.1871 78.182C89.5509 78.182 90.4683 77.4543 90.3288 76.1075C90.2276 75.1385 89.3835 74.4949 88.1975 74.4984L64.4644 74.5194C63.4807 74.5194 62.654 75.7227 62.7168 76.4189C62.8215 77.5488 63.6342 78.1645 64.8097 78.168L88.1836 78.1855L88.1871 78.182ZM80.5237 89.8624C81.169 89.0684 81.4341 88.1133 81.1341 87.4207C80.9074 86.8995 79.8784 86.3538 79.1703 86.3538L64.4365 86.3712C63.5016 86.3712 62.654 87.4942 62.7482 88.2953C62.8668 89.2887 63.7493 89.8694 64.7888 89.8694L80.5237 89.8624Z"
                    fill="black"
                  />
                  <path
                    d="M84.4617 104.097L85.2605 98.0552L100.845 80.9525C102.147 79.5253 102.858 78.042 105.129 78.3499C106.747 78.5703 108.348 79.7841 108.858 81.5752C109.419 83.5622 108.233 84.804 106.803 86.2243L90.3357 102.564L84.4652 104.097H84.4617Z"
                    fill="black"
                  />
                </svg>
              </div>

              <div className="flex items-center gap-6 sm:gap-8 px-8 sm:px-20 lg:px-40">
                <div className="min-w-0">
                  <h3
                    className={`m-0 ${KOROLEV} capitalize text-white`}
                    style={{
                      fontSize: "clamp(36px, 6vw, 100px)",
                      fontWeight: 900,
                      lineHeight: "100%",
                    }}
                  >
                    Submit Your Inquiry
                  </h3>
                  <p
                    className={`m-0 mt-3 ${INTER} capitalize text-white max-w-[480px]`}
                    style={{
                      fontSize: "clamp(14px, 1.5vw, 40px)",
                      fontWeight: 400,
                      lineHeight: "150%",
                      letterSpacing: "0.54px",
                    }}
                  >
                    fill out our inquiry form and tell us about yourself and
                    your vision.
                  </p>
                </div>
              </div>
            </div>

            <div className="ml-auto hidden shrink-0 flex-col gap-3 sm:flex">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="240"
                viewBox="0 0 12 240"
                fill="none"
              >
                <circle cx="6" cy="6" r="6" fill="white" />
                <circle cx="6" cy="44" r="5.5" stroke="white" />
                <circle cx="6" cy="82" r="5.5" stroke="white" />
                <circle cx="6" cy="120" r="5.5" stroke="white" />
                <circle cx="6" cy="158" r="5.5" stroke="white" />
                <circle cx="6" cy="196" r="5.5" stroke="white" />
                <circle cx="6" cy="234" r="5.5" stroke="white" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Become A Partner */}
      <section className="bg-black relative py-24 sm:py-40 ">
        <div className="h-[50%] w-full bg-white absolute top-0" />
        <div className="h-[50%] w-full bg-black absolute bottom-0  " />

        <div className="w-[90%] xl:w-[80%] mx-auto rounded-4xl px-8 py-12 sm:px-14 sm:py-16 bg-[#FEFEFE] relative border-[#C4C4C4] border-2">
          <div className="flex flex-col items-center justify-between gap-12 lg:flex-row lg:items-center">
            <div className="w-full lg:w-1/2">
              <h2
                className={`m-0 ${KOROLEV} uppercase text-black`}
                style={{
                  fontSize: "clamp(36px, 8vw, 200px)",
                  fontWeight: 900,
                  lineHeight: "100%",
                  letterSpacing: "0.54px",
                }}
              >
                Become
                <br />A Partner
              </h2>

              <button
                type="button"
                onClick={() => setApplicationOpen(true)}
                className="mt-8 inline-flex justify-between items-center gap-4 rounded-2xl bg-[#FF0000] px-7 py-6 text-white transition-transform hover:scale-105 w-full max-w-[380px] sm:w-[380px] cursor-pointer"
              >
                <span className={`${INTER} text-[30px] font-semibold`}>
            Contact Us
                </span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="33"
                  height="33"
                  viewBox="0 0 33 33"
                  fill="none"
                >
                  <path
                    d="M3.36031 33L0 29.6441L24.9869 4.64668H5.68668L5.72977 0H33V27.2777H28.3042L28.3473 8.00261L3.36031 33Z"
                    fill="white"
                  />
                </svg>
              </button>
            </div>

            <div className="hidden lg:block w-px shrink-0 self-stretch">
            <svg xmlns="http://www.w3.org/2000/svg" width="1" height="490" viewBox="0 0 1 490" fill="none">
  <path d="M0.5 0L0.500021 490" stroke="url(#paint0_linear_697_3103)"/>
  <defs>
    <linearGradient id="paint0_linear_697_3103" x1="0" y1="2.18557e-08" x2="2.14186e-05" y2="490" gradientUnits="userSpaceOnUse">
      <stop stopColor="#A2A1A3" stopOpacity="0"/>
      <stop offset="0.4904" stopColor="#3D3C3D"/>
      <stop offset="1" stopColor="#686769" stopOpacity="0"/>
    </linearGradient>
  </defs>
</svg>
            </div>

            <div className="w-full lg:w-1/2 flex justify-center lg:justify-end">
              <img
                src="/images/svgLogo.svg"
                alt="Crispies Logo"
                className="w-full max-w-[400px] h-auto"
              />
            </div>
          </div>
        </div>
      </section>
      <Footer />
      {applicationOpen && (
        <FranchiseApplicationOverlay
          onClose={() => setApplicationOpen(false)}
        />
      )}
    </>
  );
}
