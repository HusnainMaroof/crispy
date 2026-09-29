"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { splitPanel } from "@/lib/admin/paths";

export function usePanel() {
  const pathname = usePathname();
  const { prefix } = splitPanel(pathname);
  return useMemo(() => ({
    prefix,
    href: (segment = "") => {
      const clean = segment.replace(/^\//, "");
      return clean ? `${prefix}/${clean}` : prefix;
    },
  }), [prefix]);
}
