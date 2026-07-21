"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import OptimizedImage from "@/components/ui/optimized-image";
import { useDispatch, useSelector } from "react-redux";
import { fetchFullMenu } from "@/lib/redux/slices/menuSlice";
import type { RootState, AppDispatch } from "@/lib/redux/store";
import type { MenuItem } from "@/lib/redux/types";

type MenuRowProps = {
  item: MenuItem;
  categorySlug: string;
  index: number;
  isHovered: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
};

function MenuRow({
  item,
  categorySlug,
  index,
  isHovered,
  onMouseEnter,
  onMouseLeave,
}: MenuRowProps) {
  return (
    <Link
      href={`/menu#${categorySlug}`}
      className="group flex cursor-pointer items-center justify-between border-b border-white/10 py-4 leading-none transition-opacity duration-300 first:border-t first:pt-8 last:border-none hover:opacity-100 "
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="flex w-full items-baseline gap-4 md:gap-8 ">
        {/* Number */}
        <div className="mt-2 w-8 text-lg font-semibold text-white/40 md:w-12 md:text-2xl group-[:hover]:text-red-500 transition-colors duration-150">
          {String(index + 1).padStart(2, "0")}.
        </div>

        {/* Title and Tags */}
        <div className="min-w-0 flex-1">
          <h4 className="font-semibold flex gap-4 bg-linear-to-r from-brand-red from-50% to-white to-50% bg-size-[200%] bg-right bg-clip-text text-lg text-nowrap uppercase text-transparent transition-[background-position] duration-700 group-hover:bg-left md:text-3xl">
            {item.name}

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

          {/* Description underneath */}
          <p className="mt-2 line-clamp-2 max-w-2xl text-[10px] font-medium uppercase tracking-widest text-white/50 md:mt-3 md:text-xs">
            {item.description}
          </p>
        </div>

        {/* Price - right side */}
        <div className="shrink-0 self-start pt-3 text-right text-sm font-semibold uppercase tracking-widest text-white/70 md:pt-4 md:text-base">
          {item.price}
        </div>
      </div>
    </Link>
  );
}

const FEATURED_CATEGORY_COUNT = 3;
const HOMEPAGE_ITEMS_PER_CATEGORY = 5;

export default function MenuSection() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const dispatch = useDispatch<AppDispatch>();
  const categories = useSelector((state: RootState) => state.menu.categories);

  useEffect(() => {
    if (categories.length === 0) {
      dispatch(fetchFullMenu());
    }
  }, [dispatch, categories.length]);

  const imageRef = useRef<HTMLDivElement>(null);
  const mousePos = useRef({ x: 0, y: 0 });
  const currentPos = useRef({ x: 0, y: 0 });
  const reqRef = useRef<number | undefined>(undefined);

  // Pick featured categories for the homepage preview, cap their items at N each
  const featuredCategories = categories
    .slice(0, FEATURED_CATEGORY_COUNT)
    .map((category) => ({
       ...category,
       items: category.items.slice(0, HOMEPAGE_ITEMS_PER_CATEGORY),
    }));

  // Build a flat index → {category, item} map once per render so the cursor
  // follower's hovered image resolves correctly regardless of the per-category cap.
  const flatItems = featuredCategories.flatMap((category) =>
    category.items.map((item) => ({ category, item })),
  );

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

      <section className="relative overflow-hidden bg-black px-6 py-20 text-white sm:px-8 sm:py-24 md:px-12 md:py-28 lg:px-16 lg:py-36">
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
{hoveredIndex !== null && flatItems[hoveredIndex] && (
            <>
               <OptimizedImage
                 src={flatItems[hoveredIndex].item.image}
                 alt={flatItems[hoveredIndex].item.name ?? "Crispies menu item"}
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
          <div className="mb-12 flex flex-col items-baseline justify-between gap-4 md:mb-16 md:flex-row">
            <h2 className="font-[family-name:var(--font-bebas)] text-5xl uppercase leading-none md:text-7xl lg:text-8xl">
              The Menu
            </h2>
            <Link
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
            </Link>
          </div>

{/* Menu Categories */}
          {featuredCategories.map((category, catIdx) => {
            const globalStartIdx = featuredCategories
              .slice(0, catIdx)
              .reduce((sum, c) => sum + c.items.length, 0);
            const moreCount = (categories[catIdx]?.items.length ?? 0) - category.items.length;
            return (
              <div
                key={category.id}
                id={category.id}
                className={`scroll-mt-32 ${
                  catIdx < featuredCategories.length - 1 ? "mb-12 md:mb-16" : "mb-0"
                }`}
              >
                <div className="mb-4 flex items-baseline justify-between gap-4 border-b border-white/10 pb-4 md:mb-6">
                  <div className="flex items-baseline gap-4">
                    <span className="font-[family-name:var(--font-bebas)] text-5xl leading-none text-white/20 md:text-6xl">{category.number}</span>
                    <h3 className="font-[family-name:var(--font-bebas)] text-3xl uppercase leading-none text-white md:text-4xl">{category.title}</h3>
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-widest text-white/30">
                    {category.items.length} Items{moreCount > 0 ? ` (+${moreCount})` : ""}
                  </span>
                </div>
                <div className="menu-container flex w-full flex-col">
                   {category.items.map((item, index) => {
                     const globalIdx = globalStartIdx + index;
                     return (
                       <MenuRow
                         key={item.id}
                         item={item}
                         categorySlug={category.id}
                         index={index}
                         isHovered={hoveredIndex === globalIdx}
                         onMouseEnter={() => setHoveredIndex(globalIdx)}
                         onMouseLeave={() => setHoveredIndex(null)}
                       />
                     );
                   })}
                </div>
                {moreCount > 0 && (
                  <Link
                    href={`/menu#${category.id}`}
                    className="group mt-6 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-white/40 transition-colors hover:text-white md:mt-8"
                  >
                    View all {categories[catIdx]?.items.length} in {category.title}
                    <span className="transition-transform group-hover:translate-x-1">&rarr;</span>
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
