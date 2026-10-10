"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import PageHeader from "@/app/components/admin/ui/page-header";
import { PageSkeleton } from "@/app/components/admin/ui/skeleton";
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
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!params.id) return;
    api.get<Branch>(`/admin/locations/${params.id}`)
      .then(setBranch)
      .catch((err: Error) => setError(err.message));
  }, [params.id]);

  async function setStatus(status: "active" | "inactive") {
    if (!branch || busy) return;
    setBusy(true);
    try {
      const updated = await api.patch<Branch>(`/admin/locations/${branch.id}`, { status });
      setBranch({ ...branch, ...updated });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update the branch");
    } finally {
      setBusy(false);
    }
  }

  if (!branch && !error) return <PageSkeleton />;

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
            disabled={busy}
            className="btn-press mt-4 flex h-11 w-fit items-center gap-2 rounded-full bg-[#FF0931] px-5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy && <Loader2 aria-hidden className="size-4 animate-spin" />}
            {busy ? "Updating…" : branch.status === "active" ? "Deactivate" : "Activate"}
          </button>
        </div>
      )}
    </div>
  );
}
