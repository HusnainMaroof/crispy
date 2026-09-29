"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { SUPPORTED_LOCALES, type AppLocale } from "@/lib/i18n";
import { useLocale } from "@/lib/i18n/locale-context";

type OrderingContent = {
  mode?: "cart" | "redirect";
  redirectUrl?: string;
  ctaLabel?: string;
  uberEatsUrl?: string;
  deliverooUrl?: string;
  justEatUrl?: string;
};
type ResolvedOrdering = Required<OrderingContent>;
type SiteResponse = { sections?: { ordering?: OrderingContent } };

const DEFAULT_ORDERING: ResolvedOrdering = {
  mode: "cart",
  redirectUrl: "",
  ctaLabel: "Order Now",
  uberEatsUrl: "",
  deliverooUrl: "",
  justEatUrl: "",
};

type OrderingBundle = Record<AppLocale, ResolvedOrdering>;

const DEFAULT_BUNDLE: OrderingBundle = { en: DEFAULT_ORDERING, ar: DEFAULT_ORDERING };

let orderingRequest: Promise<OrderingBundle> | null = null;
let orderingCache: { value: OrderingBundle; expiresAt: number } | null = null;

function readOrdering(sections?: OrderingContent): ResolvedOrdering {
  return {
    mode: sections?.mode === "redirect" ? "redirect" : "cart",
    redirectUrl: sections?.redirectUrl ?? "",
    ctaLabel: sections?.ctaLabel || "Order Now",
    uberEatsUrl: sections?.uberEatsUrl ?? "",
    deliverooUrl: sections?.deliverooUrl ?? "",
    justEatUrl: sections?.justEatUrl ?? "",
  };
}

function loadOrdering(): Promise<OrderingBundle> {
  if (orderingCache && orderingCache.expiresAt > Date.now()) {
    return Promise.resolve(orderingCache.value);
  }
  if (!orderingRequest) {
    const request: Promise<OrderingBundle> = Promise.all(
      SUPPORTED_LOCALES.map((locale) => api.get<SiteResponse>(`/store/cms/site?locale=${locale}`).catch(() => null)),
    ).then((pages) => {
      const bundle = { ...DEFAULT_BUNDLE };
      SUPPORTED_LOCALES.forEach((locale, index) => {
        bundle[locale] = readOrdering(pages[index]?.sections?.ordering);
      });
      return bundle;
    });
    orderingRequest = request;
    void request.then((value) => {
      orderingCache = { value, expiresAt: Date.now() + 15_000 };
    }).finally(() => {
      if (orderingRequest === request) orderingRequest = null;
    });
  }
  return orderingRequest ?? Promise.resolve(DEFAULT_BUNDLE);
}

export function useStoreOrdering() {
  const { locale } = useLocale();
  const [bundle, setBundle] = useState<OrderingBundle>(DEFAULT_BUNDLE);
  const ordering = bundle[locale] ?? DEFAULT_ORDERING;

  useEffect(() => {
    let active = true;
    void loadOrdering().then((value) => {
      if (active) setBundle(value);
    });
    return () => { active = false; };
  }, []);

  // Resolve the published setting before taking any ordering action so a fast
  // click immediately after page load cannot accidentally open the cart.
  const redirect = useCallback(async () => {
    const value = (await loadOrdering())[locale] ?? DEFAULT_ORDERING;
    if (value.mode !== "redirect" || !/^https:\/\//i.test(value.redirectUrl)) return false;
    window.location.assign(value.redirectUrl);
    return true;
  }, [locale]);

  // Resolves the published setting at click time, so a fast click right after
  // page load cannot act on stale defaults.
  const resolveOrdering = useCallback(async () => {
    return (await loadOrdering())[locale] ?? DEFAULT_ORDERING;
  }, [locale]);

  const redirectLink = ordering.mode === "redirect" && /^https:\/\//i.test(ordering.redirectUrl) ? ordering.redirectUrl : null;

  return { ordering, redirect, redirectLink, resolveOrdering };
}
