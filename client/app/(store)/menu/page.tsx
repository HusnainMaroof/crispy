"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLenis } from "@/components/providers/smooth-scroll";
import { addItem } from "@/lib/redux/slices/cartSlice";
import { fetchFullMenu, fetchDeals } from "@/lib/redux/slices/menuSlice";
import type { RootState, AppDispatch } from "@/lib/redux/store";
import type { MenuItem, MenuCategory } from "@/lib/redux/types";
import MenuItemModal from "@/components/store/menu-item-modal";

gsap.registerPlugin(ScrollTrigger, useGSAP);

type TabId = "full-menu" | "deals";

const TABS: { id: TabId; label: string }[] = [
  { id: "full-menu", label: "Full Menu" },
  { id: "deals", label: "Deals" },
];

type MenuRowProps = {
  index: string;
  item: MenuItem;
  onOpen: () => void;
  onHover: (image: string | null) => void;
};

function MenuRow({ index, item, onOpen, onHover }: MenuRowProps) {
  return (
    <button
      type="button"
      onClick={onOpen}
      onMouseEnter={() => onHover(item.image)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(item.image)}
      onBlur={() => onHover(null)}
      className="group flex w-full cursor-pointer items-center justify-between border-b border-white/10 py-6 text-left leading-none transition-opacity duration-300 last:border-none hover:opacity-100 md:py-8"
      aria-label={`Order ${item.name}`}
    >
      <div className="flex w-full items-baseline gap-3 md:gap-6">
        <div className="mt-1 w-6 shrink-0 text-base font-semibold text-white/40 transition-colors duration-150 group-hover:text-brand-red md:w-9 md:text-lg">
          {index}.
        </div>

        <div className="min-w-0 flex-1">
          <h4 className="flex flex-wrap items-center gap-3 bg-linear-to-r from-brand-red from-50% to-white to-50% bg-size-[200%] bg-right bg-clip-text text-base text-transparent transition-[background-position] duration-700 group-hover:bg-left md:text-2xl">
            <span className="uppercase">{item.name}</span>

            <span className="ml-1 flex items-center text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path pathLength={1} className="icon-path-anim-box" d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <path pathLength={1} className="icon-path-anim-line" d="M10 14 21 3" />
                <path pathLength={1} className="icon-path-anim-curb" d="M15 3h6v6" />
              </svg>
            </span>
          </h4>

          {item.badge && (
            <span
              className={`mt-3 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                item.badgeVariant === "vegan"
                  ? "border border-brand-red/40 bg-brand-red/15 text-brand-red"
                  : "border border-white/15 bg-white/[0.03] text-white/60"
              }`}
            >
              {item.badge}
            </span>
          )}

          <p className="mt-2 line-clamp-2 max-w-2xl text-[10px] font-medium uppercase tracking-widest text-white/50 md:mt-3 md:text-xs">
            {item.description}
          </p>
        </div>

        <div className="shrink-0 self-start pt-2 text-right text-xs font-semibold uppercase tracking-widest text-white/70 md:pt-3 md:text-sm">
          {item.price}
        </div>
      </div>
    </button>
  );
}

export default function FullMenuPage() {
  const [activeTab, setActiveTab] = useState<TabId>("full-menu");
  const [query, setQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [hoveredImage, setHoveredImage] = useState<string | null>(null);
  const hoveredImageRef = useRef<string | null>(null);

  const dispatch = useDispatch<AppDispatch>();
  const categories = useSelector((state: RootState) => state.menu.categories);
  const dealItems = useSelector((state: RootState) => state.menu.deals);

  useEffect(() => {
    if (categories.length === 0) dispatch(fetchFullMenu());
    if (dealItems.length === 0) dispatch(fetchDeals());
  }, [dispatch, categories.length, dealItems.length]);

  const menuListRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const floatImgRef = useRef<HTMLDivElement>(null);
  const mousePos = useRef({ x: 0, y: 0 });
  const curPos = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number | undefined>(undefined);

  const { stop, start } = useLenis();

  const isSearching = query.trim().length > 0;
  const q = query.trim().toLowerCase();

  const searchMenuGroups = useMemo<MenuCategory[]>(() => {
    if (!isSearching) return [];
    return categories
      .map((cat) => ({
        ...cat,
        items: cat.items.filter(
          (it) => it.name.toLowerCase().includes(q) || it.description.toLowerCase().includes(q),
        ),
      }))
      .filter((cat) => cat.items.length > 0);
  }, [q, isSearching, categories]);

  const searchDeals = useMemo<MenuItem[]>(() => {
    if (!isSearching) return [];
    return dealItems.filter(
      (it) => it.name.toLowerCase().includes(q) || it.description.toLowerCase().includes(q),
    );
  }, [q, isSearching, dealItems]);

  const searchMenuCount = searchMenuGroups.reduce((s, c) => s + c.items.length, 0);
  const searchDealsCount = searchDeals.length;
  const searchTotalCount = searchMenuCount + searchDealsCount;

  useGSAP(
    () => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce) return;

      gsap.from(".page-title", { opacity: 0, y: -12, duration: 0.7, ease: "power3.out" });

      const rows = gsap.utils.toArray<HTMLElement>(".menu-row-anim");
      rows.forEach((row) => {
        gsap.from(row, {
          y: 16,
          opacity: 0,
          duration: 0.5,
          ease: "power3.out",
          scrollTrigger: { trigger: row, start: "top 92%" },
        });
      });

      if (menuListRef.current && progressRef.current) {
        ScrollTrigger.create({
          trigger: menuListRef.current,
          start: "top 50%",
          end: "bottom 90%",
          scrub: true,
          onUpdate: (self) => {
            const pct = Math.min(100, Math.max(0, self.progress * 100));
            progressRef.current!.style.width = `${pct}%`;
          },
        });
      }
    },
    { scope: menuListRef, dependencies: [activeTab, isSearching] },
  );

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const onMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", onMove);

    const animate = () => {
      curPos.current.x += (mousePos.current.x - curPos.current.x) * 0.15;
      curPos.current.y += (mousePos.current.y - curPos.current.y) * 0.15;
      if (floatImgRef.current && hoveredImageRef.current) {
        const offX = 160;
        const offY = 110;
        floatImgRef.current.style.transform = `translate3d(${curPos.current.x - offX}px, ${curPos.current.y - offY}px, 0)`;
      }
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", onMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  useEffect(() => {
    if (!selectedItem) return;
    stop();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
      start();
    };
  }, [selectedItem, stop, start]);

  const handleAddToCart = (quantity: number) => {
    if (!selectedItem) return;
    for (let i = 0; i < quantity; i++) {
      dispatch(addItem({ id: selectedItem.id, name: selectedItem.name, price: selectedItem.priceValue }));
    }
  };

  const openItem = (item: MenuItem) => setSelectedItem(item);
  const hoverItem = (image: string | null) => {
    hoveredImageRef.current = image;
    setHoveredImage(image);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .menu-row-anim { will-change: transform, opacity; }
        .icon-path-anim-box,
        .icon-path-anim-line,
        .icon-path-anim-curb {
          stroke-dasharray: 1;
          stroke-dashoffset: 1;
          opacity: 0;
        }
        .group:hover .icon-path-anim-box { animation: drawPath 2.2s infinite; }
        .group:hover .icon-path-anim-line { animation: drawPath 2.2s infinite 0.2s; }
        .group:hover .icon-path-anim-curb { animation: drawPath 2.2s infinite 0.2s; }
        @keyframes drawPath {
          0% { stroke-dashoffset: 1; opacity: 0; }
          10% { stroke-dashoffset: 1; opacity: 1; }
          40%, 80% { stroke-dashoffset: 0; opacity: 1; }
          100% { stroke-dashoffset: 0; opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          .icon-path-anim-box,
          .icon-path-anim-line,
          .icon-path-anim-curb { animation: none !important; opacity: 1 !important; stroke-dashoffset: 0 !important; }
        }
      `,
        }}
      />

      {/* Header */}
      <section className="px-6 pb-8 pt-28 md:px-16 md:pb-10 md:pt-32 lg:px-24">
        <h1 className="page-title mb-6 font-[family-name:var(--font-bebas)] uppercase leading-[0.85] md:mb-8">
          <span className="block text-5xl text-white md:text-7xl lg:text-8xl">Menu.</span>
        </h1>

        <div className="relative max-w-2xl">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/40" aria-hidden>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            type="search"
            inputMode="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={activeTab === "deals" ? "Search deals…" : "Search the menu…"}
            aria-label="Search"
            className="w-full rounded-2xl border border-white/10 bg-white/[0.03] py-4 pl-12 pr-12 text-base text-white placeholder:text-white/40 outline-none transition-colors duration-200 focus:border-brand-red/60 focus:bg-white/[0.05] md:text-lg"
          />
          {isSearching && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full border border-white/15 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Clear search"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
                <line x1="6" y1="6" x2="18" y2="18" />
                <line x1="6" y1="18" x2="18" y2="6" />
              </svg>
            </button>
          )}
        </div>
      </section>

      {/* Sticky tab pills + scroll progress */}
      <div className="sticky top-16 z-30 border-y border-white/10 bg-black/95 backdrop-blur-lg">
        <div className="flex gap-2 px-6 py-3 md:gap-3 md:px-16 lg:px-24">
          {TABS.map((tab) => {
            const active = activeTab === tab.id && !isSearching;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setQuery("");
                  setActiveTab(tab.id);
                }}
                className={`whitespace-nowrap rounded-full border px-5 py-2.5 text-xs font-bold uppercase tracking-widest transition-all duration-200 ${
                  active
                    ? "border-brand-red bg-brand-red text-white"
                    : "border-white/15 bg-white/[0.02] text-white/60 hover:border-white/30 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
        <div className="h-0.5 w-full bg-white/10" aria-hidden>
          <div ref={progressRef} className="h-full w-0 bg-brand-red transition-[width] duration-150 ease-out" />
        </div>
      </div>

      {/* Content */}
      <div ref={menuListRef} className="px-6 md:px-16 lg:px-24">
        {isSearching ? (
          <div className="py-12 md:py-16">
            <div className="mb-6 flex items-baseline justify-between gap-4 border-b border-white/10 pb-5">
              <h2 className="font-[family-name:var(--font-bebas)] text-4xl uppercase leading-none text-white md:text-5xl">
                Results
              </h2>
              <span className="shrink-0 text-xs font-semibold uppercase tracking-widest text-white/30">
                {searchTotalCount} {searchTotalCount === 1 ? "Item" : "Items"}
              </span>
            </div>

            {searchDeals.length > 0 && (
              <div className="pb-8">
                <h3 className="mb-2 text-[11px] font-bold uppercase tracking-widest text-brand-red">Deals</h3>
                <div className="grid grid-cols-1 gap-x-10 md:grid-cols-2 lg:gap-x-16">
                  {searchDeals.map((item, i) => (
                    <div key={item.id} className="menu-row-anim">
                      <MenuRow index={String(i + 1).padStart(2, "0")} item={item} onOpen={() => openItem(item)} onHover={hoverItem} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {searchMenuGroups.length > 0 && (
              <div>
                {searchMenuGroups.map((cat) => (
                  <div key={cat.id} className="pb-8">
                    <h3 className="mb-2 mt-4 text-[11px] font-bold uppercase tracking-widest text-brand-red">{cat.title}</h3>
                    <div className="grid grid-cols-1 gap-x-10 md:grid-cols-2 lg:gap-x-16">
                      {cat.items.map((item, i) => (
                        <div key={item.id} className="menu-row-anim">
                          <MenuRow index={String(i + 1).padStart(2, "0")} item={item} onOpen={() => openItem(item)} onHover={hoverItem} />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {searchTotalCount === 0 && (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <p className="font-[family-name:var(--font-bebas)] text-5xl uppercase text-white/30 md:text-6xl">Nothing found</p>
                <p className="mt-3 max-w-sm text-sm text-white/50">No items match &ldquo;{query.trim()}&rdquo;. Try another search.</p>
                <button type="button" onClick={() => setQuery("")} className="mt-6 rounded-full border border-white/15 px-5 py-3 text-xs font-bold uppercase tracking-widest text-white/70 transition-colors hover:border-brand-red hover:text-white">Clear search</button>
              </div>
            )}
          </div>
        ) : activeTab === "full-menu" ? (
          <div className="py-12 md:py-16">
            {categories.map((cat) => (
              <section key={cat.id} className="menu-row-anim scroll-mt-32 pb-10">
                <div className="mb-4 flex items-baseline justify-between gap-4 border-b border-white/10 pb-4">
                  <div className="flex items-baseline gap-4">
                    <span className="font-[family-name:var(--font-bebas)] text-5xl leading-none text-white/20 md:text-6xl">{cat.number}</span>
                    <h2 className="font-[family-name:var(--font-bebas)] text-4xl uppercase leading-none text-white md:text-5xl">{cat.title}</h2>
                  </div>
                  <span className="shrink-0 text-xs font-semibold uppercase tracking-widest text-white/30">{cat.items.length} Items</span>
                </div>
                <div className={`grid gap-x-10 lg:gap-x-16 ${cat.items.length === 1 ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"}`}>
                  {cat.items.map((item, i) => (
                    <MenuRow key={item.id} index={String(i + 1).padStart(2, "0")} item={item} onOpen={() => openItem(item)} onHover={hoverItem} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="py-12 md:py-16">
            <div className="mb-6 flex items-baseline justify-between gap-4 border-b border-white/10 pb-5">
              <h2 className="font-[family-name:var(--font-bebas)] text-4xl uppercase leading-none text-white md:text-5xl">Today&apos;s Deals</h2>
              <span className="shrink-0 text-xs font-semibold uppercase tracking-widest text-white/30">{dealItems.length} Deals</span>
            </div>
            <div className="grid grid-cols-1 gap-x-10 md:grid-cols-2 lg:gap-x-16">
              {dealItems.map((item, i) => (
                <div key={item.id} className="menu-row-anim">
                  <MenuRow index={String(i + 1).padStart(2, "0")} item={item} onOpen={() => openItem(item)} onHover={hoverItem} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bottom CTA */}
        <div className="flex flex-col items-start justify-between gap-6 border-t border-white/10 py-16 md:flex-row md:items-center">
          <div>
            <h3 className="font-[family-name:var(--font-bebas)] text-4xl uppercase leading-none text-white md:text-5xl">Hungry yet?</h3>
            <p className="mt-3 max-w-md text-sm text-white/50">Fire up an order in seconds — delivery or click &amp; collect, your call.</p>
          </div>
          <Link
            href="/cart"
            className="group inline-flex items-center gap-3 rounded-full bg-brand-red px-7 py-4 text-xs font-bold uppercase tracking-widest text-white shadow-[0_20px_60px_-15px_rgba(220,38,38,0.7)] transition-transform duration-300 hover:scale-105 active:scale-95"
          >
            Start Order
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </Link>
        </div>

        <div className="h-24" />
      </div>

      {/* Floating cursor-following preview image */}
      <div
        ref={floatImgRef}
        className={`pointer-events-none fixed left-0 top-0 z-50 h-56 w-80 overflow-hidden rounded-2xl shadow-2xl transition-opacity duration-300 ease-in-out ${
          hoveredImage ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
        aria-hidden
      >
        {hoveredImage && (
          <>
            <Image src={hoveredImage} alt="Preview" fill sizes="320px" className="object-cover transition-transform duration-700" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" aria-hidden />
          </>
        )}
      </div>

      {/* Order modal */}
      {selectedItem && (
        <MenuItemModal item={selectedItem} onClose={() => setSelectedItem(null)} onAdd={handleAddToCart} />
      )}
    </div>
  );
}