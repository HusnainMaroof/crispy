"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DEFAULT_LOCALE, LOCALE_COOKIE, resolveLocale, translate, type AppLocale } from "@/lib/i18n";

const LocaleContext = createContext<{ locale: AppLocale; setLocale: (value: string) => void; t: (key: string) => string }>({
  locale: DEFAULT_LOCALE,
  setLocale: () => undefined,
  t: (key) => translate(DEFAULT_LOCALE, key),
});

export function LocaleProvider({ initial, children }: { initial?: string; children: React.ReactNode }) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<AppLocale>(resolveLocale(initial));
  const value = useMemo(() => ({
    locale,
    setLocale(next: string) {
      const safe = resolveLocale(next);
      document.cookie = `${LOCALE_COOKIE}=${safe};path=/;max-age=31536000;samesite=lax`;
      setLocaleState(safe);
      router.refresh();
    },
    t: (key: string) => translate(locale, key),
  }), [locale, router]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  return useContext(LocaleContext);
}
