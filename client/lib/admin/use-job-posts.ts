"use client";

import { useState, useCallback } from "react";
import { api } from "@/lib/api";

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

function mapJobPost(raw: Record<string, unknown>): AdminJobPost {
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
  const [loading, setLoading] = useState(false);

  const fetchJobPosts = useCallback(async (filters?: { status?: string }) => {
    setLoading(true);
    try {
      const query = filters?.status ? `?status=${filters.status}` : "";
      const data = await api.get<Record<string, unknown>[]>(`/admin/jobs${query}`);
      setJobPosts(data.map(mapJobPost));
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

  return { jobPosts, loading, fetchJobPosts, addJobPost, updateJobPost, deleteJobPost, toggleJobStatus, getJobPost };
}
