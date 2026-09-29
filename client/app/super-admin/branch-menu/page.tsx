"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePanel } from "@/lib/admin/use-panel";

export default function BranchMenuPage() {
  const router = useRouter();
  const panel = usePanel();
  useEffect(() => {
    router.replace(panel.href("menu"));
  }, [router, panel]);
  return null;
}
