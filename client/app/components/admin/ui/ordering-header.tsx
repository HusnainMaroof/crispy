"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PageHeader from "./page-header";
import Dropdown from "./dropdown";
import { usePanel } from "@/lib/admin/use-panel";
import { useAdminSession } from "@/lib/admin/session";

export default function OrderingHeader({ active }: { active: "orders" | "customers" }) {
  const panel = usePanel(); const router = useRouter(); const { tabs } = useAdminSession();
  const options = [{ value: "orders", label: "Orders" }, { value: "customers", label: "Customers" }].filter((option) => tabs.includes(option.value));
  return <><PageHeader title="Ordering" description="Manage orders and the customers behind them." />
    <nav aria-label="Ordering views" className="mb-6 hidden gap-7 border-b border-white/10 sm:flex">{options.map((option) => <Link key={option.value} href={panel.href(option.value)} aria-current={active === option.value ? "page" : undefined} className={`-mb-px border-b-2 px-1 pb-4 text-sm font-medium transition-colors ${active === option.value ? "border-brand-red text-white" : "border-transparent text-white/50 hover:text-white"}`}>{option.label}</Link>)}</nav>
    <div className="mb-5 sm:hidden"><Dropdown aria-label="Ordering view" value={active} onChange={(value) => router.push(panel.href(value))} options={options} /></div>
  </>;
}
