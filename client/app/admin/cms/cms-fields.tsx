"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";

export type CmsField =
  | { kind: "text"; label: string; max: number; multiline?: boolean; hint?: string; default: string }
  | { kind: "image" | "video"; label: string; hint?: string; default: string }
  | { kind: "link"; label: string; external?: boolean; hint?: string; default: string }
  | { kind: "url"; label: string; hosts?: string[]; hint?: string; default: string }
  | { kind: "number"; label: string; min: number; max: number; hint?: string; default: number }
  | { kind: "select"; label: string; options: { value: string; label: string }[]; hint?: string; default: string }
  | { kind: "toggle"; label: string; hint?: string; default: boolean }
  | { kind: "list"; label: string; max: number; item: CmsListItem; hint?: string; default: unknown[] };

export type CmsListItem = Exclude<CmsField, { kind: "list" }> | { kind: "object"; label: string; fields: Record<string, CmsField> };

const STOREFRONT_PATHS = ["/", "/menu", "/locations", "/franchise-inquiries", "/delivery", "/orders", "/checkout"];
const IMAGE_TYPES = "image/jpeg,image/png,image/webp,image/avif";
const VIDEO_TYPES = "video/mp4,video/webm,video/quicktime";
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

export const fieldClass = "mt-2 w-full rounded-xl border border-white/10 bg-black px-3 py-2.5 text-sm text-white outline-none transition focus:border-[#FF0931]";
const smallButton = "cursor-pointer rounded-lg border border-white/15 px-3 py-2 text-xs text-white/75 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40";

function newItem(item: CmsListItem): unknown {
  if (item.kind === "object") {
    return Object.fromEntries(Object.entries(item.fields).map(([name, field]) => [name, structuredClone(field.default)]));
  }
  return structuredClone(item.default);
}

function Hint({ text }: { text?: string }) {
  return text ? <p className="mt-1 text-xs text-white/40">{text}</p> : null;
}

function MediaInput({ field, value, onChange }: { field: Extract<CmsField, { kind: "image" | "video" }>; value: string; onChange: (value: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const isVideo = field.kind === "video";

  async function upload(file?: File) {
    if (!file) return;
    const limit = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
    if (file.size > limit) {
      toast.error(`File must be ${limit / 1024 / 1024} MB or smaller.`);
      return;
    }
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const result = await api.upload<{ url: string }>(isVideo ? "/admin/upload-media" : "/admin/upload", body);
      onChange(result.url);
      toast.success("Uploaded. Save the section to publish it.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="block text-sm text-white/70">
      {field.label}
      <div className="mt-2 flex items-center gap-3">
        {value && !isVideo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="h-11 w-11 shrink-0 rounded-lg border border-white/10 object-cover" />
        )}
        <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={isVideo ? "https://… or /images/video.mp4" : "https://… or /images/photo.jpg"} className={`${fieldClass} mt-0`} />
        <label className={`${smallButton} shrink-0 ${uploading ? "pointer-events-none opacity-40" : ""}`}>
          {uploading ? "Uploading…" : "Upload"}
          <input type="file" accept={isVideo ? VIDEO_TYPES : IMAGE_TYPES} className="hidden" onChange={(event) => { void upload(event.target.files?.[0]); event.target.value = ""; }} />
        </label>
      </div>
      <Hint text={field.hint ?? (isVideo ? "MP4, WebM or MOV, up to 50 MB." : "JPEG, PNG, WebP or AVIF, up to 5 MB.")} />
    </div>
  );
}

export function FieldInput({ field, value, onChange }: { field: CmsField | CmsListItem; value: unknown; onChange: (value: unknown) => void }) {
  switch (field.kind) {
    case "text": {
      const text = typeof value === "string" ? value : "";
      return (
        <label className="block text-sm text-white/70">
          {field.label}
          {field.multiline
            ? <textarea value={text} maxLength={field.max} rows={4} onChange={(event) => onChange(event.target.value)} className={fieldClass} />
            : <input value={text} maxLength={field.max} onChange={(event) => onChange(event.target.value)} className={fieldClass} />}
          <Hint text={field.hint} />
        </label>
      );
    }
    case "image":
    case "video":
      return <MediaInput field={field} value={typeof value === "string" ? value : ""} onChange={onChange} />;
    case "link":
      return (
        <label className="block text-sm text-white/70">
          {field.label}
          <input value={typeof value === "string" ? value : ""} list="cms-storefront-paths" onChange={(event) => onChange(event.target.value)} placeholder={field.external ? "/menu or https://…" : "/menu"} className={fieldClass} />
          <datalist id="cms-storefront-paths">{STOREFRONT_PATHS.map((path) => <option key={path} value={path} />)}</datalist>
          <Hint text={field.hint ?? (field.external ? "A storefront page or an https link." : "A storefront page, e.g. /menu.")} />
        </label>
      );
    case "url":
      return (
        <label className="block text-sm text-white/70">
          {field.label}
          <input type="url" value={typeof value === "string" ? value : ""} onChange={(event) => onChange(event.target.value)} placeholder="https://…" className={fieldClass} />
          <Hint text={field.hint ?? (field.hosts ? `Must be an https link on ${field.hosts.join(" or ")}.` : undefined)} />
        </label>
      );
    case "number":
      return (
        <label className="block text-sm text-white/70">
          {field.label}
          <input type="number" min={field.min} max={field.max} value={typeof value === "number" ? value : field.default} onChange={(event) => onChange(Number(event.target.value))} className={fieldClass} />
          <Hint text={field.hint ?? `Between ${field.min} and ${field.max}.`} />
        </label>
      );
    case "select":
      return (
        <label className="block text-sm text-white/70">
          {field.label}
          <select value={typeof value === "string" ? value : field.default} onChange={(event) => onChange(event.target.value)} className={fieldClass}>
            {field.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <Hint text={field.hint} />
        </label>
      );
    case "toggle":
      return (
        <label className="flex items-center gap-2 text-sm text-white/70">
          <input type="checkbox" checked={value === true} onChange={(event) => onChange(event.target.checked)} />
          {field.label}
        </label>
      );
    case "object": {
      const object = value && typeof value === "object" ? value as Record<string, unknown> : {};
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          {Object.entries(field.fields).map(([name, child]) => (
            <div key={name} className={child.kind === "text" && child.multiline ? "sm:col-span-2" : ""}>
              <FieldInput field={child} value={object[name]} onChange={(next) => onChange({ ...object, [name]: next })} />
            </div>
          ))}
        </div>
      );
    }
    case "list":
      return <ListInput field={field} value={Array.isArray(value) ? value : []} onChange={onChange} />;
  }
}

function ListInput({ field, value, onChange }: { field: Extract<CmsField, { kind: "list" }>; value: unknown[]; onChange: (value: unknown[]) => void }) {
  const itemLabel = field.item.label || "Item";
  function move(index: number, offset: number) {
    const next = [...value];
    [next[index], next[index + offset]] = [next[index + offset], next[index]];
    onChange(next);
  }
  return (
    <div className="text-sm text-white/70">
      <div className="flex items-center justify-between">
        <span>{field.label}</span>
        <span className="text-xs text-white/40">{value.length} / {field.max}</span>
      </div>
      <Hint text={field.hint} />
      <div className="mt-2 space-y-3">
        {value.map((entry, index) => (
          <div key={index} className="rounded-xl border border-white/10 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-white/60">{itemLabel} {index + 1}</span>
              <div className="flex gap-1">
                <button type="button" onClick={() => move(index, -1)} disabled={index === 0} className={smallButton} aria-label="Move up">↑</button>
                <button type="button" onClick={() => move(index, 1)} disabled={index === value.length - 1} className={smallButton} aria-label="Move down">↓</button>
                <button type="button" onClick={() => onChange(value.filter((_, position) => position !== index))} className={`${smallButton} text-red-300`}>Remove</button>
              </div>
            </div>
            <FieldInput field={{ ...field.item, label: field.item.kind === "object" ? field.item.label : "" } as CmsListItem} value={entry} onChange={(next) => onChange(value.map((item, position) => position === index ? next : item))} />
          </div>
        ))}
      </div>
      <button type="button" onClick={() => onChange([...value, newItem(field.item)])} disabled={value.length >= field.max} className={`${smallButton} mt-3`}>
        Add {itemLabel.toLowerCase()}
      </button>
    </div>
  );
}
