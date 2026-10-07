"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import Modal from "@/app/components/admin/ui/modal";
import Dropdown from "@/app/components/admin/ui/dropdown";
import JobScopeFields from "@/app/components/admin/ui/job-scope-fields";
import { adminInput, primaryButton, secondaryButton } from "@/app/components/admin/ui/list-toolbar";
import { useJobPosts, type AdminJobPost } from "@/lib/admin/use-job-posts";

const statusOptions = [
  { value: "active", label: "Active" },
  { value: "draft", label: "Draft" },
  { value: "closed", label: "Closed" },
];

/**
 * Create and edit job posts in one modal form shared by both, so the fields can
 * never drift apart. `post` is undefined for a create.
 *
 * The submit bar is pinned to the bottom of the dialog: the form is long
 * enough that a button scrolled out of sight reads as a dead end. Labels wrap
 * their inputs, so every field has a real accessible name.
 */
export default function JobFormModal({
  post,
  onClose,
  onSaved,
}: {
  post?: AdminJobPost;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { addJobPost, updateJobPost } = useJobPosts();

  const [locationId, setLocationId] = useState<string | null>(post?.locationId ?? null);
  const [title, setTitle] = useState(post?.title ?? "");
  const [titleAr, setTitleAr] = useState(post?.titleAr ?? "");
  const [type, setType] = useState(post?.type ?? "");
  const [salary, setSalary] = useState(post?.salary ?? "");
  const [description, setDescription] = useState(post?.description ?? "");
  const [descriptionAr, setDescriptionAr] = useState(post?.descriptionAr ?? "");
  const [requirements, setRequirements] = useState<string[]>(post?.requirements.length ? post.requirements : [""]);
  const [requirementsAr, setRequirementsAr] = useState<string[]>(post?.requirementsAr.length ? post.requirementsAr : [""]);
  const [status, setStatus] = useState<string>(post?.status ?? "draft");
  const [fieldError, setFieldError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const filteredRequirements = requirements.filter((r) => r.trim() !== "");
    if (filteredRequirements.length === 0) {
      setFieldError("Add at least one requirement.");
      return;
    }
    // A create always names a branch. An edit of a post from before branch
    // scoping may still have none, and the API leaves that as it is.
    if (!post && !locationId) {
      setFieldError("Choose a branch for this job post.");
      return;
    }
    setFieldError("");
    setSaveError("");
    setSubmitting(true);
    try {
      const payload = {
        title,
        titleAr,
        type,
        salary,
        description,
        descriptionAr,
        requirements: filteredRequirements,
        requirementsAr: requirementsAr.filter((r) => r.trim() !== ""),
        status: status as "active" | "closed" | "draft",
      };
      if (post) {
        await updateJobPost(post.id, { ...payload, locationId: locationId ?? undefined });
        toast.success("Job post updated");
      } else {
        await addJobPost({ ...payload, locationId: locationId as string });
        toast.success("Job post created");
      }
      onSaved();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Could not save the job post.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title={post ? "Edit Job Post" : "Create Job Post"} onClose={onClose} busy={submitting}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block text-sm text-white/50">
            Job Title <span className="text-brand-red">*</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="e.g. Restaurant Manager"
              className={`mt-1 ${adminInput}`}
            />
          </label>
          <label className="block text-sm text-white/50">
            Job Title (Arabic)
            <input
              type="text"
              value={titleAr}
              onChange={(e) => setTitleAr(e.target.value)}
              placeholder="Optional. Shown in the Arabic store"
              className={`mt-1 ${adminInput}`}
              dir="rtl"
            />
          </label>
        </div>

        <JobScopeFields
          locationId={locationId}
          onLocationChange={setLocationId}
          type={type}
          onTypeChange={setType}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block text-sm text-white/50">
            Salary <span className="text-brand-red">*</span>
            <input
              type="text"
              value={salary}
              onChange={(e) => setSalary(e.target.value)}
              required
              placeholder="e.g. £25,000 - £30,000"
              className={`mt-1 ${adminInput}`}
            />
          </label>
          <label className="block text-sm text-white/50">
            Status
            <div className="mt-1">
              <Dropdown
                options={statusOptions}
                value={status}
                onChange={setStatus}
                placeholder="Select status"
                className="w-full"
              />
            </div>
          </label>
        </div>

        <label className="block text-sm text-white/50">
          Description <span className="text-brand-red">*</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={4}
            placeholder="Describe the role, responsibilities, and what makes it a great opportunity..."
            className={`mt-1 ${adminInput}`}
          />
        </label>

        <label className="block text-sm text-white/50">
          Description (Arabic)
          <textarea
            value={descriptionAr}
            onChange={(e) => setDescriptionAr(e.target.value)}
            rows={4}
            placeholder="Optional. Shown in the Arabic store"
            className={`mt-1 ${adminInput}`}
            dir="rtl"
          />
        </label>

        <RequirementRows
          legend="Requirements"
          hint="At least one. Applicants see these as a checklist."
          values={requirements}
          onChange={setRequirements}
        />

        <RequirementRows
          legend="Requirements (Arabic)"
          hint="Optional. Shown in the Arabic store; falls back to English when empty."
          values={requirementsAr}
          onChange={setRequirementsAr}
          dir="rtl"
        />

        {(fieldError || saveError) && (
          <p role="alert" className="m-0 rounded-lg border border-brand-red/40 bg-brand-red/10 px-4 py-3 text-sm text-brand-red">
            {fieldError || saveError}
          </p>
        )}

        <div className="sticky bottom-0 -mx-6 flex justify-end gap-3 border-t border-white/10 bg-[#0b0b0b] px-6 py-4">
          <button type="button" onClick={onClose} disabled={submitting} className={secondaryButton}>
            Cancel
          </button>
          <button type="submit" disabled={submitting} className={primaryButton}>
            {submitting ? (post ? "Saving…" : "Creating…") : post ? "Save Changes" : "Create Job Post"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/** Repeatable list of short lines with add and remove rows. */
function RequirementRows({
  legend,
  hint,
  values,
  onChange,
  dir,
}: {
  legend: string;
  hint: string;
  values: string[];
  onChange: (next: string[]) => void;
  dir?: "rtl";
}) {
  return (
    <fieldset>
      <legend className="text-sm font-medium text-white">{legend}</legend>
      <p className="mt-1 text-xs text-white/40">{hint}</p>
      <div className="mt-2 space-y-3">
        {values.map((value, index) => (
          <div key={index} className="flex gap-2">
            <input
              type="text"
              value={value}
              onChange={(e) => {
                const next = [...values];
                next[index] = e.target.value;
                onChange(next);
              }}
              placeholder={`${legend} ${index + 1}`}
              aria-label={`${legend} ${index + 1}`}
              className={`flex-1 ${adminInput}`}
              dir={dir}
            />
            {/* Hidden on the last row: one row must always stay so the list is
                never left without an input to type in. */}
            {values.length > 1 && (
              <button
                type="button"
                onClick={() => onChange(values.filter((_, i) => i !== index))}
                aria-label={`Remove ${legend} ${index + 1}`}
                className="btn-press flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-lg text-white/50 transition-colors hover:bg-brand-red/20 hover:text-brand-red focus-visible:outline-2 focus-visible:outline-brand-red"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() => onChange([...values, ""])}
          className="btn-press flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-dashed border-white/20 px-4 py-2.5 text-sm text-white/50 transition-colors hover:border-white/40 hover:text-white focus-visible:outline-2 focus-visible:outline-brand-red"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add {legend}
        </button>
      </div>
    </fieldset>
  );
}
