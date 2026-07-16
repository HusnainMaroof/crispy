"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { addItem } from "@/lib/redux/slices/cartSlice";

gsap.registerPlugin(ScrollTrigger, useGSAP);

interface MenuItemType {
  id: string;
  name: string;
  description: string;
  price: string;
  priceValue: number;
  image: string;
  badge?: string;
  badgeVariant?: "default" | "vegan";
}

interface MenuCategoryType {
  id: string;
  number: string;
  title: string;
  image: string;
  items: MenuItemType[];
}

const IMG = {
  wings: "https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&q=80&w=800&h=600",
  tenders:
    "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&q=80&w=800&h=600",
  burger:
    "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=800&h=600",
  grill: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=800&h=600",
  wrap: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&q=80&w=800&h=600",
  platter:
    "https://images.unsplash.com/photo-1576867757603-05b134ebc379?auto=format&fit=crop&q=80&w=800&h=600",
  box: "https://images.unsplash.com/photo-1606755962774-d1cf.firebaseapp.com?auto=format&fit=crop&q=80&w=800&h=600",
  gourmet:
    "https://images.unsplash.com/photo-1550317135-9ba9fbc88e54?auto=format&fit=crop&q=80&w=800&h=600",
  kids: "https://images.unsplash.com/photo-1509042239860-f550ce740f57?auto=format&fit=crop&q=80&w=800&h=600",
  sides: "https://images.unsplash.com/photo-1639024471283-035a8a9c4c35?auto=format&fit=crop&q=80&w=800&h=600",
  dessert:
    "https://images.unsplash.com/photo-1606313564200-e1d346c0d0a1?auto=format&fit=crop&q=80&w=800&h=600",
};

const menuCategories: MenuCategoryType[] = [
  {
    id: "wings",
    number: "01",
    title: "Crispies Style Wings",
    image: IMG.wings,
    items: [
      { id: "wings-5", name: "5 Wings", description: "Five crispy golden wings tossed in your choice of house sauce.", price: "£5.99", priceValue: 5.99, image: IMG.wings },
      { id: "wings-7", name: "7 Wings", description: "Seven wings, more crunch, more flavour — pick your heat level.", price: "£7.99", priceValue: 7.99, image: IMG.wings },
      { id: "wings-10", name: "10 Wings", description: "The full ten — perfect for sharing or going solo on a big day.", price: "£10.99", priceValue: 10.99, image: IMG.wings },
    ],
  },
  {
    id: "tenders",
    number: "02",
    title: "Chicken Tenders",
    image: IMG.tenders,
    items: [
      { id: "tenders-3", name: "Trio-Tastic", description: "Three juicy hand-breaded tenders, crisp outside, tender all the way through.", price: "£5.49", priceValue: 5.49, image: IMG.tenders, badge: "3 Tenders" },
      { id: "tenders-5", name: "Five Easy Pieces", description: "Five golden tenders served with your choice of dipping sauce.", price: "£7.99", priceValue: 7.99, image: IMG.tenders, badge: "5 Tenders" },
      { id: "tenders-10", name: "Ten Steps to Heaven", description: "Ten tenders — the real deal. Share if you must.", price: "£12.99", priceValue: 12.99, image: IMG.tenders, badge: "10 Tenders" },
    ],
  },
  {
    id: "burgers",
    number: "03",
    title: "Big Flavour Burgers",
    image: IMG.burger,
    items: [
      { id: "burger-classic", name: "Classic Crispies Burger", description: "Our OG crispy chicken burger — house slaw, pickles, signature mayo on a toasted brioche bun.", price: "£7.99", priceValue: 7.99, image: IMG.burger },
      { id: "burger-plant", name: "Plant Based Burger", description: "A plant-based patty with all the crunch. Lettuce, tomato, vegan mayo. Zero compromise.", price: "£7.99", priceValue: 7.99, image: IMG.burger, badge: "V", badgeVariant: "vegan" },
      { id: "burger-smoked", name: "Smoked Grill Burger", description: "Chargrilled chicken breast, smoked cheddar, caramelised onions, smoky BBQ glaze.", price: "£8.99", priceValue: 8.99, image: IMG.grill },
      { id: "burger-quarter", name: "Quarter Pounder", description: "A thick, seasoned beef-style patty stacked with fresh lettuce, tomato, and special sauce.", price: "£8.49", priceValue: 8.49, image: IMG.burger },
    ],
  },
  {
    id: "box-meals",
    number: "04",
    title: "Box Meals",
    image: IMG.box,
    items: [
      { id: "box-1", name: "The Crispies Box", description: "Placeholder — swap in your real box meal items and prices.", price: "£9.99", priceValue: 9.99, image: IMG.box },
      { id: "box-2", name: "Grilled Box", description: "Placeholder — swap in your real box meal items and prices.", price: "£10.49", priceValue: 10.49, image: IMG.grill },
    ],
  },
  {
    id: "gourmet-burgers",
    number: "05",
    title: "Gourmet Burgers",
    image: IMG.gourmet,
    items: [
      { id: "gourmet-1", name: "Truffle Mayo Burger", description: "Placeholder — swap in your real gourmet burger items and prices.", price: "£9.99", priceValue: 9.99, image: IMG.gourmet },
      { id: "gourmet-2", name: "Double Smash", description: "Placeholder — swap in your real gourmet burger items and prices.", price: "£11.49", priceValue: 11.49, image: IMG.gourmet },
    ],
  },
  {
    id: "big-wrap",
    number: "06",
    title: "The Big Wrap",
    image: IMG.wrap,
    items: [
      { id: "wrap-1", name: "Loaded Chicken Wrap", description: "Placeholder — swap in your real wrap items and prices.", price: "£6.99", priceValue: 6.99, image: IMG.wrap },
    ],
  },
  {
    id: "flaming-grill",
    number: "07",
    title: "Crispies Flaming Grill",
    image: IMG.grill,
    items: [
      { id: "grill-1", name: "Flame Grilled Half Chicken", description: "Placeholder — swap in your real grill items and prices.", price: "£8.99", priceValue: 8.99, image: IMG.grill },
    ],
  },
  {
    id: "platters",
    number: "08",
    title: "Crispies Platters",
    image: IMG.platter,
    items: [
      { id: "platter-1", name: "Family Sharer Platter", description: "Placeholder — swap in your real platter items and prices.", price: "£18.99", priceValue: 18.99, image: IMG.platter },
    ],
  },
  {
    id: "kids-deals",
    number: "09",
    title: "Kids Deals",
    image: IMG.kids,
    items: [
      { id: "kids-1", name: "Kids Tenders Meal", description: "Placeholder — swap in your real kids deal items and prices.", price: "£4.99", priceValue: 4.99, image: IMG.kids },
    ],
  },
  {
    id: "signature-sides",
    number: "10",
    title: "Signature Sides",
    image: IMG.sides,
    items: [
      { id: "side-1", name: "Loaded Fries", description: "Placeholder — swap in your real sides and prices.", price: "£3.99", priceValue: 3.99, image: IMG.sides },
    ],
  },
  {
    id: "desserts",
    number: "11",
    title: "Desserts",
    image: IMG.dessert,
    items: [
      { id: "dessert-1", name: "Chocolate Fudge Cake", description: "Placeholder — swap in your real desserts and prices.", price: "£3.49", priceValue: 3.49, image: IMG.dessert },
    ],
  },
];

const totalItems = menuCategories.reduce((sum, cat) => sum + cat.items.length, 0);

const SAUCE_OPTIONS = ["Signature Mayo", "Buffalo", "BBQ", "Garlic Parm", "Hot Honey", "Nashville hot"];
const HEAT_LEVELS = ["Mild", "Medium", "Hot", "Extra Hot", "Inferno"];

export default function FullMenuPage() {
  const [activeCategory, setActiveCategory] = useState(menuCategories[0].id);
  const [selectedItem, setSelectedItem] = useState<MenuItemType | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [sauce, setSauce] = useState(SAUCE_OPTIONS[0]);
  const [heat, setHeat] = useState(HEAT_LEVELS[1]);
  const [added, setAdded] = useState(false);

  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const navButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const heroRef = useRef<HTMLDivElement>(null);
  const menuListRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const dispatch = useDispatch();

  useGSAP(
    () => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce) return;

      const words = heroRef.current?.querySelectorAll(".hero-word");
      if (words) {
        gsap.from(words, { yPercent: 110, opacity: 0, duration: 1.1, ease: "expo.out", stagger: 0.12, delay: 0.15 });
      }
      gsap.from(".hero-meta", { opacity: 0, x: -20, duration: 0.8, ease: "power3.out", delay: 0.4 });

      const sections = gsap.utils.toArray<HTMLElement>(".menu-section-row");
      sections.forEach((section) => {
        gsap.from(section, {
          yPercent: 100,
          opacity: 0,
          duration: 0.9,
          ease: "expo.out",
          scrollTrigger: { trigger: section, start: "top 88%" },
        });
      });

      const cards = gsap.utils.toArray<HTMLElement>(".menu-card");
      cards.forEach((card) => {
        gsap.from(card, {
          y: 30,
          opacity: 0,
          duration: 0.7,
          ease: "power3.out",
          scrollTrigger: { trigger: card, start: "top 95%" },
        });
      });
    },
    { scope: menuListRef },
  );

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute("data-category-id");
            if (id) setActiveCategory(id);
          }
        });
      },
      { rootMargin: "-35% 0px -55% 0px", threshold: 0 },
    );
    Object.values(sectionRefs.current).forEach((el) => { if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const activeBtn = navButtonRefs.current[activeCategory];
    activeBtn?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [activeCategory]);

  // Modal open / close
  useEffect(() => {
    if (!selectedItem) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setSelectedItem(null); };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches && modalRef.current) {
      gsap.fromTo(
        modalRef.current,
        { opacity: 0, scale: 0.92, y: 12 },
        { opacity: 1, scale: 1, y: 0, duration: 0.4, ease: "expo.out" },
      );
    }

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [selectedItem]);

  const scrollToCategory = (id: string) => {
    sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const openItem = (item: MenuItemType) => {
    setSelectedItem(item);
    setQuantity(1);
    setSauce(SAUCE_OPTIONS[0]);
    setHeat(HEAT_LEVELS[1]);
    setAdded(false);
  };

  const handleAddToCart = () => {
    if (!selectedItem) return;
    dispatch(addItem({ id: selectedItem.id, name: selectedItem.name, price: selectedItem.priceValue }));
    setAdded(true);
    setTimeout(() => { setSelectedItem(null); }, 900);
  };

  const unitPrice = selectedItem ? selectedItem.priceValue : 0;
  const total = (unitPrice * quantity).toFixed(2);

  return (
    <div className="min-h-screen bg-black text-white">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .menu-section-row { will-change: transform, opacity; }
        .menu-card { will-change: transform, opacity; }
      `,
        }}
      />

      {/* Hero */}
      <section ref={heroRef} className="relative overflow-hidden px-6 pb-12 pt-28 md:px-16 md:pb-16 md:pt-32 lg:px-24">
        <div className="hero-meta mb-5 flex items-center gap-3 text-xs font-semibold uppercase tracking-widest text-white/40">
          <span className="h-px w-6 bg-brand-red" aria-hidden />
          100% Halal &middot; Made Fresh &middot; {menuCategories.length} Categories &middot; {totalItems} Items
        </div>

        <h1 className="font-[family-name:var(--font-bebas)] uppercase leading-[0.85]" style={{ perspective: 800 }}>
          <span className="block overflow-hidden">
            <span className="hero-word inline-block text-6xl text-white md:text-8xl lg:text-[8rem]">The Full</span>
          </span>
          <span className="block overflow-hidden">
            <span className="hero-word inline-block text-6xl text-brand-red md:text-8xl lg:text-[8rem]">Menu.</span>
          </span>
        </h1>
      </section>

      {/* Sticky Category Nav */}
      <div className="sticky top-16 z-30 border-y border-white/10 bg-black/95 backdrop-blur-lg">
        <div className="no-scrollbar flex gap-8 overflow-x-auto px-6 md:px-16 lg:px-24">
          {menuCategories.map((cat) => (
            <button
              key={cat.id}
              ref={(el) => { navButtonRefs.current[cat.id] = el; }}
              onClick={() => scrollToCategory(cat.id)}
              className={`relative shrink-0 whitespace-nowrap py-4 text-xs font-bold uppercase tracking-widest transition-colors ${
                activeCategory === cat.id ? "text-white" : "text-white/40 hover:text-white/70"
              }`}
            >
              {cat.title}
              {activeCategory === cat.id && (
                <span className="absolute bottom-0 left-0 h-0.5 w-full bg-brand-red" aria-hidden />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Category Sections */}
      <div ref={menuListRef} className="px-6 md:px-16 lg:px-24">
        {menuCategories.map((cat) => (
          <section
            key={cat.id}
            data-category-id={cat.id}
            ref={(el) => { sectionRefs.current[cat.id] = el; }}
            className="menu-section-row scroll-mt-20 py-12 md:py-16"
          >
            <div className="mb-6 flex items-baseline justify-between gap-4 border-b border-white/10 pb-5">
              <div className="flex items-baseline gap-4">
                <span className="font-[family-name:var(--font-bebas)] text-5xl leading-none text-white/20 md:text-6xl">
                  {cat.number}
                </span>
                <h2 className="font-[family-name:var(--font-bebas)] text-4xl uppercase leading-none text-white md:text-5xl">
                  {cat.title}
                </h2>
              </div>
              <span className="shrink-0 text-xs font-semibold uppercase tracking-widest text-white/30">
                {cat.items.length} Items
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:gap-6">
              {cat.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => openItem(item)}
                  className="menu-card group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] text-left transition-all duration-300 hover:border-brand-red/40 hover:bg-white/[0.04]"
                  aria-label={`View ${item.name}`}
                >
                  {/* Image */}
                  <div className="relative aspect-[4/3] w-full overflow-hidden">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" aria-hidden />
                    {item.badge && (
                      <span
                        className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md ${
                          item.badgeVariant === "vegan"
                            ? "border border-brand-red/40 bg-brand-red/15 text-brand-red"
                            : "border border-white/15 bg-black/50 text-white/80"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                    {/* Price chip */}
                    <span className="absolute bottom-3 right-3 rounded-full bg-black/70 px-3 py-1 text-xs font-bold tracking-wider text-white backdrop-blur-md">
                      {item.price}
                    </span>
                  </div>

                  {/* Text */}
                  <div className="flex flex-1 flex-col gap-2 p-4">
                    <h3 className="text-lg font-semibold leading-tight text-white transition-colors duration-300 group-hover:text-brand-red">
                      {item.name}
                    </h3>
                    <p className="line-clamp-2 text-sm leading-relaxed text-white/40">{item.description}</p>
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <span className="text-[11px] font-semibold uppercase tracking-widest text-white/40">
                        Tap to order
                      </span>
                      <span className="grid h-8 w-8 place-items-center rounded-full border border-white/15 text-white/70 transition-all duration-300 group-hover:border-brand-red group-hover:bg-brand-red group-hover:text-white">
                        +
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>
        ))}

        {/* Bottom CTA */}
        <div className="menu-card flex flex-col items-start justify-between gap-6 border-t border-white/10 py-16 md:flex-row md:items-center">
          <div>
            <h3 className="font-[family-name:var(--font-bebas)] text-4xl uppercase leading-none text-white md:text-5xl">
              Hungry yet?
            </h3>
            <p className="mt-3 max-w-md text-sm text-white/50">
              Fire up an order in seconds — delivery or click &amp; collect, your call.
            </p>
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

      {/* Order Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-6">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={() => setSelectedItem(null)}
            aria-hidden
          />

          {/* Modal */}
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-label={`${selectedItem.name} order details`}
            className="relative z-10 w-full max-w-2xl overflow-hidden rounded-t-3xl border border-white/10 bg-[#0a0a0a] shadow-2xl sm:rounded-3xl"
          >
            {/* Close */}
            <button
              type="button"
              onClick={() => setSelectedItem(null)}
              className="absolute right-3 top-3 z-20 grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-black/50 text-white/70 backdrop-blur-md transition-colors hover:bg-white/15 hover:text-white"
              aria-label="Close"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
                <line x1="6" y1="6" x2="18" y2="18" />
                <line x1="6" y1="18" x2="18" y2="6" />
              </svg>
            </button>

            {/* Image */}
            <div className="relative aspect-[16/10] w-full overflow-hidden sm:aspect-[2/1]">
              <Image
                src={selectedItem.image}
                alt={selectedItem.name}
                fill
                sizes="(max-width: 640px) 100vw, 672px"
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" aria-hidden />
              {selectedItem.badge && (
                <span
                  className={`absolute left-4 top-4 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md ${
                    selectedItem.badgeVariant === "vegan"
                      ? "border border-brand-red/40 bg-brand-red/15 text-brand-red"
                      : "border border-white/15 bg-black/50 text-white/80"
                  }`}
                >
                  {selectedItem.badge}
                </span>
              )}
            </div>

            {/* Body */}
            <div className="max-h-[60vh] overflow-y-auto px-5 py-6 sm:px-8 md:max-h-[55vh]">
              <div className="flex items-start justify-between gap-4">
                <h3 className="text-2xl font-bold leading-tight text-white md:text-3xl">{selectedItem.name}</h3>
                <span className="shrink-0 text-2xl font-bold text-brand-red">{selectedItem.price}</span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-white/50">{selectedItem.description}</p>

              {/* Sauce selector */}
              <div className="mt-7">
                <span className="mb-3 block text-[11px] font-bold uppercase tracking-widest text-white/40">
                  Choose your sauce
                </span>
                <div className="flex flex-wrap gap-2">
                  {SAUCE_OPTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSauce(s)}
                      className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
                        sauce === s
                          ? "border border-brand-red bg-brand-red text-white"
                          : "border border-white/15 bg-white/[0.03] text-white/60 hover:border-white/30 hover:text-white"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Heat level */}
              <div className="mt-6">
                <span className="mb-3 block text-[11px] font-bold uppercase tracking-widest text-white/40">
                  Heat level
                </span>
                <div className="flex flex-wrap gap-2">
                  {HEAT_LEVELS.map((h, i) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setHeat(h)}
                      className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
                        heat === h
                          ? "border border-brand-red bg-brand-red/15 text-brand-red"
                          : "border border-white/15 bg-white/[0.03] text-white/60 hover:border-white/30 hover:text-white"
                      }`}
                    >
                      <span className="flex gap-0.5" aria-hidden>
                        {Array.from({ length: 5 }).map((_, dot) => (
                          <span
                            key={dot}
                            className={`h-1.5 w-1.5 rounded-full ${dot <= i ? "bg-brand-red" : "bg-white/15"}`}
                          />
                        ))}
                      </span>
                      {h}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div className="mt-7 flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-widest text-white/40">Quantity</span>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="grid h-8 w-8 place-items-center rounded-full border border-white/15 text-white/70 transition-colors hover:border-white/30 hover:text-white disabled:opacity-30"
                    disabled={quantity <= 1}
                    aria-label="Decrease quantity"
                  >
                    <span className="text-lg leading-none">−</span>
                  </button>
                  <span className="min-w-[2ch] text-center text-lg font-bold tabular-nums text-white">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(20, q + 1))}
                    className="grid h-8 w-8 place-items-center rounded-full border border-white/15 text-white/70 transition-colors hover:border-white/30 hover:text-white"
                    aria-label="Increase quantity"
                  >
                    <span className="text-lg leading-none">+</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Footer / Add to cart */}
            <div className="border-t border-white/10 bg-black/40 px-5 py-4 sm:px-8">
              <button
                type="button"
                onClick={handleAddToCart}
                className="group relative w-full overflow-hidden rounded-full bg-brand-red px-6 py-4 text-sm font-bold uppercase tracking-widest text-white shadow-[0_20px_60px_-15px_rgba(220,38,38,0.7)] transition-transform duration-300 hover:scale-[1.02] active:scale-95"
              >
                <span className="relative z-10 flex items-center justify-center gap-3">
                  {added ? (
                    <>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Added to cart
                    </>
                  ) : (
                    <>
                      Add to cart · £{total}
                      <span className="transition-transform group-hover:translate-x-1">→</span>
                    </>
                  )}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}