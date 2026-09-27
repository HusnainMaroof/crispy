export const SUPPORTED_LOCALES = ["en", "ur"] as const;
export type AppLocale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: AppLocale = "en";

export function isSupportedLocale(value: unknown): value is AppLocale {
  return typeof value === "string" && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

/** Public reads fall back. Invalid values never select a file or a row. */
export function resolveLocale(value: unknown): AppLocale {
  return isSupportedLocale(value) ? value : DEFAULT_LOCALE;
}

export function localeFromAcceptLanguage(header: unknown): AppLocale {
  if (typeof header !== "string") return DEFAULT_LOCALE;
  const tags = header.split(",").map((part) => part.split(";")[0]?.trim().toLowerCase() ?? "");
  for (const tag of tags) {
    const primary = tag.split("-")[0];
    if (isSupportedLocale(primary)) return primary;
  }
  return DEFAULT_LOCALE;
}
