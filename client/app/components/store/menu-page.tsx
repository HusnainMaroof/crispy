"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addItem, clearCartBranch } from "@/lib/redux/slices/cartSlice";
import { fetchDeals, fetchFullMenu } from "@/lib/redux/slices/menuSlice";
import { useUI } from "@/lib/context/ui-context";
import type { AppDispatch, RootState } from "@/lib/redux/store";
import type { MenuItem } from "@/lib/redux/types";
import Footer from "@/app/components/store/footer";
import DownloadApp from "@/app/components/store/download-app";
import DeliveryOverlay from "@/app/components/store/delivery-overlay";
import { MenuGridSkeleton, MenuTabsSkeleton } from "@/app/components/store/menu-skeleton";
import { useStoreOrdering } from "@/lib/use-store-ordering";
import { useStoreLocations } from "@/lib/use-store-locations";
import { useBranchSelection } from "@/lib/branch-selection";
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

/**
 * One box for every inline icon on this page.
 *
 * The magnifier used to grow 20px to 36px across three breakpoints, so it was a
 * third bigger on a laptop than on a phone, and each dropdown chevron was drawn
 * on a 23x14 viewBox but given an h-3 w-4 box, which squashed it. Both now sit
 * on a 24x24 grid at a fixed size, and the chevron is defined once instead of
 * being pasted three times.
 */
const ICON = "h-5 w-5 shrink-0";

/** Shared by all three filter dropdowns so they cannot drift apart again. */
const SELECT_CLS =
  "h-12 w-full appearance-none rounded-xl border border-black/15 bg-white ps-4 pe-11 font-[family-name:var(--font-inter),Inter,sans-serif] text-sm text-black outline-none transition-colors focus:border-[#FF0931] disabled:cursor-not-allowed disabled:opacity-60";

function SearchIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={`${ICON} ${className}`}
    >
      <path
        d="M21 21l-4.6-4.6M17 10.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ChevronDown({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={`${ICON} ${className}`}
    >
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function MenuPage() {
  const dispatch = useDispatch<AppDispatch>();
  const menu = useSelector((state: RootState) => state.menu);
  const cart = useSelector((state: RootState) => state.cart);
  const { toggleCart } = useUI();
  const { resolveOrdering, isRedirect } = useStoreOrdering();
  const { locations: branches, loading: branchesLoading } = useStoreLocations();
  const { selectBranch } = useBranchSelection();
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

  const [collectProduct, setCollectProduct] = useState<MenuCard | null>(null);

  // Only fetch while nothing has been loaded yet. Redux lives for the whole
  // session, so coming back to /menu from another page no longer refires the
  // request or flashes the grid. A branch change still refetches, because
  // selectBranch dispatches fetchFullMenu with the new id. A failed load is
  // not retried here: refiring on `failed` looped the request forever.
  useEffect(() => {
    if (menu.status !== "idle") return;
    void dispatch(fetchFullMenu(cart.locationId ?? undefined));
  }, [dispatch, menu.status, cart.locationId]);

  const isFirstLoad = menu.status !== "ready" && menu.status !== "failed";

  // The cart's location is the single source of truth for the current branch, so
  // the dropdown is a controlled read of it. An empty id means "All branches",
  // which is the default: fetchFullMenu is called with no location_id and the
  // whole menu across every branch comes back. Picking a branch goes through
  // selectBranch, which is the same path the delivery popup uses — it sets the
  // cookie, refetches the menu and deals for that branch, and prompts before
  // clearing a cart that belongs somewhere else.
  const branchValue = cart.locationId ?? "";
  const savedBranch = branches.find((item) => item.id === branchValue);
  const handleBranchChange = (nextId: string) => {
    // "" is the All branches option. Going back to it drops the branch, which
    // empties the cart because its lines were picked against a branch.
    if (nextId === "") {
      if (cart.locationId === null) return;
      dispatch(clearCartBranch());
      void dispatch(fetchFullMenu(undefined));
      void dispatch(fetchDeals(undefined));
      return;
    }
    if (nextId === cart.locationId) return;
    const branch = branches.find((item) => item.id === nextId);
    if (!branch) return;
    selectBranch(nextId, localizedName(locale, branch.name));
  };

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

  /* The measured offset is relative to the container's visible left edge, but the
     underline is a child of the scrolling content, so scrollLeft has to be added
     back or the bar drifts sideways once the row has been scrolled. */
  useEffect(() => {
    const container = tabContainerRef.current;
    const underline = underlineRef.current;
    const activeIndex = categoryNames.indexOf(effectiveCategory);
    const activeTab = tabRefs.current[activeIndex];

    if (!container || !underline || !activeTab) return;

    const containerRect = container.getBoundingClientRect();
    const tabRect = activeTab.getBoundingClientRect();

    const offset = tabRect.left - containerRect.left + container.scrollLeft;
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
    // `locale` sorts on the translated name, so the order has to be recomputed
    // when the language changes, not just when the data does.
  }, [effectiveCategory, search, dietary, sort, menuItems, locale]);

  const handleAddToCart = async (item: MenuCard) => {
    const resolved = await resolveOrdering();
    // Redirect system: no cart. The Get It Delivered popup takes the order to
    // the product's own link, the chosen platform, or the external order URL.
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

          <div className="absolute flex  items-center justify-center gap-4  bg-[#FF0931]  rounded-b-xl md:rounded-b-2xl   start-[35%] -translate-x-1/2 rtl:translate-x-1/2  px-4 lg:px-6 py-3  md:py-4 lg:py-5   2xl:px-8 2xl:py-6">
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
          {isFirstLoad ? (
            <MenuTabsSkeleton />
          ) : (
            <div
              ref={tabContainerRef}
              className="relative flex gap-6 overflow-x-auto"
            >
              {categoryNames.map((cat, i) => {
                const isActive = effectiveCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    ref={(el) => {
                      tabRefs.current[i] = el;
                    }}
                    onClick={() => setActiveCategory(cat)}
                    aria-pressed={isActive}
                    className={`shrink-0 cursor-pointer whitespace-nowrap pb-3 pt-1 font-[family-name:var(--font-inter),Inter,sans-serif] text-sm font-medium transition-colors duration-200 sm:text-base ${
                      isActive ? "text-[#FF0931]" : "text-black/55 hover:text-black"
                    }`}
                  >
                    {categoryLabel(cat)}
                  </button>
                );
              })}
              {/* The underline was measured by the effect above all along but
                  sat on a `hidden` element, so the indicator never appeared.
                  Sliding tab labels now carry the active state themselves. */}
              <div
                ref={underlineRef}
                aria-hidden="true"
                className="absolute bottom-0 start-0 h-[2px] rounded-full bg-[#FF0931] transition-[width,transform] duration-300 ease-out"
              />
            </div>
          )}
        </div>

        {/* Filter Bar */}
        <div className="py-4 px-4 sm:py-6 sm:px-6 md:px-12 xl:px-25">
          <div className="flex flex-col gap-3 md:flex-row md:flex-wrap sm:items-stretch sm:gap-10">
            {/* Search. ps-11 is 16px of offset + a 24px icon + a 4px gap, so the
                glyph no longer butts straight into the typed text. */}
            <div className="relative w-full max-w-full md:w-[858px]">
              <SearchIcon className="absolute start-4 top-1/2 -translate-y-1/2 text-black" />
              <input
                type="text"
                aria-label={t("menu.searchLabel")}
                placeholder={t("menu.search")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-12 w-full rounded-xl border border-black/15 bg-white ps-11 pe-4 font-[family-name:var(--font-inter),Inter,sans-serif] text-sm text-black outline-none transition-colors focus:border-[#FF0931] placeholder:text-black/40"
              />
            </div>

            {/* Dietary Preference */}
            <div className="relative w-full max-w-full md:w-[419px]">
              <select
                value={dietary}
                aria-label={t("menu.dietary.label")}
                onChange={(e) => setDietary(e.target.value)}
                className={SELECT_CLS}
              >
                {DIETARY_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt === "All" ? t("menu.dietary.label") : t(`menu.dietary.${opt.toLowerCase()}`)}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute end-4 top-1/2 -translate-y-1/2 text-black" />
            </div>

            {/* Sort By */}
            <div className="relative w-full max-w-full md:w-[419px]">
              <select
                value={sort}
                aria-label={t("menu.sortLabel")}
                onChange={(e) => setSort(e.target.value)}
                className={SELECT_CLS}
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {t(`menu.sort.${opt.value}`)}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute end-4 top-1/2 -translate-y-1/2 text-black" />
            </div>

            {/* Branch. While the branch list is still in flight the select is
                disabled, so there is no window where it looks empty but is live. */}
            <div className="relative w-full max-w-full md:w-[419px]">
              <select
                value={branchValue}
                disabled={branchesLoading}
                onChange={(e) => handleBranchChange(e.target.value)}
                aria-label={t("menu.branch")}
                className={SELECT_CLS}
              >
                {/* Default view: the whole menu across every branch. Rendered first and
                    always, so "" is a real choice rather than a blank state. */}
                <option value="">{t("menu.allBranches")}</option>
                {/* One option is always rendered that matches the current value,
                    otherwise the browser falls back to showing nothing at all
                    when the saved branch id is not in the list yet. Only needed
                    for a real branch id, since "" already has the row above. */}
                {branchValue !== "" && !savedBranch && (
                  <option value={branchValue}>
                    {branchesLoading ? t("menu.branchesLoading") : t("menu.branchPlaceholder")}
                  </option>
                )}
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {localizedText(locale, branch.name)}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute end-4 top-1/2 -translate-y-1/2 text-black" />
            </div>
          </div>
        </div>

        {/* Menu Grid */}
        <div className=" pb-10 px-6  sm:px-10 md:px-12 xl:px-25">
          {isFirstLoad && <MenuGridSkeleton />}

          {!isFirstLoad && menu.status === "failed" && (
            <div className="py-20 text-center font-[family-name:var(--font-inter),Inter,sans-serif] text-[14px] text-[#999]">
              <p className="m-0">{t("menu.error")}</p>
              <button
                type="button"
                onClick={() => void dispatch(fetchFullMenu(cart.locationId ?? undefined))}
                className="mt-4 cursor-pointer rounded-full border border-[#E5E5E5] bg-white px-6 py-2.5 text-sm font-medium text-black transition-colors hover:border-[#FF0931] hover:text-[#FF0931]"
              >
                {t("menu.retry")}
              </button>
            </div>
          )}

          {!isFirstLoad && menu.status === "ready" && filteredItems.length === 0 && (
            <div className="py-20 text-center font-[family-name:var(--font-inter),Inter,sans-serif] text-[14px] text-[#999]">
              {menuItems.length === 0 ? t("menu.emptyCatalogue") : t("menu.empty")}
            </div>
          )}

          {!isFirstLoad && filteredItems.length > 0 && (
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
                        className=" w-full h-[180px] sm:h-[264px] lg:h-[240px] object-cover transition-transform duration-300 group-hover:scale-105"
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
                        className="group/btn flex h-[59px] w-[59px] shrink-0 cursor-pointer items-center justify-center rounded-[8.5px] border border-[#E2E2E2] bg-[#F7F8F8] text-black transition-colors hover:border-[#FF0931] hover:bg-[#FF0931] hover:text-white"
                        aria-label={t(isRedirect ? "menu.orderItem" : "menu.addToCart", { name: localizedName(locale, item.name, item.nameAr) })}
                      >
                        {/* The plus used to be wrapped in its own 58x58 <rect>
                            that repeated the button's border and carried a fixed
                            #F7F8F8 fill, so hovering turned the button red while
                            a grey square with a doubled 1px border sat on top of
                            it. The button itself already draws both. */}
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          aria-hidden="true"
                          className="h-5 w-5 shrink-0"
                        >
                          <path
                            d="M12 5v14M5 12h14"
                            stroke="currentColor"
                            strokeWidth="2.5"
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
            redirects: collectProduct.redirects,
          }}
        />
      )}

      <Footer />
    </>
  );
}
