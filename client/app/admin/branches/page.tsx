"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PageHeader from "@/app/components/admin/ui/page-header";
import { TableSkeleton } from "@/app/components/admin/ui/skeleton";
import { api } from "@/lib/api";

type BranchRow = {
  id: string;
  name: string;
  status: string;
  address: string;
  hours: string;
  phone: string;
  staff_count?: number;
};

export default function BranchesPage() {
  const [branches, setBranches] = useState<BranchRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<BranchRow[]>("/admin/locations")
      .then(setBranches)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="admin-fade-in">
      <PageHeader title="Branches" description="Operational status for the Crispies branches." />
      {loading ? <TableSkeleton /> : <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/5">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-white/50">
              <th className="px-6 py-3">Branch</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Staff</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {branches.map((branch) => (
              <tr key={branch.id}>
                <td className="px-6 py-4 text-sm text-white">
                  <Link href={`/admin/branches/${branch.id}`} className="underline">{branch.name}</Link>
                </td>
                <td className="px-6 py-4 text-sm capitalize text-white/70">{branch.status}</td>
                <td className="px-6 py-4 text-sm text-white/70">{branch.staff_count ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>}
    </div>
  );
}
