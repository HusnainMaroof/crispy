"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import PageHeader from "@/app/components/admin/ui/page-header";
import { PageSkeleton } from "@/app/components/admin/ui/skeleton";
import { api } from "@/lib/api";
import { NAV_SECTIONS, adminTab, type AdminTabId } from "@/lib/admin/tabs";

type Branch = { id: string; name: string };
type StaffMember = {
  id: string;
  name: string;
  email: string;
  role: string;
  tabs: string[];
  is_active: boolean;
  branches: Branch[];
};

export default function StaffDetailPage() {
  const params = useParams<{ id: string }>();
  const [person, setPerson] = useState<StaffMember | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [tabs, setTabs] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!params.id) return;
    Promise.all([
      api.get<StaffMember>(`/admin/staff/${params.id}`),
      api.get<Branch[]>("/admin/locations"),
    ]).then(([member, places]) => {
      setPerson({ ...member, branches: member.branches ?? [], tabs: member.tabs ?? [] });
      setTabs(member.tabs ?? []);
      setSelected((member.branches ?? []).map((branch) => branch.id));
      setBranches(Array.isArray(places) ? places : []);
    }).catch((err: Error) => setError(err.message));
  }, [params.id]);

  function toggle(list: string[], id: string, on: boolean, set: (next: string[]) => void) {
    set(on ? [...list, id] : list.filter((item) => item !== id));
  }

  async function save() {
    if (!person) return;
    if (person.role !== "superadmin" && tabs.length === 0) {
      setError("Choose at least one tab.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const updated = await api.patch<StaffMember>(`/admin/staff/${person.id}`, {
        tabs: person.role === "superadmin" ? undefined : tabs,
        branchIds: selected,
      });
      setPerson(updated);
      setTabs(updated.tabs ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save access");
    } finally {
      setSaving(false);
    }
  }

  async function setActive(active: boolean) {
    if (!person) return;
    const path = active ? "activate" : "deactivate";
    try {
      const updated = await api.post<StaffMember>(`/admin/staff/${person.id}/${path}`, {});
      setPerson(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update status");
    }
  }

  if (!person && !error) {
    return <PageSkeleton />;
  }

  return (
    <div className="admin-fade-in">
      <nav aria-label="Breadcrumb" className="mb-3 text-sm text-white/50">
        <ol className="flex flex-wrap items-center gap-2">
          <li><Link href="/admin/staff" className="hover:text-white">Staff</Link></li>
          <li aria-hidden="true">/</li>
          <li className="text-white" aria-current="page">{person?.name ?? "Staff"}</li>
        </ol>
      </nav>
      <PageHeader title={person?.name ?? "Staff"} description={person?.email ?? ""} />
      {error && <p role="alert" className="mb-4 text-sm text-red-400">{error}</p>}
      {person && (
        <div className="grid max-w-3xl gap-6 text-sm text-white/80">
          <p>Status {person.is_active ? "Active" : "Inactive"}</p>
          <button type="button" onClick={() => void setActive(!person.is_active)} className="h-11 w-fit cursor-pointer rounded-full bg-white/10 px-5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#FF0931]">
            {person.is_active ? "Deactivate" : "Activate"}
          </button>
          <fieldset>
            <legend className="text-sm text-white">Tabs they can open</legend>
            {person.role === "superadmin" ? (
              <p className="mt-2 text-white/50">This account keeps every tab.</p>
            ) : (
              <div className="mt-3 space-y-4">
                {[...NAV_SECTIONS, { id: "other", label: "Other", tabIds: ["dashboard", "posts", "staff", "settings"] as AdminTabId[] }].map((section) => (
                  <div key={section.id}>
                    <p className="mb-2 text-xs uppercase tracking-wider text-white/40">{section.label}</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {section.tabIds.map((id) => (
                        <label key={id} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-white/10 px-3">
                          <input type="checkbox" checked={tabs.includes(id)} onChange={(event) => toggle(tabs, id, event.target.checked, setTabs)} className="h-4 w-4" />
                          {adminTab(id).label}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </fieldset>
          <fieldset>
            <legend className="text-sm text-white">Branches</legend>
            <p className="mt-1 text-xs text-white/45">Leave empty for every branch.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {branches.map((branch) => (
                <label key={branch.id} className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-white/10 px-3">
                  <input type="checkbox" checked={selected.includes(branch.id)} onChange={(event) => toggle(selected, branch.id, event.target.checked, setSelected)} className="h-4 w-4" />
                  {branch.name}
                </label>
              ))}
            </div>
          </fieldset>
          <button type="button" onClick={() => void save()} disabled={saving} className="h-11 w-fit cursor-pointer rounded-full bg-[#FF0931] px-5 text-white disabled:opacity-50">
            {saving ? "Saving…" : "Save access"}
          </button>
        </div>
      )}
    </div>
  );
}
