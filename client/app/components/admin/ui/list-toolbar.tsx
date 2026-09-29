"use client";

import { Search } from "lucide-react";
import type { ReactNode } from "react";

export const adminInput = "h-11 w-full rounded-lg border border-white/15 bg-white/5 px-3 text-sm text-white outline-none transition-colors placeholder:text-white/40 focus:border-brand-red focus:ring-1 focus:ring-brand-red disabled:opacity-50";
export const primaryButton = "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg bg-brand-red px-5 text-sm font-medium text-white transition-colors hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red disabled:cursor-not-allowed disabled:opacity-50";
export const secondaryButton = "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border border-white/15 px-4 text-sm text-white/80 transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-brand-red disabled:cursor-not-allowed disabled:opacity-50";

export function ListToolbar({ query, onQueryChange, placeholder, children }: { query: string; onQueryChange: (value: string) => void; placeholder: string; children?: ReactNode }) {
  return <div className="mb-5 flex flex-wrap items-end gap-3">
    <label className="relative block min-w-52 flex-1">
      <span className="sr-only">{placeholder}</span>
      <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-white/50" />
      <input type="search" value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder={placeholder} className={`${adminInput} pl-10`} />
    </label>
    {children}
  </div>;
}

export function ListMessage({ title, detail, action }: { title: string; detail?: string; action?: ReactNode }) {
  return <div className="border-y border-white/10 px-5 py-14 text-center"><p className="text-base font-medium text-white">{title}</p>{detail && <p className="mx-auto mt-2 max-w-md text-sm text-white/60">{detail}</p>}{action && <div className="mt-5">{action}</div>}</div>;
}

export function Pagination({ page, total, size = 20, onChange }: { page: number; total: number; size?: number; onChange: (page: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / size));
  return <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-white/60">
    <p aria-live="polite">{total === 0 ? "0 results" : `${(page - 1) * size + 1}–${Math.min(page * size, total)} of ${total}`}</p>
    <div className="flex items-center gap-3"><button type="button" className={secondaryButton} disabled={page <= 1} onClick={() => onChange(page - 1)}>Previous</button><span>{page} / {pages}</span><button type="button" className={secondaryButton} disabled={page >= pages} onClick={() => onChange(page + 1)}>Next</button></div>
  </div>;
}
