"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import PageHeader from "@/app/components/admin/ui/page-header";
import { PageSkeleton } from "@/app/components/admin/ui/skeleton";
import Dropdown from "@/app/components/admin/ui/dropdown";
import TeamAccessFields from "@/app/components/admin/ui/team-access-fields";
import { adminInput, primaryButton, secondaryButton } from "@/app/components/admin/ui/list-toolbar";
import { api } from "@/lib/api";
import { assignableRoles, normalizeRole, roleLabel, ROLE_ACCESS, type AdminRole } from "@/lib/admin/roles";
import { useAdminSession } from "@/lib/admin/session";
import { usePanel } from "@/lib/admin/use-panel";

type Member = { id: string; name: string; email: string; role: string; position: string | null; tabs: string[]; is_active: boolean; branches: { id: string; name: string }[] };
export default function StaffDetailPage() {
  const panel = usePanel(); const params = useParams<{ id: string }>(); const { user, refreshSession } = useAdminSession();
  const actorRole = normalizeRole(user?.role);
  const [person, setPerson] = useState<Member | null>(null);
  const [branches, setBranches] = useState<Member["branches"]>([]);
  const [name, setName] = useState(""); const [email, setEmail] = useState("");
  const [role, setRole] = useState<AdminRole>("staff"); const [position, setPosition] = useState("");
  const [tabs, setTabs] = useState<string[]>([]); const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState(""); const [saving, setSaving] = useState(false);
  function accept(member: Member) { setPerson(member); setName(member.name); setEmail(member.email); setRole(normalizeRole(member.role)); setPosition(member.position ?? ""); setTabs(member.tabs); setSelected(member.branches.map((branch) => branch.id)); }
  useEffect(() => {
    let cancelled = false;
    Promise.all([api.get<Member>(`/admin/staff/${params.id}`), api.get<Member["branches"]>("/admin/locations")]).then(([member, places]) => { if (!cancelled) { accept(member); setBranches(places); } }).catch((err: Error) => { if (!cancelled) setError(err.message); });
    return () => { cancelled = true; };
  }, [params.id]);
  async function save(event: React.FormEvent) {
    event.preventDefault(); if (!person) return;
    if (role !== "superadmin" && (!tabs.length || !selected.length)) { setError("Choose at least one branch and one area of access."); return; }
    if (role === "staff" && !position.trim()) { setError("Choose a job position."); return; }
    setSaving(true); setError("");
    try { accept(await api.patch<Member>(`/admin/staff/${person.id}`, { name, email, role: person.role === "superadmin" ? undefined : role, position: role === "staff" ? position.trim() : null, tabs: role === "superadmin" ? undefined : tabs, branchIds: role === "superadmin" ? [] : selected })); toast.success("Team member updated"); if (person.id === user?.id) await refreshSession(); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not save changes."); } finally { setSaving(false); }
  }
  async function toggleActive() {
    if (!person) return; setSaving(true); setError("");
    try { const updated = await api.post<Member>(`/admin/staff/${person.id}/${person.is_active ? "deactivate" : "activate"}`, {}); setPerson(updated); toast.success(updated.is_active ? "Account activated" : "Account deactivated"); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not update status."); } finally { setSaving(false); }
  }
  if (!person && !error) return <PageSkeleton />;
  return <div>
    <Link className="mb-5 inline-flex min-h-11 items-center text-sm text-white/60 hover:text-white" href={panel.href("staff")}>← Back to team</Link>
    <PageHeader title={person?.name ?? "Team member"} description="Update their details, branch assignments, and access." />
    {error && <p role="alert" className="mb-5 text-sm text-red-400">{error}</p>}
    {person && <div className="grid gap-10 xl:grid-cols-[minmax(0,600px)_minmax(220px,320px)]">
      <form onSubmit={(event) => void save(event)} className="space-y-6"><fieldset disabled={saving} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2"><label className="space-y-2 text-sm text-white/70"><span className="block">Full name</span><input required maxLength={200} value={name} onChange={(event) => setName(event.target.value)} className={adminInput} /></label><label className="space-y-2 text-sm text-white/70"><span className="block">Email address</span><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className={adminInput} /></label></div>
        <div className="space-y-2"><label htmlFor="account-role" className="text-sm text-white/70">Account role</label>{person.role === "superadmin" || actorRole === "branch_manager" ? <p className="text-sm text-white">{roleLabel(person.role)}</p> : <Dropdown id="account-role" value={role} options={assignableRoles(actorRole).map((value) => ({ value, label: roleLabel(value) }))} onChange={(value) => { const next = value as AdminRole; setRole(next); setTabs((current) => current.filter((tab) => ROLE_ACCESS[next].includes(tab))); }} />}</div>
        <TeamAccessFields role={role} position={position} onPositionChange={setPosition} tabs={tabs} onTabsChange={setTabs} branchIds={selected} onBranchesChange={setSelected} branches={branches} actorRole={actorRole} actorTabs={user?.tabs ?? []} />
      </fieldset><div className="flex flex-wrap gap-3 border-t border-white/10 pt-5"><button disabled={saving} className={primaryButton}>{saving && <Loader2 aria-hidden className="size-4 animate-spin" />}{saving ? "Saving…" : "Save changes"}</button><button type="button" disabled={saving} onClick={() => accept(person)} className={secondaryButton}>Discard changes</button></div></form>
      <aside className="self-start border-t border-white/10 pt-5 xl:border-l xl:border-t-0 xl:pl-7 xl:pt-0"><h2 className="text-sm font-medium text-white">Account status</h2><p className="mt-3 text-sm text-white/80">{person.is_active ? "Active" : "Inactive"}</p><p className="mt-2 text-sm leading-relaxed text-white/50">Deactivating blocks sign-in and ends access. Their account details stay saved.</p>{person.id !== user?.id && <button type="button" disabled={saving} onClick={() => void toggleActive()} className={`${secondaryButton} mt-5`}>{saving && <Loader2 aria-hidden className="size-4 animate-spin" />}{saving ? "Updating…" : person.is_active ? "Deactivate account" : "Activate account"}</button>}</aside>
    </div>}
  </div>;
}
