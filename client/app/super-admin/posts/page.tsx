"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import PageHeader from "@/app/components/admin/ui/page-header";
import Dropdown from "@/app/components/admin/ui/dropdown";
import ConfirmModal from "@/app/components/admin/ui/confirm-modal";
import JobFormModal from "@/app/components/admin/ui/job-form-modal";
import { ListToolbar, Pagination, primaryButton } from "@/app/components/admin/ui/list-toolbar";
import { TableSkeleton } from "@/app/components/admin/ui/skeleton";
import { useJobPosts, getJobFieldValues, type AdminJobPost } from "@/lib/admin/use-job-posts";
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

/** Server-side search fires once per pause in typing, not once per keystroke. */
function useDebounced<T>(value: T, ms = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(timer);
  }, [value, ms]);
  return debounced;
}

function countLabel(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

function initialsFor(name: string): string {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?"
  );
}

function PostJobsTab() {
  const { jobPosts, pagination, loading, hasLoaded, error, fetchJobPosts, deleteJobPost, toggleJobStatus } = useJobPosts();
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [branchFilter, setBranchFilter] = useState<string>("all");
  const [branchOptions, setBranchOptions] = useState<{ value: string; label: string }[]>([]);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search);
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<AdminJobPost | null>(null);
  const [deleting, setDeleting] = useState<AdminJobPost | null>(null);
  const [pendingPostId, setPendingPostId] = useState<string | null>(null);
  const PAGE_SIZE = 12;

  // Branch filter options come from the job form's own endpoint rather than
  // /admin/locations, which is gated on tabs a manager may not hold.
  useEffect(() => {
    getJobFieldValues().then((values) => {
      setBranchOptions(values.branches.map((branch) => ({ value: branch.id, label: branch.name })));
    });
  }, []);

  // Search, the filters and paging are all server-side, so the grid shows one
  // page of matches and `total` counts every match.
  const loadJobs = useCallback(() => {
    void fetchJobPosts({
      status: filterStatus === "all" ? undefined : filterStatus,
      q: debouncedSearch.trim() || undefined,
      locationId: branchFilter === "all" ? undefined : branchFilter,
      page,
      limit: PAGE_SIZE,
    });
  }, [fetchJobPosts, filterStatus, branchFilter, debouncedSearch, page]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  /** After a mutation the grid refetches, and a create lands on page 1. */
  const refresh = () => {
    if (page === 1) loadJobs();
    else setPage(1);
  };

  const handleToggle = async (post: AdminJobPost) => {
    // Per-row pending, so rapid clicks cannot fire overlapping PATCHes and
    // leave the row showing a status that was never saved.
    if (pendingPostId) return;
    setPendingPostId(post.id);
    try {
      await toggleJobStatus(post.id);
      toast.success(post.status === "active" ? "Post closed" : "Post activated");
      refresh();
    } catch {
      toast.error("Failed to update job status");
    } finally {
      setPendingPostId(null);
    }
  };

  return (
    <>
      <ListToolbar
        query={search}
        onQueryChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        placeholder="Search jobs..."
      >
        {branchOptions.length > 1 && (
          <Dropdown
            options={[{ value: "all", label: "All Branches" }, ...branchOptions]}
            value={branchFilter}
            onChange={(value) => {
              setBranchFilter(value);
              setPage(1);
            }}
            placeholder="Filter by branch"
            aria-label="Filter by branch"
            className="w-full sm:w-48"
          />
        )}
        <Dropdown
          options={filterOptions}
          value={filterStatus}
          onChange={(value) => {
            setFilterStatus(value);
            setPage(1);
          }}
          placeholder="Filter by status"
          aria-label="Filter by status"
          className="w-full sm:w-48"
        />
        <button type="button" className={primaryButton} onClick={() => setCreateOpen(true)}>
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Post
        </button>
      </ListToolbar>

      {error ? (
        <p role="alert" className="rounded-lg border border-brand-red/40 bg-brand-red/10 px-4 py-3 text-sm text-brand-red">
          {error}
        </p>
      ) : loading && !hasLoaded ? (
        <TableSkeleton rows={4} />
      ) : jobPosts.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/5 py-12 text-center">
          <svg className="mx-auto h-12 w-12 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <h3 className="mt-4 text-sm font-medium text-white">No job posts found</h3>
          <p className="mt-1 text-sm text-white/50">Get started by creating a new job post.</p>
          <button type="button" className={`${primaryButton} mt-4`} onClick={() => setCreateOpen(true)}>
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Post
          </button>
        </div>
      ) : (
        <div className={`grid grid-cols-1 gap-4 transition-opacity md:grid-cols-2 lg:grid-cols-3 ${loading ? "opacity-60" : ""}`}>
          {jobPosts.map((post, index) => (
            <div
              key={post.id}
              className="group rounded-xl border border-white/10 bg-white/5 p-6 transition-all duration-200 hover:border-white/20 hover:bg-white/10 admin-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="mb-4 flex items-start justify-between gap-2">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[post.status]}`}
                >
                  {statusLabels[post.status]}
                </span>
                {/* Always visible, not hover-only: on a touch screen the old
                    hidden actions could never be reached, and a keyboard user
                    never saw them at all. */}
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => void handleToggle(post)}
                    disabled={pendingPostId === post.id}
                    aria-label={post.status === "active" ? `Close ${post.title}` : `Activate ${post.title}`}
                    title={post.status === "active" ? "Close post" : "Activate post"}
                    className="btn-press flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-lg text-white/50 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-brand-red disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {pendingPostId === post.id ? (
                      <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
                    ) : (
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {post.status === "active" ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        )}
                      </svg>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(post)}
                    aria-label={`Edit ${post.title}`}
                    title="Edit post"
                    className="btn-press flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-lg text-white/50 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-brand-red"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleting(post)}
                    aria-label={`Delete ${post.title}`}
                    title="Delete post"
                    className="btn-press flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-lg text-white/50 transition-colors hover:bg-brand-red/20 hover:text-brand-red focus-visible:outline-2 focus-visible:outline-brand-red"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              <h3 className="mb-2 font-display text-xl tracking-wide text-white">{post.title}</h3>

              <div className="mb-3 flex flex-wrap gap-2 text-sm text-white/50">
                <span className="flex items-center gap-1">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {post.location}
                </span>
                {/* The job type is free text now, so older rows still hold slugs like
                    "full-time". capitalize keeps those readable without a lookup map. */}
                <span className="flex items-center gap-1 capitalize">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {post.type}
                </span>
              </div>

              <p className="mb-4 text-sm font-medium text-brand-red">{post.salary}</p>

              <p className="mb-4 line-clamp-2 text-sm text-white/50">{post.description}</p>

              <div className="flex items-center justify-between border-t border-white/10 pt-4">
                <span className="text-xs text-white/30">{countLabel(post.applications, "application")}</span>
                <span className="text-xs text-white/30">Posted {new Date(post.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination page={pagination.page} total={pagination.total} size={pagination.limit} onChange={setPage} />

      {createOpen && (
        <JobFormModal
          onClose={() => setCreateOpen(false)}
          onSaved={() => {
            setCreateOpen(false);
            refresh();
          }}
        />
      )}
      {editing && (
        <JobFormModal
          post={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            refresh();
          }}
        />
      )}
      {deleting && (
        <ConfirmModal
          title="Delete job post?"
          message={`"${deleting.title}" and its ${countLabel(deleting.applications, "application")} will be removed for good. This cannot be undone.`}
          confirmLabel="Delete Post"
          onClose={() => setDeleting(null)}
          onConfirm={async () => {
            await deleteJobPost(deleting.id);
            toast.success("Job post deleted");
            refresh();
          }}
        />
      )}
    </>
  );
}

function ReviewApplicationsTab() {
  const {
    applications,
    pagination,
    loading,
    hasLoaded,
    error,
    fetchApplications,
    updateApplicationStatus,
    deleteApplication,
  } = useJobApplications();
  const { jobPosts, fetchJobPosts } = useJobPosts();
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterJob, setFilterJob] = useState<string>("all");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<AdminJobApplication | null>(null);
  const [pendingAppId, setPendingAppId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const loadApplications = useCallback(() => {
    void fetchApplications({
      status: filterStatus === "all" ? undefined : filterStatus,
      job_post_id: filterJob === "all" ? undefined : filterJob,
      q: debouncedSearch.trim() || undefined,
      page,
      limit: PAGE_SIZE,
    });
  }, [fetchApplications, filterStatus, filterJob, debouncedSearch, page]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  // The job dropdown and its options need every post, not the page currently in
  // the grid, so this is a separate unfiltered read with a raised limit.
  useEffect(() => {
    void fetchJobPosts({ limit: 100 });
  }, [fetchJobPosts]);

  /** After a mutation the grid refetches so the totals stay right. */
  const refresh = () => {
    if (page === 1) loadApplications();
    else setPage(1);
  };

  const handleStatusChange = async (app: AdminJobApplication, status: AdminJobApplication["status"]) => {
    if (pendingAppId) return;
    setPendingAppId(app.id);
    try {
      await updateApplicationStatus(app.id, status);
      toast.success(`Application ${appStatusLabels[status].toLowerCase()}`);
      // A status filter would otherwise keep showing a row it should hide.
      if (filterStatus !== "all") refresh();
    } catch {
      toast.error("Failed to update status");
    } finally {
      setPendingAppId(null);
    }
  };

  const jobOptions = [
    { value: "all", label: "All Jobs" },
    ...jobPosts.map((p) => ({ value: p.id, label: p.title })),
  ];

  return (
    <>
      <ListToolbar
        query={search}
        onQueryChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        placeholder="Search by name or email..."
      >
        <Dropdown
          options={jobOptions}
          value={filterJob}
          onChange={(value) => {
            setFilterJob(value);
            setPage(1);
          }}
          placeholder="Filter by job"
          aria-label="Filter by job"
          className="w-full sm:w-48"
        />
        <Dropdown
          options={appStatusOptions}
          value={filterStatus}
          onChange={(value) => {
            setFilterStatus(value);
            setPage(1);
          }}
          placeholder="Filter by status"
          aria-label="Filter by status"
          className="w-full sm:w-48"
        />
      </ListToolbar>

      {error ? (
        <p role="alert" className="rounded-lg border border-brand-red/40 bg-brand-red/10 px-4 py-3 text-sm text-brand-red">
          {error}
        </p>
      ) : loading && !hasLoaded ? (
        <TableSkeleton rows={5} />
      ) : applications.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/5 py-12 text-center">
          <svg className="mx-auto h-12 w-12 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-4 text-sm font-medium text-white">No applications found</h3>
          <p className="mt-1 text-sm text-white/50">Applications will appear here once candidates start applying.</p>
        </div>
      ) : (
        <div className={`space-y-3 transition-opacity ${loading ? "opacity-60" : ""}`}>
          {applications.map((app, index) => {
            const expanded = expandedId === app.id;
            return (
              <div
                key={app.id}
                className="rounded-xl border border-white/10 bg-white/5 transition-all duration-200 hover:border-white/20 admin-slide-up"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                {/* Header row — always visible. A real button, so the row can be
                    opened with the keyboard and announces its expanded state. */}
                <button
                  type="button"
                  aria-expanded={expanded}
                  onClick={() => setExpandedId(expanded ? null : app.id)}
                  className="flex w-full cursor-pointer items-center gap-4 p-4 text-left transition-colors hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-brand-red"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-medium text-white">
                    {initialsFor(app.applicantName)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="truncate text-sm font-medium text-white">{app.applicantName}</h4>
                      <span
                        className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium ${appStatusColors[app.status]}`}
                      >
                        {appStatusLabels[app.status]}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-3 text-xs text-white/40">
                      <span className="truncate">{app.email}</span>
                      <span className="hidden sm:inline">•</span>
                      <span className="hidden sm:inline">{app.jobTitle ?? "Unknown Job"}</span>
                      <span className="hidden sm:inline">•</span>
                      <span className="hidden sm:inline">{new Date(app.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <svg
                    className={`h-5 w-5 shrink-0 text-white/30 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Expanded detail */}
                {expanded && (
                  <div className="border-t border-white/10 px-4 pb-4 pt-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <h5 className="mb-2 text-xs font-medium uppercase tracking-wider text-white/40">Contact</h5>
                        <div className="space-y-1 text-sm text-white/70">
                          <p>Email: {app.email}</p>
                          {app.phone && <p>Phone: {app.phone}</p>}
                          <p>Applied: {new Date(app.createdAt).toLocaleString()}</p>
                          <p>Job: {app.jobTitle ?? "Unknown Job"}</p>
                        </div>
                      </div>
                      <div>
                        <h5 className="mb-2 text-xs font-medium uppercase tracking-wider text-white/40">Documents</h5>
                        <div className="space-y-1 text-sm">
                          {app.cvUrl ? (
                            <a
                              href={app.cvUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`View CV of ${app.applicantName}`}
                              className="inline-flex min-h-11 items-center gap-1 text-brand-red hover:underline"
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
                        <h5 className="mb-2 text-xs font-medium uppercase tracking-wider text-white/40">Cover Letter</h5>
                        <p className="whitespace-pre-wrap text-sm text-white/70">{app.coverLetter}</p>
                      </div>
                    )}

                    {app.notes && (
                      <div className="mt-4">
                        <h5 className="mb-2 text-xs font-medium uppercase tracking-wider text-white/40">Notes</h5>
                        <p className="text-sm text-white/70">{app.notes}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/10 pt-4">
                      {statusActions.map((action) => (
                        <button
                          key={action.value}
                          type="button"
                          onClick={() => void handleStatusChange(app, action.value)}
                          disabled={app.status === action.value || pendingAppId === app.id}
                          className="btn-press flex min-h-11 cursor-pointer items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/60 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          {pendingAppId === app.id && (
                            <Loader2 aria-hidden className="size-3.5 animate-spin" />
                          )}
                          {action.label}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setDeleting(app)}
                        disabled={pendingAppId === app.id}
                        className="btn-press ml-auto min-h-11 cursor-pointer rounded-lg border border-brand-red/30 px-3 py-1.5 text-xs text-brand-red transition-colors hover:bg-brand-red/10 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Pagination page={pagination.page} total={pagination.total} size={pagination.limit} onChange={setPage} />

      {deleting && (
        <ConfirmModal
          title="Delete application?"
          message={`The application from ${deleting.applicantName} for ${deleting.jobTitle ?? "this role"} will be removed for good. This cannot be undone.`}
          confirmLabel="Delete Application"
          onClose={() => setDeleting(null)}
          onConfirm={async () => {
            await deleteApplication(deleting.id);
            toast.success("Application deleted");
            refresh();
          }}
        />
      )}
    </>
  );
}

export default function JobPostsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("posts");

  return (
    <div className="admin-fade-in">
      <PageHeader title="Jobs" description="Manage job listings and review applicant submissions." />

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-lg border border-white/10 bg-white/5 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            aria-pressed={activeTab === tab.id}
            className={`flex-1 cursor-pointer rounded-md px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-brand-red ${
              activeTab === tab.id ? "bg-white/10 text-white" : "text-white/50 hover:text-white/70"
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
