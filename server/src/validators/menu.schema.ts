import { z } from "zod";

export const menuCategorySchema = z.object({
  number: z.string().min(1).max(4),
  title: z.string().min(1).max(100),
  image: z.string().url(),
  sort_order: z.number().int().min(0).optional(),
});

export const menuCategoryUpdateSchema = menuCategorySchema.partial();

export const menuItemSchema = z.object({
  category_id: z.string().min(1),
  name: z.string().min(1).max(200),
  description: z.string().min(1).max(500),
  price: z.number().positive(),
  image: z.string().url(),
  badge: z.string().max(50).nullable().optional(),
  badge_variant: z.enum(["default", "vegan"]).nullable().optional(),
  sort_order: z.number().int().min(0).optional(),
  active: z.boolean().optional(),
});

export const menuItemUpdateSchema = menuItemSchema.partial();

export const dealSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().min(1).max(500),
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
