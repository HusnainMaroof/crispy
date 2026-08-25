"use client";

import Footer from "@/app/components/store/footer";
import { ArrowUpDown } from "lucide-react";

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
                    stroke-width="1.5"
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
      <section className="bg-black relative py-24 sm:py-40">
        <div className="h-[50%] w-full bg-white absolute top-0" />
        <div className="h-[50%] w-full bg-black absolute bottom-0  " />

        <div className="mx-auto max-w-[1564px] rounded-4xl px-8 py-12 sm:px-14 sm:py-16 bg-[#FEFEFE] relative border-[#C4C4C4] border-2">
          <div className="flex flex-col items-start justify-between gap-12 lg:flex-row lg:items-center">
            <div>
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

              <a
                href="/contact"
                className="mt-8 inline-flex justify-between items-center gap-4 rounded-2xl bg-[#FF0000] px-7 py-6 text-white transition-transform hover:scale-105 w-full max-w-[380px] sm:w-[380px]"
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
              </a>
            </div>

            <div className="hidden items-center gap-10 lg:flex">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="1"
                height="356"
                viewBox="0 0 1 356"
                fill="none"
                className="h-[420px] w-px shrink-0"
                aria-hidden="true"
              >
                <path
                  d="M0.5 0L0.500016 356"
                  stroke="url(#partner_divider_gradient)"
                />
                <defs>
                  <linearGradient
                    id="partner_divider_gradient"
                    x1="0"
                    y1="2.18557e-08"
                    x2="1.55613e-05"
                    y2="356"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#A2A1A3" stopOpacity="0" />
                    <stop offset="0.4904" stopColor="#3D3C3D" />
                    <stop offset="1" stopColor="#686769" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>

              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 300 275"
                fill="none"
                className="h-[190px] w-auto shrink-0"
                aria-hidden="true"
              >
                <g transform="translate(0 0)">
                  <svg x="0" y="0" width="53" height="121" viewBox="0 0 53 121">
                    <path
                      d="M52.537 32.2923V27.2709C52.537 11.2091 41.6605 0 26.2685 0C10.8765 0 0 11.2091 0 27.2709V93.1951C0 109.098 10.7079 120.297 26.2685 120.297C41.8291 120.297 52.537 109.088 52.537 93.1951V87.5039H36.1523V93.6963C36.1523 102.062 31.4682 104.573 26.2781 104.573C21.0881 104.573 16.2401 102.062 16.2401 93.6963V26.7697C16.2401 18.4039 21.0929 15.7293 26.2781 15.7293C31.4634 15.7293 36.1523 18.4039 36.1523 26.7697V32.2923H52.537Z"
                      fill="#EAEAEA"
                    />
                  </svg>
                  <svg
                    x="62"
                    y="2"
                    width="52"
                    height="118"
                    viewBox="0 0 52 118"
                  >
                    <path
                      d="M35.1355 55.5634C35.1355 68.4446 29.4442 70.6228 23.088 70.6228H16.3943V15.7679H23.088C29.2804 15.7679 35.1355 18.2737 35.1355 28.8178V55.5634ZM51.1973 56.5657V28.7792C51.1973 10.038 40.4895 0 25.0975 0H0V117.97H16.3847V86.1642H23.247C25.589 91.8506 31.6128 112.264 33.9548 117.97H51.6889L38.3016 81.6632C46.1663 77.6489 51.1877 69.7843 51.1877 56.5657"
                      fill="#EAEAEA"
                    />
                  </svg>
                  <svg
                    x="124"
                    y="1"
                    width="17"
                    height="119"
                    viewBox="0 0 17 119"
                  >
                    <path d="M16.2305 0H0V119.011H16.2305V0Z" fill="#EAEAEA" />
                  </svg>
                  <svg
                    x="152"
                    y="0"
                    width="54"
                    height="121"
                    viewBox="0 0 54 121"
                  >
                    <path
                      d="M26.6058 0.0192802C11.8789 0.0192802 1.00235 9.22362 1.00235 23.9457C1.00235 30.8032 2.00953 37.4968 9.87418 49.0432L30.9526 80.1645C35.6367 87.1906 36.8077 90.535 36.8077 95.0553C36.8077 101.243 32.2923 104.592 26.9383 104.592C21.5844 104.592 16.2305 101.913 16.2305 93.2144H0C0 110.11 11.209 120.485 26.7697 120.485C42.3303 120.485 53.0382 110.616 53.0382 95.5565C53.0382 87.1906 51.366 80.497 43.67 69.1193L22.5868 38.1474C18.7316 32.6248 17.4015 28.1094 17.4015 24.0951C17.4015 18.4039 21.5844 15.392 26.4372 15.392C31.2899 15.392 36.1427 18.2352 36.1427 26.4372H52.0455C52.0455 10.0525 41.1689 0 26.6155 0"
                      fill="#EAEAEA"
                    />
                  </svg>
                  <svg
                    x="216"
                    y="2"
                    width="52"
                    height="118"
                    viewBox="0 0 52 118"
                  >
                    <path
                      d="M35.1355 58.5608C35.1355 69.1 29.1117 71.6107 23.0879 71.6107H16.3943V15.7534H23.0879C29.2804 15.7534 35.1355 18.2593 35.1355 28.8033V58.5608ZM51.1973 58.8933V28.6106C51.1973 10.2067 40.4894 0 25.0975 0H0V117.955H16.3847V87.1714H25.0878C40.4798 87.1714 51.1877 77.2972 51.1877 58.8933"
                      fill="#EAEAEA"
                    />
                  </svg>
                  <svg
                    x="240"
                    y="88"
                    width="21"
                    height="28"
                    viewBox="0 0 21 28"
                  >
                    <path
                      d="M16.2356 11.0211L0.000274151 0V15.5269C-0.0430971 21.8976 5.06506 27.1022 11.4358 27.1745C15.2814 27.1552 18.6547 24.6059 19.7245 20.9097C20.8377 17.2039 19.4258 13.2089 16.2356 11.0211Z"
                      fill="#E11822"
                    />
                  </svg>
                  <svg
                    x="270"
                    y="38"
                    width="16"
                    height="28"
                    viewBox="0 0 16 28"
                  >
                    <path
                      d="M15.0739 0L6.0286 11.8885L13.5704 16.9822L0 27.1697V0H15.0739Z"
                      fill="#E11822"
                    />
                  </svg>
                </g>
                <g transform="translate(0 135)">
                  <svg
                    x="0"
                    y="25"
                    width="117"
                    height="17"
                    viewBox="0 0 117 17"
                  >
                    <path d="M116.283 0H0V16.2305H116.283V0Z" fill="#EAEAEA" />
                  </svg>
                  <svg
                    x="130"
                    y="0"
                    width="17"
                    height="118"
                    viewBox="0 0 17 118"
                  >
                    <path d="M16.2305 0H0V117.955H16.2305V0Z" fill="#EAEAEA" />
                  </svg>
                  <svg
                    x="158"
                    y="0"
                    width="44"
                    height="118"
                    viewBox="0 0 44 118"
                  >
                    <path
                      d="M44.0025 0H0V117.955H44.0025V102.226H16.2256V65.0809H36.9764V50.6962H16.2256V15.7245H44.0025V0Z"
                      fill="#EAEAEA"
                    />
                  </svg>
                  <svg
                    x="214"
                    y="0"
                    width="54"
                    height="121"
                    viewBox="0 0 54 121"
                  >
                    <path
                      d="M26.601 0C11.8789 0 1.00237 9.20434 1.00237 23.9265C1.00237 30.7888 2.00471 37.4824 9.86935 49.024L30.9526 80.1452C35.6367 87.1714 36.8077 90.5206 36.8077 95.036C36.8077 101.228 32.2923 104.573 26.9335 104.573C21.5748 104.573 16.2257 101.898 16.2257 93.1951H0C0 110.095 11.209 120.471 26.7697 120.471C42.3303 120.471 53.0382 110.597 53.0382 95.5372C53.0382 87.1714 51.366 80.4826 43.6652 69.1048L22.5916 38.1522C18.7364 32.6296 17.4015 28.1094 17.4015 24.0951C17.4015 18.4087 21.5844 15.3968 26.4372 15.3968C31.2899 15.3968 36.1427 18.24 36.1427 26.4372H52.0455C52.0455 10.0525 41.1737 0 26.6155 0"
                      fill="#EAEAEA"
                    />
                  </svg>
                </g>
              </svg>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
