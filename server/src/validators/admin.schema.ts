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

export const jobApplicationPublicSchema = jobApplicationSchema.omit({ job_post_id: true });

export const jobApplicationUpdateSchema = z.object({
  status: z.enum(["pending", "reviewed", "shortlisted", "rejected", "hired"]).optional(),
  notes: z.string().max(2000).optional(),
});

export const jobApplicationStatusSchema = z.object({
  status: z.enum(["pending", "reviewed", "shortlisted", "rejected", "hired"]),
});

// Only the three current panel roles can be assigned.
export const staffRoleSchema = z.enum(["superadmin", "branch_manager", "staff"]);

const staffTabSchema = z.enum([
  "dashboard", "menu", "categories", "orders", "customers", "staff", "branches",
  "deals", "branch-menu", "posts", "locations", "content", "settings",
]);

export const createStaffSchema = z.object({
  position: z.string().trim().min(1).max(100).nullable().optional(),
  name: z.string().min(1).max(200),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  role: staffRoleSchema.optional(),
  tabs: z.array(staffTabSchema).min(1).optional(),
  branchIds: z.array(z.string().min(1)).max(20).default([]),
});

export const updateStaffSchema = z.object({
  position: z.string().trim().min(1).max(100).nullable().optional(),
  name: z.string().min(1).max(200).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).max(128).optional(),
  role: staffRoleSchema.optional(),
  tabs: z.array(staffTabSchema).min(1).optional(),
  branchIds: z.array(z.string().min(1)).max(20).optional(),
  is_active: z.boolean().optional(),
}).refine((value) => Object.values(value).some((item) => item !== undefined), { message: "Nothing to update" });

export const staffBranchesSchema = z.object({
  branchIds: z.array(z.string().min(1)).max(20),
});

export const ownProfileSchema = z.object({
  name: z.string().min(1).max(200),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});
