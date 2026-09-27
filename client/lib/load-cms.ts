import { cookies } from "next/headers";
import { resolveLocale } from "@/lib/i18n";

export async function loadCmsPage<T = { sections?: Record<string, unknown> }>(page: string): Promise<T | null> {
  try {
    const jar = await cookies();
    const locale = resolveLocale(jar.get("crispy_locale")?.value);
    const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
    const res = await fetch(`${base}/api/store/cms/${page}?locale=${locale}`, { cache: "no-store" });
    if (!res.ok) return null;
    const body = await res.json() as { data?: T };
    return body.data ?? null;
  } catch {
    return null;
  }
}
