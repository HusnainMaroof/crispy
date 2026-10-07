"use client";

import { useEffect, useId, useState } from "react";
import Dropdown from "@/app/components/admin/ui/dropdown";
import { getJobFieldValues } from "@/lib/admin/use-job-posts";

const FIELD =
  "w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-brand-red/50";

type ScopeProps = {
  /** Branch id, or null for a post that predates branch scoping. */
  locationId: string | null;
  onLocationChange: (locationId: string) => void;
  /** Free text. See `getJobFieldValues`. */
  type: string;
  onTypeChange: (type: string) => void;
};

/**
 * Branch picker plus the free-text job type field, shared by the create and edit
 * forms so both stay in step.
 *
 * Both lists come from `/admin/jobs/field-values`, which the server already
 * limits to the branches this admin manages. When only one branch comes back the
 * picker is locked to it, because there is no choice to offer.
 * `server/src/controllers/admin/jobs.controller.ts` re-checks the branch on
 * write regardless, so a tampered client cannot post outside its own branches.
 */
export default function JobScopeFields({
  locationId,
  onLocationChange,
  type,
  onTypeChange,
}: ScopeProps) {
  const typeListId = useId();
  const [branchOptions, setBranchOptions] = useState<{ value: string; label: string }[]>([]);
  const [typeOptions, setTypeOptions] = useState<string[]>([]);
  const [branchError, setBranchError] = useState("");

  useEffect(() => {
    let live = true;
    getJobFieldValues().then((values) => {
      if (!live) return;
      setTypeOptions(values.types);
      const options = values.branches.map((branch) => ({ value: branch.id, label: branch.name }));
      setBranchOptions(options);
      setBranchError(options.length ? "" : "No active branches available for your account.");

      // Only fill a blank field, and only against the value this form mounted
      // with. Blindly overwriting would silently move a post to another branch
      // when editing: the option list holds active branches only, so a post on a
      // since-deactivated branch is missing from it and the picker would rewrite
      // the branch on save with no prompt.
      if (options.length === 1 && options[0].value !== locationId) {
        onLocationChange(options[0].value);
      }
    });
    return () => {
      live = false;
    };
    // Runs once on mount, so `locationId` here is the value the form opened with,
    // which is the comparison above wants. Depending on it would re-run the load
    // on every parent render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const singleBranch = branchOptions.length === 1;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div>
        <label className="mb-2 block text-sm font-medium text-white">
          Branch <span className="text-brand-red">*</span>
        </label>
        <Dropdown
          options={branchOptions}
          value={locationId ?? ""}
          onChange={onLocationChange}
          placeholder="Select branch"
          disabled={singleBranch}
        />
        {branchError && <p className="mt-2 text-xs text-brand-red">{branchError}</p>}
        {singleBranch && (
          <p className="mt-2 text-xs text-white/40">Locked to your branch.</p>
        )}
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-white" htmlFor={`${typeListId}-type`}>
          Job Type <span className="text-brand-red">*</span>
        </label>
        {/* A datalist rather than a select: the field is free text, so a manager
            can introduce a type nobody uses yet while still seeing what is in use. */}
        <input
          id={`${typeListId}-type`}
          type="text"
          list={typeListId}
          value={type}
          onChange={(e) => onTypeChange(e.target.value)}
          required
          placeholder="e.g. Full-time"
          className={FIELD}
        />
        <datalist id={typeListId}>
          {typeOptions.map((option) => (
            <option key={option} value={option} />
          ))}
        </datalist>
      </div>
    </div>
  );
}
