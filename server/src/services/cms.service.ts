import { Prisma } from "../generated/prisma/client.js";
import { getPrisma } from "../config/prisma.js";
import { DEFAULT_LOCALE, resolveLocale, strictLocale, SUPPORTED_LOCALES, type AppLocale } from "../config/locales.js";
import {
  CMS_PAGES,
  findCmsPage,
  findCmsSection,
  publicDefinition,
  sectionDefaults,
  sectionDefinition,
  type CmsPage,
  type CmsSection,
} from "../config/cms-registry.js";
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

function publishedContent(section: CmsSection, row: SectionRow | undefined, locale: AppLocale) {
  const english = asObject(publishedCopy(row, DEFAULT_LOCALE)?.content);
  if (locale === DEFAULT_LOCALE) return english;
  const requested = row?.translations.find((item) => item.locale === locale && item.is_published);
  if (!requested) return english;
  const local = asObject(requested.content);
  const merged = { ...english };
  for (const [name, field] of Object.entries(section.fields)) {
    if (local[name] === undefined) continue;
    // Links and media are shared. An empty Arabic value must not wipe the
    // English destination, or the redirect system has nowhere to send people.
    const shared = field.kind === "url" || field.kind === "link" || field.kind === "image" || field.kind === "video";
    if (shared && local[name] === "") continue;
    merged[name] = local[name];
  }
  return merged;
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

async function loadRows(pageId: string): Promise<SectionRow[]> {
  return getPrisma().cms_sections.findMany({
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
  const request = loadRows(pageId).then((rows) => {
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

async function ensureSections(page: CmsPage) {
  await getPrisma().cms_sections.createMany({
    data: page.sections.map((section, index) => ({ page: page.id, key: section.key, sort_order: index })),
    skipDuplicates: true,
  });
}

export async function getPublicCmsPage(pageId: string, requested?: unknown): Promise<PublicCmsPage> {
  const page = requirePage(pageId);
  const locale = resolveLocale(requested);
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
  const coverage = SUPPORTED_LOCALES.map((code) => ({
    locale: code,
    translated: page.sections.filter((section) => rows.find((row) => row.key === section.key)?.translations.some((item) => item.locale === code)).length,
    total: page.sections.length,
  }));
  return serialize({
    page: publicDefinition(page),
    locale,
    coverage,
    sections: orderedSections(page, rows).map((section) => {
      const row = rows.find((item) => item.key === section.key)!;
      const translation = row.translations.find((item) => item.locale === locale) ?? null;
      const english = row.translations.find((item) => item.locale === DEFAULT_LOCALE);
      const base = translation ?? (locale === DEFAULT_LOCALE ? null : english);
      return {
        id: row.id,
        key: section.key,
        sort_order: row.sort_order,
        is_active: row.is_active,
        definition: sectionDefinition(section),
        content: resolveContent(section, asObject(base?.content)),
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

export async function updateCmsSection(actor: Actor, id: string, input: CmsSectionInput) {
  await assertCmsEditor(actor);
  const locale = requireLocale(input.locale ?? DEFAULT_LOCALE);
  const { row, section } = await requireSection(id);
  const content = input.content !== undefined ? validateContent(section, input.content) : undefined;
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
  if (!page.sortable || section.pinned) throw new BadRequestException("This section has a fixed position");
  const rows = await loadRows(page.id);
  const ordered = orderedSections(page, rows);
  const movable = ordered.filter((item) => !item.pinned);
  const index = movable.findIndex((item) => item.key === section.key);
  const swap = direction === "up" ? index - 1 : index + 1;
  if (swap >= 0 && swap < movable.length) {
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
