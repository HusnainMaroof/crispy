import type { MenuItemRedirects } from "./redux/types";

/**
 * Per-platform redirect links live on three parallel columns. Every consumer
 * (storefront menu, admin menu list, redux slice) needs the same grouped shape,
 * so the grouping is done once here rather than three times at the call site.
 */
export function mapMenuItemRedirects(raw: Record<string, unknown>): MenuItemRedirects {
  return {
    uberEats: (raw.redirect_uber_eats as string) ?? "",
    deliveroo: (raw.redirect_deliveroo as string) ?? "",
    justEat: (raw.redirect_just_eat as string) ?? "",
  };
}

/** The column each platform reads, matching menu_items in the Prisma schema. */
export const PLATFORM_REDIRECT_COLUMNS: Record<keyof MenuItemRedirects, string> = {
  uberEats: "redirect_uber_eats",
  deliveroo: "redirect_deliveroo",
  justEat: "redirect_just_eat",
};
