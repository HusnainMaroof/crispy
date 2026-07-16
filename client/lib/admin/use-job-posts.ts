"use client";

import { useCallback } from "react";
import { useAdminStore } from "./store";
import type { AdminJobPost } from "./mock-data";

export function useJobPosts() {
  const { jobPosts, setJobPosts } = useAdminStore();

  const addJobPost = useCallback(
    (post: Omit<AdminJobPost, "id" | "createdAt" | "applications">) => {
      const newId = `job-${Date.now()}`;
      setJobPosts([
        ...jobPosts,
        {
          ...post,
          id: newId,
          createdAt: new Date().toISOString(),
          applications: 0,
        },
      ]);
    },
    [jobPosts, setJobPosts]
  );

  const updateJobPost = useCallback(
    (id: string, updates: Partial<AdminJobPost>) => {
      setJobPosts(
        jobPosts.map((post) => (post.id === id ? { ...post, ...updates } : post))
      );
    },
    [jobPosts, setJobPosts]
  );

  const deleteJobPost = useCallback(
    (id: string) => {
      setJobPosts(jobPosts.filter((post) => post.id !== id));
    },
    [jobPosts, setJobPosts]
  );

  const toggleJobStatus = useCallback(
    (id: string) => {
      setJobPosts(
        jobPosts.map((post) =>
          post.id === id
            ? { ...post, status: post.status === "active" ? "closed" : "active" }
            : post
        )
      );
    },
    [jobPosts, setJobPosts]
  );

  const getJobPost = useCallback(
    (id: string) => jobPosts.find((post) => post.id === id),
    [jobPosts]
  );

  return { jobPosts, addJobPost, updateJobPost, deleteJobPost, toggleJobStatus, getJobPost };
}
