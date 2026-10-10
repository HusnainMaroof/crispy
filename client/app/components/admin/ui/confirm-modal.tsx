"use client";

import { useState } from "react";
import Modal from "@/app/components/admin/ui/modal";
import { secondaryButton } from "@/app/components/admin/ui/list-toolbar";

/** Danger variant of `primaryButton`, kept apart so a destructive action never
 *  looks like the default one. */
const dangerButton =
  "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg bg-brand-red px-5 text-sm font-medium text-white transition-colors hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red disabled:cursor-not-allowed disabled:opacity-50";

/**
 * Confirmation dialog for destructive actions, replacing `window.confirm`.
 *
 * The dialog owns the busy state and the error line, so a double click cannot
 * fire the action twice and a failure leaves the dialog open with the reason
 * instead of a silent nothing. Cancel closes; Escape closes; the destructive
 * button is visually separated and runs only on an explicit click.
 */
export default function ConfirmModal({
  title,
  message,
  confirmLabel = "Delete",
  busyLabel = "Deleting…",
  onConfirm,
  onClose,
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  busyLabel?: string;
  onConfirm: () => Promise<void> | void;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const run = async () => {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "That did not work. Please try again.");
      setBusy(false);
    }
  };

  return (
    <Modal title={title} onClose={onClose} busy={busy}>
      <p className="m-0 text-sm leading-relaxed text-white/70">{message}</p>
      {error && (
        <p role="alert" className="m-0 mt-4 rounded-lg border border-brand-red/40 bg-brand-red/10 px-4 py-3 text-sm text-brand-red">
          {error}
        </p>
      )}
      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <button type="button" className={secondaryButton} onClick={onClose} disabled={busy}>
          Cancel
        </button>
        <button type="button" className={dangerButton} onClick={() => void run()} disabled={busy}>
          {busy ? busyLabel : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
