export const SUPPORTED_LOCALES = ["en", "ar"] as const;
export type AppLocale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: AppLocale = "en";

export function isSupportedLocale(value: unknown): value is AppLocale {
  return typeof value === "string" && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

function primaryTag(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const primary = value.trim().toLowerCase().split("-")[0] ?? "";
  return primary || null;
}

/**
 * Storefront reads. Missing or leftover values (including the old Urdu code)
 * stay on English so the site opens in English unless Arabic was chosen.
 */
export function resolveLocale(value: unknown): AppLocale {
  const primary = primaryTag(value);
  return isSupportedLocale(primary) ? primary : DEFAULT_LOCALE;
}

/**
 * Writes and admin reads. The old Urdu code means Arabic. Anything else is rejected.
 */
export function strictLocale(value: unknown): AppLocale | null {
  const primary = primaryTag(value);
  if (primary === "ur") return "ar";
  return isSupportedLocale(primary) ? primary : null;
}
