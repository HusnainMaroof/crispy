"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Toaster } from "react-hot-toast";
import AdminShell from "@/app/components/admin/layout/admin-shell";
import { AdminSessionProvider, useAdminSession } from "@/lib/admin/session";

const toaster = (
  <Toaster
    position="bottom-right"
    gutter={8}
    toastOptions={{
      duration: 4000,
      style: {
        background: "#000000",
        color: "#ffffff",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "12px",
        padding: "12px 16px",
        fontSize: "14px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        backdropFilter: "blur(12px)",
      },
      success: {
        iconTheme: { primary: "#4ade80", secondary: "#000000" },
        style: { borderColor: "rgba(74,222,128,0.3)" },
      },
      error: {
        iconTheme: { primary: "#dc2626", secondary: "#000000" },
        style: { borderColor: "rgba(220,38,38,0.4)" },
      },
    }}
    containerStyle={{ bottom: 16, right: 16 }}
  />
);

function AdminGate({ children }: { children: React.ReactNode }) {
  const { status } = useAdminSession();
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname === "/admin/login";

  useEffect(() => {
    if (status === "guest" && !isLogin) router.replace("/admin/login");
    if (status === "ready" && isLogin) router.replace("/admin");
  }, [status, isLogin, router]);

  if (isLogin) {
    if (status === "checking" || status === "ready") {
      return <div className="min-h-screen bg-black" />;
    }
    return <>{toaster}{children}</>;
  }

  return (
    <>
      {toaster}
      <AdminShell ready={status === "ready"}>{children}</AdminShell>
    </>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminSessionProvider>
      <AdminGate>{children}</AdminGate>
    </AdminSessionProvider>
  );
}
