"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

interface MenuItemType {
  id: string;
  title: string;
  price: string;
  imageUrl: string;
  tags: string[];
}

const menuItems: MenuItemType[] = [
  {
    id: "01",
    title: "Chicken Tenders",
    price: "from £7.99",
    imageUrl:
      "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&q=80&w=800&h=600",
    tags: ["Crispy", "Buttermilk", "Signature Dip"],
  },
  {
    id: "02",
    title: "Big Flavour Burgers",
    price: "from £9.49",
    imageUrl:
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=800&h=600",
    tags: ["100% Beef", "Brioche Bun", "House Sauce"],
  },
  {
    id: "03",
    title: "Flaming Grill",
    price: "from £10.99",
    imageUrl:
      "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=800&h=600",
    tags: ["Charcoal Fired", "Spicy", "Smokey"],
  },
  {
    id: "04",
    title: "Loaded Wraps",
    price: "from £8.49",
    imageUrl:
      "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&q=80&w=800&h=600",
    tags: ["Toasted", "Fresh Veg", "Generous Fill"],
  },
  {
    id: "05",
    title: "Platters",
    price: "from £18.99",
    imageUrl:
      "https://images.unsplash.com/photo-1576867757603-05b134ebc379?auto=format&fit=crop&q=80&w=800&h=600",
    tags: ["Shareable", "Party Size", "Mixed Grill"],
  },
];

type MenuRowProps = {
  item: MenuItemType;
  isHovered: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
};

function MenuRow({
  item,
  isHovered,
  onMouseEnter,
  onMouseLeave,
}: MenuRowProps) {
  return (
    <div
      className="group flex cursor-pointer items-center justify-between border-b border-white/10 py-4 leading-none transition-opacity duration-300 first:border-t first:pt-8 last:border-none hover:opacity-100 "
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="flex w-full items-baseline gap-4 md:gap-8 ">
        {/* Number */}
        <div className="mt-2 w-8  text-lg font-semibold text-white/40 md:w-12 md:text-2xl group-[:hover]:text-red-500 transition-colors duration-150">
          {item.id}.
        </div>

        {/* Title and Tags */}
        <div className="min-w-0 flex-1">
          <h4 className="font-semibold flex gap-4 bg-linear-to-r from-brand-red from-50% to-white to-50% bg-size-[200%] bg-right bg-clip-text text-lg text-nowrap uppercase text-transparent transition-[background-position] duration-700 group-hover:bg-left md:text-3xl">
            {item.title}

            {/* CSS Animated SVG Link Icon */}
            <span
              className={`ml-2 flex items-center text-white transition-opacity duration-300 ${
                isHovered ? "opacity-100 icon-container-anim" : "opacity-0"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="36"
                height="36"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path
                  id="box"
                  pathLength={1}
                  className={isHovered ? "icon-path-anim-box" : ""}
                  d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"
                />
                <path
                  id="arrow-line"
                  pathLength={1}
                  className={isHovered ? "icon-path-anim-line" : ""}
                  d="M10 14 21 3"
                />
                <path
                  id="arrow-curb"
                  pathLength={1}
                  className={isHovered ? "icon-path-anim-curb" : ""}
                  d="M15 3h6v6"
                />
              </svg>
            </span>
          </h4>

          {/* Tags / Info underneath */}
          <div className="mt-4 flex  items-center gap-3  text-[10px] text-nowrap font-semibold uppercase tracking-widest text-white/50 md:mt-6  md:text-sm">
            {item.tags.map((tag, idx, stackArr) => (
              <div className="flex items-center gap-3" key={tag}>
                <span>{tag}</span>
                {idx !== stackArr.length - 1 && (
                  <span
                    className="inline-block h-1.5 w-1.5 rounded-full bg-white/30"
                    aria-hidden
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Price - right side */}
        <div className="shrink-0 self-start pt-3 text-right  text-sm font-semibold uppercase tracking-widest text-white/70 md:pt-4 md:text-base">
          {item.price}
        </div>
      </div>
    </div>
  );
}

export default function MenuSection() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const imageRef = useRef<HTMLDivElement>(null);
  const mousePos = useRef({ x: 0, y: 0 });
  const currentPos = useRef({ x: 0, y: 0 });
  const reqRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduce) return;

    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", handleMouseMove);

    const animate = () => {
      currentPos.current.x +=
        (mousePos.current.x - currentPos.current.x) * 0.15;
      currentPos.current.y +=
        (mousePos.current.y - currentPos.current.y) * 0.15;

      if (imageRef.current) {
        const offsetX = 160;
        const offsetY = 110;
        imageRef.current.style.transform = `translate3d(${currentPos.current.x - offsetX}px, ${currentPos.current.y - offsetY}px, 0)`;
      }

      reqRef.current = requestAnimationFrame(animate);
    };

    reqRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (reqRef.current) cancelAnimationFrame(reqRef.current);
    };
  }, []);

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .menu-container:hover .group:not(:hover) {
          opacity: 0.3;
        }
        .icon-container-anim { animation: containerFade 2.2s infinite; }
        .icon-path-anim-box,
        .icon-path-anim-line,
        .icon-path-anim-curb {
          stroke-dasharray: 1;
          stroke-dashoffset: 1;
          opacity: 0;
        }
        .icon-path-anim-box { animation: drawPath 2.2s infinite; }
        .icon-path-anim-line { animation: drawPath 2.2s infinite 0.2s; }
        .icon-path-anim-curb { animation: drawPath 2.2s infinite 0.2s; }
        @keyframes drawPath {
          0% { stroke-dashoffset: 1; opacity: 0; }
          10% { stroke-dashoffset: 1; opacity: 1; }
          40%, 80% { stroke-dashoffset: 0; opacity: 1; }
          100% { stroke-dashoffset: 0; opacity: 1; }
        }
        @keyframes containerFade {
          0%, 70% { opacity: 1; }
          80%, 100% { opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .icon-container-anim,
          .icon-path-anim-box,
          .icon-path-anim-line,
          .icon-path-anim-curb { animation: none !important; opacity: 1 !important; stroke-dashoffset: 0 !important; }
        }
      `,
        }}
      />

      <section className="relative min-h-screen overflow-hidden bg-black p-8 text-white md:p-16 lg:p-24">
        {/* Floating Image Cursor Follower */}
        <div
          ref={imageRef}
          className={`pointer-events-none fixed left-0 top-0 z-50 h-56 w-80 overflow-hidden rounded-2xl shadow-2xl transition-opacity duration-300 ease-in-out ${
            hoveredIndex !== null
              ? "scale-100 opacity-100"
              : "scale-95 opacity-0"
          }`}
          aria-hidden
        >
          {hoveredIndex !== null && (
            <>
              <Image
                src={menuItems[hoveredIndex].imageUrl}
                alt={`${menuItems[hoveredIndex].title} preview`}
                fill
                sizes="320px"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div
                className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"
                aria-hidden
              />
            </>
          )}
        </div>

        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-16 flex flex-col items-baseline justify-between gap-4 md:flex-row">
            <h2 className=" text-xl uppercase md:text-4xl lg:text-5xl font-semibold">
              The Menu
            </h2>
            <a
              href="/menu"
              className="group flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-white/55 transition-colors hover:text-white"
            >
              Full Menu
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                aria-hidden
              >
                <path d="M7 7h10v10" />
                <path d="M7 17 17 7" />
              </svg>
            </a>
          </div>

          {/* Menu List */}
          <div className="menu-container flex w-full flex-col pt-8">
            {menuItems.map((item, index) => (
              <MenuRow
                key={item.id}
                item={item}
                isHovered={hoveredIndex === index}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
