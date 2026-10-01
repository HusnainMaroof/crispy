import { cache } from "react";
import { cookies } from "next/headers";
import { resolveLocale } from "@/lib/i18n";

const fetchCmsPage = cache(async (page: string, locale: string): Promise<unknown | null> => {
  try {
    const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
    const res = await fetch(`${base}/api/store/cms/${page}?locale=${locale}`, { next: { revalidate: 15 } });
    if (!res.ok) return null;
    const body = await res.json() as { data?: unknown };
    return body.data ?? null;
  } catch {
    return null;
  }
});

export async function loadCmsPage<T = { sections?: Record<string, unknown> }>(page: string, requested?: string): Promise<T | null> {
  const locale = resolveLocale(requested ?? (await cookies()).get("crispy_locale")?.value);
  return fetchCmsPage(page, locale) as Promise<T | null>;
}
