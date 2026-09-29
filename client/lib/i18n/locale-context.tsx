"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DEFAULT_LOCALE, isSupportedLocale, LOCALE_COOKIE, resolveLocale, translate, type AppLocale, type TranslateParams } from "@/lib/i18n";

const LocaleContext = createContext<{ locale: AppLocale; setLocale: (value: string) => void; t: (key: string, params?: TranslateParams) => string }>({
  locale: DEFAULT_LOCALE,
  setLocale: () => undefined,
  t: (key) => translate(DEFAULT_LOCALE, key),
});

function writeLocaleCookie(locale: AppLocale) {
  document.cookie = `${LOCALE_COOKIE}=${locale};path=/;max-age=31536000;samesite=lax`;
}

export function LocaleProvider({ initial, children }: { initial?: string; children: React.ReactNode }) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<AppLocale>(resolveLocale(initial));

  useEffect(() => {
    const match = document.cookie.match(/(?:^|;\s*)crispy_locale=([^;]*)/);
    const raw = match ? decodeURIComponent(match[1] ?? "") : "";
    if (raw && !isSupportedLocale(raw.trim().toLowerCase())) writeLocaleCookie(DEFAULT_LOCALE);
  }, []);

  const value = useMemo(() => ({
    locale,
    setLocale(next: string) {
      const safe = resolveLocale(next);
      writeLocaleCookie(safe);
      document.documentElement.lang = safe;
      setLocaleState(safe);
      router.refresh();
    },
    t: (key: string, params?: TranslateParams) => translate(locale, key, params),
  }), [locale, router]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  return useContext(LocaleContext);
}
