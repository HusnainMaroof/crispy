"use client";

import Link from "next/link";
import { useLocale } from "@/lib/i18n/locale-context";

const KOROLEV = "font-[family-name:var(--font-korolev),Korolev,sans-serif]";

export default function StoreStatus({ kind }: { kind: "not-found" | "offline" }) {
  const { t } = useLocale();
  const missing = kind === "not-found";

  return (
    <section className="relative flex min-h-[calc(100dvh-var(--navbar-h))] items-center overflow-hidden bg-black px-6 py-20 text-white">
      <p
        aria-hidden
        className={`${KOROLEV} pointer-events-none absolute start-[-0.06em] top-1/2 -translate-y-1/2 select-none text-[clamp(8rem,32vw,22rem)] font-bold uppercase leading-none tracking-[-0.06em] text-white/[0.04]`}
      >
        {missing ? "404" : "OFF"}
      </p>
      <div className="relative mx-auto w-full max-w-3xl">
        <p className="m-0 text-xs font-bold uppercase tracking-[0.28em] text-[#FF0931]">
          {t(missing ? "status.404.kicker" : "status.offline.kicker")}
        </p>
        <h1 className={`${KOROLEV} m-0 mt-4 max-w-[12ch] text-[clamp(3.5rem,9vw,7.5rem)] font-bold uppercase leading-[0.88] tracking-[0.01em]`}>
          {missing ? "404" : t("status.offline.headline")}
        </h1>
        {missing ? (
          <p className={`${KOROLEV} m-0 mt-3 text-[clamp(1.75rem,4vw,3rem)] font-medium uppercase leading-[0.95] text-white/90`}>
            {t("status.404.headline")}
          </p>
        ) : null}
        <span className="mt-6 block h-1 w-16 bg-[#FF0931]" />
        <p className="m-0 mt-6 max-w-md text-base leading-relaxed text-white/70">
          {t(missing ? "status.404.body" : "status.offline.body")}
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          {missing ? (
            <>
              <Link
                href="/"
                className="inline-flex min-h-11 items-center rounded-full bg-[#FF0931] px-6 text-sm font-bold uppercase tracking-wider text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
              >
                {t("status.404.home")}
              </Link>
              <Link
                href="/menu"
                className="inline-flex min-h-11 items-center rounded-full border border-white/25 px-6 text-sm font-bold uppercase tracking-wider text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#FF0931]"
              >
                {t("status.404.menu")}
              </Link>
            </>
          ) : (
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex min-h-11 cursor-pointer items-center rounded-full bg-[#FF0931] px-6 text-sm font-bold uppercase tracking-wider text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
            >
              {t("status.offline.retry")}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
