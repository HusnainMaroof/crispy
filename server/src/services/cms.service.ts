import { Prisma } from "../generated/prisma/client.js";
import { getPrisma, getReadPrisma } from "../config/prisma.js";
import { cachedJson, invalidateCmsCache, TTL_CMS_SECONDS } from "../utils/cache.js";
import { DEFAULT_LOCALE, resolveLocale, strictLocale, SUPPORTED_LOCALES, type AppLocale } from "../config/locales.js";
import {
  CMS_PAGES,
  findCmsPage,
  findCmsSection,
  publicDefinition,
  lockedFieldNames,
  sectionDefaults,
  sectionDefinition,
  type CmsPage,
  type CmsSection,
} from "../config/cms-registry.js";
import { hasTranslatableFields, mergeSectionContent, stripSharedFields } from "./cms-merge.js";
import { sectionContentSchema } from "../validators/cms.schema.js";
import { resolveTabs } from "../config/admin-tabs.js";
import { BadRequestException, ForbiddenException, NotFoundException } from "../utils/app-error.js";
import { serialize } from "../utils/db.js";
import type { AuthPayload } from "../types/responses.js";

type Actor = Pick<AuthPayload, "sub" | "role">;
type Translation = { locale: string; content: Prisma.JsonValue; is_published: boolean; updated_at: Date };
type SectionRow = { id: string; key: string; sort_order: number; is_active: boolean; translations: Translation[] };

export type CmsSectionInput = {
  locale?: string;
  content?: Record<string, unknown>;
  is_active?: boolean;
  is_published?: boolean;
};

export async function assertCmsEditor(actor: Actor) {
  if (actor.role === "superadmin") return;
  const profile = await getPrisma().admin_profiles.findUnique({ where: { id: actor.sub }, select: { role: true, tabs: true } });
  if (profile && resolveTabs(profile.role, profile.tabs).includes("content")) return;
  throw new ForbiddenException("Content is not assigned to your account");
}

function requirePage(id: string): CmsPage {
  const page = findCmsPage(id);
  if (!page) throw new NotFoundException("Content page not found");
  return page;
}

function requireLocale(value: unknown): AppLocale {
  const locale = strictLocale(value);
  if (!locale) throw new BadRequestException("Unsupported locale");
  return locale;
}

function asObject(value: Prisma.JsonValue | undefined): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function resolveContent(section: CmsSection, stored: Record<string, unknown>) {
  const content = sectionDefaults(section);
  for (const name of Object.keys(section.fields)) {
    if (stored[name] !== undefined) content[name] = stored[name];
  }
  return content;
}

/**
 * The published copy for one locale: the English content with the translated
 * values laid over it. Shared media and links always come from English.
 */
function publishedContent(section: CmsSection, row: SectionRow | undefined, locale: AppLocale) {
  const english = asObject(publishedCopy(row, DEFAULT_LOCALE)?.content);
  if (locale === DEFAULT_LOCALE) return english;
  const requested = row?.translations.find((item) => item.locale === locale && item.is_published);
  if (!requested) return english;
  return mergeSectionContent(section, english, asObject(requested.content));
}

function publishedCopy(row: SectionRow | undefined, locale: AppLocale) {
  if (!row) return null;
  const requested = row.translations.find((item) => item.locale === locale && item.is_published);
  if (requested) return requested;
  return row.translations.find((item) => item.locale === DEFAULT_LOCALE && item.is_published) ?? null;
}

function orderedSections(page: CmsPage, rows: SectionRow[]) {
  const position = (section: CmsSection, index: number) => rows.find((row) => row.key === section.key)?.sort_order ?? index;
  const pinned = page.sections.filter((section) => section.pinned);
  const movable = page.sections
    .map((section, index) => ({ section, order: position(section, index), index }))
    .filter((item) => !item.section.pinned)
    .sort((a, b) => a.order - b.order || a.index - b.index)
    .map((item) => item.section);
  return page.sortable ? [...pinned, ...movable] : page.sections;
}

/** Public reads may use the read replica; editing always uses the primary. */
async function loadRows(pageId: string, read?: boolean): Promise<SectionRow[]> {
  return (read ? getReadPrisma() : getPrisma()).cms_sections.findMany({
    where: { page: pageId },
    orderBy: [{ sort_order: "asc" }, { id: "asc" }],
    include: { translations: true },
  });
}

type PublicCmsPage = { page: string; locale: AppLocale; order: string[]; sections: Record<string, Record<string, unknown>> };

const PUBLIC_TTL_MS = 15_000;
const publicCache = new Map<string, { expires: number; value: PublicCmsPage }>();
const publicInflight = new Map<string, Promise<PublicCmsPage>>();
const rowCache = new Map<string, { expires: number; rows: SectionRow[] }>();
const rowInflight = new Map<string, Promise<SectionRow[]>>();

function clearPublicCmsCache(pageId: string) {
  // Also drop the shared (multi-instance) cms: keys on every write.
  void invalidateCmsCache();
  rowCache.delete(pageId);
  for (const key of publicCache.keys()) {
    if (key.startsWith(`${pageId}:`)) publicCache.delete(key);
  }
}

async function loadPublicRows(pageId: string): Promise<SectionRow[]> {
  const hit = rowCache.get(pageId);
  if (hit && hit.expires > Date.now()) return hit.rows;
  const pending = rowInflight.get(pageId);
  if (pending) return pending;
  // Primary read. This result is cached, so a replica fill would keep lag for the TTL.
  const request = loadRows(pageId, false).then((rows) => {
    rowCache.set(pageId, { expires: Date.now() + PUBLIC_TTL_MS, rows });
    return rows;
  });
  rowInflight.set(pageId, request);
  try {
    return await request;
  } finally {
    if (rowInflight.get(pageId) === request) rowInflight.delete(pageId);
  }
}

/**
 * Creates any registry section rows a page is missing. It is a write, so it runs
 * once per page per process rather than on every editor read. `skipDuplicates`
 * makes the first call idempotent, and the registry only grows, so a later
 * request never needs to re-check. A restart simply re-runs it once.
 */
const ensuredPages = new Set<string>();

async function ensureSections(page: CmsPage) {
  if (ensuredPages.has(page.id)) return;
  await getPrisma().cms_sections.createMany({
    data: page.sections.map((section, index) => ({ page: page.id, key: section.key, sort_order: index })),
    skipDuplicates: true,
  });
  ensuredPages.add(page.id);
}

export async function getPublicCmsPage(pageId: string, requested?: unknown): Promise<PublicCmsPage> {
  const page = requirePage(pageId);
  const locale = resolveLocale(requested);
  // Outer shared cache (utils/cache.ts), invalidated by every CMS write. The
  // inner maps below still coalesce concurrent requests and hold a shorter copy.
  return cachedJson(`cms:${page.id}:${locale}`, TTL_CMS_SECONDS, () => loadPublicCmsPage(page, locale));
}

async function loadPublicCmsPage(page: CmsPage, locale: AppLocale): Promise<PublicCmsPage> {
  const key = `${page.id}:${locale}`;
  const hit = publicCache.get(key);
  if (hit && hit.expires > Date.now()) return hit.value;
  const pending = publicInflight.get(key);
  if (pending) return pending;

  const request = (async (): Promise<PublicCmsPage> => {
    const rows = await loadPublicRows(page.id);
    const sections: Record<string, Record<string, unknown>> = {};
    const order: string[] = [];
    for (const section of orderedSections(page, rows)) {
      const row = rows.find((item) => item.key === section.key);
      if (row && !row.is_active) continue;
      sections[section.key] = resolveContent(section, publishedContent(section, row, locale));
      order.push(section.key);
    }
    return { page: page.id, locale, order, sections };
  })();

  publicInflight.set(key, request);
  try {
    const value = await request;
    publicCache.set(key, { expires: Date.now() + PUBLIC_TTL_MS, value });
    return value;
  } finally {
    if (publicInflight.get(key) === request) publicInflight.delete(key);
  }
}

export async function listCmsPages(actor: Actor) {
  await assertCmsEditor(actor);
  return CMS_PAGES.map((page) => ({ ...publicDefinition(page), sectionCount: page.sections.length }));
}

export async function getCmsPageForEditing(actor: Actor, pageId: string, requested?: unknown) {
  await assertCmsEditor(actor);
  const page = requirePage(pageId);
  const locale = requireLocale(requested ?? DEFAULT_LOCALE);
  await ensureSections(page);
  const rows = await loadRows(page.id);
  // Hidden sections and sections with only locked or shared fields cannot be
  // translated, so counting them left the gauge stuck below 100% forever.
  const translatable = page.sections.filter((section) => !section.hidden && hasTranslatableFields(section));
  const coverage = SUPPORTED_LOCALES.map((code) => ({
    locale: code,
    translated: translatable.filter((section) => rows.find((row) => row.key === section.key)?.translations.some((item) => item.locale === code)).length,
    total: translatable.length,
  }));
  return serialize({
    page: publicDefinition(page),
    locale,
    coverage,
    sections: orderedSections(page, rows).filter((section) => !section.hidden).map((section) => {
      const row = rows.find((item) => item.key === section.key)!;
      const translation = row.translations.find((item) => item.locale === locale) ?? null;
      const english = row.translations.find((item) => item.locale === DEFAULT_LOCALE);
      const base = translation ?? (locale === DEFAULT_LOCALE ? null : english);
      // The editor shows the English pictures in every language, because those
      // are the ones the storefront uses for this locale too.
      const content = locale === DEFAULT_LOCALE
        ? asObject(base?.content)
        : mergeSectionContent(section, asObject(english?.content), asObject(base?.content));
      return {
        id: row.id,
        key: section.key,
        sort_order: row.sort_order,
        is_active: row.is_active,
        definition: sectionDefinition(section),
        content: resolveContent(section, content),
        translation: translation
          ? { is_published: translation.is_published, updated_at: translation.updated_at }
          : null,
        copied_from_english: !translation && Boolean(english) && locale !== DEFAULT_LOCALE,
      };
    }),
  });
}

async function requireSection(id: string) {
  const row = await getPrisma().cms_sections.findUnique({ where: { id } });
  if (!row) throw new NotFoundException("Content section not found");
  const section = findCmsSection(row.page, row.key);
  if (!section) throw new NotFoundException("Content section is no longer defined");
  return { row, section };
}

function validateContent(section: CmsSection, content: Record<string, unknown>) {
  const result = sectionContentSchema(section).safeParse(content);
  if (!result.success) {
    const issue = result.error.issues[0];
    const where = issue.path.length ? `${issue.path.join(".")}: ` : "";
    throw new BadRequestException(`${where}${issue.message}`);
  }
  return result.data as Prisma.InputJsonValue;
}

/**
 * Locked fields are not editable in the panel, but the editor still sends the
 * whole content object back. Their values are restored from the stored copy (or
 * the registry default) so a save can never change them.
 */
function restoreLocked(section: CmsSection, incoming: Record<string, unknown>, stored: Record<string, unknown>) {
  const result = { ...incoming };
  for (const name of lockedFieldNames(section)) {
    result[name] = stored[name] !== undefined ? stored[name] : sectionDefaults(section)[name];
  }
  return result;
}

export async function updateCmsSection(actor: Actor, id: string, input: CmsSectionInput) {
  await assertCmsEditor(actor);
  const locale = requireLocale(input.locale ?? DEFAULT_LOCALE);
  const { row, section } = await requireSection(id);
  if (section.hidden) throw new BadRequestException("This section is managed by the store");
  let content: Prisma.InputJsonValue | undefined;
  if (input.content !== undefined) {
    const current = await getPrisma().cms_section_translations.findUnique({
      where: { section_id_locale: { section_id: id, locale } },
      select: { content: true },
    });
    const restored = restoreLocked(section, input.content, asObject(current?.content));
    // A translation stores only what is translated; media and links stay in English.
    const cleaned = locale === DEFAULT_LOCALE ? restored : stripSharedFields(section, restored);
    content = validateContent(section, cleaned);
  }
  if (input.is_active !== undefined) {
    await getPrisma().cms_sections.update({ where: { id }, data: { is_active: input.is_active } });
  }
  if (content !== undefined || input.is_published !== undefined) {
    await getPrisma().cms_section_translations.upsert({
      where: { section_id_locale: { section_id: id, locale } },
      create: { section_id: id, locale, content: content ?? {}, is_published: input.is_published ?? false },
      update: {
        ...(content !== undefined ? { content } : {}),
        ...(input.is_published !== undefined ? { is_published: input.is_published } : {}),
      },
    });
  }
  clearPublicCmsCache(row.page);
  return getCmsPageForEditing(actor, row.page, locale);
}

export async function moveCmsSection(actor: Actor, id: string, direction: "up" | "down") {
  await assertCmsEditor(actor);
  const { row, section } = await requireSection(id);
  const page = requirePage(row.page);
  if (!page.sortable || section.pinned || section.hidden) throw new BadRequestException("This section has a fixed position");
  const rows = await loadRows(page.id);
  const ordered = orderedSections(page, rows);
  const movable = ordered.filter((item) => !item.pinned);
  const index = movable.findIndex((item) => item.key === section.key);
  const swap = direction === "up" ? index - 1 : index + 1;
  if (swap >= 0 && swap < movable.length) {
    if (movable[swap].hidden) throw new BadRequestException("This section has a fixed position");
    [movable[index], movable[swap]] = [movable[swap], movable[index]];
    const next = [...ordered.filter((item) => item.pinned), ...movable];
    await getPrisma().$transaction(next.map((item, order) => getPrisma().cms_sections.updateMany({
      where: { page: page.id, key: item.key },
      data: { sort_order: order },
    })));
  }
  clearPublicCmsCache(page.id);
  return getCmsPageForEditing(actor, page.id);
}

export async function resetCmsSection(actor: Actor, id: string, requested: unknown) {
  await assertCmsEditor(actor);
  const locale = requireLocale(requested);
  const { row } = await requireSection(id);
  await getPrisma().cms_section_translations.deleteMany({ where: { section_id: id, locale } });
  clearPublicCmsCache(row.page);
  return getCmsPageForEditing(actor, row.page, locale);
}
