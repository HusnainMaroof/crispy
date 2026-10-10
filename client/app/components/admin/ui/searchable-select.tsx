"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export type SearchableSelectOption = {
  value: string;
  label: string;
  /** Optional secondary line, e.g. how many items sit in the category. */
  hint?: string;
};

type SearchableSelectProps = {
  options: SearchableSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyLabel?: string;
  className?: string;
  disabled?: boolean;
  id?: string;
  "aria-label"?: string;
  /** Rendered in a sticky row under the search field, above the results. */
  footer?: React.ReactNode;
};

/**
 * A filterable single-select built on a popover listbox rather than a native
 * select. The old dropdown was a 240px tall Radix select with no search, so a
 * long category list meant scrolling blind to find an entry.
 *
 * Keyboard: arrows move the active row, Home/End jump, Enter commits, Escape
 * closes. The active row is scrolled into view so keyboard users never lose it.
 */
export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  emptyLabel = "No matches",
  className,
  disabled,
  id,
  "aria-label": ariaLabel,
  footer,
}: SearchableSelectProps) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [storedIndex, setActiveIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return options;
    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(trimmed) ||
        option.value.toLowerCase().includes(trimmed),
    );
  }, [options, query]);

  const selected = options.find((option) => option.value === value);

  // A new query can leave the stored index pointing past the end of the list.
  // Clamped during render instead of in an effect, so there is no second pass.
  const activeIndex = storedIndex >= filtered.length ? Math.max(filtered.length - 1, 0) : storedIndex;

  // Keep the highlighted row inside the scroll box during keyboard navigation.
  useEffect(() => {
    if (!open) return;
    const list = listRef.current;
    const row = list?.children[activeIndex] as HTMLElement | undefined;
    row?.scrollIntoView({ block: "nearest" });
  }, [open, activeIndex]);

  const commit = (nextValue: string) => {
    onChange(nextValue);
    setOpen(false);
    setQuery("");
    setActiveIndex(0);
  };

  const move = (delta: number) => {
    if (filtered.length === 0) return;
    setActiveIndex((current) => (current + delta + filtered.length) % filtered.length);
  };

  const onListKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        move(1);
        break;
      case "ArrowUp":
        event.preventDefault();
        move(-1);
        break;
      case "Home":
        event.preventDefault();
        setActiveIndex(0);
        break;
      case "End":
        event.preventDefault();
        setActiveIndex(Math.max(filtered.length - 1, 0));
        break;
      case "Enter":
        event.preventDefault();
        if (filtered[activeIndex]) commit(filtered[activeIndex].value);
        break;
      case "Escape":
        event.preventDefault();
        setOpen(false);
        break;
    }
  };

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={(next) => {
      setOpen(next);
      // Reopening starts from a clean slate, so the previously typed query and
      // highlighted row do not carry over.
      if (next) {
        setQuery("");
        setActiveIndex(0);
      }
    }}>
      <PopoverPrimitive.Trigger asChild disabled={disabled}>
        <button
          type="button"
          id={id}
          aria-label={ariaLabel}
          className={cn(
            "flex h-11 w-full cursor-pointer items-center justify-between gap-3 rounded-lg border border-white/15 bg-white/5 px-3 text-left text-sm text-white transition-colors hover:border-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red disabled:cursor-not-allowed disabled:opacity-50",
            className,
          )}
        >
          <span className={cn("min-w-0 truncate", !selected && "text-white/45")}>
            {selected?.label ?? placeholder}
          </span>
          <ChevronDown
            aria-hidden
            className={cn(
              "size-4 shrink-0 text-white/50 transition-transform duration-200",
              open && "rotate-180",
            )}
          />
        </button>
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={6}
          className="z-[70] w-[var(--radix-popover-trigger-width)] min-w-[13rem] overflow-hidden rounded-xl border border-white/10 bg-[#0b0b0b] shadow-xl shadow-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
        >
          <div className="border-b border-white/10 p-2">
            <div className="relative">
              <Search
                aria-hidden
                className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-white/35"
              />
              <input
                ref={searchRef}
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setActiveIndex(0);
                }}
                onKeyDown={onListKeyDown}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                aria-controls={listId}
                className="h-9 w-full rounded-lg border border-white/10 bg-white/5 ps-9 pe-3 text-sm text-white outline-none transition-colors placeholder:text-white/35 focus:border-brand-red/60"
              />
            </div>
          </div>

          <div
            ref={listRef}
            id={listId}
            role="listbox"
            aria-label={ariaLabel ?? placeholder}
            tabIndex={-1}
            onKeyDown={onListKeyDown}
            className="max-h-96 overflow-y-auto overscroll-contain p-1"
          >
            {filtered.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-white/45">{emptyLabel}</p>
            ) : (
              filtered.map((option, index) => {
                const isSelected = option.value === value;
                const isActive = index === activeIndex;
                return (
                  <div
                    key={option.value}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => commit(option.value)}
                    onMouseEnter={() => setActiveIndex(index)}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/75 transition-colors",
                      isActive && "bg-white/10 text-white",
                      isSelected && "font-medium text-white",
                    )}
                  >
                    <span className="flex size-4 shrink-0 items-center justify-center">
                      {isSelected && <Check aria-hidden className="size-4 text-brand-red" />}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{option.label}</span>
                    {option.hint && (
                      <span className="shrink-0 text-xs tabular-nums text-white/40">
                        {option.hint}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {footer && (
            <div className="border-t border-white/10 p-1">{footer}</div>
          )}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}