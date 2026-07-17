"use client";

import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { fetchFullMenu, fetchDeals } from "@/lib/redux/slices/menuSlice";
import { fetchLocations } from "@/lib/redux/slices/locationsSlice";
import { fetchSettings } from "@/lib/redux/slices/settingsSlice";
import type { AppDispatch } from "@/lib/redux/store";
import Preloader from "@/components/store/preloader";
import Hero from "@/components/store/hero";
import DealsSection from "@/components/store/deals-section";
import StatsSection from "@/components/store/stats-section";
import AppPromo from "@/components/store/app-promo";
import FindUsSection from "@/components/store/find-us-section";
import MenuSection from "@/components/store/menu-section";

export default function StoreHomePage() {
  const [preloaderDone, setPreloaderDone] = useState(false);
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    dispatch(fetchFullMenu());
    dispatch(fetchDeals());
    dispatch(fetchLocations());
    dispatch(fetchSettings());
  }, [dispatch]);

  return (
    <>
      <Hero started={preloaderDone} />
      <MenuSection />
      <DealsSection />
      <StatsSection />
      <AppPromo />
      <FindUsSection />
      {!preloaderDone && (
        <Preloader onComplete={() => setPreloaderDone(true)} />
      )}
    </>
  );
}