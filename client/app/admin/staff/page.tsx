"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PageHeader from "@/app/components/admin/ui/page-header";
import { TableSkeleton } from "@/app/components/admin/ui/skeleton";
import { api } from "@/lib/api";
import { ADMIN_TABS, NAV_SECTIONS, adminTab, type AdminTabId } from "@/lib/admin/tabs";

type Branch = { id: string; name: string };
type StaffRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  tabs: string[];
  is_active: boolean;
  branches: Branch[];
};

const fieldClass = "h-11 rounded-xl border border-white/10 bg-black px-3 text-sm text-white outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#FF0931]";

function tabNames(tabs: string[]) {
  return ADMIN_TABS.filter((tab) => tabs.includes(tab.id)).map((tab) => tab.label).join(", ");
}

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", email: "", password: "", tabs: [] as string[], branchIds: [] as string[] });

  function load() {
    Promise.all([
      api.get<StaffRow[]>("/admin/staff"),
      api.get<Branch[]>("/admin/locations"),
    ]).then(([people, places]) => {
      if (!Array.isArray(people) || !Array.isArray(places)) {
        setError("Staff could not be loaded.");
        setStaff([]);
        setBranches([]);
        return;
      }
      setStaff(people);
      setBranches(places);
    }).catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  function toggle(list: "tabs" | "branchIds", id: string, on: boolean) {
    setForm((current) => ({
      ...current,
      [list]: on ? [...current[list], id] : current[list].filter((item) => item !== id),
    }));
  }

  async function create(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    if (form.tabs.length === 0) {
      setError("Choose at least one tab.");
      return;
    }
    try {
      await api.post("/admin/staff", form);
      setForm({ name: "", email: "", password: "", tabs: [], branchIds: [] });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create staff");
    }
  }

  return (
    <div className="admin-fade-in">
      <PageHeader title="Staff" description="Choose the tabs each person can open. They will not see the rest." />
      {error && <p role="alert" className="mb-4 text-sm text-red-400">{error}</p>}
      <form onSubmit={(event) => void create(event)} className="mb-8 grid gap-4 rounded-xl border border-white/10 bg-white/5 p-4 md:grid-cols-2">
        <label className="block text-sm text-white/70">Name
          <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className={`${fieldClass} mt-2 w-full`} />
        </label>
        <label className="block text-sm text-white/70">Email
          <input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className={`${fieldClass} mt-2 w-full`} />
        </label>
        <label className="block text-sm text-white/70 md:col-span-2">Password
          <input required type="password" minLength={8} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className={`${fieldClass} mt-2 w-full`} />
        </label>
        <fieldset className="md:col-span-2">
          <legend className="text-sm text-white">Tabs they can open</legend>
          <p className="mt-1 text-xs text-white/45">Only the ticked tabs appear in their sidebar.</p>
          <div className="mt-3 space-y-4">
            {NAV_SECTIONS.map((section) => (
              <div key={section.id}>
                <p className="mb-2 text-xs uppercase tracking-wider text-white/40">{section.label}</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {section.tabIds.map((id) => (
                    <label key={id} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-white/10 px-3 text-sm text-white/80">
                      <input type="checkbox" checked={form.tabs.includes(id)} onChange={(event) => toggle("tabs", id, event.target.checked)} className="h-4 w-4" />
                      {adminTab(id).label}
                    </label>
                  ))}
                </div>
              </div>
            ))}
            <div>
              <p className="mb-2 text-xs uppercase tracking-wider text-white/40">Other</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {(["dashboard", "posts", "staff", "settings"] as AdminTabId[]).map((id) => (
                  <label key={id} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-white/10 px-3 text-sm text-white/80">
                    <input type="checkbox" checked={form.tabs.includes(id)} onChange={(event) => toggle("tabs", id, event.target.checked)} className="h-4 w-4" />
                    {adminTab(id).label}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </fieldset>
        <fieldset className="md:col-span-2">
          <legend className="text-sm text-white">Branches</legend>
          <p className="mt-1 text-xs text-white/45">Leave this empty for every branch. Tick branches to limit orders, customers, and the branch menu to those shops.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {branches.map((branch) => (
              <label key={branch.id} className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-white/10 px-3 text-sm text-white/80">
                <input type="checkbox" checked={form.branchIds.includes(branch.id)} onChange={(event) => toggle("branchIds", branch.id, event.target.checked)} className="h-4 w-4" />
                {branch.name}
              </label>
            ))}
          </div>
        </fieldset>
        <button type="submit" className="h-11 cursor-pointer rounded-full bg-[#FF0931] text-sm text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF0931] md:col-span-2">Create staff</button>
      </form>
      {loading ? <TableSkeleton /> : <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/5">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-white/50">
              <th className="px-6 py-3">Name</th>
              <th className="px-6 py-3">Tabs</th>
              <th className="px-6 py-3">Branches</th>
              <th className="px-6 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {staff.map((person) => (
              <tr key={person.id}>
                <td className="px-6 py-4 text-sm text-white">
                  <Link href={`/admin/staff/${person.id}`} className="underline">{person.name}</Link>
                </td>
                <td className="px-6 py-4 text-sm text-white/70">{person.role === "superadmin" ? "All tabs" : tabNames(person.tabs ?? [])}</td>
                <td className="px-6 py-4 text-sm text-white/70">{(person.branches ?? []).length > 0 ? (person.branches ?? []).map((branch) => branch.name).join(", ") : "All"}</td>
                <td className="px-6 py-4 text-sm text-white/70">{person.is_active ? "Active" : "Inactive"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>}
    </div>
  );
}
