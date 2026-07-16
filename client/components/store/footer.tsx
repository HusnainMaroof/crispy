"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";
import { useRef } from "react";

gsap.registerPlugin(ScrollTrigger);

const FOOTER_LINKS = {
  menu: [
    { label: "Burgers", href: "/menu#burgers" },
    { label: "Chicken", href: "/menu#chicken" },
    { label: "Sides", href: "/menu#sides" },
    { label: "Shakes", href: "/menu#shakes" },
    { label: "Deals", href: "/menu" },
  ],
  company: [
    { label: "About Us", href: "/about" },
    { label: "Careers", href: "/careers" },
    { label: "Franchise", href: "/franchise" },
    { label: "Press", href: "/press" },
  ],
  support: [
    { label: "Find Us", href: "/find-us" },
    { label: "Contact", href: "/contact" },
    { label: "FAQs", href: "/faqs" },
    { label: "Order Policy", href: "/policy" },
  ],
  social: [
    { label: "Instagram", href: "https://instagram.com" },
    { label: "TikTok", href: "https://tiktok.com" },
    { label: "X", href: "https://x.com" },
  ],
};

export default function Footer() {
  const rootRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.from(".footer-col", {
        y: 30,
        autoAlpha: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: "power2.out",
        scrollTrigger: {
          trigger: rootRef.current,
          start: "top 85%",
        },
      });

      gsap.from(".franchise-text", {
        y: 40,
        autoAlpha: 0,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ".franchise-section",
          start: "top 80%",
        },
      });
    },
    { scope: rootRef },
  );

  return (
    <footer ref={rootRef} className="bg-black text-white">
      {/* Franchise CTA */}
      <div className="franchise-section border-t border-white/10 px-6 py-20 md:px-12 lg:px-16 xl:px-24">
        <div className="mx-auto max-w-[1400px]">
          <div className="flex flex-col items-start justify-between gap-12 lg:flex-row lg:items-end lg:gap-8">
            <div className="franchise-text max-w-3xl">
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.3em] text-white/40">
                Franchise
              </p>
              <h2 className="font-[family-name:var(--font-bebas)] text-6xl md:text-8xl lg:text-[120px] font-semibold uppercase leading-[0.8] tracking-normal">
                <span className="slice-text white-slice block" data-text="Bring Crispies">
                  Bring Crispies
                </span>
                <span className="slice-text red-slice block" data-text="to your city.">
                  to your city.
                </span>
              </h2>
              <p className="mt-6 max-w-md text-[13px] leading-relaxed text-white/50">
                Join London&apos;s fastest-growing halal restaurant brand. Full
                training, proven systems, premium support.
              </p>
            </div>

            <Link
              href="/franchise"
              className="group flex items-center gap-4 text-[12px] font-bold uppercase tracking-[0.2em] text-white transition-colors hover:text-[#DC2626]"
            >
              Become a Partner
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 transition-all group-hover:border-[#DC2626] group-hover:bg-[#DC2626]">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M7 17L17 7M17 7H7M17 7v10"
                  />
                </svg>
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer Links */}
      <div className="border-t border-white/10 px-6 py-16 md:px-12 lg:px-16 xl:px-24">
        <div className="mx-auto max-w-[1400px]">
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-4 lg:gap-8">
            {/* Brand */}
            <div className="footer-col col-span-2 sm:col-span-4 lg:col-span-1">
              <h3 className="font-[var(--font-oswald)] text-2xl font-bold uppercase tracking-tight">
                Crispies
              </h3>
              <p className="mt-3 max-w-[200px] text-[12px] leading-relaxed text-white/40">
                Good mood food. Burgers + Chicken. Made halal, made fresh, made
                for London.
              </p>
            </div>

            {/* Menu */}
            <div className="footer-col">
              <h4 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.25em] text-white/60">
                Menu
              </h4>
              <ul className="space-y-2.5">
                {FOOTER_LINKS.menu.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-[13px] text-white/40 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div className="footer-col">
              <h4 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.25em] text-white/60">
                Company
              </h4>
              <ul className="space-y-2.5">
                {FOOTER_LINKS.company.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-[13px] text-white/40 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support */}
            <div className="footer-col">
              <h4 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.25em] text-white/60">
                Support
              </h4>
              <ul className="space-y-2.5">
                {FOOTER_LINKS.support.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-[13px] text-white/40 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10 px-6 py-6 md:px-12 lg:px-16 xl:px-24">
        <div className="mx-auto flex max-w-[1400px] flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-[11px] text-white/30">
            &copy; {new Date().getFullYear()} Crispies. All rights reserved.
          </p>
          <div className="flex gap-6">
            {FOOTER_LINKS.social.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-white/30 transition-colors hover:text-white"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
