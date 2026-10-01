"use client";

import { useCallback, useEffect, useLayoutEffect, useState } from "react";
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
export type ResolvedOrdering = Required<OrderingContent>;
export type { OrderingContent };
type SiteResponse = { sections?: { ordering?: OrderingContent } };

const DEFAULT_ORDERING: ResolvedOrdering = {
  mode: "redirect",
  redirectUrl: "",
  ctaLabel: "Order Now",
  uberEatsUrl: "",
  deliverooUrl: "",
  justEatUrl: "",
};

type OrderingBundle = Record<AppLocale, ResolvedOrdering>;

const DEFAULT_BUNDLE: OrderingBundle = { en: DEFAULT_ORDERING, ar: DEFAULT_ORDERING };

/**
 * The ordering mode is a per-locale CMS value, but English is the fallback
 * locale on the server. Mirror that here, otherwise an Arabic visitor whose
 * translation was never published silently gets the registry default (redirect).
 */
function pick(bundle: OrderingBundle, locale: AppLocale) {
  return bundle[locale] ?? bundle.en ?? DEFAULT_ORDERING;
}

let orderingRequest: Promise<{ bundle: OrderingBundle; complete: boolean }> | null = null;
let orderingCache: { value: OrderingBundle; expiresAt: number } | null = null;

function readOrdering(sections?: OrderingContent): ResolvedOrdering {
  return {
    mode: sections?.mode === "cart" ? "cart" : "redirect",
    redirectUrl: sections?.redirectUrl ?? "",
    ctaLabel: sections?.ctaLabel || "Order Now",
    uberEatsUrl: sections?.uberEatsUrl ?? "",
    deliverooUrl: sections?.deliverooUrl ?? "",
    justEatUrl: sections?.justEatUrl ?? "",
  };
}

function remember(bundle: OrderingBundle) {
  orderingCache = { value: bundle, expiresAt: Date.now() + 60_000 };
}

function bundleFromSeeds(initial: OrderingSeeds): OrderingBundle | null {
  if (!initial.en && !initial.ar) return null;
  const current = orderingCache?.value;
  return {
    en: initial.en ? readOrdering(initial.en) : current?.en ?? DEFAULT_ORDERING,
    ar: initial.ar ? readOrdering(initial.ar) : current?.ar ?? (initial.en ? readOrdering(initial.en) : DEFAULT_ORDERING),
  };
}

function loadOrdering(): Promise<OrderingBundle> {
  if (orderingCache && orderingCache.expiresAt > Date.now()) {
    return Promise.resolve(orderingCache.value);
  }
  if (orderingRequest) return orderingRequest.then(({ bundle }) => bundle);

  const request: Promise<{ bundle: OrderingBundle; complete: boolean }> = Promise.all(
    SUPPORTED_LOCALES.map((locale) => api.get<SiteResponse>(`/store/cms/site?locale=${locale}`).catch(() => null)),
  ).then((pages) => {
    const bundle = { ...DEFAULT_BUNDLE };
    let complete = true;
    SUPPORTED_LOCALES.forEach((locale, index) => {
      const section = pages[index]?.sections?.ordering;
      // A failed request is not evidence of either mode. Mark the
      // bundle partial so it is not cached, and let the server-rendered seed
      // keep standing rather than silently reverting a redirect store.
      if (!section) {
        complete = false;
        return;
      }
      bundle[locale] = readOrdering(section);
    });
    return { bundle, complete };
  });

  orderingRequest = request;
  void request
    .then(({ bundle, complete }) => {
      if (complete) orderingCache = { value: bundle, expiresAt: Date.now() + 15_000 };
    })
    .finally(() => {
      if (orderingRequest === request) orderingRequest = null;
    });

  return request.then(({ bundle }) => bundle);
}

export type OrderingSeeds = Partial<Record<AppLocale, OrderingContent | undefined>>;

export function useStoreOrdering(initial?: OrderingSeeds) {
  const { locale } = useLocale();
  // Seeded from the server value so the first paint matches the published
  // mode. The layout effect stores that seed and the mount fetch is skipped
  // while it is fresh, so the page does not request /store/cms/site again.
  const [bundle, setBundle] = useState<OrderingBundle>(() =>
    initial && (initial[locale] ?? initial.en)
      ? {
          en: initial.en ? readOrdering(initial.en) : DEFAULT_ORDERING,
          ar: initial.ar ? readOrdering(initial.ar) : DEFAULT_ORDERING,
        }
      : DEFAULT_BUNDLE,
  );
  const ordering = pick(bundle, locale);

  useLayoutEffect(() => {
    const seeded = initial ? bundleFromSeeds(initial) : null;
    if (seeded) remember(seeded);
  }, [initial]);

  useEffect(() => {
    if (orderingCache && orderingCache.expiresAt > Date.now()) return;
    let active = true;
    void loadOrdering().then((value) => {
      if (active) setBundle(value);
    });
    return () => { active = false; };
  }, []);

  // Resolve the published setting before taking any ordering action so a fast
  // click immediately after page load cannot accidentally open the cart.
  const redirect = useCallback(async () => {
    const value = pick(await loadOrdering(), locale);
    if (value.mode !== "redirect" || !/^https:\/\//i.test(value.redirectUrl)) return false;
    window.location.assign(value.redirectUrl);
    return true;
  }, [locale]);

  // Resolves the published setting at click time, so a fast click right after
  // page load cannot act on stale defaults.
  const resolveOrdering = useCallback(async () => {
    return pick(await loadOrdering(), locale);
  }, [locale]);

  const redirectLink = ordering.mode === "redirect" && /^https:\/\//i.test(ordering.redirectUrl) ? ordering.redirectUrl : null;

  return { ordering, mode: ordering.mode, isRedirect: ordering.mode === "redirect", redirect, redirectLink, resolveOrdering };
}
