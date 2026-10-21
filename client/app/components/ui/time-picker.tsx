"use client";

import { useState } from "react";
import * as Popover from "@radix-ui/react-popover";

const SLOTS = Array.from({ length: 48 }, (_, index) => {
  const hour = Math.floor(index / 2);
  const minute = index % 2 === 0 ? "00" : "30";
  return `${String(hour).padStart(2, "0")}:${minute}`;
});

/** Morning runs 00:00 to 11:30, the rest of the day is the second group. */
const GROUPS = [
  { label: "Morning", slots: SLOTS.slice(0, 24) },
  { label: "Afternoon and evening", slots: SLOTS.slice(24) },
];

function label(value: string) {
  const [hourPart, minute] = value.split(":");
  const hour = Number(hourPart);
  const period = hour >= 12 ? "PM" : "AM";
  const twelve = hour % 12 || 12;
  return `${twelve}:${minute} ${period}`;
}

export function TimePicker({
  value,
  onChange,
  labelText,
  compact = false,
}: {
  value: string;
  onChange: (value: string) => void;
  labelText: string;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className={compact ? "min-w-0 flex-1" : undefined}>
      {!compact && <span className="mb-1 block text-sm text-white/50">{labelText}</span>}
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger
          type="button"
          aria-label={labelText}
          className="flex h-11 w-full cursor-pointer items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/5 px-3 text-sm tabular-nums text-white outline-none transition-colors hover:border-white/25 focus-visible:border-[#FF0931] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF0931] data-[state=open]:border-[#FF0931]"
        >
          {label(value)}
          <svg className="h-4 w-4 shrink-0 text-white/45" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </Popover.Trigger>
        <Popover.Portal>
          {/* z above the admin modal (z-60) so the list stays clickable in dialogs. */}
          <Popover.Content
            sideOffset={6}
            align="start"
            collisionPadding={12}
            className="z-[70] w-[17.5rem] rounded-xl border border-white/15 bg-[#0b0b0b] p-2 shadow-2xl"
          >
            <div className="flex items-baseline justify-between gap-3 px-1.5 pb-2 pt-1">
              <span className="text-[11px] font-medium uppercase tracking-wider text-white/40">Pick a time</span>
              <span className="text-sm font-medium tabular-nums text-white">{label(value)}</span>
            </div>
            <div className="max-h-64 overflow-y-auto overscroll-contain pe-0.5">
              {GROUPS.map((group) => (
                <div key={group.label} className="mb-1 last:mb-0">
                  <p className="sticky top-0 z-10 bg-[#0b0b0b]/95 px-1.5 py-1 text-[10px] font-medium uppercase tracking-wider text-white/35 backdrop-blur">
                    {group.label}
                  </p>
                  <div className="grid grid-cols-2 gap-1">
                    {group.slots.map((slot) => {
                      const active = slot === value;
                      return (
                        <button
                          key={slot}
                          type="button"
                          aria-pressed={active}
                          onClick={() => {
                            onChange(slot);
                            setOpen(false);
                          }}
                          className={`h-9 cursor-pointer rounded-lg px-2 text-sm tabular-nums transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#FF0931] ${
                            active
                              ? "bg-[#FF0931] font-medium text-white"
                              : "text-white/75 hover:bg-white/10 hover:text-white"
                          }`}
                        >
                          {label(slot)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}
