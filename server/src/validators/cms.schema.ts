import { z } from "zod";
import type { CmsField, CmsListItem, CmsSection } from "../config/cms-registry.js";

export const localeSchema = z.enum(["en", "ur"]);

const STOREFRONT_PATH = /^\/((menu|locations|franchise-inquiries|delivery|orders|checkout)(\/[a-zA-Z0-9-]+)?)?$/;

const plain = (max: number) => z.string().max(max).refine((value) => !/[<>]/.test(value), "HTML is not allowed");

const media = z.string().max(500).refine(
  (value) => value === "" || value.startsWith("/images/") || /^https:\/\//i.test(value),
  "Media must be an https URL or a local /images path",
);

function httpsUrl(hosts?: string[]) {
  return z.string().max(500).refine((value) => {
    if (value === "") return true;
    try {
      const url = new URL(value);
      if (url.protocol !== "https:") return false;
      return !hosts || hosts.some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`));
    } catch {
      return false;
    }
  }, hosts ? `URL must be an https link on ${hosts.join(" or ")}` : "URL must start with https://");
}

function link(external?: boolean) {
  return z.string().max(500).refine(
    (value) => value === "" || STOREFRONT_PATH.test(value) || (Boolean(external) && /^https:\/\/[^\s]+$/i.test(value)),
    external ? "Link must be a storefront page or an https URL" : "Link must be an existing storefront page",
  );
}

function fieldSchema(field: CmsField | CmsListItem): z.ZodTypeAny {
  switch (field.kind) {
    case "text": return plain(field.max);
    case "image":
    case "video": return media;
    case "link": return link(field.external);
    case "url": return httpsUrl(field.hosts);
    case "number": return z.number().int().min(field.min).max(field.max);
    case "select": return z.enum(field.options.map((option) => option.value) as [string, ...string[]]);
    case "toggle": return z.boolean();
    case "list": return z.array(fieldSchema(field.item)).max(field.max);
    case "object": return z.object(Object.fromEntries(
      Object.entries(field.fields).map(([name, child]) => [name, fieldSchema(child).optional()]),
    )).strict();
  }
}

export function sectionContentSchema(section: CmsSection) {
  const shape = Object.fromEntries(Object.entries(section.fields).map(([name, field]) => [name, fieldSchema(field).optional()]));
  return z.object(shape).strict().superRefine((value, ctx) => {
    const issue = section.check?.(value);
    if (issue) ctx.addIssue({ code: "custom", message: issue.message, path: issue.path });
  });
}

export const cmsSectionUpdateSchema = z.object({
  locale: localeSchema.optional(),
  content: z.record(z.unknown()).optional(),
  is_active: z.boolean().optional(),
  is_published: z.boolean().optional(),
}).strict().refine(
  (value) => Object.values(value).some((item) => item !== undefined),
  { message: "Nothing to update" },
);

export const cmsMoveSchema = z.object({
  direction: z.enum(["up", "down"]),
});

export const cmsResetSchema = z.object({
  locale: localeSchema,
});
