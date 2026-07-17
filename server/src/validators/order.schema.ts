import { z } from "zod";

export const orderItemSchema = z.object({
  menu_item_id: z.string().min(1),
  name: z.string().min(1),
  price: z.number().positive(),
  quantity: z.number().int().positive(),
});

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
  location_id: z.string().nullable().optional(),
  subtotal: z.number().positive(),
  delivery_fee: z.number().min(0),
  total: z.number().positive(),
  items: z.array(orderItemSchema).min(1),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(["pending", "preparing", "ready", "out-for-delivery", "delivered", "cancelled"]),
});

export const locationSchema = z.object({
  name: z.string().min(1).max(200),
  address: z.string().min(1).max(500),
  hours: z.string().min(1).max(200),
  phone: z.string().min(1).max(20),
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
  sort_order: z.number().int().min(0).optional(),
});

export const locationUpdateSchema = locationSchema.partial();

export const setLocationSchema = z.object({
  location_id: z.string().min(1),
});
