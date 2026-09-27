"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import PageHeader from "@/app/components/admin/ui/page-header";
import { api } from "@/lib/api";
import { PageSkeleton } from "@/app/components/admin/ui/skeleton";
import { FieldInput, type CmsField } from "./cms-fields";

type Locale = "en" | "ur";
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

const LOCALE_LABELS: Record<Locale, string> = { en: "English", ur: "Urdu" };

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
  const router = useRouter();

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
    if (dirty.size > 0 && !window.confirm("You have unsaved changes in this section. Leave them?")) return;
    setSectionKey(key);
    router.replace(`/admin/cms/${pageId}?section=${key}`, { scroll: false });
  }

  function switchLocale(next: Locale) {
    if (next === locale) return;
    if (dirty.size > 0 && !window.confirm("You have unsaved changes. Switch language and discard them?")) return;
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
    if (dirty.size > 0 && !window.confirm("Reordering reloads the page. Discard unsaved changes?")) return;
    void run(section.id, () => api.post<PagePayload>(`/admin/cms/sections/${section.id}/move`, { direction }), "Order updated");
  }

  function reset(section: Section) {
    const message = locale === "en"
      ? `Reset "${section.definition.label}" to the built-in default content?`
      : `Remove the ${LOCALE_LABELS[locale]} copy of "${section.definition.label}"? Visitors will see English instead.`;
    if (!window.confirm(message)) return;
    void run(section.id, () => api.post<PagePayload>(`/admin/cms/sections/${section.id}/reset`, { locale }), "Section reset");
  }

  const sections = payload?.sections ?? [];
  const activeKey = sections.some((section) => section.key === sectionKey) ? sectionKey : (sections[0]?.key ?? "");
  const section = sections.find((item) => item.key === activeKey) ?? null;
  const movable = sections.filter((item) => !item.definition.pinned);

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("section");
    if (requested) setSectionKey(requested);
  }, [pageId]);

  return (
    <div className="admin-fade-in">
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-white/50">
        <ol className="flex flex-wrap items-center gap-2">
          <li>Content</li>
          <li aria-hidden="true">/</li>
          <li>{payload?.page.label ?? "Page"}</li>
          {section && <>
            <li aria-hidden="true">/</li>
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
      {sections.length > 0 && (
        <div role="tablist" aria-label="Sections" className="mb-6 flex gap-2 overflow-x-auto pb-1">
          {sections.map((item) => {
            const selected = item.key === activeKey;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => openSection(item.key)}
                className={`h-11 shrink-0 cursor-pointer rounded-full px-4 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#FF0931] ${selected ? "bg-[#FF0931] text-white" : "bg-white/5 text-white/60 hover:text-white"}`}
              >
                {item.definition.label}
              </button>
            );
          })}
        </div>
      )}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {(["en", "ur"] as const).map((code) => {
          const count = payload?.coverage.find((item) => item.locale === code);
          return (
            <button key={code} type="button" onClick={() => switchLocale(code)} className={`cursor-pointer rounded-full px-4 py-2 text-sm ${locale === code ? "bg-[#FF0931] text-white" : "bg-white/5 text-white/60"}`}>
              {LOCALE_LABELS[code]}{count ? ` ${count.translated}/${count.total}` : ""}
            </button>
          );
        })}
        {dirty.size > 0 && <span className="ml-2 text-xs text-amber-300">{dirty.size} unsaved {dirty.size === 1 ? "section" : "sections"}</span>}
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
            <form key={section.id} onSubmit={(event) => { event.preventDefault(); save(section); }} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="mb-4 flex items-center justify-end gap-2">
                <div className="flex shrink-0 items-center gap-2">
                  {canMove && <>
                    <button type="button" onClick={() => move(section, "up")} disabled={position <= 0 || busyId !== ""} className="h-11 w-11 cursor-pointer rounded-lg border border-white/15 text-sm text-white/70 disabled:opacity-30" aria-label="Move section up">↑</button>
                    <button type="button" onClick={() => move(section, "down")} disabled={position === movable.length - 1 || busyId !== ""} className="h-11 w-11 cursor-pointer rounded-lg border border-white/15 text-sm text-white/70 disabled:opacity-30" aria-label="Move section down">↓</button>
                  </>}
                  <span className={`rounded-full px-2.5 py-1 text-xs ${live ? "bg-green-500/15 text-green-300" : "bg-white/10 text-white/50"}`}>{live ? "Shown" : "Hidden"}</span>
                </div>
              </div>

              {section.copied_from_english && (
                <p className="mb-4 rounded-xl border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-xs text-amber-200">
                  No {LOCALE_LABELS[locale]} copy yet. The English content is filled in below as a starting point; visitors see English until you save and publish.
                </p>
              )}

              <div className="mb-5 space-y-4">
                {Object.entries(section.definition.fields).map(([name, field]) => (
                  <FieldInput key={name} field={field} value={draft.content[name]} onChange={(value) => edit(section.id, { content: { ...draft.content, [name]: value } })} />
                ))}
              </div>

              <div className="mb-5 flex flex-wrap gap-4 text-sm text-white/70">
                <label className="flex items-center gap-2"><input type="checkbox" checked={draft.is_active} onChange={(event) => edit(section.id, { is_active: event.target.checked })} />Show this section on the site</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={draft.is_published} onChange={(event) => edit(section.id, { is_published: event.target.checked })} />Publish this {LOCALE_LABELS[locale]} copy</label>
              </div>
              <p className="-mt-3 mb-5 text-xs text-white/40">
                Unpublished copy is saved as a draft. Visitors see the published English copy, or the built-in default if there is none.
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <button type="submit" disabled={busyId === section.id || !dirty.has(section.id)} className="h-11 cursor-pointer rounded-full bg-[#FF0931] px-6 text-sm text-white disabled:opacity-50">
                  {busyId === section.id ? "Saving…" : "Save section"}
                </button>
                {dirty.has(section.id) && (
                  <button type="button" onClick={() => edit(section.id, draftOf(section))} className="cursor-pointer text-sm text-white/60 hover:text-white">Discard changes</button>
                )}
                {section.translation && (
                  <button type="button" onClick={() => reset(section)} disabled={busyId !== ""} className="ml-auto cursor-pointer text-sm text-red-300/80 hover:text-red-300 disabled:opacity-40">
                    {locale === "en" ? "Reset to default" : `Remove ${LOCALE_LABELS[locale]} copy`}
                  </button>
                )}
              </div>
            </form>
          );
        })()}
      </div>
    </div>
  );
}
