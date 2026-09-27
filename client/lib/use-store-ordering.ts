"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";

type OrderingContent = { mode?: "cart" | "redirect"; redirectUrl?: string; ctaLabel?: string };
type ResolvedOrdering = Required<OrderingContent>;
type SiteResponse = { sections?: { ordering?: OrderingContent } };

const DEFAULT_ORDERING: ResolvedOrdering = {
  mode: "cart",
  redirectUrl: "",
  ctaLabel: "Order Now",
};

let orderingRequest: Promise<ResolvedOrdering> | null = null;
let orderingCache: { value: ResolvedOrdering; expiresAt: number } | null = null;

function loadOrdering(): Promise<ResolvedOrdering> {
  if (orderingCache && orderingCache.expiresAt > Date.now()) {
    return Promise.resolve(orderingCache.value);
  }
  if (!orderingRequest) {
    const request: Promise<ResolvedOrdering> = api.get<SiteResponse>("/store/cms/site")
      .then(({ sections }): ResolvedOrdering => ({
        mode: sections?.ordering?.mode === "redirect" ? "redirect" : "cart",
        redirectUrl: sections?.ordering?.redirectUrl ?? "",
        ctaLabel: sections?.ordering?.ctaLabel || "Order Now",
      }))
      .catch((): ResolvedOrdering => DEFAULT_ORDERING);
    orderingRequest = request;
    void request.then((value) => {
      orderingCache = { value, expiresAt: Date.now() + 15_000 };
    }).finally(() => {
      if (orderingRequest === request) orderingRequest = null;
    });
  }
  return orderingRequest ?? Promise.resolve(DEFAULT_ORDERING);
}

export function useStoreOrdering() {
  const [ordering, setOrdering] = useState<ResolvedOrdering>(DEFAULT_ORDERING);

  useEffect(() => {
    let active = true;
    void loadOrdering().then((value) => {
      if (active) setOrdering(value);
    });
    return () => { active = false; };
  }, []);

  // Resolve the published setting before taking any ordering action so a fast
  // click immediately after page load cannot accidentally open the cart.
  const redirect = useCallback(async () => {
    const value = await loadOrdering();
    if (value.mode !== "redirect" || !/^https:\/\//i.test(value.redirectUrl)) return false;
    window.location.assign(value.redirectUrl);
    return true;
  }, []);

  const redirectLink = ordering.mode === "redirect" && /^https:\/\//i.test(ordering.redirectUrl) ? ordering.redirectUrl : null;

  return { ordering, redirect, redirectLink };
}
