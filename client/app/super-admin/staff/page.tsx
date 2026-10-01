"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Plus, ArrowUpRight } from "lucide-react";
import PageHeader from "@/app/components/admin/ui/page-header";
import Modal from "@/app/components/admin/ui/modal";
import Dropdown from "@/app/components/admin/ui/dropdown";
import TeamAccessFields from "@/app/components/admin/ui/team-access-fields";
import { ListToolbar, ListMessage, Pagination, adminInput, primaryButton, secondaryButton } from "@/app/components/admin/ui/list-toolbar";
import { TableSkeleton } from "@/app/components/admin/ui/skeleton";
import { api, type Pagination as PageMeta } from "@/lib/api";
import { TAB_PICKER_LABELS, type AdminTabId } from "@/lib/admin/tabs";
import { assignableRoles, normalizeRole, roleLabel, ROLE_DEFAULTS, type AdminRole } from "@/lib/admin/roles";
import { useAdminSession } from "@/lib/admin/session";
import { usePanel } from "@/lib/admin/use-panel";

type Branch = { id: string; name: string };
type StaffRow = { id: string; name: string; email: string; role: string; position?: string | null; tabs: string[]; is_active: boolean; branches: Branch[] };
const emptyForm = { name: "", email: "", password: "", role: "staff" as AdminRole, position: "", tabs: [...ROLE_DEFAULTS.staff], branchIds: [] as string[] };
const PAGE_SIZE = 20;

export default function StaffPage() {
  const panel = usePanel();
  const { user } = useAdminSession();
  const actorRole = normalizeRole(user?.role);
  const isManager = actorRole === "branch_manager";
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [pagination, setPagination] = useState<PageMeta>({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [query, setQuery] = useState("");
  const [branchFilter, setBranchFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  // Search, the three dropdowns and paging all run in the database, which is
  // also where the role/branch visibility rule lives. `total` therefore counts
  // every row the actor may see, not the rows on this page.
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      if (branchFilter !== "all") params.set("branch_id", branchFilter);
      if (roleFilter !== "all") params.set("role", roleFilter);
      if (statusFilter !== "all") params.set("is_active", String(statusFilter === "active"));
      params.set("page", String(page));
      params.set("limit", String(PAGE_SIZE));
      const [people, places] = await Promise.all([
        api.getPage<StaffRow>(`/admin/staff?${params.toString()}`),
        api.get<Branch[]>("/admin/locations"),
      ]);
      setStaff(people.items); setPagination(people.pagination); setBranches(places); setError("");
    } catch (err) { setError(err instanceof Error ? err.message : "Could not load the team."); }
    finally { setLoading(false); }
  }, [query, branchFilter, roleFilter, statusFilter, page]);
  useEffect(() => { queueMicrotask(() => { void load(); }); }, [load]);
  const permittedDefaults = (role: AdminRole) => ROLE_DEFAULTS[role].filter((tab) => actorRole === "superadmin" || user?.tabs.includes(tab));
  function openModal() {
    setError(""); setForm({ ...emptyForm, tabs: permittedDefaults("staff"), branchIds: branches.length === 1 ? [branches[0].id] : [] }); setOpen(true);
  }
  async function create(event: React.FormEvent) {
    event.preventDefault();
    if (form.branchIds.length === 0) { setError("Choose at least one branch."); return; }
    if (form.tabs.length === 0) { setError("Choose at least one area of access."); return; }
    if (form.role === "staff" && !form.position.trim()) { setError("Choose a job position for this team member."); return; }
    setSaving(true); setError("");
    try {
      await api.post("/admin/staff", { ...form, position: form.role === "staff" ? form.position.trim() : null });
      setOpen(false); toast.success("Team member added"); await load();
    } catch (err) { setError(err instanceof Error ? err.message : "Could not add this person."); }
    finally { setSaving(false); }
  }
  return <div>
    <PageHeader title="Team" description={isManager ? "Manage the people working in your branches." : "People, branch assignments, and access across your business."} action={<button className={primaryButton} onClick={openModal}><Plus className="h-4 w-4" />Add team member</button>} />
    <ListToolbar query={query} onQueryChange={(value) => { setQuery(value); setPage(1); }} placeholder="Search name, email, or job position">
      <Dropdown aria-label="Filter by branch" className="w-full sm:w-44" value={branchFilter} onChange={(value) => { setBranchFilter(value); setPage(1); }} options={[{ value: "all", label: "All branches" }, ...branches.map((branch) => ({ value: branch.id, label: branch.name }))]} />
      <Dropdown aria-label="Filter by role" className="w-full sm:w-44" value={roleFilter} onChange={(value) => { setRoleFilter(value); setPage(1); }} options={[{ value: "all", label: "All roles" }, ...assignableRoles(actorRole).map((role) => ({ value: role, label: roleLabel(role) }))]} />
      <Dropdown aria-label="Filter by status" className="w-full sm:w-36" value={statusFilter} onChange={(value) => { setStatusFilter(value); setPage(1); }} options={[{ value: "all", label: "Any status" }, { value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }]} />
    </ListToolbar>
    {!open && error && <div role="alert" className="mb-5 flex items-center gap-4 text-sm text-red-400">{error}<button className={secondaryButton} onClick={() => void load()}>Retry</button></div>}
    {loading ? <TableSkeleton /> : staff.length === 0 ? <ListMessage title="No team members found" detail="Try another search or change your filters." /> : <>
      <div className="overflow-x-auto rounded-xl border border-white/10"><table className="w-full min-w-[760px] text-left text-sm">
        <thead className="border-b border-white/10 bg-white/[0.025] text-xs uppercase tracking-wider text-white/50"><tr>{["Person", "Role / position", "Branches", "Access", "Status", ""].map((heading) => <th key={heading} scope="col" className="px-5 py-4 font-medium">{heading || <span className="sr-only">Manage</span>}</th>)}</tr></thead>
        <tbody className="divide-y divide-white/10">{staff.map((person) => <tr key={person.id} className="transition-colors hover:bg-white/[0.03]">
          <td className="px-5 py-4"><Link href={panel.href(`staff/${person.id}`)} className="font-medium text-white hover:underline">{person.name}</Link><p className="mt-1 text-xs text-white/50">{person.email}</p></td>
          <td className="px-5 py-4 text-white/80">{roleLabel(person.role)}{person.position && <p className="mt-1 text-xs text-white/50">{person.position}</p>}</td>
          <td className="max-w-52 px-5 py-4 text-white/70">{person.branches.map((branch) => branch.name).join(", ") || "All branches"}</td>
          <td className="max-w-64 px-5 py-4 text-xs leading-relaxed text-white/60">{person.role === "superadmin" ? "Full access" : person.tabs.map((tab) => TAB_PICKER_LABELS[tab as AdminTabId] ?? tab).join(", ")}</td>
          <td className="px-5 py-4 text-white/70">{person.is_active ? "Active" : "Inactive"}</td>
          <td className="px-5 py-4"><Link href={panel.href(`staff/${person.id}`)} aria-label={`Manage ${person.name}`} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-white/60 hover:bg-white/10 hover:text-white"><ArrowUpRight className="h-4 w-4" /></Link></td>
        </tr>)}</tbody>
      </table></div><Pagination page={pagination.page} total={pagination.total} size={pagination.limit} onChange={setPage} />
    </>}
    {open && <Modal title="Add team member" onClose={() => { if (!saving) { setOpen(false); setError(""); } }} busy={saving}>
      <form onSubmit={(event) => void create(event)} className="space-y-5">
        <p className="text-sm text-white/60">Create their login, then choose where they work and what they can access.</p>
        {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
        <fieldset disabled={saving} className="space-y-5">
          <label className="block space-y-2 text-sm text-white/70"><span>Full name</span><input autoComplete="name" required maxLength={200} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className={adminInput} /></label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-2 text-sm text-white/70"><span>Email address</span><input autoComplete="off" required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className={adminInput} /></label>
            <label className="block space-y-2 text-sm text-white/70"><span>Initial password</span><input autoComplete="new-password" required type="password" minLength={8} maxLength={128} placeholder="At least 8 characters" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className={adminInput} /></label>
          </div>
          <div className="space-y-2 border-t border-white/10 pt-5"><label htmlFor="team-role" className="text-sm text-white/70">Account role</label><Dropdown id="team-role" value={form.role} disabled={isManager} onChange={(value) => { const role = value as AdminRole; setForm({ ...form, role, tabs: permittedDefaults(role) }); }} options={assignableRoles(actorRole).map((role) => ({ value: role, label: roleLabel(role) }))} /></div>
          <TeamAccessFields role={form.role} position={form.position} onPositionChange={(position) => setForm({ ...form, position })} tabs={form.tabs} onTabsChange={(tabs) => setForm({ ...form, tabs })} branchIds={form.branchIds} onBranchesChange={(branchIds) => setForm({ ...form, branchIds })} branches={branches} actorRole={actorRole} actorTabs={user?.tabs ?? []} />
        </fieldset>
        <div className="flex justify-end gap-3 border-t border-white/10 pt-5"><button type="button" disabled={saving} onClick={() => { setOpen(false); setError(""); }} className={secondaryButton}>Cancel</button><button disabled={saving} className={primaryButton}>{saving ? "Adding…" : "Add team member"}</button></div>
      </form>
    </Modal>}
  </div>;
}
