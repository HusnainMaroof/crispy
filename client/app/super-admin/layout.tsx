"use client";

import dynamic from "next/dynamic";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Toaster } from "react-hot-toast";
import { PageSkeleton, SidebarSkeleton, Skeleton } from "@/app/components/admin/ui/skeleton";
import { AdminSessionProvider, useAdminSession } from "@/lib/admin/session";
import { defaultAdminPath } from "@/lib/admin/tabs";
import { splitPanel } from "@/lib/admin/paths";

const AdminShell = dynamic(() => import("@/app/components/admin/layout/admin-shell"), {
  loading: () => <AdminShellSkeleton />,
});

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

function AdminShellSkeleton() {
  return (
    <div className="min-h-screen bg-black" aria-hidden="true">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-white/10 bg-black p-3 lg:block">
        <Skeleton className="mb-6 h-10 w-40" />
        <SidebarSkeleton />
      </aside>
      <div className="lg:pl-64">
        <div className="h-16 border-b border-white/10 px-6 py-5">
          <Skeleton className="h-5 w-36" />
        </div>
        <main className="p-4 sm:p-6"><PageSkeleton /></main>
      </div>
    </div>
  );
}

function AuthCheckingSkeleton({ login = false }: { login?: boolean }) {
  return (
    <div className="min-h-screen bg-black p-4" role="status" aria-label="Checking admin session">
      <span className="sr-only">Checking your admin session…</span>
      {login ? (
        <div className="flex min-h-[calc(100vh-2rem)] items-center justify-center">
          <div className="w-full max-w-sm space-y-5">
            <Skeleton className="mx-auto mb-8 h-10 w-56" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-12 w-full rounded-2xl" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-12 w-full rounded-2xl" />
            <Skeleton className="h-12 w-full rounded-full" />
          </div>
        </div>
      ) : (
        <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-7xl gap-6">
          <div className="hidden w-64 shrink-0 space-y-3 pt-4 lg:block">
            <Skeleton className="mb-8 h-10 w-40" />
            <SidebarSkeleton />
          </div>
          <div className="flex-1 pt-8"><PageSkeleton /></div>
        </div>
      )}
    </div>
  );
}

function AdminGate({ children }: { children: React.ReactNode }) {
  const { status, tabs, user } = useAdminSession();
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = splitPanel(pathname).rest === "/login";
  const home = user?.home || defaultAdminPath(tabs);
  const onPanel = splitPanel(pathname).prefix === splitPanel(home).prefix;

  useEffect(() => {
    if (status === "guest" && !isLogin) router.replace("/super-admin/login");
    if (status === "ready" && (isLogin || !onPanel)) router.replace(home);
  }, [status, isLogin, router, home, onPanel]);

  if (status === "checking") return <AuthCheckingSkeleton login={isLogin} />;
  if (isLogin) return <>{toaster}{children}</>;
  if (status === "guest") return <AuthCheckingSkeleton />;

  return (
    <>
      {toaster}
      <AdminShell ready>{children}</AdminShell>
    </>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // The admin is English-only and stays left-to-right even when the
  // storefront switches to Arabic (the root html flips to rtl).
  return (
    <div dir="ltr">
      <AdminSessionProvider>
        <AdminGate>{children}</AdminGate>
      </AdminSessionProvider>
    </div>
  );
}
