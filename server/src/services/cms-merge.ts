import { isLocked, type CmsField, type CmsListItem, type CmsSection } from "../config/cms-registry.js";

export type CmsShape = CmsField | CmsListItem;

const SHARED_KINDS = new Set(["image", "video", "url", "link"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/**
 * Media and links belong to the page, not to one language. A gallery is a list
 * of images, so the whole list is shared too.
 */
export function isSharedField(field: CmsShape): boolean {
  if ((field as { shared?: boolean }).shared === true) return true;
  if (SHARED_KINDS.has(field.kind)) return true;
  return field.kind === "list" && isSharedField(field.item);
}

/**
 * False for a section with nothing to translate: every field is either locked
 * (edited in code) or shared (the same in every language), so it can never
 * reach a translation count.
 */
export function hasTranslatableFields(section: CmsSection): boolean {
  return Object.values(section.fields).some((field) => !isLocked(field) && !isSharedField(field));
}

/**
 * Folds one translated value onto its English counterpart.
 *
 * Shared fields always come from English. The Arabic copy used to keep its own
 * Instagram thumbnails, so replacing a picture in English left the Arabic page
 * showing the old one. Everything else is translated, and a blank value means
 * "not translated yet", so it falls back to English.
 */
export function mergeLocalizedValue(english: unknown, local: unknown, field: CmsShape): unknown {
  if (isSharedField(field)) return english !== undefined ? english : local;

  if (field.kind === "list") {
    if (!Array.isArray(local)) return english;
    if (!Array.isArray(english)) return local;
    return local.map((item, index) =>
      index < english.length ? mergeLocalizedValue(english[index], item, field.item) : item,
    );
  }

  if (field.kind === "object") {
    if (!isRecord(local)) return english;
    const base = isRecord(english) ? english : {};
    return Object.fromEntries(
      Object.entries(field.fields).map(([name, child]) => [
        name,
        mergeLocalizedValue(base[name], local[name], child),
      ]),
    );
  }

  return local === undefined || local === "" ? english : local;
}

/** The English content with every translated value laid over it. */
export function mergeSectionContent(
  section: CmsSection,
  english: Record<string, unknown>,
  local: Record<string, unknown>,
): Record<string, unknown> {
  const merged = { ...english };
  for (const [name, field] of Object.entries(section.fields)) {
    if (local[name] === undefined) continue;
    merged[name] = mergeLocalizedValue(english[name], local[name], field);
  }
  return merged;
}

const DROP = Symbol("drop");

function withoutShared(field: CmsShape, value: unknown): unknown | typeof DROP {
  if (isSharedField(field)) return DROP;

  if (field.kind === "list") {
    if (!Array.isArray(value)) return value;
    return value.map((item) => {
      const next = withoutShared(field.item, item);
      return next === DROP ? {} : next;
    });
  }

  if (field.kind === "object") {
    if (!isRecord(value)) return value;
    const result = { ...value };
    for (const [name, child] of Object.entries(field.fields)) {
      if (!(name in result)) continue;
      const next = withoutShared(child, result[name]);
      if (next === DROP) delete result[name];
      else result[name] = next;
    }
    return result;
  }

  return value;
}

/**
 * A translation keeps only translatable values. Media and links are dropped,
 * so a saved Arabic copy can never go stale behind the English one.
 */
export function stripSharedFields(
  section: CmsSection,
  content: Record<string, unknown>,
): Record<string, unknown> {
  const result = { ...content };
  for (const [name, field] of Object.entries(section.fields)) {
    if (!(name in result)) continue;
    const next = withoutShared(field, result[name]);
    if (next === DROP) delete result[name];
    else result[name] = next;
  }
  return result;
}
