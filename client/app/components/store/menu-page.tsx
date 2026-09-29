"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addItem } from "@/lib/redux/slices/cartSlice";
import { fetchFullMenu } from "@/lib/redux/slices/menuSlice";
import { useUI } from "@/lib/context/ui-context";
import type { AppDispatch, RootState } from "@/lib/redux/store";
import type { MenuItem } from "@/lib/redux/types";
import Footer from "@/app/components/store/footer";
import DownloadApp from "@/app/components/store/download-app";
import DeliveryOverlay from "@/app/components/store/delivery-overlay";
import { useStoreOrdering } from "@/lib/use-store-ordering";
import { localizedName, localizedText } from "@/lib/i18n";
import { useLocale } from "@/lib/i18n/locale-context";
import { dietaryTags } from "@/lib/dietary";

type MenuCard = MenuItem & { category: string };

const DIETARY_OPTIONS = ["All", "Halal", "Vegan", "Vegetarian"];
const SORT_OPTIONS = [
  { value: "name-asc", label: "Name A-Z" },
  { value: "name-desc", label: "Name Z-A" },
  { value: "price-asc", label: "Price Low-High" },
  { value: "price-desc", label: "Price High-Low" },
];

export default function MenuPage() {
  const dispatch = useDispatch<AppDispatch>();
  const menu = useSelector((state: RootState) => state.menu);
  const cart = useSelector((state: RootState) => state.cart);
  const { toggleCart } = useUI();
  const { resolveOrdering } = useStoreOrdering();
  const { locale, t } = useLocale();
  const categoryLabel = (cat: string) =>
    cat === "All" ? t("menu.dietary.all") : localizedName(locale, cat, menu.categories.find((category) => category.title === cat)?.titleAr);
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [dietary, setDietary] = useState("All");
  const [sort, setSort] = useState("name-asc");

  const tabContainerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const underlineRef = useRef<HTMLDivElement>(null);

  const [menuFetched, setMenuFetched] = useState(false);
  const [collectProduct, setCollectProduct] = useState<MenuCard | null>(null);

  useEffect(() => {
    dispatch(fetchFullMenu()).finally(() => setMenuFetched(true));
  }, [dispatch]);

  const categoryNames = useMemo(
    () => ["All", ...menu.categories.map((category) => category.title)],
    [menu.categories],
  );
  const effectiveCategory = categoryNames.includes(activeCategory) ? activeCategory : "All";

  const menuItems = useMemo<MenuCard[]>(
    () =>
      menu.categories.flatMap((category) =>
        category.items.map((item) => ({ ...item, category: category.title })),
      ),
    [menu.categories],
  );

  useEffect(() => {
    const container = tabContainerRef.current;
    const underline = underlineRef.current;
    const activeIndex = categoryNames.indexOf(effectiveCategory);
    const activeTab = tabRefs.current[activeIndex];

    if (!container || !underline || !activeTab) return;

    const containerRect = container.getBoundingClientRect();
    const tabRect = activeTab.getBoundingClientRect();

    const offset = tabRect.left - containerRect.left;
    const width = tabRect.width;

    underline.style.width = `${width}px`;
    underline.style.transform = `translateX(${offset}px)`;
  }, [effectiveCategory, categoryNames]);

  const filteredItems = useMemo(() => {
    let items = menuItems;

    if (effectiveCategory !== "All") {
      items = items.filter((item) => item.category === effectiveCategory);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(
        (item) => item.name.toLowerCase().includes(q) || (item.nameAr ?? "").toLowerCase().includes(q),
      );
    }

    if (dietary !== "All") {
      items = items.filter((item) =>
        dietaryTags(item.badge, item.badgeVariant).some((tag) => tag.toLowerCase() === dietary.toLowerCase()),
      );
    }

    const sorted = [...items];
    switch (sort) {
      case "name-asc":
        sorted.sort((a, b) => localizedName(locale, a.name, a.nameAr).localeCompare(localizedName(locale, b.name, b.nameAr)));
        break;
      case "name-desc":
        sorted.sort((a, b) => localizedName(locale, b.name, b.nameAr).localeCompare(localizedName(locale, a.name, a.nameAr)));
        break;
      case "price-asc":
        sorted.sort((a, b) => a.priceValue - b.priceValue);
        break;
      case "price-desc":
        sorted.sort((a, b) => b.priceValue - a.priceValue);
        break;
    }

    return sorted;
  }, [effectiveCategory, search, dietary, sort, menuItems]);

  const handleAddToCart = async (item: MenuCard) => {
    const resolved = await resolveOrdering();
    // Redirect system: no cart. The Click & Collect popup takes the order
    // to the product's own link, the chosen platform, or the external order URL.
    if (resolved.mode === "redirect") {
      setCollectProduct(item);
      return;
    }
    dispatch(addItem({ id: item.id, kind: "product", name: localizedName(locale, item.name, item.nameAr), price: item.priceValue, locationId: cart.locationId }));
    toggleCart();
  };

  return (
    <>
      <section className="w-full bg-white ">
        {/* Header */}

        <div
          className="relative h-[300px] md:h-[350px] 2xl:h-[600px]  w-full bg-cover bg-center"
          style={{ backgroundImage: "url('/images/menu%20hero%20section.avif')" }}
        >

          <div className="absolute flex  items-center justify-center gap-4  bg-[#FF0931]  rounded-b-xl md:rounded-b-2xl   left-[35%] -translate-x-1/2  px-4 lg:px-6 py-3  md:py-4 lg:py-5   2xl:px-8 2xl:py-6">
            <h1 className=" leading-[1] tracking-[0.54px] capitalize text-nowrap">
              <span className="font-[family-name:var(--font-korolev),Korolev,sans-serif]   text-[30px]  md:text-[45px] lg:text-[50px]  2xl:text-[60px] font-black text-white">
                {t("menu.hero.1")}{" "}
              </span>
              <span className="font-[family-name:var(--font-korolev),Korolev,sans-serif]   text-[30px]  md:text-[45px] lg:text-[50px]  2xl:text-[60px] font-black text-black">
                {t("menu.hero.2")}
              </span>
            </h1>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="bg-[#FAFAFA] px-4 py-3 sm:px-6 md:px-12 xl:px-25">
          <div
            ref={tabContainerRef}
            className="relative flex gap-2 overflow-x-auto"
          >
            {categoryNames.map((cat, i) => (
              <button
                key={cat}
                type="button"
                ref={(el) => {
                  tabRefs.current[i] = el;
                }}
                onClick={() => setActiveCategory(cat)}
                className={`cursor-pointer whitespace-nowrap rounded-full px-4 py-2 font-[family-name:var(--font-inter),Inter,sans-serif] text-sm font-medium transition-colors duration-200 ${
                  effectiveCategory === cat
                    ? "bg-[#FF0931] text-white"
                    : "bg-white text-black hover:text-[#FF0931]"
                }`}
              >
                {categoryLabel(cat)}
              </button>
            ))}
            <div ref={underlineRef} className="hidden" />
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
                placeholder={t("menu.search")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-12 w-full rounded-xl border border-black/15 bg-white pl-12 pr-4 font-[family-name:var(--font-inter),Inter,sans-serif] text-sm text-black outline-none transition-colors focus:border-[#FF0931] placeholder:text-black/40 sm:pl-14"
              />
            </div>

            {/* Dietary Preference */}
            <div className="relative w-full md:w-[419px]">
              <select
                value={dietary}
                onChange={(e) => setDietary(e.target.value)}
                className="h-12 w-full appearance-none rounded-xl border border-black/15 bg-white pl-4 pr-10 font-[family-name:var(--font-inter),Inter,sans-serif] text-sm text-black outline-none transition-colors focus:border-[#FF0931]"
              >
                {DIETARY_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt === "All" ? t("menu.dietary.label") : t(`menu.dietary.${opt.toLowerCase()}`)}
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
                className="h-12 w-full appearance-none rounded-xl border border-black/15 bg-white pl-4 pr-10 font-[family-name:var(--font-inter),Inter,sans-serif] text-sm text-black outline-none transition-colors focus:border-[#FF0931]"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {t(`menu.sort.${opt.value}`)}
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
          {(!menuFetched || menu.loading || filteredItems.length === 0) && (
            <div className="py-20 text-center font-[family-name:var(--font-inter),Inter,sans-serif] text-[14px] text-[#999]">
              {!menuFetched || menu.loading
                ? t("menu.loading")
                : menu.error
                  ? t("menu.error")
                  : t("menu.empty")}
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
                        alt={localizedName(locale, item.name, item.nameAr)}
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
                    <h3 className="m-0 truncate font-[family-name:var(--font-inter),Inter,sans-serif] text-[16px] font-medium leading-[1.2] text-black sm:text-[20px]">
                      {localizedName(locale, item.name, item.nameAr)}
                    </h3>
                    {(item.description || item.descriptionAr) && (
                      <p className="mt-1 line-clamp-2 font-[family-name:var(--font-inter),Inter,sans-serif] text-[12px] leading-snug text-black/55 sm:text-[13px]">
                        {localizedName(locale, item.description, item.descriptionAr)}
                      </p>
                    )}
                    {(item.badge ?? "").trim() && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {dietaryTags(item.badge, item.badgeVariant).map((tag) => (
                          <span key={tag} className="rounded-full bg-[#F7F8F8] px-2 py-0.5 text-[11px] text-black/70">
                            {t(`menu.dietary.${tag.toLowerCase()}`)}
                          </span>
                        ))}
                        {(item.badge ?? "").split(",").map((tag) => tag.trim()).filter((tag) => tag && !["halal", "vegan", "vegetarian"].includes(tag.toLowerCase())).map((tag) => (
                          <span key={tag} className="rounded-full bg-[#F7F8F8] px-2 py-0.5 text-[11px] text-black/70">
                            {localizedText(locale, tag)}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="min-w-0 flex justify-between items-center gap-2 pt-2">
                      <p className="mt-1 m-0 font-[family-name:var(--font-korolev),Korolev,sans-serif] text-[20px] font-black leading-[1] tracking-[0.54px] text-black sm:text-[25px] capitalize">
                        {item.price}
                      </p>
                      <button
                        type="button"
                        onClick={() => void handleAddToCart(item)}
                        className="flex cursor-pointer h-[59px] w-[59px] shrink-0 items-center justify-center rounded-[8.5px] border border-[#E2E2E2] bg-[#F7F8F8] transition-colors hover:bg-[#FF0931] hover:border-[#FF0931] group/btn"
                        aria-label={t("menu.addToCart", { name: localizedName(locale, item.name, item.nameAr) })}
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

      {collectProduct && (
        <DeliveryOverlay
          onClose={() => setCollectProduct(null)}
          product={{
            name: localizedName(locale, collectProduct.name, collectProduct.nameAr),
            image: collectProduct.image,
            redirectUrl: collectProduct.redirectUrl,
          }}
        />
      )}

      <Footer />
    </>
  );
}
