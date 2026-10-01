"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import toast from "react-hot-toast";
import PageHeader from "@/app/components/admin/ui/page-header";
import { PageSkeleton } from "@/app/components/admin/ui/skeleton";
import Dropdown from "@/app/components/admin/ui/dropdown";
import { useJobPosts, mapJobPost, type AdminJobPost } from "@/lib/admin/use-job-posts";
import { api } from "@/lib/api";
import { getLocationOptions } from "@/lib/admin/location-options";
import { usePanel } from "@/lib/admin/use-panel";

const typeOptions = [
  { value: "full-time", label: "Full-time" },
  { value: "part-time", label: "Part-time" },
  { value: "contract", label: "Contract" },
];

const statusOptions = [
  { value: "active", label: "Active" },
  { value: "draft", label: "Draft" },
  { value: "closed", label: "Closed" },
];

function EditForm({ post }: { post: NonNullable<ReturnType<ReturnType<typeof useJobPosts>["getJobPost"]>> }) {
  const panel = usePanel();
  const router = useRouter();
  const { updateJobPost, deleteJobPost } = useJobPosts();

  const [locationOpts, setLocationOpts] = useState<{ value: string; label: string }[]>([]);
  const [title, setTitle] = useState(post.title);
  const [location, setLocation] = useState(post.location);
  const [type, setType] = useState<string>(post.type);
  const [salary, setSalary] = useState(post.salary);
  const [description, setDescription] = useState(post.description);
  const [requirements, setRequirements] = useState<string[]>(
    post.requirements.length > 0 ? post.requirements : [""]
  );
  const [status, setStatus] = useState<string>(post.status);
  const [requirementsError, setRequirementsError] = useState<string>("");
  const [saveError, setSaveError] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Swallow the failure rather than leaving an unhandled rejection; the
    // dropdown simply stays empty and the form keeps the saved value.
    getLocationOptions().then(setLocationOpts).catch(() => {});
  }, []);

  const addRequirement = () => {
    setRequirements([...requirements, ""]);
  };

  const updateRequirement = (index: number, value: string) => {
    const updated = [...requirements];
    updated[index] = value;
    setRequirements(updated);
    if (updated.some((r) => r.trim() !== "")) setRequirementsError("");
  };

  const removeRequirement = (index: number) => {
    if (requirements.length > 1) {
      setRequirements(requirements.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const filteredRequirements = requirements.filter((r) => r.trim() !== "");
    if (filteredRequirements.length === 0) {
      setRequirementsError("Add at least one requirement.");
      return;
    }
    setRequirementsError("");
    // Await the write before navigating. Pushing first unmounted this
    // component, so a validation failure became an unhandled rejection with
    // no message and the user landed on the list believing it saved.
    setSubmitting(true);
    try {
      await updateJobPost(post.id, {
        title,
        location,
        type: type as "full-time" | "part-time" | "contract",
        salary,
        description,
        requirements: filteredRequirements,
        status: status as "active" | "closed" | "draft",
      });
      toast.success("Job post updated");
      router.push(panel.href("posts"));
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Could not update the job post.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this job post?")) return;
    setSubmitting(true);
    try {
      await deleteJobPost(post.id);
      toast.success("Job post deleted");
      router.push(panel.href("posts"));
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Could not delete the job post.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Edit Job Post"
        description={`Editing: ${post.title}`}
        action={
          <button
            onClick={() => void handleDelete()}
            disabled={submitting}
            className="btn-press rounded-lg border border-brand-red/50 px-4 py-2.5 text-sm text-brand-red transition-colors hover:bg-brand-red/10 disabled:opacity-50"
          >
            Delete Post
          </button>
        }
      />

      {saveError && (
        <p role="alert" className="mb-4 rounded-lg border border-brand-red/40 bg-brand-red/10 px-4 py-3 text-sm text-brand-red">
          {saveError}
        </p>
      )}

      <form onSubmit={handleSubmit} className="max-w-3xl">
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <div className="space-y-6">
            {/* Title */}
            <div>
              <label className="mb-2 block text-sm font-medium text-white">
                Job Title <span className="text-brand-red">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="e.g. Restaurant Manager"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-brand-red/50"
              />
            </div>

            {/* Location and Type */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-white">
                  Location <span className="text-brand-red">*</span>
                </label>
                <Dropdown
                  options={locationOpts}
                  value={location}
                  onChange={setLocation}
                  placeholder="Select location"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-white">
                  Job Type <span className="text-brand-red">*</span>
                </label>
                <Dropdown
                  options={typeOptions}
                  value={type}
                  onChange={setType}
                  placeholder="Select type"
                />
              </div>
            </div>

            {/* Salary and Status */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-white">
                  Salary <span className="text-brand-red">*</span>
                </label>
                <input
                  type="text"
                  value={salary}
                  onChange={(e) => setSalary(e.target.value)}
                  required
                  placeholder="e.g. £25,000 - £30,000"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-brand-red/50"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-white">Status</label>
                <Dropdown
                  options={statusOptions}
                  value={status}
                  onChange={setStatus}
                  placeholder="Select status"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="mb-2 block text-sm font-medium text-white">
                Description <span className="text-brand-red">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={4}
                placeholder="Describe the role, responsibilities, and what makes it a great opportunity..."
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-brand-red/50"
              />
            </div>

            {/* Requirements */}
            <div>
              <label className="mb-2 block text-sm font-medium text-white">
                Requirements
              </label>
              {requirementsError && (
                <p className="mb-2 text-xs text-brand-red">{requirementsError}</p>
              )}
              <div className="space-y-3">
                {requirements.map((req, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={req}
                      onChange={(e) => updateRequirement(index, e.target.value)}
                      placeholder={`Requirement ${index + 1}`}
                      className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-brand-red/50"
                    />
                    <button
                      type="button"
                      onClick={() => removeRequirement(index)}
                      className="btn-press rounded-lg p-2.5 text-white/50 transition-colors hover:bg-brand-red/20 hover:text-brand-red"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addRequirement}
                  className="btn-press flex items-center gap-2 rounded-lg border border-dashed border-white/20 px-4 py-2.5 text-sm text-white/50 transition-colors hover:border-white/40 hover:text-white"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Requirement
                </button>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="mt-8 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="btn-press rounded-lg border border-white/10 px-6 py-2.5 text-sm text-white/50 transition-colors hover:bg-white/5 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-press rounded-lg bg-brand-red px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
            >
              {submitting ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>
      </form>
    </>
  );
}

export default function EditJobPostPage() {
  const panel = usePanel();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [post, setPost] = useState<AdminJobPost | null>(null);
  // Which id has finished loading. Comparing against it keeps `loading`
  // derived, which avoids a setState in the effect body.
  const [resolvedId, setResolvedId] = useState<string | null>(null);

  // Fetch this post directly. Reading it out of the cached list via
  // getJobPost captured a stale closure that always saw an empty list, and
  // getJobPost's identity changed after every fetch, so the effect re-ran
  // forever and refetched in a loop. GET /admin/jobs/:id already exists.
  useEffect(() => {
    let cancelled = false;
    api
      .get<Record<string, unknown>>(`/admin/jobs/${id}`)
      .then((value) => {
        if (cancelled) return;
        setPost(mapJobPost(value));
        setResolvedId(id);
      })
      .catch(() => {
        if (cancelled) return;
        setPost(null);
        setResolvedId(id);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const loading = resolvedId !== id;

  if (loading) return <PageSkeleton />;

  if (!post) {
    return (
      <div className="admin-fade-in">
        <PageHeader title="Job Post Not Found" />
        <div className="rounded-xl border border-white/10 bg-white/5 py-12 text-center">
          <p className="text-sm text-white/50">This job post does not exist.</p>
          <button
            onClick={() => router.push(panel.href("posts"))}
            className="btn-press mt-4 rounded-lg bg-brand-red px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700"
          >
            Back to Posts
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-fade-in">
      <EditForm post={post} />
    </div>
  );
}
