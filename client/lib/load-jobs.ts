import { cache } from "react";

export type StoreJobPost = {
  id: string;
  title: string;
  /** Arabic display copy. Empty means fall back to the English field. */
  title_ar: string;
  /** Branch display name, copied from the branch row on write. */
  location: string;
  location_id: string | null;
  type: string;
  salary: string;
  description: string;
  description_ar: string;
  requirements: string[];
  requirements_ar: string[];
  applications: number;
  created_at: string;
};

function toJobPost(row: Record<string, unknown>): StoreJobPost | null {
  if (!row.id || typeof row.title !== "string") return null;
  return {
    id: row.id as string,
    title: row.title,
    title_ar: typeof row.title_ar === "string" ? row.title_ar : "",
    location: typeof row.location === "string" ? row.location : "",
    location_id: typeof row.location_id === "string" ? row.location_id : null,
    type: typeof row.type === "string" ? row.type : "",
    salary: typeof row.salary === "string" ? row.salary : "",
    description: typeof row.description === "string" ? row.description : "",
    description_ar: typeof row.description_ar === "string" ? row.description_ar : "",
    requirements: Array.isArray(row.requirements) ? (row.requirements as string[]) : [],
    requirements_ar: Array.isArray(row.requirements_ar) ? (row.requirements_ar as string[]) : [],
    applications: typeof row.applications === "number" ? row.applications : 0,
    created_at: typeof row.created_at === "string" ? row.created_at : "",
  };
}

/**
 * Public careers list, active posts only. Never rejects: an API outage has to
 * render the page, same as the CMS and branch loaders.
 *
 * `ok` is reported separately from the list because an empty array is ambiguous:
 * "no roles posted" and "could not reach the API" both look like `[]`, and the
 * page would otherwise claim there are no openings when the API is down. The
 * `(store)` layout only checks `/health`, so it cannot be relied on for this.
 */
export const loadStoreJobs = cache(async (): Promise<{ ok: boolean; jobs: StoreJobPost[] }> => {
  try {
    const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
    const res = await fetch(`${base}/api/store/jobs`, { next: { revalidate: 15 } });
    if (!res.ok) return { ok: false, jobs: [] };
    const body = (await res.json()) as { data?: unknown };
    if (!Array.isArray(body.data)) return { ok: false, jobs: [] };
    return {
      ok: true,
      jobs: body.data.flatMap((row) => {
        if (!row || typeof row !== "object") return [];
        const post = toJobPost(row as Record<string, unknown>);
        return post ? [post] : [];
      }),
    };
  } catch {
    return { ok: false, jobs: [] };
  }
});

/**
 * A single active post for the detail page. Returns null for anything missing,
 * draft or closed, which the page renders as "not found" rather than a 500.
 */
export const loadStoreJob = cache(async (id: string): Promise<StoreJobPost | null> => {
  try {
    const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
    const res = await fetch(`${base}/api/store/jobs/${encodeURIComponent(id)}`, {
      next: { revalidate: 15 },
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { data?: unknown };
    if (!body.data || typeof body.data !== "object") return null;
    return toJobPost(body.data as Record<string, unknown>);
  } catch {
    return null;
  }
});
