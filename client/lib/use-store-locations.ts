"use client";

import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "./redux/store";
import { api } from "./api";
import { fetchLocations } from "./redux/slices/locationsSlice";
import { toStoreLocationCard } from "./storefront-locations";

export function useStoreLocations() {
  const dispatch = useDispatch<AppDispatch>();
  const { locations, loading, error } = useSelector((state: RootState) => state.locations);

  useEffect(() => {
    dispatch(fetchLocations());
  }, [dispatch]);

  const cards = useMemo(() => locations.map(toStoreLocationCard), [locations]);
  return { locations: cards, loading, error };
}

export function rememberBranch(locationId: string): void {
  void api.patch("/store/location", { location_id: locationId });
}
