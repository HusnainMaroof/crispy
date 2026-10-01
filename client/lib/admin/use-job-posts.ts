"use client";

import { useState, useCallback } from "react";
import { api, type Pagination } from "@/lib/api";

export type AdminJobPost = {
  id: string;
  title: string;
  location: string;
  type: "full-time" | "part-time" | "contract";
  salary: string;
  description: string;
  requirements: string[];
  status: "active" | "closed" | "draft";
  createdAt: string;
  applications: number;
};

export function mapJobPost(raw: Record<string, unknown>): AdminJobPost {
  return {
    id: raw.id as string,
    title: raw.title as string,
    location: raw.location as string,
    type: raw.type as AdminJobPost["type"],
    salary: raw.salary as string,
    description: raw.description as string,
    requirements: (raw.requirements as string[]) ?? [],
    status: raw.status as AdminJobPost["status"],
    createdAt: raw.created_at as string,
    applications: (raw.applications as number) ?? 0,
  };
}

export function useJobPosts() {
  const [jobPosts, setJobPosts] = useState<AdminJobPost[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1, limit: 20, total: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /**
   * Filtering and paging happen in the database. The applications tab used to
   * read the full job-post list to resolve titles and to populate its job
   * dropdown, so it now asks for a separate unfiltered list for those lookups
   * instead of relying on whatever page the grid happens to be showing.
   */
  const fetchJobPosts = useCallback(async (filters?: { status?: string; q?: string; page?: number; limit?: number }) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.set("status", filters.status);
      if (filters?.q) params.set("q", filters.q);
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
    }
  }, []);

  const addJobPost = useCallback(
    async (post: Omit<AdminJobPost, "id" | "createdAt" | "applications">) => {
      const data = await api.post<Record<string, unknown>>("/admin/jobs", {
        title: post.title,
        location: post.location,
        type: post.type,
        salary: post.salary,
        description: post.description,
        requirements: post.requirements,
        status: post.status,
      });
      setJobPosts((prev) => [...prev, mapJobPost(data)]);
    },
    []
  );

  const updateJobPost = useCallback(
    async (id: string, updates: Partial<AdminJobPost>) => {
      const body: Record<string, unknown> = {};
      if (updates.title !== undefined) body.title = updates.title;
      if (updates.location !== undefined) body.location = updates.location;
      if (updates.type !== undefined) body.type = updates.type;
      if (updates.salary !== undefined) body.salary = updates.salary;
      if (updates.description !== undefined) body.description = updates.description;
      if (updates.requirements !== undefined) body.requirements = updates.requirements;
      if (updates.status !== undefined) body.status = updates.status;
      const data = await api.put<Record<string, unknown>>(`/admin/jobs/${id}`, body);
      const updated = mapJobPost(data);
      setJobPosts((prev) => prev.map((post) => (post.id === id ? updated : post)));
    },
    []
  );

  const deleteJobPost = useCallback(async (id: string) => {
    await api.delete(`/admin/jobs/${id}`);
    setJobPosts((prev) => prev.filter((post) => post.id !== id));
  }, []);

  const toggleJobStatus = useCallback(async (id: string) => {
    const post = jobPosts.find((p) => p.id === id);
    if (!post) return;
    const newStatus = post.status === "active" ? "closed" : "active";
    const data = await api.patch<Record<string, unknown>>(`/admin/jobs/${id}/status`, {
      status: newStatus,
    });
    const updated = mapJobPost(data);
    setJobPosts((prev) => prev.map((p) => (p.id === id ? updated : p)));
  }, [jobPosts]);

  const getJobPost = useCallback(
    (id: string) => jobPosts.find((post) => post.id === id),
    [jobPosts]
  );

  return { jobPosts, pagination, loading, error, fetchJobPosts, addJobPost, updateJobPost, deleteJobPost, toggleJobStatus, getJobPost };
}
