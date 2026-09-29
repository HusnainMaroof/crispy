"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import PageHeader from "@/app/components/admin/ui/page-header";
import { api } from "@/lib/api";
import { usePanel } from "@/lib/admin/use-panel";

type Branch = {
  id: string;
  name: string;
  slug: string | null;
  status: string;
  address: string;
  phone: string;
  hours: string;
  staff_count?: number;
};

export default function BranchDetailPage() {
  const panel = usePanel();
  const params = useParams<{ id: string }>();
  const [branch, setBranch] = useState<Branch | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!params.id) return;
    api.get<Branch>(`/admin/locations/${params.id}`)
      .then(setBranch)
      .catch((err: Error) => setError(err.message));
  }, [params.id]);

  async function setStatus(status: "active" | "inactive") {
    if (!branch) return;
    try {
      const updated = await api.patch<Branch>(`/admin/locations/${branch.id}`, { status });
      setBranch({ ...branch, ...updated });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update the branch");
    }
  }

  if (!branch && !error) return null;

  return (
    <div className="admin-fade-in">
      <PageHeader title={branch?.name ?? "Branch"} description={branch?.address ?? ""} />
      <Link href={panel.href("locations")} className="mb-6 inline-block text-sm text-white/50">Back to branches</Link>
      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}
      {branch && (
        <div className="grid max-w-xl gap-2 text-sm text-white/80">
          <p className="capitalize">Status {branch.status}</p>
          <p>{branch.hours}</p>
          <p>{branch.phone || "No phone"}</p>
          <button
            type="button"
            onClick={() => void setStatus(branch.status === "active" ? "inactive" : "active")}
            className="mt-4 h-11 w-fit rounded-full bg-[#FF0931] px-5"
          >
            {branch.status === "active" ? "Deactivate" : "Activate"}
          </button>
        </div>
      )}
    </div>
  );
}
