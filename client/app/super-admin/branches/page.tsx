"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePanel } from "@/lib/admin/use-panel";

export default function BranchesPage() {
  const router = useRouter();
  const panel = usePanel();
  useEffect(() => {
    router.replace(panel.href("locations"));
  }, [router, panel]);
  return null;
}
