"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
const NAV_LINKS = [
  { href: "/menu", label: "Menu" },
  { href: "/locations", label: "Locations" },
];

const navItemClass =
  "text-white text-[15px] font-normal capitalize tracking-[0.54px] " +
  "[font-family:var(--font-koulen),Koulen,sans-serif] " +
  "transition-colors duration-200 hover:text-[#FF0931]";

const orderBtnClass =
  "rounded-[4px] bg-[#FF0931] text-white text-[15px] font-semibold capitalize " +
  "tracking-[0.54px] [font-family:var(--font-inter),Inter,sans-serif]";

const deliveryBtnClass =
  "rounded-[4px] border border-[#FF0931] text-[#FF0931] text-[15px] font-semibold " +
  "capitalize tracking-[0.54px] [font-family:var(--font-inter),Inter,sans-serif]";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="relative z-50 w-full bg-black">
      {/* Desktop navbar */}
      <nav className="nav-enter mx-auto hidden py-10 w-full max-w-[1422px] items-center justify-between px-6 lg:flex xl:px-10">
        <Link
          href="/"
          className="h-[124px] w-[124px] shrink-0"
          aria-label="Crispies home"
        >
          <Image
            src="/images/cripieslogoblack.png"
            alt="Crispies"
            width={124}
            height={124}
            className="h-full w-full object-contain"
            priority
          />
        </Link>

        <div className="flex items-center gap-6 xl:gap-8">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`link-underline ${navItemClass}`}
            >
              {l.label}
            </Link>
          ))}
          <div className="h-14 w-px shrink-0 bg-[#434343]" />
          <button className={`btn-press px-7 py-3 ${orderBtnClass}`}>
            Order In The App
          </button>
          <button className={`btn-press px-7 py-3 ${deliveryBtnClass}`}>
            Delivery
          </button>
        </div>
      </nav>

      {/* Mobile navbar */}
      <nav className="flex h-16 items-center justify-between px-5 lg:hidden">
        <Link href="/" aria-label="Crispies home">
          <Image
            src="/images/cripieslogoblack.png"
            alt="Crispies"
            width={56}
            height={56}
            className="block"
            priority
          />
        </Link>
        <div className="flex items-center gap-2">
          <button
            aria-label="Delivery"
            className={`px-3 py-2 text-[12px] ${deliveryBtnClass}`}
          >
            Delivery
          </button>
          <button
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="px-3 py-2 text-[13px] font-semibold capitalize tracking-[0.54px] text-white [font-family:var(--font-inter),Inter,sans-serif]"
          >
            {open ? "Close" : "Menu"}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {open && (
        <>
          <div
            className="backdrop-in fixed inset-0 top-16 bg-black/60 lg:hidden"
            onClick={() => setOpen(false)}
          />
          <div className="menu-drop absolute inset-x-0 top-full border-b border-white/10 bg-black lg:hidden">
            <div className="flex flex-col gap-1 px-5 py-6">
              {NAV_LINKS.map((l, i) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  style={{ animationDelay: `${0.05 + i * 0.08}s` }}
                  className={`menu-item rounded-md px-4 py-4 transition-colors hover:bg-white/5 ${navItemClass}`}
                >
                  {l.label}
                </Link>
              ))}
              <button
                style={{ animationDelay: `${0.05 + NAV_LINKS.length * 0.08}s` }}
                className={`menu-item btn-press mt-2 px-7 py-4 ${orderBtnClass}`}
              >
                Order In The App
              </button>
              <button
                style={{
                  animationDelay: `${0.05 + (NAV_LINKS.length + 1) * 0.08}s`,
                }}
                className={`menu-item btn-press mt-2 px-7 py-4 ${deliveryBtnClass}`}
              >
                Delivery
              </button>
            </div>
          </div>
        </>
      )}
    </header>
  );
}