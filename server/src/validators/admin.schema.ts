import { z } from "zod";
import { envConfig } from "../config/env.js";

export const businessSettingsSchema = z.object({
  delivery_fee: z.number().min(0),
  free_delivery_threshold: z.number().min(0),
});

/**
 * `location_id` is optional here on purpose. A branch manager never gets to
 * choose freely, so the controller resolves and checks the branch against their
 * own assignments rather than trusting the body. Super admins still have to send
 * it — the controller rejects a create without it.
 *
 * `location` is the display copy of the branch name and is always overwritten
 * from the resolved branch, so it is never read from the request.
 *
 * `type` stays free text on purpose. Managers can introduce a type nobody uses
 * yet, so there is no enum here; the form offers the values already in use as
 * suggestions. See `getJobPostTypes`.
 *
 * The `*_ar` fields are the Arabic display copy, same convention as the menu
 * catalogue: optional, and the Arabic store falls back to the English field
 * when they are empty.
 */
export const jobPostSchema = z.object({
  title: z.string().trim().min(1).max(200),
  title_ar: z.string().trim().max(200).optional(),
  location_id: z.string().trim().min(1).max(80).optional(),
  location: z.string().trim().min(1).max(200).optional(),
  type: z.string().trim().min(1).max(100),
  salary: z.string().trim().min(1).max(100),
  description: z.string().trim().min(1).max(2000),
  description_ar: z.string().trim().max(2000).optional(),
  requirements: z.array(z.string().trim().min(1)).min(1),
  requirements_ar: z.array(z.string().trim().min(1)).optional(),
  status: z.enum(["draft", "active", "closed"]).optional(),
});

// Guards the same case as updateStaffSchema: `.partial()` alone accepts `{}`,
// which would reach Prisma as an update with no fields.
export const jobPostUpdateSchema = jobPostSchema
  .partial()
  .refine((value) => Object.values(value).some((item) => item !== undefined), {
    message: "Nothing to update",
  });

export const contactMessageSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  subject: z.string().min(1).max(200),
  message: z.string().min(1).max(2000),
  type: z.enum(["general", "franchise", "careers", "press"]),
});

/** Public brochure request — only an email is required. */
export const brochureRequestSchema = z.object({
  email: z.string().trim().email().max(254),
  name: z.string().trim().max(200).optional().default(""),
  phone: z.string().trim().max(40).optional().default(""),
  locale: z.enum(["en", "ar"]).optional().default("en"),
});

export const jobPostStatusSchema = z.object({
  status: z.enum(["draft", "active", "closed"]),
});

/**
 * A CV link is rendered straight into an `href` in the admin applications
 * grid, so the scheme is pinned to http(s). `z.string().url()` alone also
 * accepts `javascript:` and `data:` URLs, which would run in the reviewing
 * admin's session.
 */
const cvLinkSchema = z
  .string()
  .trim()
  .max(2048)
  .url()
  .refine((value) => /^https?:\/\//i.test(value), {
    message: "CV link must start with http:// or https://",
  });

export const jobApplicationSchema = z.object({
  job_post_id: z.string().min(1),
  applicant_name: z.string().min(1).max(200),
  email: z.string().email(),
  phone: z.string().max(20).optional(),
  cv_url: cvLinkSchema.optional(),
  cover_letter: z.string().max(5000).optional(),
});

/**
 * A public applicant may only point at a CV we stored ourselves: the raw upload
 * path of our Cloudinary account, over https. Anything else is an outside link
 * that an admin would later open from the applications grid.
 */
export function isOwnCvUrl(value: string, cloudName = envConfig.CLOUDINARY.CLOUD_NAME): boolean {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  return (
    url.protocol === "https:" &&
    url.hostname === "res.cloudinary.com" &&
    url.username === "" &&
    url.password === "" &&
    url.port === "" &&
    url.pathname.startsWith(`/${cloudName}/raw/upload/`)
  );
}

/**
 * The store form uploads the CV file and sends back the stored URL, and a
 * CV-less application cannot be shortlisted, so the public route requires one
 * rather than silently accepting an application nobody can review. Admin
 * entry keeps it optional above, since an admin may add an application that
 * arrives by another channel.
 */
export const jobApplicationPublicSchema = jobApplicationSchema.omit({ job_post_id: true }).extend({
  cv_url: cvLinkSchema.refine(isOwnCvUrl, { message: "CV must be uploaded through the careers form" }),
});

export const jobApplicationUpdateSchema = z.object({
  status: z.enum(["pending", "reviewed", "shortlisted", "rejected", "hired"]).optional(),
  notes: z.string().max(2000).optional(),
});

export const jobApplicationStatusSchema = z.object({
  status: z.enum(["pending", "reviewed", "shortlisted", "rejected", "hired"]),
});

// Super admin accounts are provisioned out of band (see scripts/reset-superadmin).
// The client never offers "superadmin" in its role picker, so accepting it here
// would let a direct API call mint a second super admin with every tab.
export const staffRoleSchema = z.enum(["branch_manager", "staff"]);

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
