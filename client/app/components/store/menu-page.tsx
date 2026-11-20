"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useLenis } from "@/app/components/providers/smooth-scroll";
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
import { titleCase } from "@/lib/utils";

type MenuCard = MenuItem & { category: string };

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

/** Old items were saved with "/placeholder.jpg", a file that never existed. */
function usableImage(src: string | null | undefined): boolean {
  const value = src?.trim() ?? "";
  return value !== "" && value !== "/placeholder.jpg";
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
    cat === "All" ? t("menu.dietary.all") : localizedName(locale, cat, menu.categories.find((category) => titleCase(category.title) === cat)?.titleAr);
  const [activeCategory, setActiveCategory] = useState("All");
  const lenis = useLenis();
  // The sidebar and grid row, and the sidebar itself, for the scroll fixes below.
  const layoutRef = useRef<HTMLDivElement>(null);
  const asideRef = useRef<HTMLElement>(null);

  // The navbar height changes with the screen size, so the sidebar is pinned
  // just under the measured navbar instead of a fixed offset.
  useEffect(() => {
    const header = document.querySelector("header");
    const aside = asideRef.current;
    if (!header || !aside) return;
    const place = () => aside.style.setProperty("--menu-sidebar-top", `${Math.round(header.getBoundingClientRect().height) + 24}px`);
    place();
    const observer = new ResizeObserver(place);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  /**
   * Switching category while scrolled far down left the reader looking at the
   * app banner under a short list. Bring the top of the list back into view.
   */
  const pickCategory = (category: string) => {
    setActiveCategory(category);
    const layout = layoutRef.current;
    const header = document.querySelector("header");
    if (!layout) return;
    const offset = (header?.getBoundingClientRect().height ?? 0) + 24;
    if (layout.getBoundingClientRect().top >= offset) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      window.scrollTo({ top: window.scrollY + layout.getBoundingClientRect().top - offset });
      return;
    }
    lenis.scrollTo(layout, { offset: -offset });
  };
  // Items whose photo failed to load, shown as the plain tile instead.
  const [failedImages, setFailedImages] = useState<Set<string>>(() => new Set());
  // What is typed and what is searched are kept apart: typing alone never
  // filters the grid. The search runs when the Search button is pressed (or
  // Enter), and clearing the box brings the full list back.
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const runSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const next = searchInput.trim();
    if (next !== search) setSearch(next);
  };

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

  // Skeletons only on the very first load. A branch change keeps the tabs and
  // grid on screen (dimmed) instead of flashing them away and back.
  const hasMenu = menu.categories.length > 0;
  const isFirstLoad = menu.status !== "ready" && menu.status !== "failed" && !hasMenu;
  const refreshing = menu.status === "loading" && hasMenu;

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

  // Titles are stored as typed, so the tab row title-cases them for display.
  const categoryNames = useMemo(
    () => ["All", ...menu.categories.map((category) => titleCase(category.title))],
    [menu.categories],
  );
  const effectiveCategory = categoryNames.includes(activeCategory) ? activeCategory : "All";

  const menuItems = useMemo<MenuCard[]>(
    () =>
      menu.categories.flatMap((category) =>
        category.items.map((item) => ({ ...item, category: titleCase(category.title) })),
      ),
    [menu.categories],
  );

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

    // Always A-Z on the name the visitor sees. `locale` is a dependency so the
    // order follows the language.
    return [...items].sort((a, b) =>
      localizedName(locale, a.name, a.nameAr).localeCompare(localizedName(locale, b.name, b.nameAr)),
    );
  }, [effectiveCategory, search, menuItems, locale]);

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

        {/* Categories on the left, search + branch and the
            grid on the right. Below lg the sidebar stacks on top and the
            categories scroll sideways. */}
        <div className="px-4 pb-10 pt-6 sm:px-6 md:px-12 xl:px-25">
          <div ref={layoutRef} className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-10">
            {/* On large screens the list can be taller than the window, so it
                scrolls on its own inside the space left under the navbar.
                data-lenis-prevent lets the mouse wheel scroll it. */}
            <aside
              ref={asideRef}
              data-lenis-prevent
              className="menu-sidebar w-full lg:sticky lg:top-[var(--menu-sidebar-top,8rem)] lg:max-h-[calc(100dvh-var(--menu-sidebar-top,8rem)-1.5rem)] lg:py-1 lg:w-[240px] lg:shrink-0 lg:overflow-y-auto lg:overscroll-contain xl:w-[260px]"
            >
              {/* Categories: a sideways row on small screens, a vertical list
                  on large ones. The active one carries a red bar and red text. */}
              <div>
                {isFirstLoad ? (
                  <MenuTabsSkeleton count={8} className="px-3 py-2.5 lg:flex-col lg:gap-5 lg:px-4" />
                ) : (
                  <nav
                    aria-label={t("menu.categoriesLabel")}
                    className="category-scroll flex gap-1 overflow-x-auto lg:flex-col lg:gap-0.5 lg:overflow-visible"
                  >
                    {categoryNames.map((cat) => {
                      const isActive = effectiveCategory === cat;
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => pickCategory(cat)}
                          aria-pressed={isActive}
                          className={`shrink-0 cursor-pointer whitespace-nowrap border-b-2 px-3 py-2.5 text-start font-[family-name:var(--font-inter),Inter,sans-serif] text-sm font-medium transition-colors duration-200 sm:text-base lg:whitespace-normal lg:rounded-e-lg lg:border-b-0 lg:border-s-2 lg:px-4 lg:py-2 lg:text-[14px] lg:leading-snug ${
                            isActive
                              ? "border-[#FF0931] text-[#FF0931] lg:bg-[#FF0931]/5"
                              : "border-transparent text-black/55 hover:text-black lg:hover:bg-black/[0.03]"
                          }`}
                        >
                          {categoryLabel(cat)}
                        </button>
                      );
                    })}
                  </nav>
                )}
              </div>
            </aside>

            <div className="min-w-0 flex-1">
              {/* Search and branch, one row from sm up. */}
              <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-stretch sm:gap-4">
                {/* Search. ps-11 is 16px of offset + a 24px icon + a 4px gap. */}
                <form role="search" onSubmit={runSearch} className="relative min-w-0 flex-1">
                  <SearchIcon className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-black" />
                  <input
                    type="search"
                    aria-label={t("menu.searchLabel")}
                    placeholder={t("menu.search")}
                    value={searchInput}
                    onChange={(e) => {
                      setSearchInput(e.target.value);
                      if (e.target.value.trim() === "") setSearch("");
                    }}
                    className={`h-12 w-full rounded-xl border border-black/15 bg-white ps-11 ${searchInput.trim() ? "pe-[104px]" : "pe-4"} font-[family-name:var(--font-inter),Inter,sans-serif] text-sm text-black outline-none transition-colors focus:border-[#FF0931] placeholder:text-black/40 [&::-webkit-search-cancel-button]:hidden`}
                  />
                  {/* Hidden until something is typed. Enter still searches. */}
                  {searchInput.trim() !== "" && (
                    <button
                      type="submit"
                      className="absolute end-1.5 top-1/2 h-9 -translate-y-1/2 cursor-pointer rounded-lg bg-[#FF0931] px-4 font-[family-name:var(--font-inter),Inter,sans-serif] text-sm font-semibold text-white transition-colors hover:bg-[#E0082C]"
                    >
                      {t("menu.searchButton")}
                    </button>
                  )}
                </form>

                {/* Branch. While the branch list is still in flight the select is
                    disabled, so there is no window where it looks empty but is live. */}
                <div className="relative w-full sm:w-[260px] sm:shrink-0">
                  <select
                    value={branchValue}
                    disabled={branchesLoading}
                    onChange={(e) => handleBranchChange(e.target.value)}
                    aria-label={t("menu.branch")}
                    className={SELECT_CLS}
                  >
                    {/* Default view: the whole menu across every branch. */}
                    <option value="">{t("menu.allBranches")}</option>
                    {/* Always one option matching the current value, so the
                        select never shows blank while the list is loading. */}
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
              {menuItems.length === 0 && effectiveCategory === "All"
                ? t("menu.emptyCatalogue")
                : effectiveCategory !== "All" && !search.trim()
                  ? t("menu.emptyCategory")
                  : t("menu.empty")}
            </div>
          )}

          {!isFirstLoad && filteredItems.length > 0 && (
            <div
              aria-busy={refreshing}
              className={`grid grid-cols-2 gap-4 transition-opacity duration-200 sm:grid-cols-3 sm:gap-6 2xl:grid-cols-4 ${refreshing ? "opacity-50" : ""}`}
            >
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="group overflow-hidden rounded-2xl border border-[#E5E5E5] bg-white transition-shadow hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)]"
                >
                  {/* Image */}
                  <div className="relative  overflow-hidden bg-[#F5F5F5] ">
                    {usableImage(item.image) && !failedImages.has(item.id) ? (
                      <img
                        src={item.image}
                        alt={localizedName(locale, item.name, item.nameAr)}
                        className=" w-full h-[180px] sm:h-[264px] lg:h-[240px] object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                        // A missing or deleted photo falls back to the plain tile below.
                        onError={() => setFailedImages((current) => new Set(current).add(item.id))}
                      />
                    ) : (
                      <div role="img" aria-label={localizedName(locale, item.name, item.nameAr)} className="flex h-[180px] w-full items-center justify-center text-[#CCC] sm:h-[264px] lg:h-[240px]">
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
                      {/* Hidden price leaves nothing behind: no £0.00, no dash. */}
                      {item.showPrice && item.priceValue > 0 ? (
                        <p className="mt-1 m-0 font-[family-name:var(--font-korolev),Korolev,sans-serif] text-[20px] font-black leading-[1] tracking-[0.54px] text-black sm:text-[25px] capitalize">
                          {item.price}
                        </p>
                      ) : <span aria-hidden />}
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
          </div>
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
