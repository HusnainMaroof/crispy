"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useUI } from "@/lib/context/ui-context";
import { useSelector } from "react-redux";
import type { RootState } from "@/lib/redux/store";

gsap.registerPlugin(useGSAP);

function ArrowUpRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="7" y1="17" x2="17" y2="7" />
      <polyline points="7 7 17 7 17 17" />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      {open ? (
        <>
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </>
      ) : (
        <>
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </>
      )}
    </svg>
  );
}

const navLinks = [
  { href: "/menu", label: "Menu" },
  { href: "#locations", label: "Locations" },
  { href: "#franchise", label: "Franchise" },
];

export default function Navbar() {
  const { isMobileNavOpen, toggleMobileNav, closeMobileNav } = useUI();
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    closeMobileNav();
  }, [pathname, closeMobileNav]);

  useEffect(() => {
    if (isMobileNavOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileNavOpen]);

  useGSAP(
    () => {
      if (!mobileMenuRef.current) return;

      const el = mobileMenuRef.current;
      const items = el.querySelectorAll(".mobile-nav-item");

      if (isMobileNavOpen) {
        // Immediately show container
        el.style.display = "flex";
        el.style.opacity = "1";
        el.style.pointerEvents = "auto";

        // Animate items in
        gsap.fromTo(
          items,
          { y: 30, autoAlpha: 0 },
          {
            y: 0,
            autoAlpha: 1,
            duration: 0.4,
            stagger: 0.06,
            ease: "power3.out",
            delay: 0.1,
          },
        );
      } else {
        // Animate items out
        gsap.to(items, {
          y: 20,
          autoAlpha: 0,
          duration: 0.25,
          stagger: 0.03,
          ease: "power2.in",
        });

        // Hide container after items animate out
        gsap.to(el, {
          opacity: 0,
          duration: 0.3,
          delay: 0.15,
          onComplete: () => {
            el.style.pointerEvents = "none";
            el.style.display = "none";
          },
        });
      }
    },
    { dependencies: [isMobileNavOpen] },
  );

  const itemCount = useSelector((state: RootState) =>
    state.cart.items.reduce((sum, i) => sum + i.quantity, 0),
  );

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-black/90 backdrop-blur-md border-b border-white/5"
            : "bg-transparent"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-red font-display text-lg font-black text-white leading-none">
              C
            </span>
            <span className="font-display text-xl font-bold tracking-wider text-white">
              CRISPIES
            </span>
          </Link>

          {/* Center nav — desktop */}
          <nav className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => {
              const isRoute = link.href.startsWith("/");
              const active = isRoute && pathname === link.href;
              return isRoute ? (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-[11px] font-semibold uppercase tracking-[0.2em] transition-colors duration-200 ${
                    active ? "text-brand-red" : "text-white/60 hover:text-white"
                  }`}
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/60 hover:text-white transition-colors duration-200"
                >
                  {link.label}
                </a>
              );
            })}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Delivery link — desktop */}
            <a
              href="#order"
              className="hidden items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/60 hover:text-white transition-colors duration-200 md:flex"
            >
              Delivery
              <ArrowUpRight />
            </a>

            {/* Cart */}
            <Link
              href="/cart"
              className="relative hidden h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/70 transition-colors duration-200 hover:bg-white/5 hover:text-white md:flex"
              aria-label={`Cart ${itemCount > 0 ? `(${itemCount} items)` : ""}`}
            >
              <BagIcon />
              {itemCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand-red px-1 text-[9px] font-bold text-white ring-2 ring-black">
                  {itemCount}
                </span>
              )}
            </Link>

            {/* Order Now CTA */}
            <a
              href="#order"
              className="hidden rounded-full bg-brand-red px-5 py-2 text-[11px] font-bold uppercase tracking-[0.15em] text-white transition-transform duration-300 hover:scale-105 active:scale-95 md:inline-block"
            >
              Order Now
            </a>

            {/* Mobile hamburger */}
            <button
              onClick={toggleMobileNav}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white transition-colors duration-200 hover:bg-white/5 md:hidden"
              aria-label={isMobileNavOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMobileNavOpen}
            >
              <MenuIcon open={isMobileNavOpen} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu overlay — GSAP controls visibility */}
      <div
        ref={mobileMenuRef}
        className="fixed inset-0 top-16 z-[60] flex flex-col bg-black px-6 py-8 md:hidden"
        style={{ display: "none", opacity: 0, pointerEvents: "none" }}
      >
        <p className="mobile-nav-item mb-6 text-[10px] font-bold uppercase tracking-[0.35em] text-brand-red">
          Good Mood Food
        </p>

        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={closeMobileNav}
            className="mobile-nav-item group flex items-center justify-between border-b border-white/5 py-4"
          >
            <span className="font-display text-3xl font-bold uppercase tracking-wide text-white transition-colors duration-200 group-hover:text-brand-red">
              {link.label}
            </span>
            <ArrowUpRight />
          </Link>
        ))}

        {/* Delivery (mobile) */}
        <a
          href="#order"
          onClick={closeMobileNav}
          className="mobile-nav-item group flex items-center justify-between border-b border-white/5 py-4"
        >
          <span className="font-display text-3xl font-bold uppercase tracking-wide text-white transition-colors duration-200 group-hover:text-brand-red">
            Delivery
          </span>
          <ArrowUpRight />
        </a>

        <a
          href="#order"
          onClick={closeMobileNav}
          className="mobile-nav-item mt-10 rounded-full bg-brand-red px-6 py-4 text-center text-sm font-bold uppercase tracking-[0.2em] text-white transition-transform duration-300 hover:scale-105 active:scale-95"
        >
          Order Now
        </a>
      </div>
    </>
  );
}
