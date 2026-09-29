"use client";

import { useState } from "react";
import * as Popover from "@radix-ui/react-popover";

const SLOTS = Array.from({ length: 48 }, (_, index) => {
  const hour = Math.floor(index / 2);
  const minute = index % 2 === 0 ? "00" : "30";
  return `${String(hour).padStart(2, "0")}:${minute}`;
});

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
          className="flex h-11 w-full cursor-pointer items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#FF0931]"
          aria-label={labelText}
        >
          {label(value)}
          <svg className="h-4 w-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            sideOffset={6}
            className="z-50 max-h-60 w-40 overflow-y-auto rounded-lg border border-white/10 bg-black p-1 shadow-xl"
          >
            {SLOTS.map((slot) => (
              <button
                key={slot}
                type="button"
                onClick={() => {
                  onChange(slot);
                  setOpen(false);
                }}
                className={`flex h-11 w-full cursor-pointer items-center rounded-md px-3 text-left text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#FF0931] ${slot === value ? "bg-[#FF0931] text-white" : "text-white/80 hover:bg-white/10"}`}
              >
                {label(slot)}
              </button>
            ))}
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}
