"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import PageHeader from "@/components/admin/ui/page-header";
import Dropdown from "@/components/admin/ui/dropdown";
import { useJobPosts } from "@/lib/admin/use-job-posts";
import { getLocationOptions } from "@/lib/admin/location-options";

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

  useEffect(() => {
    getLocationOptions().then(setLocationOpts);
  }, []);

  const addRequirement = () => {
    setRequirements([...requirements, ""]);
  };

  const updateRequirement = (index: number, value: string) => {
    const updated = [...requirements];
    updated[index] = value;
    setRequirements(updated);
  };

  const removeRequirement = (index: number) => {
    if (requirements.length > 1) {
      setRequirements(requirements.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const filteredRequirements = requirements.filter((r) => r.trim() !== "");
    updateJobPost(post.id, {
      title,
      location,
      type: type as "full-time" | "part-time" | "contract",
      salary,
      description,
      requirements: filteredRequirements,
      status: status as "active" | "closed" | "draft",
    });
    router.push("/admin/posts");
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this job post?")) {
      deleteJobPost(post.id);
      router.push("/admin/posts");
    }
  };

  return (
    <>
      <PageHeader
        title="Edit Job Post"
        description={`Editing: ${post.title}`}
        action={
          <button
            onClick={handleDelete}
            className="btn-press rounded-lg border border-brand-red/50 px-4 py-2.5 text-sm text-brand-red transition-colors hover:bg-brand-red/10"
          >
            Delete Post
          </button>
        }
      />

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
              className="btn-press rounded-lg bg-brand-red px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700"
            >
              Save Changes
            </button>
          </div>
        </div>
      </form>
    </>
  );
}

export default function EditJobPostPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { getJobPost, fetchJobPosts } = useJobPosts();

  const [post, setPost] = useState(getJobPost(id));
  const [loading, setLoading] = useState(!post);

  useEffect(() => {
    if (post) return;
    fetchJobPosts().then(() => {
      const found = getJobPost(id);
      setPost(found);
      setLoading(false);
    });
  }, [id, post, fetchJobPosts, getJobPost]);

  if (loading) {
    return (
      <div className="admin-fade-in">
        <PageHeader title="Loading..." />
        <div className="rounded-xl border border-white/10 bg-white/5 py-12 text-center">
          <p className="text-sm text-white/50">Loading job post...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="admin-fade-in">
        <PageHeader title="Job Post Not Found" />
        <div className="rounded-xl border border-white/10 bg-white/5 py-12 text-center">
          <p className="text-sm text-white/50">This job post does not exist.</p>
          <button
            onClick={() => router.push("/admin/posts")}
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
