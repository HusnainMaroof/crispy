"use client";

import { createContext, createElement, useContext, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "./redux/store";
import { api } from "./api";
import { fetchLocations } from "./redux/slices/locationsSlice";
import { toStoreLocationCard, type StoreLocationCard } from "./storefront-locations";

const StoreLocationsContext = createContext<StoreLocationCard[]>([]);

/** Branches loaded on the server, so the store can render them before the browser asks again. */
export function StoreLocationsProvider({
  initial,
  children,
}: {
  initial: StoreLocationCard[];
  children: React.ReactNode;
}) {
  return createElement(StoreLocationsContext.Provider, { value: initial }, children);
}

export function useStoreLocations() {
  const seeded = useContext(StoreLocationsContext);
  const dispatch = useDispatch<AppDispatch>();
  const { locations, loading, error } = useSelector((state: RootState) => state.locations);

  useEffect(() => {
    if (locations.length > 0 || seeded.length > 0) return;
    dispatch(fetchLocations());
  }, [dispatch, locations.length, seeded.length]);

  const cards = useMemo(() => {
    if (locations.length > 0) return locations.flatMap((location) => {
      try {
        return [toStoreLocationCard(location)];
      } catch {
        return [];
      }
    });
    return seeded;
  }, [locations, seeded]);
  return { locations: cards, loading: cards.length === 0 && loading, error };
}

export function rememberBranch(locationId: string): void {
  void api.patch("/store/location", { location_id: locationId });
}
