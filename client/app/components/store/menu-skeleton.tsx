// menu-skeleton.tsx
// Placeholder shapes that mirror the real menu markup, so the layout does not
// shift when the data lands. Light theme — the admin skeletons are dark.
"use client";

import { useLocale } from "@/lib/i18n/locale-context";

function Bar({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-[#EFEFEF] ${className}`} />;
}

/** Stands in for the category tab pills while the catalogue is in flight. */
export function MenuTabsSkeleton({ count = 5 }: { count?: number }) {
  const widths = ["w-16", "w-24", "w-20", "w-28", "w-20", "w-24"];
  return (
    <div className="flex gap-2 overflow-hidden" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <Bar key={i} className={`h-9 shrink-0 ${widths[i % widths.length]}`} />
      ))}
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#E5E5E5] bg-white" aria-hidden="true">
      <Bar className="h-[264px] w-full rounded-none" />
      <div className="flex-col px-3 py-5 sm:px-4">
        <Bar className="h-4 w-3/5" />
        <Bar className="mt-3 h-3 w-full" />
        <Bar className="mt-1.5 h-3 w-4/5" />
        <div className="flex items-center justify-between gap-2 pt-4">
          <Bar className="h-6 w-20" />
          <Bar className="h-[59px] w-[59px] rounded-[8.5px]" />
        </div>
      </div>
    </div>
  );
}

/** Stands in for the product grid using the same breakpoints as the real one. */
export function MenuGridSkeleton({ count = 8 }: { count?: number }) {
  const { t } = useLocale();
  return (
    <div
      className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4"
      role="status"
      aria-live="polite"
    >
      <span className="sr-only">{t("menu.loading")}</span>
      {Array.from({ length: count }, (_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
