import { z } from "zod";
import { paginationSchema } from "./pagination.schema.js";

export const createOrderSchema = z.object({
  customer_name: z.string().min(1).max(200),
  email: z.string().email(),
  phone: z.string().min(7).max(20),
  address: z.string().max(500).nullable().optional(),
  postcode: z.string().max(20).nullable().optional(),
  city: z.string().max(100).nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
  fulfilment: z.enum(["delivery", "collection"]),
  payment_method: z.enum(["card", "cash"]),
  location_id: z.string().min(1),
  checkout_key: z.string().uuid(),
  locale: z.enum(["en", "ar"]).optional(),
  items: z.array(z.object({
    kind: z.enum(["product", "deal"]),
    id: z.string().min(1),
    quantity: z.number().int().positive().max(99),
  })).min(1).max(40),
}).superRefine((value, ctx) => {
  if (value.fulfilment !== "delivery") return;
  if (!value.address) ctx.addIssue({ code: "custom", message: "Address is required for delivery", path: ["address"] });
  if (!value.postcode) ctx.addIssue({ code: "custom", message: "Postcode is required for delivery", path: ["postcode"] });
  if (!value.city) ctx.addIssue({ code: "custom", message: "City is required for delivery", path: ["city"] });
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(["pending", "preparing", "ready", "out-for-delivery", "delivered", "cancelled"]),
});

const branchSlug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80);

export const locationSchema = z.object({
  name: z.string().min(1).max(200),
  slug: branchSlug.optional(),
  address: z.string().min(1).max(500),
  postcode: z.string().max(20).nullable().optional(),
  city: z.string().max(100).nullable().optional(),
  hours: z.string().min(1).max(200),
  phone: z.string().min(1).max(20),
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
  status: z.enum(["active", "inactive"]).optional(),
  delivery_enabled: z.boolean().optional(),
  collection_enabled: z.boolean().optional(),
  delivery_fee: z.number().min(0).nullable().optional(),
  free_delivery_threshold: z.number().min(0).nullable().optional(),
  sort_order: z.number().int().min(0).optional(),
});

export const locationUpdateSchema = locationSchema.partial();

export const customerProfileSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(7).max(20).optional(),
}).refine((value) => value.name || value.email || value.phone, { message: "Nothing to update" });

/**
 * validate(..., "query") replaces req.query with the parsed object, and zod
 * strips keys the schema does not declare. Without page/limit declared here,
 * `?page=2` was silently discarded before the controller ever saw it.
 */
export const customerSearchSchema = paginationSchema.extend({
  q: z.string().trim().max(100).optional(),
});

export const orderLookupSchema = z.object({
  email: z.string().email(),
});

export const setLocationSchema = z.object({
  location_id: z.string().min(1),
});

export const branchMenuWriteSchema = z.object({
  replace: z.boolean().optional(),
  items: z.array(z.object({
    menu_item_id: z.string().min(1),
    // min(0), not positive(): a branch legitimately prices an item at 0, and
    // the admin form sends a real 0 rather than null for that.
    price: z.number().min(0).nullable().optional(),
    available: z.boolean().optional(),
    sort_order: z.number().int().min(0).nullable().optional(),
  })),
}).refine((value) => value.replace === true || value.items.length > 0, {
  message: "Add at least one menu item",
  path: ["items"],
});

export const quoteSchema = z.object({
  locationId: z.string().min(1),
  locale: z.enum(["en", "ar"]).optional(),
  items: z.array(z.object({
    kind: z.enum(["product", "deal"]),
    id: z.string().min(1),
    quantity: z.number().int().positive().max(99),
  })).min(1).max(40),
});

export const branchDealWriteSchema = z.object({
  deals: z.array(z.object({
    deal_id: z.string().min(1),
    price: z.number().positive().nullable().optional(),
    available: z.boolean().optional(),
  })).min(1),
});
