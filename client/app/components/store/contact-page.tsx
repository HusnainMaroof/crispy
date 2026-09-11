"use client";

import { useState } from "react";
import Footer from "@/app/components/store/footer";
import FranchiseApplicationOverlay from "@/app/components/store/franchise-application-overlay";
import ScrollTabs from "@/app/components/store/scroll-tabs";
import HowToGetStarted from "@/app/components/store/how-to-get-started";
import { ArrowUpDown, FilePenLine } from "lucide-react";
import Image from "next/image";

const KOROLEV = "font-[family-name:var(--font-korolev),Korolev,sans-serif]";
const INTER = "font-[family-name:var(--font-inter),Inter,sans-serif]";

const WHY_CHOOSE_ITEMS = [
  {
    title: "Proven Concept",
    description:
      "Crispies has already established a strong presence in the food industry with our unique blend of flavours and high-quality ingredients. Our menu items, ranging from crispy chicken tenders to flavourful wraps and salads, have garnered a loyal customer base.",
  },
  {
    title: "Supportive Team",
    description:
      "When you join the Crispies family, you'll receive comprehensive support every step of the way. From site selection and restaurant design to training and marketing assistance, our team is committed to helping you succeed.",
  },
  {
    title: "Operational Excellence",
    description:
      "We provide our franchisees with access to our time-tested operational systems and processes, ensuring smooth day-to-day operations and consistent customer satisfaction.",
  },
  {
    title: "Marketing Power",
    description:
      "Benefit from our national marketing campaigns and promotional materials designed to drive foot traffic to your Crispies location. We'll also support you in developing local marketing strategies to attract customers in your area.",
  },
  {
    title: "Flexible Models",
    description:
      "Whether you're interested in opening a standalone restaurant, a food truck, or a kiosk in a high-traffic location, Crispies offers flexible franchise models to suit your preferences and budget.",
  },
  {
    title: "Community Engagement",
    description:
      "At Crispies, we believe in giving back to the communities we serve. As a franchisee, you'll have the opportunity to engage with local schools, charities, and events, strengthening your brand presence while making a positive impact.",
  },
];

const GET_STARTED_ITEMS = [
  {
    title: "Submit Your Inquiry",
    description:
      "Fill out our franchise inquiry form to express your interest in joining the Crispies family. Tell us a bit about yourself and why you're excited about the opportunity.",
  },
  {
    title: "Initial Consultation",
    description:
      "Once we receive your inquiry, a member of our franchise development team will reach out to schedule an initial consultation. This is your chance to ask questions and learn more about the franchise process.",
  },
  {
    title: "FDD",
    description:
      "Upon approval of your application, you'll receive our Franchise Disclosure Document (FDD) for review. This document contains important information about the franchise agreement, financial obligations, and support provided by Crispies.",
  },
  {
    title: "Training",
    description:
      "With the help of our experienced team, you'll select the perfect location for your Crispies restaurant. You'll also undergo comprehensive training to ensure you're equipped with the knowledge and skills to run a successful operation.",
  },
  {
    title: "Grand Opening",
    description:
      "Finally, it's time to celebrate! We'll work closely with you to plan and execute a memorable grand opening event, generating excitement and attracting eager customers to your new Crispies location.",
  },
];

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
                className="w-full rounded-[50px] object-cover   lg:w-[420px] xl:h-[500px] xl:w-[685px]"
                style={{}}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 2. Why Choose Crispies */}
      <section className="bg-white w-full">
        <ScrollTabs
          theme="dark"
          heading={
            <h2
              className={`m-0 shrink-0 ${KOROLEV} capitalize    text-3xl sm:text-4xl md:text-5xl lg:text-7xl xl:text-[150px]`}
              style={{
                fontWeight: 900,
                lineHeight: "100%",
              }}
            >
              <span className="block text-white">Why Choose</span>
              <span className="block text-[#FF0931]">Crispies ?</span>
            </h2>
          }
          items={WHY_CHOOSE_ITEMS}
        />
      </section>
      {/* 3. How To Get Started */}
      <section className="bg-[#FF0931] w-full">
        <HowToGetStarted
          heading={
            <div className=" flex items-center justify-between gap-6 sm:gap-12  lg:gap-0">
              <h2
                className={`m-0 shrink-0 ${KOROLEV} capitalize  text-[44px] sm:text-[70px] md:text-[80px] lg:text-[100px]  xl:text-[135px] 2xl:text-[150px]`}
                style={{
                  fontWeight: 900,
                  lineHeight: "100%",
                }}
              >
                <span className="lg:block text-black"> How To Get</span>
                <span className="lg:block text-white pl-3 lg:pl-0">
                  Started?
                </span>
              </h2>

              <div className="  p-5   rounded-[10px] max-sm:translate-x-0 bg-white lg:hidden  ">
                <FilePenLine
                  className="w-16 h-16 sm:w-20 sm:h-20 lg:w-[162px] lg:h-[162px] text-black "
                  strokeWidth={1.5}
                />
              </div>
            </div>
          }
          items={GET_STARTED_ITEMS}
        />
      </section>

      {/* 4. Become A Partner */}
      <section className="bg-black relative py-24 sm:py-40 ">
        <div className="h-[50%] w-full bg-white absolute top-0" />
        <div className="h-[50%] w-full bg-black absolute bottom-0  " />

        <div className="w-[90%] xl:w-[80%] mx-auto rounded-4xl px-8 py-12 sm:px-14 sm:py-16 bg-[#FEFEFE] relative border-[#C4C4C4] border-2">
          <div className="flex  items-center justify-between gap-12  lg:items-center">
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
                className="mt-8 inline-flex justify-between items-center gap-4 rounded-[10px] lg:rounded-2xl bg-[#FF0000]  px-2 py-3 lg:px-7 lg:py-6 text-white transition-transform hover:scale-105  w-fit  lg:w-[380px] cursor-pointer"
              >
                <span
                  className={`${INTER}  lg:text-[30px] font-semibold text-nowrap`}
                >
                  Contact Us
                </span>
                <div className="flex items-center justify-center w-[10px] lg:w-auto">
                  {" "}
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
                </div>
              </button>
            </div>

            <div className="h-[clamp(10px,20vw,490px)] w-px shrink-0 self-stretch">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="100%"
                height="100%"
                viewBox="0 0 1 490"
                preserveAspectRatio="none"
                fill="none"
              >
                <path d="M0.5 0V490" stroke="url(#paint0_linear_697_3103)" />

                <defs>
                  <linearGradient
                    id="paint0_linear_697_3103"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="490"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#A2A1A3" stopOpacity="0" />
                    <stop offset="0.4904" stopColor="#3D3C3D" />
                    <stop offset="1" stopColor="#686769" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            <div className="w-full lg:w-1/2 flex justify-center lg:justify-end">
              <img
                src="/images/svgLogo.svg"
                alt="Crispies Logo"
                className="w-[220px ]      sm:w-[280px]  md:w-[300px]  lg:w-[480px] xl:max-w-[520px] h-auto"
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
