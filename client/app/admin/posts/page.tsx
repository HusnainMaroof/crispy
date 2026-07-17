"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Link from "next/link";
import PageHeader from "@/components/admin/ui/page-header";
import Dropdown from "@/components/admin/ui/dropdown";
import { useJobPosts } from "@/lib/admin/use-job-posts";
import { useJobApplications, type AdminJobApplication } from "@/lib/admin/use-job-applications";

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

const appStatusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400",
  reviewed: "bg-blue-500/20 text-blue-400",
  shortlisted: "bg-green-500/20 text-green-400",
  rejected: "bg-red-500/20 text-red-400",
  hired: "bg-purple-500/20 text-purple-400",
};

const appStatusLabels: Record<string, string> = {
  pending: "Pending",
  reviewed: "Reviewed",
  shortlisted: "Shortlisted",
  rejected: "Rejected",
  hired: "Hired",
};

const appStatusOptions = [
  { value: "all", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "reviewed", label: "Reviewed" },
  { value: "shortlisted", label: "Shortlisted" },
  { value: "rejected", label: "Rejected" },
  { value: "hired", label: "Hired" },
];

const statusActions: { value: AdminJobApplication["status"]; label: string }[] = [
  { value: "reviewed", label: "Mark Reviewed" },
  { value: "shortlisted", label: "Shortlist" },
  { value: "rejected", label: "Reject" },
  { value: "hired", label: "Hire" },
];

const tabs = [
  { id: "posts", label: "Post Jobs" },
  { id: "applications", label: "Review Applications" },
] as const;

type TabId = (typeof tabs)[number]["id"];

function PostJobsTab() {
  const { jobPosts, loading, fetchJobPosts, deleteJobPost, toggleJobStatus } = useJobPosts();
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchJobPosts();
  }, [fetchJobPosts]);

  const filtered = jobPosts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(search.toLowerCase()) ||
      post.location.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === "all" || post.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this job post?")) return;
    try {
      await deleteJobPost(id);
      toast.success("Job post deleted");
    } catch {
      toast.error("Failed to delete job post");
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await toggleJobStatus(id);
      toast.success("Job status updated");
    } catch {
      toast.error("Failed to update job status");
    }
  };

  return (
    <>
      {loading && (
        <p className="mb-4 text-sm text-white/50">Loading job posts...</p>
      )}

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
                  onClick={() => handleToggle(post.id)}
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
    </>
  );
}

function ReviewApplicationsTab() {
  const { applications, loading, fetchApplications, updateApplicationStatus, deleteApplication } = useJobApplications();
  const { jobPosts, fetchJobPosts } = useJobPosts();
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterJob, setFilterJob] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchApplications();
    fetchJobPosts();
  }, [fetchApplications, fetchJobPosts]);

  const jobOptions = [
    { value: "all", label: "All Jobs" },
    ...jobPosts.map((p) => ({ value: p.id, label: p.title })),
  ];

  const filtered = applications.filter((app) => {
    const matchesSearch =
      app.applicantName.toLowerCase().includes(search.toLowerCase()) ||
      app.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === "all" || app.status === filterStatus;
    const matchesJob = filterJob === "all" || app.jobPostId === filterJob;
    return matchesSearch && matchesStatus && matchesJob;
  });

  const handleStatusChange = async (id: string, status: AdminJobApplication["status"]) => {
    try {
      await updateApplicationStatus(id, status);
      toast.success(`Application ${appStatusLabels[status].toLowerCase()}`);
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this application?")) return;
    try {
      await deleteApplication(id);
      toast.success("Application deleted");
    } catch {
      toast.error("Failed to delete application");
    }
  };

  const getJobTitle = (jobPostId: string) => {
    return jobPosts.find((p) => p.id === jobPostId)?.title ?? "Unknown Job";
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <>
      {loading && (
        <p className="mb-4 text-sm text-white/50">Loading applications...</p>
      )}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-brand-red/50"
          />
        </div>
        <Dropdown
          options={jobOptions}
          value={filterJob}
          onChange={setFilterJob}
          placeholder="Filter by job"
          className="w-48"
        />
        <Dropdown
          options={appStatusOptions}
          value={filterStatus}
          onChange={setFilterStatus}
          placeholder="Filter by status"
          className="w-48"
        />
      </div>

      <div className="space-y-3">
        {filtered.map((app, index) => (
          <div
            key={app.id}
            className="rounded-xl border border-white/10 bg-white/5 transition-all duration-200 hover:border-white/20 admin-slide-up"
            style={{ animationDelay: `${index * 30}ms` }}
          >
            {/* Header row — always visible */}
            <div
              className="flex cursor-pointer items-center gap-4 p-4"
              onClick={() => toggleExpand(app.id)}
            >
              {/* Avatar */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-medium text-white">
                {app.applicantName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="truncate text-sm font-medium text-white">
                    {app.applicantName}
                  </h4>
                  <span
                    className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      appStatusColors[app.status]
                    }`}
                  >
                    {appStatusLabels[app.status]}
                  </span>
                </div>
                <div className="mt-0.5 flex items-center gap-3 text-xs text-white/40">
                  <span className="truncate">{app.email}</span>
                  <span className="hidden sm:inline">•</span>
                  <span className="hidden sm:inline">{getJobTitle(app.jobPostId)}</span>
                  <span className="hidden sm:inline">•</span>
                  <span className="hidden sm:inline">
                    {new Date(app.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Chevron */}
              <svg
                className={`h-5 w-5 shrink-0 text-white/30 transition-transform duration-200 ${
                  expandedId === app.id ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            {/* Expanded detail */}
            {expandedId === app.id && (
              <div className="border-t border-white/10 px-4 pb-4 pt-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <h5 className="mb-2 text-xs font-medium uppercase tracking-wider text-white/40">
                      Contact
                    </h5>
                    <div className="space-y-1 text-sm text-white/70">
                      <p>Email: {app.email}</p>
                      {app.phone && <p>Phone: {app.phone}</p>}
                      <p>Applied: {new Date(app.createdAt).toLocaleString()}</p>
                      <p>Job: {getJobTitle(app.jobPostId)}</p>
                    </div>
                  </div>
                  <div>
                    <h5 className="mb-2 text-xs font-medium uppercase tracking-wider text-white/40">
                      Documents
                    </h5>
                    <div className="space-y-1 text-sm">
                      {app.cvUrl ? (
                        <a
                          href={app.cvUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-brand-red hover:underline"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          View CV
                        </a>
                      ) : (
                        <span className="text-white/30">No CV uploaded</span>
                      )}
                    </div>
                  </div>
                </div>

                {app.coverLetter && (
                  <div className="mt-4">
                    <h5 className="mb-2 text-xs font-medium uppercase tracking-wider text-white/40">
                      Cover Letter
                    </h5>
                    <p className="whitespace-pre-wrap text-sm text-white/70">{app.coverLetter}</p>
                  </div>
                )}

                {app.notes && (
                  <div className="mt-4">
                    <h5 className="mb-2 text-xs font-medium uppercase tracking-wider text-white/40">
                      Notes
                    </h5>
                    <p className="text-sm text-white/70">{app.notes}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/10 pt-4">
                  {statusActions.map((action) => (
                    <button
                      key={action.value}
                      onClick={() => handleStatusChange(app.id, action.value)}
                      disabled={app.status === action.value}
                      className="btn-press rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/60 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      {action.label}
                    </button>
                  ))}
                  <button
                    onClick={() => handleDelete(app.id)}
                    className="btn-press ml-auto rounded-lg border border-brand-red/30 px-3 py-1.5 text-xs text-brand-red transition-colors hover:bg-brand-red/10"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-xl border border-white/10 bg-white/5 py-12 text-center">
          <svg className="mx-auto h-12 w-12 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-4 text-sm font-medium text-white">No applications found</h3>
          <p className="mt-1 text-sm text-white/50">
            Applications will appear here once candidates start applying.
          </p>
        </div>
      )}
    </>
  );
}

export default function JobPostsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("posts");

  return (
    <div className="admin-fade-in">
      <PageHeader
        title="Jobs"
        description="Manage job listings and review applicant submissions."
        action={
          activeTab === "posts" ? (
            <Link
              href="/admin/posts/create"
              className="btn-press inline-flex items-center gap-2 rounded-lg bg-brand-red px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Post
            </Link>
          ) : undefined
        }
      />

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-lg border border-white/10 bg-white/5 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 rounded-md px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-white/10 text-white"
                : "text-white/50 hover:text-white/70"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "posts" && <PostJobsTab />}
      {activeTab === "applications" && <ReviewApplicationsTab />}
    </div>
  );
}
