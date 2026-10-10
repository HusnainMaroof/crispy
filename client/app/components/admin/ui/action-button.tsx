"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type ActionButtonVariant = "primary" | "secondary" | "danger" | "ghost";

const BASE =
  "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red disabled:cursor-not-allowed disabled:opacity-50";

const VARIANTS: Record<ActionButtonVariant, string> = {
  primary: "bg-brand-red text-white hover:bg-red-700",
  secondary: "border border-white/15 text-white/80 hover:bg-white/10 hover:text-white",
  danger: "bg-brand-red text-white hover:bg-red-700",
  ghost: "text-white/60 hover:bg-white/10 hover:text-white",
};

export type ActionButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Spins, disables and swaps the label while an async action is in flight. */
  busy?: boolean;
  /** Label shown while busy. Defaults to the normal children. */
  busyLabel?: string;
  variant?: ActionButtonVariant;
};

/**
 * Every super-admin action button goes through this so that three things are
 * never left to chance: the pointer cursor, the disabled state during an async
 * action, and a visible spinner. Hand-rolling them per button meant several
 * buttons had no cursor and no busy guard, so a double click fired the request
 * twice.
 */
export default function ActionButton({
  busy = false,
  busyLabel,
  variant = "primary",
  className,
  children,
  disabled,
  ...props
}: ActionButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      className={cn(BASE, VARIANTS[variant], className)}
    >
      {busy && <Loader2 aria-hidden className="size-4 shrink-0 animate-spin" />}
      {busy && busyLabel ? busyLabel : children}
    </button>
  );
}