"use client";

import { useState, useCallback } from "react";
import { api } from "@/lib/api";

export type AdminJobApplication = {
  id: string;
  jobPostId: string;
  applicantName: string;
  email: string;
  phone: string | null;
  cvUrl: string | null;
  coverLetter: string | null;
  status: "pending" | "reviewed" | "shortlisted" | "rejected" | "hired";
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

function mapApplication(raw: Record<string, unknown>): AdminJobApplication {
  return {
    id: raw.id as string,
    jobPostId: raw.job_post_id as string,
    applicantName: raw.applicant_name as string,
    email: raw.email as string,
    phone: (raw.phone as string) ?? null,
    cvUrl: (raw.cv_url as string) ?? null,
    coverLetter: (raw.cover_letter as string) ?? null,
    status: raw.status as AdminJobApplication["status"],
    notes: (raw.notes as string) ?? null,
    createdAt: raw.created_at as string,
    updatedAt: raw.updated_at as string,
  };
}

export function useJobApplications() {
  const [applications, setApplications] = useState<AdminJobApplication[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchApplications = useCallback(async (filters?: { job_post_id?: string; status?: string }) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters?.job_post_id) params.set("job_post_id", filters.job_post_id);
      if (filters?.status) params.set("status", filters.status);
      const query = params.toString() ? `?${params.toString()}` : "";
      const data = await api.get<Record<string, unknown>[]>(`/admin/job-applications${query}`);
      setApplications(data.map(mapApplication));
    } finally {
      setLoading(false);
    }
  }, []);

  const updateApplicationStatus = useCallback(
    async (id: string, status: AdminJobApplication["status"]) => {
      const data = await api.patch<Record<string, unknown>>(`/admin/job-applications/${id}/status`, {
        status,
      });
      const updated = mapApplication(data);
      setApplications((prev) => prev.map((app) => (app.id === id ? updated : app)));
    },
    []
  );

  const updateApplicationNotes = useCallback(
    async (id: string, notes: string) => {
      const data = await api.put<Record<string, unknown>>(`/admin/job-applications/${id}`, {
        notes,
      });
      const updated = mapApplication(data);
      setApplications((prev) => prev.map((app) => (app.id === id ? updated : app)));
    },
    []
  );

  const deleteApplication = useCallback(async (id: string) => {
    await api.delete(`/admin/job-applications/${id}`);
    setApplications((prev) => prev.filter((app) => app.id !== id));
  }, []);

  return {
    applications,
    loading,
    fetchApplications,
    updateApplicationStatus,
    updateApplicationNotes,
    deleteApplication,
  };
}
