import type { Metadata } from "next";
import AdminShell from "@/components/admin/layout/admin-shell";

export const metadata: Metadata = {
  title: "Crispies Admin — Dashboard",
  description: "Manage your Crispies restaurant operations.",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminShell>{children}</AdminShell>;
}
