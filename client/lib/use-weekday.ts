"use client";

import { useSyncExternalStore } from "react";

const subscribe = (onChange: () => void) => {
  // Re-checks every minute so the day flips at midnight on an open page.
  const timer = window.setInterval(onChange, 60_000);
  return () => window.clearInterval(timer);
};

/** Today's weekday in London (0 is Sunday). Null during server render. */
function londonWeekday(): number {
  const name = new Intl.DateTimeFormat("en-GB", { weekday: "short", timeZone: "Europe/London" }).format(new Date());
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(name);
}

export function useWeekday(): number | null {
  return useSyncExternalStore(subscribe, londonWeekday, () => null);
}
