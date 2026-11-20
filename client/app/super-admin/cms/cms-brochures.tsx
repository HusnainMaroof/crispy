"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { ExternalLink, FileText, Loader2, RefreshCw, Trash2, Upload } from "lucide-react";
import { api } from "@/lib/api";

export type Brochure = { title: string; file: string };
export type BrochureContent = { items: Brochure[]; shown: string };

const MAX_BROCHURES = 4;
const MAX_PDF_BYTES = 25 * 1024 * 1024;
const LANGUAGE: Record<"en" | "ar", string> = { en: "English", ar: "Arabic" };

type UploadResult = { url: string; before: number; after: number };

function megabytes(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function readBrochures(content: Record<string, unknown>): BrochureContent {
  const items = Array.isArray(content.items)
    ? content.items.map((item) => {
      const row = item && typeof item === "object" ? item as Record<string, unknown> : {};
      return { title: typeof row.title === "string" ? row.title : "", file: typeof row.file === "string" ? row.file : "" };
    })
    : [];
  return { items, shown: typeof content.shown === "string" ? content.shown : "1" };
}

/** Uploads one PDF. The server compresses it before it is stored. */
async function uploadPdf(file: File): Promise<UploadResult | null> {
  if (file.type !== "application/pdf") {
    toast.error("Choose a PDF file.");
    return null;
  }
  if (file.size > MAX_PDF_BYTES) {
    toast.error("PDF must be 25 MB or smaller.");
    return null;
  }
  const body = new FormData();
  body.append("file", file);
  const result = await api.upload<UploadResult>("/admin/upload-document", body);
  const saved = result.before - result.after;
  toast.success(saved > 0
    ? `Uploaded and compressed from ${megabytes(result.before)} to ${megabytes(result.after)}.`
    : "Uploaded. Publish to put it live.");
  return result;
}

function PickFile({ label, busy, onFile, className }: { label: string; busy: boolean; onFile: (file: File) => void; className: string }) {
  return (
    <label className={`${className} ${busy ? "cursor-progress opacity-70" : "cursor-pointer"}`}>
      {busy ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <Upload aria-hidden className="size-4" />}
      {busy ? "Uploading and compressing…" : label}
      <input
        type="file"
        accept="application/pdf"
        disabled={busy}
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) onFile(file);
        }}
      />
    </label>
  );
}

export function BrochureEditor({ value, locale, onChange }: { value: BrochureContent; locale: "en" | "ar"; onChange: (next: BrochureContent) => void }) {
  // Index being replaced, or "new" while a fresh brochure uploads.
  const [busy, setBusy] = useState<number | "new" | null>(null);
  // Brochure waiting for the delete confirmation.
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const { items } = value;
  // -1 when every brochure is switched off.
  const picked = Number(value.shown) - 1;
  const shownIndex = picked >= 0 && picked < items.length ? picked : -1;
  const language = LANGUAGE[locale];

  async function add(file: File) {
    if (busy !== null || items.length >= MAX_BROCHURES) return;
    setBusy("new");
    try {
      const result = await uploadPdf(file);
      if (!result) return;
      const next = [...items, { title: file.name.replace(/\.pdf$/i, "").slice(0, 80), file: result.url }];
      onChange({ items: next, shown: items.length === 0 ? "1" : value.shown });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(null);
    }
  }

  async function replace(index: number, file: File) {
    if (busy !== null) return;
    setBusy(index);
    try {
      const result = await uploadPdf(file);
      if (result) onChange({ ...value, items: items.map((item, position) => position === index ? { ...item, file: result.url } : item) });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(null);
    }
  }

  function remove(index: number) {
    setConfirmDelete(null);
    const next = items.filter((_, position) => position !== index);
    // Deleting the shown one switches the site off. Deleting one above it
    // keeps the same brochure switched on.
    const shown = index === shownIndex ? -1 : index < shownIndex ? shownIndex - 1 : shownIndex;
    onChange({ items: next, shown: String(shown + 1) });
  }

  /** Turning one on turns the others off. Turning it off leaves none on. */
  function toggle(index: number) {
    onChange({ ...value, shown: String(index === shownIndex ? 0 : index + 1) });
  }

  /** PDFs are only delivered through signed links, so ask the server for one. */
  async function open(file: string) {
    // Open the tab first, inside the click, so the browser does not block it.
    const tab = window.open("", "_blank");
    try {
      const { url } = await api.post<{ url: string }>("/admin/upload-document/open", { url: file });
      if (tab) tab.location.href = url;
      else window.location.assign(url);
    } catch (err) {
      tab?.close();
      toast.error(err instanceof Error ? err.message : "Could not open the PDF");
    }
  }

  function rename(index: number, title: string) {
    onChange({ ...value, items: items.map((item, position) => position === index ? { ...item, title } : item) });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/40 px-4 py-3.5">
        <span className="mt-0.5 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-black">{language}</span>
        <p className="text-sm leading-relaxed text-white/65">
          {locale === "en"
            ? "These brochures go only to visitors on the English site."
            : "These brochures go only to visitors on the Arabic site. With none here, Arabic visitors get the English brochure."}
        </p>
      </div>

      {items.length > 0 && shownIndex === -1 && (
        <p className="rounded-xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-xs leading-relaxed text-amber-200">
          {locale === "en"
            ? "No brochure is switched on. Visitors get the default brochure link from the server settings."
            : "No Arabic brochure is switched on. Arabic visitors get the English brochure."}
        </p>
      )}

      {items.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-white/15 px-6 py-12 text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-white/5"><FileText aria-hidden className="size-7 text-white/50" /></span>
          <p className="mt-4 text-base font-medium text-white">No {language} brochure yet</p>
          <p className="mt-1 max-w-sm text-sm text-white/45">Upload a PDF. It is compressed automatically, then visitors get it after they verify their email.</p>
          <PickFile
            label="Upload brochure"
            busy={busy === "new"}
            onFile={(file) => void add(file)}
            className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-[#FF0931] px-6 text-sm font-medium text-white shadow-[0_6px_20px_rgba(255,9,49,0.35)] transition hover:brightness-110"
          />
        </div>
      ) : (
        <div className="grid gap-3">
          {items.map((item, index) => {
            const shown = index === shownIndex;
            return (
              <div key={`${item.file}-${index}`} className={`rounded-2xl border p-4 transition-colors ${shown ? "border-[#FF0931]/60 bg-[#FF0931]/[0.07]" : "border-white/10 bg-black/40"}`}>
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${shown ? "bg-[#FF0931] text-white" : "bg-white/5 text-white/50"}`}>
                    <FileText aria-hidden className="size-5" />
                  </span>
                  <input
                    value={item.title}
                    maxLength={80}
                    onChange={(event) => rename(index, event.target.value)}
                    placeholder={`Brochure ${index + 1}`}
                    aria-label={`Brochure ${index + 1} name`}
                    className="min-w-0 flex-1 rounded-xl border border-transparent bg-transparent px-2 py-2 text-sm font-medium text-white outline-none transition-colors placeholder:text-white/30 hover:border-white/10 focus:border-[#FF0931] focus:bg-black"
                  />
                  <label className="inline-flex shrink-0 cursor-pointer items-center gap-3 text-xs font-medium">
                    <span className={shown ? "text-white" : "text-white/50"}>{shown ? "Shown on the site" : "Hidden"}</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={shown}
                      aria-label={`Show ${item.title || `brochure ${index + 1}`} on the site`}
                      onClick={() => toggle(index)}
                      className={`relative h-7 w-12 shrink-0 cursor-pointer rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#FF0931] ${shown ? "bg-[#FF0931]" : "bg-white/15"}`}
                    >
                      <span aria-hidden="true" className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${shown ? "left-6" : "left-1"}`} />
                    </button>
                  </label>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 ps-14">
                  <button type="button" onClick={() => void open(item.file)} className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-white/15 px-3.5 text-xs text-white/70 transition-colors hover:border-white/30 hover:bg-white/10 hover:text-white">
                    <ExternalLink aria-hidden className="size-3.5" /> Open
                  </button>
                  <PickFile
                    label="Replace PDF"
                    busy={busy === index}
                    onFile={(file) => void replace(index, file)}
                    className="inline-flex h-9 items-center gap-1.5 rounded-full border border-white/15 px-3.5 text-xs text-white/70 transition-colors hover:border-white/30 hover:bg-white/10 hover:text-white"
                  />
                  <button type="button" onClick={() => setConfirmDelete(index)} disabled={busy !== null} className="ms-auto inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full px-3 text-xs text-red-300/80 transition-colors hover:bg-red-500/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-40">
                    <Trash2 aria-hidden className="size-3.5" /> Delete
                  </button>
                </div>
                {confirmDelete === index && (
                  <div role="alert" className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 sm:ms-14">
                    <p className="min-w-0 flex-1 text-xs leading-relaxed text-red-100/90">
                      Delete &ldquo;{item.title || `Brochure ${index + 1}`}&rdquo;? When you publish, the PDF is also deleted from storage and cannot be recovered.
                    </p>
                    <button type="button" onClick={() => setConfirmDelete(null)} className="h-9 cursor-pointer rounded-full border border-white/15 px-4 text-xs text-white/75 transition-colors hover:bg-white/10 hover:text-white">Cancel</button>
                    <button type="button" onClick={() => remove(index)} className="h-9 cursor-pointer rounded-full bg-[#FF0931] px-4 text-xs font-medium text-white transition hover:brightness-110">Yes, delete</button>
                  </div>
                )}
              </div>
            );
          })}
          {items.length < MAX_BROCHURES ? (
            <PickFile
              label={`Upload another brochure (${items.length} of ${MAX_BROCHURES})`}
              busy={busy === "new"}
              onFile={(file) => void add(file)}
              className="flex h-14 items-center justify-center gap-2 rounded-2xl border border-dashed border-white/15 text-sm text-white/60 transition-colors hover:border-white/30 hover:bg-white/[0.03] hover:text-white"
            />
          ) : (
            <p className="flex items-center justify-center gap-2 text-xs text-white/40"><RefreshCw aria-hidden className="size-3.5" /> 4 of 4 used. Delete or replace one to add another.</p>
          )}
        </div>
      )}
      <p className="text-xs text-white/40">PDF only, up to 25 MB. Each file is compressed on upload and must end up 10 MB or less.</p>
    </div>
  );
}
