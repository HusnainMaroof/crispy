"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useDispatch } from "react-redux";
import { addItem } from "@/lib/redux/slices/cartSlice";
import type { MenuItem } from "@/lib/redux/types";
import Image from "next/image";
import Footer from "@/app/components/store/footer";
import DownloadApp from "@/app/components/store/download-app";

type MockItem = MenuItem & { category: string };

const MOCK_ITEMS: MockItem[] = [
  {
    id: "1",
    name: "Crispies Fries Chicken",
    description: "",
    price: "£6.00",
    priceValue: 6,
    image: "/images/aboutimage.jpg",
    category: "Chicken",
  },
  {
    id: "2",
    name: "Crispies Fries Chicken",
    description: "",
    price: "£6.00",
    priceValue: 6,
    image: "/images/aboutimage.jpg",
    category: "Chicken",
  },
  {
    id: "3",
    name: "Crispies Fries Chicken",
    description: "",
    price: "£6.00",
    priceValue: 6,
    image: "/images/aboutimage.jpg",
    category: "Chicken",
  },
  {
    id: "4",
    name: "Crispies Fries Chicken",
    description: "",
    price: "£6.00",
    priceValue: 6,
    image: "/images/aboutimage.jpg",
    category: "Chicken",
  },
  {
    id: "5",
    name: "Classic Smash Burger",
    description: "",
    price: "£8.50",
    priceValue: 8.5,
    image: "/images/aboutimage.jpg",
    category: "Burger",
  },
  {
    id: "6",
    name: "Classic Smash Burger",
    description: "",
    price: "£8.50",
    priceValue: 8.5,
    image: "/images/aboutimage.jpg",
    category: "Burger",
  },
  {
    id: "7",
    name: "Classic Smash Burger",
    description: "",
    price: "£8.50",
    priceValue: 8.5,
    image: "/images/aboutimage.jpg",
    category: "Burger",
  },
  {
    id: "8",
    name: "Classic Smash Burger",
    description: "",
    price: "£8.50",
    priceValue: 8.5,
    image: "/images/aboutimage.jpg",
    category: "Burger",
  },
  {
    id: "9",
    name: "Chicken Wrap",
    description: "",
    price: "£7.00",
    priceValue: 7,
    image: "/images/aboutimage.jpg",
    category: "Wraps",
  },
  {
    id: "10",
    name: "Chicken Wrap",
    description: "",
    price: "£7.00",
    priceValue: 7,
    image: "/images/aboutimage.jpg",
    category: "Wraps",
  },
  {
    id: "11",
    name: "Chicken Wrap",
    description: "",
    price: "£7.00",
    priceValue: 7,
    image: "/images/aboutimage.jpg",
    category: "Wraps",
  },
  {
    id: "12",
    name: "Chicken Wrap",
    description: "",
    price: "£7.00",
    priceValue: 7,
    image: "/images/aboutimage.jpg",
    category: "Wraps",
  },
  {
    id: "13",
    name: "Loaded Fries",
    description: "",
    price: "£5.50",
    priceValue: 5.5,
    image: "/images/aboutimage.jpg",
    category: "Sides",
  },
  {
    id: "14",
    name: "Loaded Fries",
    description: "",
    price: "£5.50",
    priceValue: 5.5,
    image: "/images/aboutimage.jpg",
    category: "Sides",
  },
  {
    id: "15",
    name: "Loaded Fries",
    description: "",
    price: "£5.50",
    priceValue: 5.5,
    image: "/images/aboutimage.jpg",
    category: "Sides",
  },
  {
    id: "16",
    name: "Loaded Fries",
    description: "",
    price: "£5.50",
    priceValue: 5.5,
    image: "/images/aboutimage.jpg",
    category: "Sides",
  },
  {
    id: "17",
    name: "Cola Drink",
    description: "",
    price: "£2.50",
    priceValue: 2.5,
    image: "/images/aboutimage.jpg",
    category: "Drinks",
  },
  {
    id: "18",
    name: "Cola Drink",
    description: "",
    price: "£2.50",
    priceValue: 2.5,
    image: "/images/aboutimage.jpg",
    category: "Drinks",
  },
  {
    id: "19",
    name: "Cola Drink",
    description: "",
    price: "£2.50",
    priceValue: 2.5,
    image: "/images/aboutimage.jpg",
    category: "Drinks",
  },
  {
    id: "20",
    name: "Cola Drink",
    description: "",
    price: "£2.50",
    priceValue: 2.5,
    image: "/images/aboutimage.jpg",
    category: "Drinks",
  },
  {
    id: "21",
    name: "Chocolate Brownie",
    description: "",
    price: "£4.00",
    priceValue: 4,
    image: "/images/aboutimage.jpg",
    category: "Desserts",
  },
  {
    id: "22",
    name: "Chocolate Brownie",
    description: "",
    price: "£4.00",
    priceValue: 4,
    image: "/images/aboutimage.jpg",
    category: "Desserts",
  },
  {
    id: "23",
    name: "Chocolate Brownie",
    description: "",
    price: "£4.00",
    priceValue: 4,
    image: "/images/aboutimage.jpg",
    category: "Desserts",
  },
  {
    id: "24",
    name: "Chocolate Brownie",
    description: "",
    price: "£4.00",
    priceValue: 4,
    image: "/images/aboutimage.jpg",
    category: "Desserts",
  },
];

const CATEGORY_NAMES = [
  "All",
  "Chicken",
  "Burger",
  "Wraps",
  "Sides",
  "Drinks",
  "Desserts",
];

const DIETARY_OPTIONS = ["All", "Halal", "Vegan", "Vegetarian"];
const SORT_OPTIONS = [
  { value: "name-asc", label: "Name A-Z" },
  { value: "name-desc", label: "Name Z-A" },
  { value: "price-asc", label: "Price Low-High" },
  { value: "price-desc", label: "Price High-Low" },
];

function AddIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="59"
      height="59"
      viewBox="0 0 59 59"
      fill="none"
    >
      <rect
        x="0.5"
        y="0.5"
        width="58"
        height="58"
        rx="8.5"
        fill="#F7F8F8"
        stroke="#E2E2E2"
      />
      <path
        d="M17 29H29M29 29H42M29 29V17M29 29L29 42"
        stroke="black"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function MenuPage() {
  const dispatch = useDispatch();
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [dietary, setDietary] = useState("All");
  const [sort, setSort] = useState("name-asc");

  const tabContainerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const underlineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = tabContainerRef.current;
    const underline = underlineRef.current;
    const activeIndex = CATEGORY_NAMES.indexOf(activeCategory);
    const activeTab = tabRefs.current[activeIndex];

    if (!container || !underline || !activeTab) return;

    const containerRect = container.getBoundingClientRect();
    const tabRect = activeTab.getBoundingClientRect();

    const offset = tabRect.left - containerRect.left;
    const width = tabRect.width;

    underline.style.width = `${width}px`;
    underline.style.transform = `translateX(${offset}px)`;
  }, [activeCategory]);

  const filteredItems = useMemo(() => {
    let items = MOCK_ITEMS;

    if (activeCategory !== "All") {
      items = items.filter((item) => item.category === activeCategory);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter((item) => item.name.toLowerCase().includes(q));
    }

    if (dietary !== "All") {
      items = items.filter(
        (item) =>
          item.badge?.toLowerCase() === dietary.toLowerCase() ||
          item.badgeVariant?.toLowerCase() === dietary.toLowerCase(),
      );
    }

    const sorted = [...items];
    switch (sort) {
      case "name-asc":
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name-desc":
        sorted.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "price-asc":
        sorted.sort((a, b) => a.priceValue - b.priceValue);
        break;
      case "price-desc":
        sorted.sort((a, b) => b.priceValue - a.priceValue);
        break;
    }

    return sorted;
  }, [activeCategory, search, dietary, sort]);

  const handleAddToCart = (item: MockItem) => {
    dispatch(addItem({ id: item.id, name: item.name, price: item.priceValue }));
  };

  return (
    <>
      <section className="w-full bg-white ">
        {/* Header */}
        <div className="py-10  px-6  sm:px-10 md:px-12 xl:px-25">
          <div className="flex items-center justify-between gap-8 ">
            <div>
              <h1 className="m-0 leading-[1] tracking-[0.54px] capitalize text-nowrap">
                <span className="font-[family-name:var(--font-korolev),Korolev,sans-serif] text-[clamp(60px,12vw,150px)] font-black text-black">
                  Our{" "}
                </span>
                <span className="font-[family-name:var(--font-korolev),Korolev,sans-serif] text-[clamp(60px,12vw,150px)] font-black text-[#FF0931]">
                  Menu
                </span>
              </h1>
              <p className="mt-4 max-w-[500px] font-[family-name:var(--font-inter),Inter,sans-serif] text-[clamp(18px,2.5vw,30px)] font-normal leading-[1] tracking-[0.54px] text-black capitalize">
                Explore our full menu and find <br /> your next favorite.
              </p>
            </div>
            <div className=" shrink-0 sm:block">
              <img
                src="/images/orderOnimage.png"
                alt="Crispies"
                className="  w-[320px] sm:w-[480px]  xl:h-auto xl:w-auto ml-auto  object-cover "
              />
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="bg-[#FAFAFA] py-4 px-4 sm:py-6 sm:px-6 md:px-12 xl:px-25">
          <div
            ref={tabContainerRef}
            className="relative flex gap-4 overflow-x-auto w-full justify-between sm:w-[85%] sm:gap-0 2xl:w-[90%]"
          >
            {CATEGORY_NAMES.map((cat, i) => (
              <button
                key={cat}
                type="button"
                ref={(el) => { tabRefs.current[i] = el; }}
                onClick={() => setActiveCategory(cat)}
                className={`whitespace-nowrap cursor-pointer pb-3 pt-4 font-[family-name:var(--font-inter),Inter,sans-serif] text-sm font-medium capitalize leading-[1] tracking-[0.54px] transition-colors duration-200 sm:pb-4 sm:pt-5 sm:text-[clamp(18px,2.5vw,30px)] ${
                  activeCategory === cat
                    ? "text-[#FF0931]"
                    : "text-black hover:text-[#FF0931]"
                }`}
              >
                {cat}
              </button>
            ))}
            <div
              ref={underlineRef}
              className="absolute bottom-0 left-0 h-[3px] bg-[#FF0931] transition-[transform,width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
            />
          </div>
        </div>

        {/* Filter Bar */}
        <div className="py-4 px-4 sm:py-6 sm:px-6 md:px-12 xl:px-25">
          <div className="flex flex-col gap-3 md:flex-row sm:items-stretch sm:gap-10">
            {/* Search */}
            <div className="relative w-full  md:w-[858px]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="36"
                height="35"
                viewBox="0 0 36 35"
                fill="none"
                className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 sm:h-6 sm:w-6 md:left-5 md:h-[35px] md:w-[36px]"
              >
                <path
                  d="M33.5 32L25.5 24M28.5 15.5C28.5 22.6797 22.6797 28.5 15.5 28.5C8.3203 28.5 2.5 22.6797 2.5 15.5C2.5 8.3203 8.3203 2.5 15.5 2.5C22.6797 2.5 28.5 8.3203 28.5 15.5Z"
                  stroke="black"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
              </svg>
              <input
                type="text"
                placeholder="Search For Item..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-[6px] border border-black bg-white pl-12 pr-4 font-[family-name:var(--font-inter),Inter,sans-serif] text-sm font-light text-black outline-none capitalize tracking-[0.54px] transition-colors focus:border-[#FF0931] placeholder:font-light placeholder:capitalize placeholder:text-black sm:pl-[70px] sm:text-[23px] sm:pr-5"
                style={{ height: "clamp(48px, 10vw, 85px)" }}
              />
            </div>

            {/* Dietary Preference */}
            <div className="relative w-full md:w-[419px]">
              <select
                value={dietary}
                onChange={(e) => setDietary(e.target.value)}
                className="w-full appearance-none rounded-[6px] border border-black bg-white pl-4 pr-10 font-[family-name:var(--font-inter),Inter,sans-serif] text-sm font-light text-black outline-none capitalize tracking-[0.54px] transition-colors focus:border-[#FF0931] sm:pl-5 sm:pr-14 sm:text-[23px]"
                style={{ height: "clamp(48px, 10vw, 85px)" }}
              >
                {DIETARY_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt === "All" ? "Dietary Preference" : opt}
                  </option>
                ))}
              </select>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="23"
                height="14"
                viewBox="0 0 23 14"
                fill="none"
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 h-3 w-4 sm:right-5 sm:h-3.5 sm:w-[23px]"
              >
                <path
                  d="M2.5 2.5L11.2504 11.3603C11.4363 11.5484 11.7347 11.5456 11.9206 11.3575L20.5 2.67034"
                  stroke="black"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            {/* Sort By */}
            <div className="relative w-full md:w-[419px]">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="w-full appearance-none rounded-[6px] border border-black bg-white pl-4 pr-10 font-[family-name:var(--font-inter),Inter,sans-serif] text-sm font-light text-black outline-none capitalize tracking-[0.54px] transition-colors focus:border-[#FF0931] sm:pl-5 sm:pr-14 sm:text-[23px]"
                style={{ height: "clamp(48px, 10vw, 85px)" }}
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="23"
                height="14"
                viewBox="0 0 23 14"
                fill="none"
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 h-3 w-4 sm:right-5 sm:h-3.5 sm:w-[23px]"
              >
                <path
                  d="M2.5 2.5L11.2504 11.3603C11.4363 11.5484 11.7347 11.5456 11.9206 11.3575L20.5 2.67034"
                  stroke="black"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Menu Grid */}
        <div className=" pb-10 px-6  sm:px-10 md:px-12 xl:px-25">
          {filteredItems.length === 0 && (
            <div className="py-20 text-center font-[family-name:var(--font-inter),Inter,sans-serif] text-[14px] text-[#999]">
              No items found. Try a different search or category.
            </div>
          )}

          {filteredItems.length > 0 && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4 ">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="group overflow-hidden rounded-2xl border border-[#E5E5E5] bg-white transition-shadow hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)]"
                >
                  {/* Image */}
                  <div className="relative  overflow-hidden bg-[#F5F5F5] ">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className=" w-full h-[264px] object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[#CCC]">
                        <svg
                          className="h-12 w-12"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-col   px-3 sm:px-4 py-5">
                    <h3 className="m-0 truncate font-[family-name:var(--font-inter),Inter,sans-serif] text-[16px] font-medium leading-[1.2] text-black sm:text-[20px] capitalize">
                      {item.name}
                    </h3>
                    <div className="min-w-0 flex justify-between items-center gap-2 pt-2">
                      <p className="mt-1 m-0 font-[family-name:var(--font-korolev),Korolev,sans-serif] text-[20px] font-black leading-[1] tracking-[0.54px] text-black sm:text-[25px] capitalize">
                        {item.price}
                      </p>
                      <button
                        type="button"
                        onClick={() => handleAddToCart(item)}
                        className="flex cursor-pointer h-[59px] w-[59px] shrink-0 items-center justify-center rounded-[8.5px] border border-[#E2E2E2] bg-[#F7F8F8] transition-colors hover:bg-[#FF0931] hover:border-[#FF0931] group/btn"
                        aria-label={`Add ${item.name} to cart`}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="59"
                          height="59"
                          viewBox="0 0 59 59"
                          fill="none"
                        >
                          <rect
                            x="0.5"
                            y="0.5"
                            width="58"
                            height="58"
                            rx="8.5"
                            fill="#F7F8F8"
                            stroke="#E2E2E2"
                          />
                          <path
                            d="M17 29H29M29 29H42M29 29V17M29 29L29 42"
                            stroke="black"
                            strokeWidth="5"
                            strokeLinecap="round"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Download App Banner */}
        <div className="px-6 pb-10 sm:px-10 md:px-12 xl:px-25">
          <DownloadApp />
        </div>
      </section>

      <Footer />
    </>
  );
}
