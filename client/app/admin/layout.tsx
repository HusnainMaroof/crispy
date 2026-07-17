"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Toaster } from "react-hot-toast";
import AdminShell from "@/components/admin/layout/admin-shell";
import { getAuthToken } from "@/lib/api";

function useAuthGate() {
  const router = useRouter();
  const pathname = usePathname();
  const redirected = useRef(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isLogin = pathname === "/admin/login";
  const hasToken = mounted && !!getAuthToken();
  const authorized = isLogin || hasToken;

  useEffect(() => {
    if (!mounted || authorized || redirected.current) return;
    redirected.current = true;
    router.replace("/admin/login");
  }, [mounted, authorized, router]);

  return { authorized, mounted };
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { authorized, mounted } = useAuthGate();
  const pathname = usePathname();

  if (!mounted || !authorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="text-sm text-white/50">Loading...</div>
      </div>
    );
  }

  return (
    <>
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
      {pathname === "/admin/login" ? children : <AdminShell>{children}</AdminShell>}
    </>
  );
}
