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
import JsonLd from "@/components/seo/json-ld";

const restaurantSchema = {
  "@context": "https://schema.org",
  "@type": "Restaurant",
  name: "Crispies",
  description:
    "Crispies — halal burgers and chicken in London. Crispy on the outside, juicy on the inside. Delivery and click & collect.",
  servesCuisine: ["Burgers", "Chicken", "Halal", "Fast Food"],
  priceRange: "£",
  areaServed: {
    "@type": "City",
    name: "London",
  },
  address: {
    "@type": "PostalAddress",
    addressLocality: "London",
    addressCountry: "GB",
  },
  url: "https://crispies.co.uk",
  logo: "https://crispies.co.uk/icon.svg",
  image:
    "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=2000&auto=format&fit=crop",
  acceptsReservations: false,
  hasMenu: "https://crispies.co.uk/menu",
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
      opens: "11:00",
      closes: "23:00",
    },
  ],
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Crispies",
  url: "https://crispies.co.uk",
  potentialAction: {
    "@type": "SearchAction",
    target: "https://crispies.co.uk/menu?q={search_term_string}",
    "query-input": "required name=search_term_string",
  },
};

export default function StoreHomePage() {
  const [preloaderDone, setPreloaderDone] = useState(false);
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    dispatch(fetchFullMenu());
    dispatch(fetchDeals());
    dispatch(fetchLocations());
    dispatch(fetchSettings());
    // Watchdog: if Preloader GSAP timeline doesn't hit onComplete
    // (route change, error mid-tween, strict-mode double-invoke), force
    // un-pause the hero after 4s so it isn't permanently invisible.
    const watchdog = window.setTimeout(() => setPreloaderDone(true), 4000);
    return () => window.clearTimeout(watchdog);
  }, [dispatch]);

  return (
    <>
      <JsonLd data={[restaurantSchema, websiteSchema]} />
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