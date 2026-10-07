"use client";

import { useState, useCallback } from "react";
import { api, type Pagination } from "@/lib/api";

export type AdminJobPost = {
  id: string;
  title: string;
  /** Arabic display copy. Empty falls back to the English field in the Arabic store. */
  titleAr: string;
  /** Display copy of the branch name. */
  location: string;
  /** Null only for posts created before job posts became branch-scoped. */
  locationId: string | null;
  /**
   * Free text, not a union. A manager can introduce a type nobody uses yet, so
   * the form offers the values already in use as suggestions only.
   */
  type: string;
  salary: string;
  description: string;
  descriptionAr: string;
  requirements: string[];
  requirementsAr: string[];
  status: "active" | "closed" | "draft";
  createdAt: string;
  applications: number;
};

export function mapJobPost(raw: Record<string, unknown>): AdminJobPost {
  return {
    id: raw.id as string,
    title: raw.title as string,
    titleAr: (raw.title_ar as string) ?? "",
    location: raw.location as string,
    locationId: (raw.location_id as string | null) ?? null,
    type: raw.type as string,
    salary: raw.salary as string,
    description: raw.description as string,
    descriptionAr: (raw.description_ar as string) ?? "",
    requirements: (raw.requirements as string[]) ?? [],
    requirementsAr: (raw.requirements_ar as string[]) ?? [],
    status: raw.status as AdminJobPost["status"],
    createdAt: raw.created_at as string,
    applications: (raw.applications as number) ?? 0,
  };
}

/**
 * Reference data for the create and edit forms: the branches this admin may post
 * to, and the job types already in use as suggestions for the free-text field.
 *
 * Both come from `/admin/jobs/field-values` rather than `/admin/locations`,
 * because that route is tab-gated on tabs a manager may not hold. Returns empty
 * arrays on failure so a form still renders and simply has no suggestions.
 */
export async function getJobFieldValues(): Promise<{
  branches: { id: string; name: string }[];
  types: string[];
}> {
  const empty = { branches: [] as { id: string; name: string }[], types: [] as string[] };
  try {
    const data = await api.get<{ branches?: unknown; types?: unknown }>("/admin/jobs/field-values");
    return {
      branches: Array.isArray(data?.branches)
        ? data.branches.flatMap((row) => {
            if (!row || typeof row !== "object") return [];
            const branch = row as { id?: unknown; name?: unknown };
            if (typeof branch.id !== "string" || typeof branch.name !== "string") return [];
            return [{ id: branch.id, name: branch.name }];
          })
        : empty.branches,
      types: Array.isArray(data?.types) ? (data.types as string[]) : empty.types,
    };
  } catch {
    return empty;
  }
}

/** A new post always names a branch, so it is narrowed from `string | null`. */
export type NewJobPost = Omit<
  AdminJobPost,
  "id" | "createdAt" | "applications" | "location" | "locationId"
> & { locationId: string };

export function useJobPosts() {
  const [jobPosts, setJobPosts] = useState<AdminJobPost[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1, limit: 20, total: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false,
  });
  const [loading, setLoading] = useState(true);
  // True once the first read finished, so the grid can tell an initial load
  // (skeleton) from a refetch (rows stay, dimmed).
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState("");

  /**
   * Filtering and paging happen in the database. The applications tab used to
   * read the full job-post list to resolve titles and to populate its job
   * dropdown, so it now asks for a separate unfiltered list for those lookups
   * instead of relying on whatever page the grid happens to be showing.
   *
   * `locationId` is the branch filter. The server ANDs it with the admin's own
   * branch allow-list, so a branch manager cannot widen the filter.
   */
  const fetchJobPosts = useCallback(async (filters?: {
    status?: string;
    q?: string;
    locationId?: string;
    page?: number;
    limit?: number;
  }) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.set("status", filters.status);
      if (filters?.q) params.set("q", filters.q);
      if (filters?.locationId) params.set("location_id", filters.locationId);
      if (filters?.page) params.set("page", String(filters.page));
      if (filters?.limit) params.set("limit", String(filters.limit));
      const query = params.toString() ? `?${params.toString()}` : "";
      const { items, pagination: meta } = await api.getPage<Record<string, unknown>>(`/admin/jobs${query}`);
      setJobPosts(items.map(mapJobPost));
      setPagination(meta);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load job posts.");
    } finally {
      setLoading(false);
      setHasLoaded(true);
    }
  }, []);

  /**
   * Mutations return the fresh row and leave `jobPosts` alone. The list is
   * paged and filtered in the database, so a local insert could land outside
   * the current filter or push a page past its size; the caller refetches.
   */
  const addJobPost = useCallback(
    async (post: NewJobPost) => {
      const data = await api.post<Record<string, unknown>>("/admin/jobs", {
        title: post.title,
        title_ar: post.titleAr,
        location_id: post.locationId,
        type: post.type,
        salary: post.salary,
        description: post.description,
        description_ar: post.descriptionAr,
        requirements: post.requirements,
        requirements_ar: post.requirementsAr,
        status: post.status,
      });
      return mapJobPost(data);
    },
    []
  );

  const updateJobPost = useCallback(
    async (id: string, updates: Partial<AdminJobPost>) => {
      const body: Record<string, unknown> = {};
      if (updates.title !== undefined) body.title = updates.title;
      if (updates.titleAr !== undefined) body.title_ar = updates.titleAr;
      // Only a real branch id is sent. A post with no branch yet would otherwise
      // put `location_id: null` in the body, which the schema rejects, making
      // every edit of that post fail with a 400.
      if (updates.locationId) body.location_id = updates.locationId;
      if (updates.type !== undefined) body.type = updates.type;
      if (updates.salary !== undefined) body.salary = updates.salary;
      if (updates.description !== undefined) body.description = updates.description;
      if (updates.descriptionAr !== undefined) body.description_ar = updates.descriptionAr;
      if (updates.requirements !== undefined) body.requirements = updates.requirements;
      if (updates.requirementsAr !== undefined) body.requirements_ar = updates.requirementsAr;
      if (updates.status !== undefined) body.status = updates.status;
      const data = await api.put<Record<string, unknown>>(`/admin/jobs/${id}`, body);
      return mapJobPost(data);
    },
    []
  );

  const deleteJobPost = useCallback(async (id: string) => {
    await api.delete(`/admin/jobs/${id}`);
  }, []);

  const toggleJobStatus = useCallback(async (id: string) => {
    const post = jobPosts.find((p) => p.id === id);
    if (!post) return;
    const newStatus = post.status === "active" ? "closed" : "active";
    const data = await api.patch<Record<string, unknown>>(`/admin/jobs/${id}/status`, {
      status: newStatus,
    });
    return mapJobPost(data);
  }, [jobPosts]);

  // No per-id lookup on purpose. `getJobPost` used to read the id out of the
  // cached list, which captured a stale closure over an empty array and made the
  // edit page refetch in a loop. The detail page reads GET /admin/jobs/:id.
  return { jobPosts, pagination, loading, hasLoaded, error, fetchJobPosts, addJobPost, updateJobPost, deleteJobPost, toggleJobStatus };
}
