"use client";

import { useId, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { ChevronDown, Search } from "lucide-react";

type Option = { value: string; label: string; disabled?: boolean };

export default function MultiSelect({ label, options, value, onChange, placeholder = "Choose…", disabled = false }: {
  label: string; options: Option[]; value: string[]; onChange: (value: string[]) => void; placeholder?: string; disabled?: boolean;
}) {
  const id = useId();
  const [query, setQuery] = useState("");
  const selected = options.filter((option) => value.includes(option.value));
  const summary = selected.length === 0 ? placeholder : selected.length <= 2 ? selected.map((option) => option.label).join(", ") : `${selected.length} selected`;
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm text-white/70">{label}</label>
      <Popover.Root onOpenChange={() => setQuery("")}>
        <Popover.Trigger id={id} disabled={disabled} className="flex min-h-11 w-full cursor-pointer items-center justify-between gap-3 rounded-lg border border-white/15 bg-white/5 px-3 text-left text-sm text-white transition-colors hover:border-white/30 focus-visible:outline-2 focus-visible:outline-brand-red disabled:cursor-not-allowed disabled:opacity-50">
          <span className="truncate">{summary}</span><ChevronDown className="h-4 w-4 shrink-0 text-white/50" />
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content align="start" sideOffset={6} className="z-[70] w-[var(--radix-popover-trigger-width)] min-w-56 overflow-hidden rounded-xl border border-white/15 bg-[#101010] p-2 text-white shadow-xl">
            <div className="mb-1 flex items-center gap-2 border-b border-white/10 px-2 pb-2">
              <Search aria-hidden="true" className="h-4 w-4 text-white/50" />
              <input aria-label={`Search ${label.toLowerCase()}`} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search…" className="h-9 min-w-0 flex-1 bg-transparent text-sm outline-none" />
            </div>
            <div className="max-h-52 overflow-y-auto">
              {options.filter((option) => option.label.toLowerCase().includes(query.toLowerCase())).map((option) => (
                <label key={option.value} className={`flex min-h-11 items-center gap-3 rounded-lg px-2 text-sm ${option.disabled ? "opacity-40" : "cursor-pointer hover:bg-white/5"}`}>
                  <input type="checkbox" disabled={option.disabled} checked={value.includes(option.value)} onChange={(event) => onChange(event.target.checked ? [...value, option.value] : value.filter((item) => item !== option.value))} className="h-4 w-4 accent-brand-red" />
                  {option.label}
                </label>
              ))}
              {!options.some((option) => option.label.toLowerCase().includes(query.toLowerCase())) && <p className="p-3 text-sm text-white/60">No matches.</p>}
            </div>
            <div className="mt-1 flex items-center justify-between border-t border-white/10 pt-2 text-xs text-white/60">
              <span className="px-2">{selected.length} selected</span>
              <Popover.Close className="min-h-9 cursor-pointer rounded-lg px-3 text-white hover:bg-white/10">Done</Popover.Close>
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}
