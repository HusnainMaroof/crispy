import { z } from "zod";

/** Empty means no link; otherwise it must be a secure external URL. */
const redirectUrl = z
  .string()
  .max(500)
  .refine((value) => value === "" || /^https:\/\/\S+$/i.test(value), "Redirect link must start with https://");

/**
 * The redirect system needs a destination for every platform, so a link is
 * required once it is supplied and must be secure. The admin form requires all
 * three; the API keeps them optional so existing catalogue rows stay valid.
 */
const platformRedirects = {
  redirect_uber_eats: redirectUrl.optional(),
  redirect_deliveroo: redirectUrl.optional(),
  redirect_just_eat: redirectUrl.optional(),
};

/**
 * Titles are stored in title case, however they were typed. "chickens",
 * "CHICKENS" and "Chickens" all become "Chickens". Hyphens, slashes and
 * ampersands start a new word, so "gluten-free" becomes "Gluten-Free".
 */
function titleCase(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
    .replace(/(^|[\s\-/&])(\p{L})/gu, (_match, lead: string, letter: string) => lead + letter.toUpperCase());
}

/** Trimmed and title-cased before the length check, so "   " is rejected. */
const categoryTitle = z
  .string()
  .transform(titleCase)
  .pipe(z.string().min(1).max(100));

export const menuCategorySchema = z.object({
  number: z.string().min(1).max(4),
  title: categoryTitle,
  title_ar: z.string().max(100).optional(),
  image: z.string().url(),
  sort_order: z.number().int().min(0).optional(),
});

export const menuCategoryUpdateSchema = menuCategorySchema.partial();

export const menuItemSchema = z.object({
  category_id: z.string().min(1),
  name: z.string().min(1).max(200),
  name_ar: z.string().max(200).optional(),
  description: z.string().max(500).optional(),
  description_ar: z.string().max(500).optional(),
  ...platformRedirects,
  // min(0): a menu item can be free, and the admin form saves 0 for that.
  price: z.number().min(0),
  show_price: z.boolean().optional(),
  image: z.string().min(1),
  badge: z.string().max(50).nullable().optional(),
  badge_variant: z.enum(["default", "vegan"]).nullable().optional(),
  sort_order: z.number().int().min(0).optional(),
  active: z.boolean().optional(),
  location_ids: z.array(z.string().min(1)).optional(),
});

export const menuItemUpdateSchema = menuItemSchema.partial();

export const dealSchema = z.object({
  name: z.string().min(1).max(200),
  name_ar: z.string().max(200).optional(),
  description: z.string().min(1).max(500),
  description_ar: z.string().max(500).optional(),
  price: z.number().positive(),
  image: z.string().url(),
  badge: z.string().max(50).nullable().optional(),
  badge_variant: z.enum(["default", "vegan"]).nullable().optional(),
  active: z.boolean().optional(),
});

export const dealUpdateSchema = dealSchema.partial();

export const menuItemsQuerySchema = z.object({
  category_id: z.string().min(1).optional(),
});
