"use client";

import { useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/admin/ui/page-header";
import Dropdown from "@/components/admin/ui/dropdown";
import { useJobPosts } from "@/lib/admin/use-job-posts";

const statusColors: Record<string, string> = {
  active: "bg-green-500/20 text-green-400",
  closed: "bg-white/10 text-white/50",
  draft: "bg-yellow-500/20 text-yellow-400",
};

const statusLabels: Record<string, string> = {
  active: "Active",
  closed: "Closed",
  draft: "Draft",
};

const typeLabels: Record<string, string> = {
  "full-time": "Full-time",
  "part-time": "Part-time",
  contract: "Contract",
};

const filterOptions = [
  { value: "all", label: "All Posts" },
  { value: "active", label: "Active" },
  { value: "closed", label: "Closed" },
  { value: "draft", label: "Draft" },
];

export default function JobPostsPage() {
  const { jobPosts, deleteJobPost, toggleJobStatus } = useJobPosts();
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [search, setSearch] = useState("");

  const filtered = jobPosts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(search.toLowerCase()) ||
      post.location.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === "all" || post.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this job post?")) {
      deleteJobPost(id);
    }
  };

  return (
    <div className="admin-fade-in">
      <PageHeader
        title="Job Posts"
        description="Manage job listings for your stores."
        action={
          <Link
            href="/admin/posts/create"
            className="btn-press inline-flex items-center gap-2 rounded-lg bg-brand-red px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Post
          </Link>
        }
      />

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search jobs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-brand-red/50"
          />
        </div>
        <Dropdown
          options={filterOptions}
          value={filterStatus}
          onChange={setFilterStatus}
          placeholder="Filter by status"
          className="w-48"
        />
      </div>

      {/* Job Posts Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((post, index) => (
          <div
            key={post.id}
            className="group rounded-xl border border-white/10 bg-white/5 p-6 transition-all duration-200 hover:border-white/20 hover:bg-white/10 admin-slide-up"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="mb-4 flex items-start justify-between">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  statusColors[post.status]
                }`}
              >
                {statusLabels[post.status]}
              </span>
              <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  onClick={() => toggleJobStatus(post.id)}
                  className="btn-press rounded-lg p-2 text-white/50 hover:bg-white/10 hover:text-white"
                  title={post.status === "active" ? "Close post" : "Activate post"}
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {post.status === "active" ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    )}
                  </svg>
                </button>
                <Link
                  href={`/admin/posts/${post.id}`}
                  className="btn-press rounded-lg p-2 text-white/50 hover:bg-white/10 hover:text-white"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </Link>
                <button
                  onClick={() => handleDelete(post.id)}
                  className="btn-press rounded-lg p-2 text-white/50 hover:bg-brand-red/20 hover:text-brand-red"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>

            <h3 className="mb-2 font-display text-xl tracking-wide text-white">
              {post.title}
            </h3>

            <div className="mb-3 flex flex-wrap gap-2 text-sm text-white/50">
              <span className="flex items-center gap-1">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {post.location}
              </span>
              <span className="flex items-center gap-1">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {typeLabels[post.type]}
              </span>
            </div>

            <p className="mb-4 text-sm font-medium text-brand-red">{post.salary}</p>

            <p className="mb-4 line-clamp-2 text-sm text-white/50">{post.description}</p>

            <div className="flex items-center justify-between border-t border-white/10 pt-4">
              <span className="text-xs text-white/30">
                {post.applications} applications
              </span>
              <span className="text-xs text-white/30">
                Posted {new Date(post.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-xl border border-white/10 bg-white/5 py-12 text-center">
          <svg className="mx-auto h-12 w-12 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <h3 className="mt-4 text-sm font-medium text-white">No job posts found</h3>
          <p className="mt-1 text-sm text-white/50">
            Get started by creating a new job post.
          </p>
          <Link
            href="/admin/posts/create"
            className="btn-press mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-red px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Post
          </Link>
        </div>
      )}
    </div>
  );
}
