"use client";

import { useState } from "react";
import Preloader from "@/components/store/preloader";
import Hero from "@/components/store/hero";
import DealsSection from "@/components/store/deals-section";
import StatsSection from "@/components/store/stats-section";
import AppPromo from "@/components/store/app-promo";
import FindUsSection from "@/components/store/find-us-section";
import MenuSection from "@/components/store/menu-section";

export default function StoreHomePage() {
  const [preloaderDone, setPreloaderDone] = useState(false);

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