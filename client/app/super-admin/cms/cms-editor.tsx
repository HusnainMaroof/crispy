"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import PageHeader from "@/app/components/admin/ui/page-header";
import ActionButton from "@/app/components/admin/ui/action-button";
import { api } from "@/lib/api";
import { usePanel } from "@/lib/admin/use-panel";
import { PageSkeleton } from "@/app/components/admin/ui/skeleton";
import { FieldInput, type CmsField } from "./cms-fields";

type Locale = "en" | "ar";
type Section = {
  id: string;
  key: string;
  is_active: boolean;
  definition: { label: string; hint: string; pinned: boolean; fields: Record<string, CmsField> };
  content: Record<string, unknown>;
  translation: { is_published: boolean; updated_at: string } | null;
  copied_from_english: boolean;
};
type PagePayload = {
  page: { id: string; label: string; detail: string; path: string | null; sortable: boolean };
  locale: Locale;
  coverage: { locale: Locale; translated: number; total: number }[];
  sections: Section[];
};
type Draft = { content: Record<string, unknown>; is_active: boolean; is_published: boolean };

const LOCALE_LABELS: Record<Locale, string> = { en: "English", ar: "Arabic" };

type ConfirmRequest = {
  title: string;
  message: string;
  confirmLabel: string;
  tone: "danger" | "primary";
  action: () => void;
};

function OrderSystemPreview({ mode }: { mode: string }) {
  const redirect = mode === "redirect";
  const buttons = redirect
    ? [["Click", "& Collect"], ["Get It", "Delivered"]]
    : [["Your", "Cart"], ["Get It", "Delivered"]];
  return (
    <div className="rounded-2xl border border-white/10 bg-black p-5">
      <p className="text-xs font-bold uppercase tracking-widest text-white/45">
        {redirect ? "Redirect system" : "Cart system"}
      </p>
      <p className="mt-2 text-sm text-white/70">
        {redirect
          ? "The navbar shows Click & Collect and Get It Delivered. Both open the branch popup, then the delivery platforms. The cart and the checkout page are switched off, and ordering any product opens the popup instead of a cart."
          : "The navbar shows Your Cart and Get It Delivered. Both open the cart popup, and the checkout page stays live."}
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        {buttons.map(([first, second]) => (
          <div key={first} className="flex h-12 w-[150px] items-center justify-center gap-2 rounded-[4px] bg-[#FF0931] px-4 text-white">
            <span className="flex flex-col text-left text-[12px] font-semibold leading-tight">
              <span>{first}</span>
              <span>{second}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ConfirmDialog({ request, onCancel }: { request: ConfirmRequest; onCancel: () => void }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onCancel]);

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="cms-confirm-title" className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 cursor-pointer bg-black/80" aria-label="Close dialog" onClick={onCancel} />
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-black p-6 shadow-[0_20px_60px_rgba(0,0,0,0.7)]">
        <h2 id="cms-confirm-title" className="font-[family-name:var(--font-korolev),Korolev,sans-serif] text-3xl uppercase text-white">{request.title}</h2>
        <p className="mt-3 text-sm leading-relaxed text-white/65">{request.message}</p>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button type="button" onClick={onCancel} className="h-11 cursor-pointer rounded-full border border-white/15 px-5 text-sm text-white/75 transition-colors hover:border-white/30 hover:bg-white/10 hover:text-white">Keep editing</button>
          <button
            type="button"
            onClick={request.action}
            className={`h-11 cursor-pointer rounded-full px-5 text-sm font-medium text-white shadow-[0_6px_20px_rgba(255,9,49,0.35)] transition hover:brightness-110 ${request.tone === "danger" ? "bg-[#FF0931] hover:brightness-110" : "bg-[#FF0931] hover:brightness-110"}`}
          >
            {request.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function draftOf(section: Section): Draft {
  return { content: section.content, is_active: section.is_active, is_published: section.translation?.is_published ?? false };
}

export default function CmsEditor({ pageId }: { pageId: string }) {
  const [payload, setPayload] = useState<PagePayload | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [locale, setLocale] = useState<Locale>("en");
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [sectionKey, setSectionKey] = useState("");
  const [confirm, setConfirm] = useState<ConfirmRequest | null>(null);
  const router = useRouter();
  const panel = usePanel();

  const apply = useCallback((next: PagePayload) => {
    setPayload(next);
    setDrafts(Object.fromEntries(next.sections.map((section) => [section.id, draftOf(section)])));
    setError("");
  }, []);

  useEffect(() => {
    let active = true;
    api.get<PagePayload>(`/admin/cms/pages/${pageId}?locale=${locale}`)
      .then((next) => { if (active) apply(next); })
      .catch((err: Error) => { if (active) setError(err.message); });
    return () => { active = false; };
  }, [pageId, locale, apply]);

  const dirty = useMemo(() => new Set(
    (payload?.sections ?? [])
      .filter((section) => drafts[section.id] && JSON.stringify(drafts[section.id]) !== JSON.stringify(draftOf(section)))
      .map((section) => section.id),
  ), [payload, drafts]);

  useEffect(() => {
    if (dirty.size === 0) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function edit(id: string, patch: Partial<Draft>) {
    setDrafts((current) => ({ ...current, [id]: { ...current[id], ...patch } }));
  }

  function openSection(key: string) {
    if (key === sectionKey) return;
    const go = () => {
      setSectionKey(key);
      router.replace(`${panel.href(`cms/${pageId}`)}?section=${key}`, { scroll: false });
    };
    if (dirty.size > 0) {
      setConfirm({
        title: "Unsaved changes",
        message: "This section has changes that are not saved yet. Leave it and discard those changes?",
        confirmLabel: "Discard and leave",
        tone: "danger",
        action: () => { setConfirm(null); go(); },
      });
      return;
    }
    go();
  }

  function switchLocale(next: Locale) {
    if (next === locale) return;
    if (dirty.size > 0) {
      setConfirm({
        title: "Unsaved changes",
        message: "Switching language discards the changes on this section. Stay here to keep editing, or discard them.",
        confirmLabel: "Discard and switch",
        tone: "danger",
        action: () => { setConfirm(null); setLocale(next); },
      });
      return;
    }
    setLocale(next);
  }

  async function run(id: string, action: () => Promise<PagePayload>, success: string) {
    setBusyId(id);
    setError("");
    try {
      const next = await action();
      const unsaved = Object.fromEntries(Object.entries(drafts).filter(([key]) => key !== id && dirty.has(key)));
      apply(next);
      setDrafts((current) => ({ ...current, ...unsaved }));
      toast.success(success);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusyId("");
    }
  }

  function save(section: Section) {
    const draft = drafts[section.id];
    void run(section.id, () => api.patch<PagePayload>(`/admin/cms/sections/${section.id}`, { locale, ...draft }), "Section saved");
  }

  function move(section: Section, direction: "up" | "down") {
    const go = () => { void run(section.id, () => api.post<PagePayload>(`/admin/cms/sections/${section.id}/move`, { direction }), "Order updated"); };
    if (dirty.size > 0) {
      setConfirm({
        title: "Unsaved changes",
        message: "Changing the section order reloads this page and discards unsaved edits.",
        confirmLabel: "Discard and reorder",
        tone: "danger",
        action: () => { setConfirm(null); go(); },
      });
      return;
    }
    go();
  }

  function reset(section: Section) {
    const removingTranslation = locale !== "en";
    setConfirm({
      title: removingTranslation ? "Remove translation" : "Reset section",
      message: removingTranslation
        ? `Remove the ${LOCALE_LABELS[locale]} copy of "${section.definition.label}"? Visitors will see English instead.`
        : `Reset "${section.definition.label}" to the built-in default content?`,
      confirmLabel: removingTranslation ? "Remove copy" : "Reset to default",
      tone: "danger",
      action: () => {
        setConfirm(null);
        void run(section.id, () => api.post<PagePayload>(`/admin/cms/sections/${section.id}/reset`, { locale }), "Section reset");
      },
    });
  }

  const sections = payload?.sections ?? [];
  const activeKey = sections.some((section) => section.key === sectionKey) ? sectionKey : (sections[0]?.key ?? "");
  const section = sections.find((item) => item.key === activeKey) ?? null;
  const movable = sections.filter((item) => !item.definition.pinned);

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("section");
    if (requested) queueMicrotask(() => setSectionKey(requested));
  }, [pageId]);

  return (
    <div className="admin-fade-in">
      <nav aria-label="Breadcrumb" className="mb-4 text-xs font-medium uppercase tracking-[0.18em] text-white/40">
        <ol className="flex flex-wrap items-center gap-2">
          <li>Content</li>
          <li aria-hidden="true" className="text-white/20">/</li>
          <li className="text-white/60">{payload?.page.label ?? "Page"}</li>
          {section && <>
            <li aria-hidden="true" className="text-white/20">/</li>
            <li className="text-white" aria-current="page">{section.definition.label}</li>
          </>}
        </ol>
      </nav>
      <PageHeader
        title={section?.definition.label ?? payload?.page.label ?? "Content"}
        description={section?.definition.hint ?? payload?.page.detail}
        action={payload?.page.path ? (
          <Link href={payload.page.path} target="_blank" className="inline-flex h-11 items-center rounded-full border border-white/15 px-4 text-sm text-white/75 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#FF0931]">View page</Link>
        ) : undefined}
      />
      <div className="mb-6 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
        {sections.length > 0 && (
          <div role="tablist" aria-label="Sections" className="flex gap-1.5 overflow-x-auto p-2">
            {sections.map((item) => {
              const selected = item.key === activeKey;
              const edited = dirty.has(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => openSection(item.key)}
                  className={`flex h-11 shrink-0 cursor-pointer items-center gap-2 rounded-xl px-4 text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#FF0931] ${selected ? "bg-[#FF0931] text-white shadow-[0_6px_20px_rgba(255,9,49,0.35)]" : "text-white/55 hover:bg-white/5 hover:text-white"}`}
                >
                  {item.definition.label}
                  {edited && <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${selected ? "bg-white" : "bg-amber-300"}`} />}
                </button>
              );
            })}
          </div>
        )}
        <div className={`flex flex-wrap items-center gap-3 px-3 py-3 ${sections.length > 0 ? "border-t border-white/10" : ""}`}>
          <div role="group" aria-label="Language" className="flex items-center gap-1 rounded-full border border-white/10 bg-black p-1">
            {(["en", "ar"] as const).map((code) => {
              const count = payload?.coverage.find((item) => item.locale === code);
              const selected = locale === code;
              return (
                <button key={code} type="button" aria-pressed={selected} onClick={() => switchLocale(code)} className={`flex cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#FF0931] ${selected ? "bg-white text-black" : "text-white/55 hover:text-white"}`}>
                  {LOCALE_LABELS[code]}
                  {count && <span className={`rounded-full px-1.5 py-0.5 text-[11px] font-medium ${selected ? "bg-black/10 text-black/55" : "bg-white/10 text-white/45"}`}>{count.translated}/{count.total}</span>}
                </button>
              );
            })}
          </div>
          {payload && (() => {
            const count = payload.coverage.find((item) => item.locale === locale);
            if (!count || count.total === 0) return null;
            return (
              <div className="min-w-32">
                <div className="h-1 w-full overflow-hidden rounded-full bg-white/10" role="presentation">
                  <div className="h-full rounded-full bg-[#FF0931] transition-all" style={{ width: `${Math.round((count.translated / count.total) * 100)}%` }} />
                </div>
                <p className="mt-1 text-[11px] text-white/40">{count.translated} of {count.total} {LOCALE_LABELS[locale]} sections translated</p>
              </div>
            );
          })()}
          {dirty.size > 0 && (
            <span className="ml-auto inline-flex items-center gap-2 rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-1.5 text-xs font-medium text-amber-200">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-amber-300" />
              {dirty.size} unsaved {dirty.size === 1 ? "section" : "sections"}
            </span>
          )}
        </div>
      </div>
      {error && <p role="alert" className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>}
      {!payload && !error && <PageSkeleton />}

      <div className="grid max-w-4xl gap-5">
        {section && (() => {
          const draft = drafts[section.id] ?? draftOf(section);
          const live = draft.is_active;
          const position = movable.findIndex((item) => item.id === section.id);
          const canMove = payload?.page.sortable && !section.definition.pinned;
          return (
            <form key={section.id} onSubmit={(event) => { event.preventDefault(); save(section); }} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
              <div className="flex flex-wrap items-center gap-3 border-b border-white/10 px-5 py-4">
                <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium ${live ? "bg-green-500/15 text-green-300" : "bg-white/10 text-white/50"}`}>
                  <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${live ? "bg-green-400" : "bg-white/40"}`} />
                  {live ? "Live on site" : "Hidden"}
                </span>
                {dirty.has(section.id) && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-1.5 text-xs font-medium text-amber-200">
                    <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-amber-300" />
                    Unsaved changes
                  </span>
                )}
                <div className="ml-auto flex shrink-0 items-center gap-2">
                  {canMove && <>
                    <button type="button" onClick={() => move(section, "up")} disabled={position <= 0 || busyId !== ""} className="h-11 w-11 cursor-pointer rounded-full border border-white/15 text-sm text-white/70 transition-colors hover:border-white/30 hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent" aria-label="Move section up" title="Move section up">↑</button>
                    <button type="button" onClick={() => move(section, "down")} disabled={position === movable.length - 1 || busyId !== ""} className="h-11 w-11 cursor-pointer rounded-full border border-white/15 text-sm text-white/70 transition-colors hover:border-white/30 hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent" aria-label="Move section down" title="Move section down">↓</button>
                  </>}
                </div>
              </div>
              <div className="p-5">

              {section.copied_from_english && (
                <p className="mb-5 rounded-xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-xs leading-relaxed text-amber-200">
                  No {LOCALE_LABELS[locale]} copy yet. The English content is filled in below as a starting point; visitors see English until you save and publish.
                </p>
              )}

              <div className="mb-6 grid gap-5 md:grid-cols-2">
                {Object.entries(section.definition.fields).map(([name, field]) => {
                  const wide = field.kind === "list" || field.kind === "branches" || field.kind === "image" || field.kind === "video" || (field.kind === "text" && field.multiline) || (field.kind === "select" && field.options.length === 2);
                  return (
                    <div key={name} className={wide ? "md:col-span-2" : ""}>
                      <FieldInput field={field} value={draft.content[name]} onChange={(value) => edit(section.id, { content: { ...draft.content, [name]: value } })} />
                    </div>
                  );
                })}
              </div>

              {section.key === "ordering" && (
                <div className="mb-5">
                  <OrderSystemPreview mode={String(draft.content.mode ?? "redirect")} />
                </div>
              )}

              <div className="mb-6 grid gap-3 sm:grid-cols-2">
                <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-black/40 px-4 py-3.5 transition-colors hover:border-white/20">
                  <input type="checkbox" checked={draft.is_active} onChange={(event) => edit(section.id, { is_active: event.target.checked })} className="mt-0.5 h-4 w-4 shrink-0 accent-[#FF0931]" />
                  <span className="text-sm leading-snug text-white/75">Show this section on the site</span>
                </label>
                <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-black/40 px-4 py-3.5 transition-colors hover:border-white/20">
                  <input type="checkbox" checked={draft.is_published} onChange={(event) => edit(section.id, { is_published: event.target.checked })} className="mt-0.5 h-4 w-4 shrink-0 accent-[#FF0931]" />
                  <span className="text-sm leading-snug text-white/75">
                    Publish this {LOCALE_LABELS[locale]} copy
                    <span className="mt-1 block text-xs font-normal text-white/40">Unpublished copy is saved as a draft. Visitors see the published English copy, or the built-in default if there is none.</span>
                  </span>
                </label>
              </div>

              <div className="sticky bottom-4 -mx-1 flex flex-wrap items-center gap-3 rounded-full border border-white/10 bg-black/85 px-4 py-3 shadow-[0_12px_40px_rgba(0,0,0,0.55)] backdrop-blur">
                <ActionButton type="submit" busy={busyId === section.id} busyLabel="Saving…" disabled={!dirty.has(section.id)} className="rounded-full px-6">
                  Save section
                </ActionButton>
                {dirty.has(section.id) && (
                  <button type="button" onClick={() => edit(section.id, draftOf(section))} className="cursor-pointer rounded-full px-3 py-2 text-sm text-white/60 transition-colors hover:bg-white/10 hover:text-white">Discard changes</button>
                )}
                {section.translation && (
                  <button type="button" onClick={() => reset(section)} disabled={busyId !== ""} className="ml-auto cursor-pointer rounded-full px-3 py-2 text-sm text-red-300/80 transition-colors hover:bg-red-500/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-40">
                    {locale === "en" ? "Reset to default" : `Remove ${LOCALE_LABELS[locale]} copy`}
                  </button>
                )}
              </div>
              </div>
            </form>
          );
        })()}
      </div>
      {confirm && <ConfirmDialog request={confirm} onCancel={() => setConfirm(null)} />}
    </div>
  );
}
