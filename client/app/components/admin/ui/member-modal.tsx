"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Pencil, Trash2, ShieldCheck, UserRound } from "lucide-react";
import Modal from "@/app/components/admin/ui/modal";
import ActionButton from "@/app/components/admin/ui/action-button";
import ConfirmModal from "@/app/components/admin/ui/confirm-modal";
import TeamAccessFields from "@/app/components/admin/ui/team-access-fields";
import { adminInput } from "@/app/components/admin/ui/list-toolbar";
import { api } from "@/lib/api";
import { assignableRoles, normalizeRole, roleLabel, ROLE_ACCESS, type AdminRole } from "@/lib/admin/roles";
import { TAB_PICKER_LABELS, type AdminTabId } from "@/lib/admin/tabs";

type Member = {
  id: string;
  name: string;
  email: string;
  role: string;
  position: string | null;
  is_active: boolean;
  tabs: string[];
  branches: { id: string; name: string }[];
};

type Branch = { id: string; name: string };

/**
 * Viewing a team member used to be a separate page, so opening one threw away
 * the list's search and filters and put "back" on the shoulders of the person.
 * This keeps the list underneath and offers Edit and Delete from the same place.
 */
export default function MemberModal({
  memberId,
  branches,
  actorRole,
  actorTabs,
  currentUserId,
  canDelete,
  onClose,
  onChanged,
  onDeleted,
}: {
  memberId: string;
  branches: Branch[];
  actorRole: AdminRole;
  actorTabs: string[];
  currentUserId?: string;
  canDelete: boolean;
  onClose: () => void;
  onChanged: () => void;
  onDeleted: () => void;
}) {
  const [person, setPerson] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Edit-mode copies, only committed on save.
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AdminRole>("staff");
  const [position, setPosition] = useState("");
  const [tabs, setTabs] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      setPerson(await api.get<Member>(`/admin/staff/${memberId}`));
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Could not load this team member.");
    } finally {
      setLoading(false);
    }
  }, [memberId]);

  // Queueing off the effect's synchronous path matches the other admin pages
  // and keeps the state update out of the effect body itself.
  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

  const startEdit = () => {
    if (!person) return;
    setName(person.name);
    setEmail(person.email);
    setRole(normalizeRole(person.role));
    setPosition(person.position ?? "");
    setTabs(person.tabs);
    setSelected(person.branches.map((branch) => branch.id));
    setError("");
    setMode("edit");
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving || !person) return;
    if (selected.length === 0 && !["superadmin", "branch_manager"].includes(normalizeRole(role))) {
      setError("Choose at least one branch.");
      return;
    }
    if (normalizeRole(role) === "staff" && !position.trim()) {
      setError("Choose a job position for this team member.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await api.patch(`/admin/staff/${person.id}`, {
        name: name.trim(),
        email: email.trim(),
role: normalizeRole(role),
        position: normalizeRole(role) === "staff" ? position.trim() : null,
        tabs,
        branchIds: selected,
      });
      toast.success("Team member updated");
      await load();
      onChanged();
      setMode("view");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save this person.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!person) return;
    await api.delete(`/admin/staff/${person.id}`);
    toast.success(`${person.name} deleted`);
    setConfirmDelete(false);
    onDeleted();
    onClose();
  };

  const isSelf = person?.id === currentUserId;

  return (
    <>
      <Modal
        onClose={onClose}
        title={mode === "edit" ? "Edit team member" : person?.name ?? "Team member"}
        busy={saving}
        size="wide"
      >
        {loading ? (
          <p className="py-8 text-center text-sm text-white/45">Loading…</p>
        ) : loadError || !person ? (
          <div role="alert" className="rounded-lg border border-brand-red/40 bg-brand-red/10 px-4 py-3 text-sm text-brand-red">
            {loadError || "Team member not found."}
            <div className="mt-3 flex gap-3">
              <ActionButton type="button" variant="secondary" onClick={() => void load()}>
                Try again
              </ActionButton>
              <ActionButton type="button" variant="ghost" onClick={onClose}>
                Close
              </ActionButton>
            </div>
          </div>
        ) : mode === "edit" ? (
          <form onSubmit={(event) => void save(event)} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="member-name" className="mb-1.5 block text-sm text-white/60">
                  Full name
                </label>
                <input
                  id="member-name"
                  required
                  maxLength={200}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className={adminInput}
                />
              </div>
              <div>
                <label htmlFor="member-email" className="mb-1.5 block text-sm text-white/60">
                  Email address
                </label>
                <input
                  id="member-email"
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className={adminInput}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="member-role" className="text-sm text-white/60">
                Account role
              </label>
              {person.role === "superadmin" || actorRole === "branch_manager" ? (
                <p className="text-sm text-white">{roleLabel(person.role)}</p>
              ) : (
                <select
                  id="member-role"
                  value={role}
                  onChange={(event) => {
                    const next = event.target.value as AdminRole;
                    setRole(next);
                    setTabs((current) => current.filter((tab) => ROLE_ACCESS[next].includes(tab)));
                  }}
                  className={adminInput}
                >
                  {assignableRoles(actorRole).map((value) => (
                    <option key={value} value={value}>
                      {roleLabel(value)}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <TeamAccessFields
              role={role}
              position={position}
              onPositionChange={setPosition}
              tabs={tabs}
              onTabsChange={setTabs}
              branchIds={selected}
              onBranchesChange={setSelected}
              branches={branches}
              actorRole={actorRole}
              actorTabs={actorTabs}
            />

            {error && (
              <p role="alert" className="rounded-lg border border-brand-red/40 bg-brand-red/10 px-4 py-3 text-sm text-brand-red">
                {error}
              </p>
            )}

            <div className="flex justify-end gap-3 border-t border-white/10 pt-5">
              <ActionButton type="button" variant="secondary" onClick={() => setMode("view")} disabled={saving}>
                Cancel
              </ActionButton>
              <ActionButton type="submit" busy={saving} busyLabel="Saving…">
                Save changes
              </ActionButton>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <span
                aria-hidden
                className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-xl font-semibold text-white"
              >
                {person.name.trim().charAt(0).toUpperCase() || <UserRound className="size-6" />}
              </span>
              <div className="min-w-0">
                <p className="truncate text-lg font-medium text-white">{person.name}</p>
                <p className="truncate text-sm text-white/60">{person.email}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-white/75">
                    {roleLabel(person.role)}
                  </span>
                  {person.position && (
                    <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-white/75">
                      {person.position}
                    </span>
                  )}
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs ${
                      person.is_active ? "bg-green-500/15 text-green-300" : "bg-white/10 text-white/50"
                    }`}
                  >
                    {person.is_active ? "Active" : "Inactive"}
                  </span>
                  {isSelf && (
                    <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-white/60">This is you</span>
                  )}
                </div>
              </div>
            </div>

            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-wider text-white/40">Branches</dt>
                <dd className="mt-1 text-sm text-white/80">
                  {person.branches.map((branch) => branch.name).join(", ") || "All branches"}
                </dd>
              </div>
              <div>
                <dt className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-white/40">
                  <ShieldCheck aria-hidden className="size-3.5" />
                  Access
                </dt>
                <dd className="mt-1 text-sm leading-relaxed text-white/80">
                  {person.role === "superadmin"
                    ? "Full access"
                    : person.tabs
                        .map((tab) => TAB_PICKER_LABELS[tab as AdminTabId] ?? tab)
                        .join(", ") || "No areas selected"}
                </dd>
              </div>
            </dl>

            <div className="flex flex-wrap justify-between gap-3 border-t border-white/10 pt-5">
              {/* Deactivating is reversible and keeps the record, so it stays
                  available to managers. Deleting erases the login for good. */}
              {canDelete ? (
                <ActionButton
                  type="button"
                  variant="secondary"
                  disabled={isSelf}
                  title={isSelf ? "You cannot delete your own account" : undefined}
                  onClick={() => setConfirmDelete(true)}
                  className="border-brand-red/40 text-brand-red hover:bg-brand-red/10"
                >
                  <Trash2 aria-hidden className="size-4" />
                  Delete
                </ActionButton>
              ) : (
                <span />
              )}
              <ActionButton type="button" onClick={startEdit}>
                <Pencil aria-hidden className="size-4" />
                Edit
              </ActionButton>
            </div>
          </div>
        )}
      </Modal>

      {confirmDelete && person && (
        <ConfirmModal
          title={`Delete ${person.name}?`}
          message={`This permanently removes their login and branch assignments. If you only want to block sign-in, deactivate the account instead.`}
          confirmLabel="Delete team member"
          onClose={() => setConfirmDelete(false)}
          onConfirm={remove}
        />
      )}
    </>
  );
}