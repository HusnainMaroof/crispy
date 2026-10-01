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

export const menuCategorySchema = z.object({
  number: z.string().min(1).max(4),
  title: z.string().min(1).max(100),
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
  price: z.number().positive(),
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
