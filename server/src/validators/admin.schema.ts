import { z } from "zod";

export const businessSettingsSchema = z.object({
  delivery_fee: z.number().min(0),
  free_delivery_threshold: z.number().min(0),
});

export const jobPostSchema = z.object({
  title: z.string().min(1).max(200),
  location: z.string().min(1).max(200),
  type: z.string().min(1).max(100),
  salary: z.string().min(1).max(100),
  description: z.string().min(1).max(2000),
  requirements: z.array(z.string().min(1)).min(1),
  status: z.enum(["draft", "active", "closed"]).optional(),
});

export const jobPostUpdateSchema = jobPostSchema.partial();

export const contactMessageSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  subject: z.string().min(1).max(200),
  message: z.string().min(1).max(2000),
  type: z.enum(["general", "franchise", "careers", "press"]),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});
