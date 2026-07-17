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

export const jobPostStatusSchema = z.object({
  status: z.enum(["draft", "active", "closed"]),
});

export const jobApplicationSchema = z.object({
  job_post_id: z.string().min(1),
  applicant_name: z.string().min(1).max(200),
  email: z.string().email(),
  phone: z.string().max(20).optional(),
  cv_url: z.string().url().optional(),
  cover_letter: z.string().max(5000).optional(),
});

export const jobApplicationUpdateSchema = z.object({
  status: z.enum(["pending", "reviewed", "shortlisted", "rejected", "hired"]).optional(),
  notes: z.string().max(2000).optional(),
});

export const jobApplicationStatusSchema = z.object({
  status: z.enum(["pending", "reviewed", "shortlisted", "rejected", "hired"]),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});
